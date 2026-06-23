import logging

import httpx
from flask_restx import Resource, fields, reqparse

from configs import dify_config
from controllers.console import api, console_ns
from controllers.console.wraps import account_initialization_required, setup_required
from libs.login import login_required

logger = logging.getLogger(__name__)

TAVILY_API_URL = "https://api.tavily.com/search"


@console_ns.route("/web-search")
class WebSearchApi(Resource):
    @api.doc("web_search")
    @api.doc(description="Search the web using Tavily API and return structured results")
    @api.expect(
        api.model(
            "WebSearchRequest",
            {
                "query": fields.String(required=True, description="Search query"),
                "num_results": fields.Integer(required=False, description="Number of results to return", default=5),
            },
        )
    )
    @api.response(200, "Success")
    @setup_required
    @login_required
    @account_initialization_required
    def post(self):
        """Search the web using Tavily API"""
        parser = reqparse.RequestParser()
        parser.add_argument("query", type=str, required=True, location="json")
        parser.add_argument("num_results", type=int, required=False, default=5, location="json")
        args = parser.parse_args()

        api_key = dify_config.WEB_SEARCH_API_KEY
        if not api_key:
            return {"code": "web_search_not_configured", "message": "Web search API key is not configured"}, 400

        try:
            response = httpx.post(
                TAVILY_API_URL,
                json={
                    "api_key": api_key,
                    "query": args["query"],
                    "max_results": args["num_results"],
                    "include_answer": True,
                    "search_depth": "basic",
                },
                timeout=httpx.Timeout(connect=5.0, read=15.0, write=5.0, pool=5.0),
            )
            response.raise_for_status()
            data = response.json()
        except httpx.HTTPStatusError as e:
            logger.warning("Tavily API returned error: %s %s", e.response.status_code, e.response.text)
            return {
                "code": "web_search_api_error",
                "message": f"Search API returned error: {e.response.status_code}",
            }, 502
        except httpx.RequestError as e:
            logger.warning("Tavily API request failed: %s", str(e))
            return {"code": "web_search_request_error", "message": "Failed to connect to search API"}, 502

        # Normalize Tavily response to standard format
        results = []
        for item in data.get("results", []):
            results.append({
                "title": item.get("title", ""),
                "url": item.get("url", ""),
                "content": item.get("content", ""),
                "score": item.get("score", 0.0),
            })

        return {
            "results": results,
            "answer": data.get("answer"),
        }, 200
