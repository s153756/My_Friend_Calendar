from flask import Blueprint, request, jsonify

from app.services.auth_service import authenticate_user

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "email_and_password_required"}), 400

    user = authenticate_user(email, password)
    if not user:
        return jsonify({"error": "invalid_credentials"}), 401

    response_user = {
        "id": str(user.id),
        "email": user.email,
        "is_email_verified": bool(getattr(user, "is_email_verified", False)),
    }

    return jsonify({"user": response_user}), 200
