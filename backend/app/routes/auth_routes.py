from flask import Blueprint, request, jsonify, make_response

from app.services.auth_service import authenticate_user
from flask_jwt_extended import (
    JWTManager, create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity, get_jwt,
    set_access_cookies, set_refresh_cookies
)


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

    access_token = create_access_token(identity=user.id)
    refresh_token = create_refresh_token(identity=user.id)

    response = jsonify({
        'access_token': access_token,
        'user': {
            "id": str(user.id),
            "email": user.email,
            "is_email_verified": bool(getattr(user, "is_email_verified", False))
        }
    })

    response.status_code = 200

    set_refresh_cookies(response, refresh_token)

    return response



@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    current_user_id = get_jwt_identity()

    new_access_token = create_access_token(identity=current_user_id)
    new_refresh_token = create_refresh_token(identity=current_user_id)

    response_data = {
        "msg": "Tokens have been successfully refreshed.",
        "access_token": new_access_token,
    }

    response = make_response(jsonify(response_data), 200)

    set_refresh_cookies(response, new_refresh_token)

    return response

@auth_bp.route("/protected", methods=["GET"])
@jwt_required()
def protected():
    """
    A protected route that requires a valid access token.
    """
    # get_jwt_identity() fetches the user_id stored in the JWT payload
    current_user_id = get_jwt_identity()

    return jsonify({
        "message": "Access granted!",
        "user_id": current_user_id,
        "token_type": "access",
        "data": "This is sensitive data accessible only with a valid access token."
    }), 200