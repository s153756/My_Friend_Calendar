from flask import Blueprint, request, jsonify, make_response

from app.services.auth_service import authenticate_user, create_user, validate_password
from flask_jwt_extended import (
    JWTManager, create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity, get_jwt,
    set_access_cookies, set_refresh_cookies,
    unset_jwt_cookies
)


auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

@auth_bp.route("/register", methods=["POST"])
def register():
    """
    Register users
    ---
    tags:
      - Authentication
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            email:
              type: string
              example: user@example.com
            password:
              type: string
              example: P@ssword123
            repeated_password:
              type: string
              example: P@ssword123
            full_name:
              type: string
              example: Grzegorz Brzęczyszczykiewicz
            display_name:
              type: string
              example: Gregory Buzzington
    responses:
      200:
        description: Successfully registered
      400:
        description: Email and password required
      401:
        description: Invalid credentials
    """
    data = request.get_json(silent=True) or {}

    required_fields = ["email", "password", "repeated_password", "full_name", "display_name"]
    for field in required_fields:
        if not data.get(field):
            return jsonify(
                {
                    "error": "field_is_required",
                    "details": [f"Field '{field}' is required."]
                }
            ), 400
    
    if data.get("password") != data.get("repeated_password"):
        return jsonify(
            {
                "error": "invalid_password",
                "details": ["Passwords must be the same"]
            }
        ), 400

    password_validation_results = validate_password(data.get("password"))
    if not password_validation_results["password_ok"]:
        return jsonify(
            {
                "error": "invalid_password",
                "details": password_validation_results["messages"]
            }
        ), 400

    user, errors = create_user(data)
    if not user:
        return jsonify(
            {
                "error": "could_not_create_user",
                "details": errors
            }
        ), 400

    return jsonify({
        'user': {
            "id": str(user.id),
            "email": user.email,
            "is_email_verified": bool(getattr(user, "is_email_verified", False))
        }
    }), 201

@auth_bp.route("/login", methods=["POST"])
def login():
    """
    Authenticate user and return tokens
    ---
    tags:
      - Authentication
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            email:
              type: string
              example: user@example.com
            password:
              type: string
              example: password123
    responses:
      200:
        description: Successfully logged in
      400:
        description: Email and password required
      401:
        description: Invalid credentials
    """
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


@auth_bp.route("/logout", methods=["POST"])
@jwt_required(optional=True)
def logout():
    """
    Logout user and clear cookies
    ---
    tags:
      - Authentication
    responses:
      200:
        description: Logged out successfully
    """
    response = jsonify({"message": "Logged out successfully"})

    unset_jwt_cookies(response)

    return response, 200


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """
    Refresh access and refresh tokens
    ---
    tags:
      - Authentication
    responses:
      200:
        description: Tokens refreshed successfully
      401:
        description: Invalid or missing refresh token
    """
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
    Access protected data
    ---
    tags:
      - Testing
    security:
      - bearerAuth: []
    responses:
      200:
        description: Access granted
      401:
        description: Missing or invalid token
    """
    current_user_id = get_jwt_identity()

    return jsonify({
        "message": "Access granted!",
        "user_id": current_user_id,
        "token_type": "access",
        "data": "This is sensitive data accessible only with a valid access token."
    }), 200