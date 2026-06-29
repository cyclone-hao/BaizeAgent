import logging

import httpx
from flask_restx import Resource, fields, reqparse

from configs import dify_config
from controllers.console import api, console_ns
from controllers.console.wraps import account_initialization_required, setup_required
from libs.login import login_required

logger = logging.getLogger(__name__)

# DashScope async video generation endpoint (wan2.7 / happyhorse use video-synthesis)
DASHSCOPE_VIDEO_URL = "https://dashscope.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis"
# DashScope task polling endpoint
DASHSCOPE_TASK_URL = "https://dashscope.aliyuncs.com/api/v1/tasks"

# Supported video models — t2v (text-to-video) and i2v (image-to-video) pairs
VIDEO_MODEL_MAP = {
    "wan2.7-t2v": "wan2.7-i2v",
    "wan2.7-i2v": "wan2.7-i2v",
    "happyhorse-1.0-t2v": "happyhorse-1.0-i2v",
    "happyhorse-1.0-i2v": "happyhorse-1.0-i2v",
}


@console_ns.route("/video-generate")
class VideoGenerateApi(Resource):
    @api.doc("video_generate")
    @api.doc(description="Submit a video generation task to DashScope (async)")
    @api.expect(
        api.model(
            "VideoGenerateRequest",
            {
                "prompt": fields.String(required=True, description="Video generation prompt"),
                "model": fields.String(required=False, description="Model ID, e.g. wan2.7-t2v", default="wan2.7-t2v"),
                "image_url": fields.String(required=False, description="Source image URL for image-to-video"),
                "upload_file_id": fields.String(required=False, description="Uploaded file ID (resolved server-side)"),
            },
        )
    )
    @api.response(200, "Task submitted successfully")
    @setup_required
    @login_required
    @account_initialization_required
    def post(self):
        """Submit video generation task to DashScope"""
        parser = reqparse.RequestParser()
        parser.add_argument("prompt", type=str, required=True, location="json")
        parser.add_argument("model", type=str, required=False, default="wan2.7-t2v", location="json")
        parser.add_argument("image_url", type=str, required=False, default=None, location="json")
        parser.add_argument("upload_file_id", type=str, required=False, default=None, location="json")
        args = parser.parse_args()

        api_key = dify_config.DASHSCOPE_API_KEY
        if not api_key:
            return {"code": "dashscope_not_configured", "message": "DashScope API key is not configured"}, 400

        # Resolve upload_file_id to a URL if provided
        image_url = args.get("image_url")
        if not image_url and args.get("upload_file_id"):
            try:
                from extensions.ext_database import db
                from models.model import UploadFile
                from flask import url_for

                upload_file = db.session.query(UploadFile).filter(
                    UploadFile.id == args["upload_file_id"]
                ).first()
                if upload_file:
                    # Construct the file preview URL
                    # Use the source_url if available (e.g., S3 signed URL)
                    if upload_file.source_url:
                        image_url = upload_file.source_url
                    else:
                        # Fallback: construct URL from storage key
                        from core.file.helpers import get_signed_file_url
                        image_url = get_signed_file_url(upload_file.id)
            except Exception as e:
                logger.warning("Failed to resolve upload_file_id %s: %s", args.get("upload_file_id"), str(e))

        # Auto-switch to i2v model when image_url is available
        model = args["model"]
        if image_url:
            i2v_model = VIDEO_MODEL_MAP.get(model)
            if i2v_model:
                model = i2v_model
            elif model.endswith("-t2v"):
                model = model.replace("-t2v", "-i2v")

        # Validate model
        if model not in VIDEO_MODEL_MAP and not any(model.startswith(k.rsplit("-", 1)[0]) for k in VIDEO_MODEL_MAP):
            return {"code": "invalid_model", "message": f"不支持的视频模型: {model}"}, 400

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "X-DashScope-Async": "enable",
        }

        # Build input
        input_data = {"prompt": args["prompt"]}
        if image_url:
            input_data["img_url"] = image_url

        payload = {
            "model": model,
            "input": input_data,
            "parameters": {
                "resolution": "720P",
                "prompt_extend": True,
            },
        }

        try:
            with httpx.Client(timeout=httpx.Timeout(connect=10.0, read=30.0, write=10.0, pool=10.0)) as client:
                resp = client.post(DASHSCOPE_VIDEO_URL, json=payload, headers=headers)
                resp.raise_for_status()
                data = resp.json()

            # Extract task_id from response
            output = data.get("output", {})
            task_id = output.get("task_id")
            task_status = output.get("task_status", "PENDING")

            if not task_id:
                logger.warning("DashScope video response missing task_id: %s", str(data)[:500])
                return {"code": "video_generate_no_task", "message": "视频生成任务提交失败，未返回任务ID"}, 502

            return {
                "task_id": task_id,
                "status": task_status,
                "prompt": args["prompt"],
                "model": model,
            }, 200

        except httpx.HTTPStatusError as e:
            error_body = e.response.text[:500] if e.response else ""
            logger.warning("DashScope video API error: %s %s", e.response.status_code, error_body)
            # Try to extract a user-friendly error message from DashScope response
            detail = ""
            try:
                err_json = e.response.json()
                detail = err_json.get("message") or err_json.get("error", {}).get("message", "") or error_body
            except Exception:
                detail = error_body
            return {
                "code": "video_generate_api_error",
                "message": f"DashScope API error: {e.response.status_code} — {detail}",
            }, 502

        except httpx.RequestError as e:
            logger.warning("DashScope video request failed: %s", str(e))
            return {"code": "video_generate_request_error", "message": "Failed to connect to DashScope API"}, 502


@console_ns.route("/video-task/<string:task_id>")
class VideoTaskApi(Resource):
    @api.doc("video_task_status")
    @api.doc(description="Poll DashScope video generation task status")
    @api.response(200, "Task status retrieved")
    @setup_required
    @login_required
    @account_initialization_required
    def get(self, task_id):
        """Poll video generation task status"""
        api_key = dify_config.DASHSCOPE_API_KEY
        if not api_key:
            return {"code": "dashscope_not_configured", "message": "DashScope API key is not configured"}, 400

        headers = {
            "Authorization": f"Bearer {api_key}",
        }

        try:
            with httpx.Client(timeout=httpx.Timeout(connect=10.0, read=30.0, write=10.0, pool=10.0)) as client:
                resp = client.get(f"{DASHSCOPE_TASK_URL}/{task_id}", headers=headers)
                resp.raise_for_status()
                data = resp.json()

            output = data.get("output", {})
            task_status = output.get("task_status", "UNKNOWN")

            result = {
                "status": task_status,
            }

            if task_status == "SUCCEEDED":
                # Extract video URL from results
                video_url = None
                results = output.get("results", [])
                if results:
                    # Try to get video_url from results array
                    for r in results:
                        url = r.get("url") or r.get("video_url")
                        if url:
                            video_url = url
                            break

                # Fallback: try output.video_url directly
                if not video_url:
                    video_url = output.get("video_url")

                # Fallback: try output.results[0].url pattern
                if not video_url and isinstance(results, list) and results:
                    first = results[0]
                    if isinstance(first, str):
                        video_url = first
                    elif isinstance(first, dict):
                        video_url = first.get("url") or first.get("video_url")

                result["video_url"] = video_url
                if not video_url:
                    logger.warning("DashScope video task succeeded but no video_url found: %s", str(output)[:500])

            elif task_status == "FAILED":
                message = output.get("message", "")
                code = output.get("code", "")
                result["message"] = message or f"视频生成失败 (code: {code})" if code else "视频生成失败"

            return result, 200

        except httpx.HTTPStatusError as e:
            error_body = e.response.text[:300] if e.response else ""
            logger.warning("DashScope task poll error: %s %s", e.response.status_code, error_body)
            return {
                "code": "video_task_poll_error",
                "message": f"Failed to poll task: {e.response.status_code}",
            }, 502

        except httpx.RequestError as e:
            logger.warning("DashScope task poll failed: %s", str(e))
            return {"code": "video_task_poll_error", "message": "Failed to connect to DashScope API"}, 502
