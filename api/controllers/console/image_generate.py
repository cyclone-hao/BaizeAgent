import logging

import httpx
from flask_restx import Resource, fields, reqparse

from configs import dify_config
from controllers.console import api, console_ns
from controllers.console.wraps import account_initialization_required, setup_required
from libs.login import login_required

logger = logging.getLogger(__name__)

# qwen-image uses the multimodal generation endpoint (synchronous)
DASHSCOPE_MULTIMODAL_URL = "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation"

DEFAULT_IMAGE_MODEL = "qwen-image"


@console_ns.route("/image-generate")
class ImageGenerateApi(Resource):
    @api.doc("image_generate")
    @api.doc(description="Generate images using DashScope qwen-image model")
    @api.expect(
        api.model(
            "ImageGenerateRequest",
            {
                "prompt": fields.String(required=True, description="Image generation prompt"),
                "size": fields.String(required=False, description="Image size, e.g. 1024*1024", default="1024*1024"),
                "n": fields.Integer(required=False, description="Number of images", default=1),
            },
        )
    )
    @api.response(200, "Success")
    @setup_required
    @login_required
    @account_initialization_required
    def post(self):
        """Generate images using DashScope qwen-image"""
        parser = reqparse.RequestParser()
        parser.add_argument("prompt", type=str, required=True, location="json")
        parser.add_argument("size", type=str, required=False, default="1024*1024", location="json")
        parser.add_argument("n", type=int, required=False, default=1, location="json")
        args = parser.parse_args()

        api_key = dify_config.DASHSCOPE_API_KEY
        if not api_key:
            return {"code": "dashscope_not_configured", "message": "DashScope API key is not configured"}, 400

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        # qwen-image uses messages format with multimodal endpoint
        payload = {
            "model": DEFAULT_IMAGE_MODEL,
            "input": {
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"text": args["prompt"]},
                        ],
                    }
                ]
            },
            "parameters": {
                "size": args["size"],
                "n": min(args["n"], 4),
            },
        }

        try:
            # Synchronous call — qwen-image returns results directly
            with httpx.Client(timeout=httpx.Timeout(connect=10.0, read=120.0, write=10.0, pool=10.0)) as client:
                resp = client.post(DASHSCOPE_MULTIMODAL_URL, json=payload, headers=headers)
                resp.raise_for_status()
                data = resp.json()

            # Extract image URLs from response
            image_urls = []
            choices = data.get("output", {}).get("choices", [])
            for choice in choices:
                content = choice.get("message", {}).get("content", [])
                for item in content:
                    if isinstance(item, dict) and item.get("image"):
                        image_urls.append(item["image"])

            if not image_urls:
                logger.warning("DashScope response missing images: %s", str(data)[:500])
                return {"code": "image_generate_no_result", "message": "图片生成未返回结果"}, 502

            return {
                "images": image_urls,
                "prompt": args["prompt"],
            }, 200

        except httpx.HTTPStatusError as e:
            error_body = e.response.text[:300] if e.response else ""
            logger.warning("DashScope API error: %s %s", e.response.status_code, error_body)
            return {
                "code": "image_generate_api_error",
                "message": f"DashScope API error: {e.response.status_code}",
            }, 502

        except httpx.RequestError as e:
            logger.warning("DashScope request failed: %s", str(e))
            return {"code": "image_generate_request_error", "message": "Failed to connect to DashScope API"}, 502
