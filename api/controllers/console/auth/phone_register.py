"""Phone number registration (no SMS verification, phone treated as username)."""

from flask import request
from flask_restx import Resource, reqparse
from sqlalchemy import select
from sqlalchemy.orm import Session

from constants.languages import languages
from controllers.console import api
from controllers.console.wraps import email_password_login_enabled, setup_required
from extensions.ext_database import db
from libs.helper import extract_remote_ip
from libs.password import valid_password
from models.account import Account
from services.account_service import AccountService, TenantService
from services.errors.account import AccountRegisterError
from controllers.console.error import AccountInFreezeError
from controllers.console.auth.error import PasswordMismatchError


class PhoneRegisterApi(Resource):
    """Register with phone number + password (no SMS code required)."""

    @setup_required
    @email_password_login_enabled
    def post(self):
        parser = reqparse.RequestParser()
        parser.add_argument("phone", type=str, required=True, location="json")
        parser.add_argument("password", type=valid_password, required=True, location="json")
        parser.add_argument("password_confirm", type=valid_password, required=True, location="json")
        args = parser.parse_args()

        phone = args["phone"].strip()
        if not phone:
            return {"result": "fail", "data": "请输入手机号"}, 400

        # Validate password match
        if args["password"] != args["password_confirm"]:
            raise PasswordMismatchError()

        # Check if phone is already registered
        with Session(db.engine) as session:
            existing = session.execute(select(Account).filter_by(phone=phone)).scalar_one_or_none()
            if existing:
                return {"result": "fail", "data": "该手机号已注册"}, 400

        # Create new account with phone as identifier
        try:
            account = AccountService.create_account_and_tenant(
                email=f"{phone}@phone.local",   # placeholder email for phone-only accounts
                name=phone,
                password=args["password"],
                interface_language=languages[0],
            )
            # Update phone field
            account.phone = phone
            db.session.commit()
        except AccountRegisterError:
            raise AccountInFreezeError()

        token_pair = AccountService.login(account=account, ip_address=extract_remote_ip(request))
        return {"result": "success", "data": token_pair.model_dump()}


api.add_resource(PhoneRegisterApi, "/phone-register")
