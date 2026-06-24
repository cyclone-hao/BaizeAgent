import logging

from flask import request
from flask_restx import Resource, fields, reqparse
from werkzeug.exceptions import Forbidden, InternalServerError, NotFound

import services
from controllers.console import api, console_ns
from controllers.console.app.error import (
    AppUnavailableError,
    CompletionRequestError,
    ConversationCompletedError,
    ProviderModelCurrentlyNotSupportError,
    ProviderNotInitializeError,
    ProviderQuotaExceededError,
)
from controllers.console.app.wraps import get_app_model
from controllers.console.wraps import account_initialization_required, setup_required
from controllers.web.error import InvokeRateLimitError as InvokeRateLimitHttpError
from core.app.apps.base_app_queue_manager import AppQueueManager
from core.app.entities.app_invoke_entities import InvokeFrom
from core.errors.error import (
    ModelCurrentlyNotSupportError,
    ProviderTokenNotInitError,
    QuotaExceededError,
)
from core.helper.trace_id_helper import get_external_trace_id
from core.model_runtime.errors.invoke import InvokeError
from libs import helper
from libs.helper import uuid_value
from libs.login import current_user, login_required
from models import Account
from models.model import AppMode
from services.app_generate_service import AppGenerateService
from services.errors.llm import InvokeRateLimitError

logger = logging.getLogger(__name__)


# define completion message api for user
@console_ns.route("/apps/<uuid:app_id>/completion-messages")
class CompletionMessageApi(Resource):
    @api.doc("create_completion_message")
    @api.doc(description="Generate completion message for debugging")
    @api.doc(params={"app_id": "Application ID"})
    @api.expect(
        api.model(
            "CompletionMessageRequest",
            {
                "inputs": fields.Raw(required=True, description="Input variables"),
                "query": fields.String(description="Query text", default=""),
                "files": fields.List(fields.Raw(), description="Uploaded files"),
                "model_config": fields.Raw(required=True, description="Model configuration"),
                "response_mode": fields.String(enum=["blocking", "streaming"], description="Response mode"),
                "retriever_from": fields.String(default="dev", description="Retriever source"),
            },
        )
    )
    @api.response(200, "Completion generated successfully")
    @api.response(400, "Invalid request parameters")
    @api.response(404, "App not found")
    @setup_required
    @login_required
    @account_initialization_required
    @get_app_model(mode=AppMode.COMPLETION)
    def post(self, app_model):
        parser = reqparse.RequestParser()
        parser.add_argument("inputs", type=dict, required=True, location="json")
        parser.add_argument("query", type=str, location="json", default="")
        parser.add_argument("files", type=list, required=False, location="json")
        parser.add_argument("model_config", type=dict, required=True, location="json")
        parser.add_argument("response_mode", type=str, choices=["blocking", "streaming"], location="json")
        parser.add_argument("retriever_from", type=str, required=False, default="dev", location="json")
        args = parser.parse_args()

        streaming = args["response_mode"] != "blocking"
        args["auto_generate_name"] = False

        try:
            if not isinstance(current_user, Account):
                raise ValueError("current_user must be an Account or EndUser instance")
            response = AppGenerateService.generate(
                app_model=app_model, user=current_user, args=args, invoke_from=InvokeFrom.DEBUGGER, streaming=streaming
            )

            return helper.compact_generate_response(response)
        except services.errors.conversation.ConversationNotExistsError:
            raise NotFound("Conversation Not Exists.")
        except services.errors.conversation.ConversationCompletedError:
            raise ConversationCompletedError()
        except services.errors.app_model_config.AppModelConfigBrokenError:
            logger.exception("App model config broken.")
            raise AppUnavailableError()
        except ProviderTokenNotInitError as ex:
            raise ProviderNotInitializeError(ex.description)
        except QuotaExceededError:
            raise ProviderQuotaExceededError()
        except ModelCurrentlyNotSupportError:
            raise ProviderModelCurrentlyNotSupportError()
        except InvokeError as e:
            raise CompletionRequestError(e.description)
        except ValueError as e:
            raise e
        except Exception as e:
            logger.exception("internal server error.")
            raise InternalServerError()


@console_ns.route("/apps/<uuid:app_id>/completion-messages/<string:task_id>/stop")
class CompletionMessageStopApi(Resource):
    @api.doc("stop_completion_message")
    @api.doc(description="Stop a running completion message generation")
    @api.doc(params={"app_id": "Application ID", "task_id": "Task ID to stop"})
    @api.response(200, "Task stopped successfully")
    @setup_required
    @login_required
    @account_initialization_required
    @get_app_model(mode=AppMode.COMPLETION)
    def post(self, app_model, task_id):
        if not isinstance(current_user, Account):
            raise ValueError("current_user must be an Account instance")
        AppQueueManager.set_stop_flag(task_id, InvokeFrom.DEBUGGER, current_user.id)

        return {"result": "success"}, 200


@console_ns.route("/apps/<uuid:app_id>/chat-messages")
class ChatMessageApi(Resource):
    @api.doc("create_chat_message")
    @api.doc(description="Generate chat message for debugging")
    @api.doc(params={"app_id": "Application ID"})
    @api.expect(
        api.model(
            "ChatMessageRequest",
            {
                "inputs": fields.Raw(required=True, description="Input variables"),
                "query": fields.String(required=True, description="User query"),
                "files": fields.List(fields.Raw(), description="Uploaded files"),
                "model_config": fields.Raw(required=True, description="Model configuration"),
                "conversation_id": fields.String(description="Conversation ID"),
                "parent_message_id": fields.String(description="Parent message ID"),
                "response_mode": fields.String(enum=["blocking", "streaming"], description="Response mode"),
                "retriever_from": fields.String(default="dev", description="Retriever source"),
            },
        )
    )
    @api.response(200, "Chat message generated successfully")
    @api.response(400, "Invalid request parameters")
    @api.response(404, "App or conversation not found")
    @setup_required
    @login_required
    @account_initialization_required
    @get_app_model(mode=[AppMode.CHAT, AppMode.AGENT_CHAT])
    def post(self, app_model):
        if not isinstance(current_user, Account):
            raise Forbidden()

        if not current_user.has_edit_permission:
            raise Forbidden()

        parser = reqparse.RequestParser()
        parser.add_argument("inputs", type=dict, required=True, location="json")
        parser.add_argument("query", type=str, required=True, location="json")
        parser.add_argument("files", type=list, required=False, location="json")
        parser.add_argument("model_config", type=dict, required=True, location="json")
        parser.add_argument("conversation_id", type=uuid_value, location="json")
        parser.add_argument("parent_message_id", type=uuid_value, required=False, location="json")
        parser.add_argument("response_mode", type=str, choices=["blocking", "streaming"], location="json")
        parser.add_argument("retriever_from", type=str, required=False, default="dev", location="json")
        args = parser.parse_args()

        streaming = args["response_mode"] != "blocking"
        args["auto_generate_name"] = False

        external_trace_id = get_external_trace_id(request)
        if external_trace_id:
            args["external_trace_id"] = external_trace_id

        try:
            if not isinstance(current_user, Account):
                raise ValueError("current_user must be an Account or EndUser instance")
            response = AppGenerateService.generate(
                app_model=app_model, user=current_user, args=args, invoke_from=InvokeFrom.DEBUGGER, streaming=streaming
            )

            return helper.compact_generate_response(response)
        except services.errors.conversation.ConversationNotExistsError:
            raise NotFound("Conversation Not Exists.")
        except services.errors.conversation.ConversationCompletedError:
            raise ConversationCompletedError()
        except services.errors.app_model_config.AppModelConfigBrokenError:
            logger.exception("App model config broken.")
            raise AppUnavailableError()
        except ProviderTokenNotInitError as ex:
            raise ProviderNotInitializeError(ex.description)
        except QuotaExceededError:
            raise ProviderQuotaExceededError()
        except ModelCurrentlyNotSupportError:
            raise ProviderModelCurrentlyNotSupportError()
        except InvokeRateLimitError as ex:
            raise InvokeRateLimitHttpError(ex.description)
        except InvokeError as e:
            raise CompletionRequestError(e.description)
        except ValueError as e:
            raise e
        except Exception as e:
            logger.exception("internal server error.")
            raise InternalServerError()


@console_ns.route("/apps/<uuid:app_id>/chat-messages/<string:task_id>/stop")
class ChatMessageStopApi(Resource):
    @api.doc("stop_chat_message")
    @api.doc(description="Stop a running chat message generation")
    @api.doc(params={"app_id": "Application ID", "task_id": "Task ID to stop"})
    @api.response(200, "Task stopped successfully")
    @setup_required
    @login_required
    @account_initialization_required
    @get_app_model(mode=[AppMode.CHAT, AppMode.AGENT_CHAT, AppMode.ADVANCED_CHAT])
    def post(self, app_model, task_id):
        if not isinstance(current_user, Account):
            raise ValueError("current_user must be an Account instance")
        AppQueueManager.set_stop_flag(task_id, InvokeFrom.DEBUGGER, current_user.id)

        return {"result": "success"}, 200


@console_ns.route("/apps/<uuid:app_id>/image-messages")
class ImageMessageApi(Resource):
    """保存生图记录到对话历史（不触发 LLM 推理）"""

    @api.doc("create_image_message")
    @api.doc(description="Save image generation result to conversation history without LLM inference")
    @api.doc(params={"app_id": "Application ID"})
    @api.expect(
        api.model(
            "ImageMessageRequest",
            {
                "query": fields.String(required=True, description="User prompt for image generation"),
                "image_urls": fields.List(fields.String, required=True, description="Generated image URLs"),
                "conversation_id": fields.String(description="Conversation ID (creates new if not provided)"),
            },
        )
    )
    @api.response(200, "Image message saved successfully")
    @api.response(400, "Invalid request parameters")
    @setup_required
    @login_required
    @account_initialization_required
    @get_app_model(mode=[AppMode.CHAT, AppMode.AGENT_CHAT, AppMode.ADVANCED_CHAT])
    def post(self, app_model):
        if not isinstance(current_user, Account):
            raise Forbidden()

        if not current_user.has_edit_permission:
            raise Forbidden()

        parser = reqparse.RequestParser()
        parser.add_argument("query", type=str, required=True, location="json")
        parser.add_argument("image_urls", type=list, required=True, location="json")
        parser.add_argument("conversation_id", type=uuid_value, required=False, location="json")
        args = parser.parse_args()

        # Create or get conversation
        conversation_id = args.get("conversation_id")
        if conversation_id:
            conversation = (
                db.session.query(Conversation)
                .where(Conversation.id == conversation_id, Conversation.app_id == app_model.id)
                .first()
            )
            if not conversation:
                raise NotFound("Conversation not found")
        else:
            # Create new conversation
            conversation = Conversation(
                app_id=app_model.id,
                app_model_config_id=app_model.app_model_config_id,
                model_provider="",
                model_id="",
                override_model_configs="{}",
                mode=app_model.mode,
                name=f"生图: {args['query'][:30]}",
                inputs={},
                introduction="",
                system_instruction="",
                system_instruction_tokens=0,
                status="normal",
                invoke_from=InvokeFrom.DEBUGGER.value,
                from_source="console",
                from_account_id=current_user.id,
            )
            db.session.add(conversation)
            db.session.flush()
            conversation_id = conversation.id

        # Create message with image URLs in answer field
        image_answer = json.dumps({"type": "image_generation", "image_urls": args["image_urls"]})

        message = Message(
            app_id=app_model.id,
            model_provider="",
            model_id="",
            override_model_configs="{}",
            conversation_id=conversation_id,
            inputs={},
            query=args["query"],
            message={"text": args["query"]},
            message_tokens=0,
            message_unit_price=0,
            message_price_unit=0.001,
            answer=image_answer,
            answer_tokens=0,
            answer_unit_price=0,
            answer_price_unit=0.001,
            provider_response_latency=0,
            total_price=0,
            currency="USD",
            status="normal",
            invoke_from=InvokeFrom.DEBUGGER.value,
            from_source="console",
            from_account_id=current_user.id,
        )
        db.session.add(message)
        db.session.commit()

        return {
            "result": "success",
            "conversation_id": str(conversation_id),
            "message_id": str(message.id),
        }, 200
