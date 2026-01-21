from flask import Blueprint, request, jsonify, make_response
import uuid
from app.services.auth_service import (
    authenticate_user, refresh_tokens,
    revoke_session, generate_session_for_user,
    SessionNotFoundError, SessionRevokedError,
    create_user, validate_password, generate_reset_password_token,
    send_reset_password_email, reset_password,
    TokenNotFoundException,TokenExpiredException,TokenAlreadyUsedException,
    validate_email)
from flask_jwt_extended import (
    jwt_required, get_jwt_identity, get_jwt,
    set_refresh_cookies, unset_jwt_cookies
)
from sqlalchemy.exc import SQLAlchemyError

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

    email_validation_results = validate_email(data.get("email"))
    if not email_validation_results["email_ok"]:
        return jsonify(
            {
                "error": "invalid_email",
                "details": email_validation_results["messages"]
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
              example: kacper@example.com
            password:
              type: string
              example: demo123
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
        return jsonify({"error": "email_and_password_required", "details": "Email and password required"}), 400

    user = authenticate_user(email, password)
    if not user:
        return jsonify({"error": "invalid_credentials", "details": "Invalid credentials"}), 401

    result = generate_session_for_user(user.id, request.user_agent, request.remote_addr)

    response = jsonify({
        'access_token': result['access_token'],
        'user': {
            "id": str(user.id),
            "email": user.email,
            "is_email_verified": bool(getattr(user, "is_email_verified", False))
        }
    })

    response.status_code = 200

    set_refresh_cookies(response, result['refresh_token'])

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
    jti_string = get_jwt()['jti']

    revoke_session(uuid.UUID(jti_string))

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
      500:
        description: Token refresh failed
    """
    try:
        jti_string = get_jwt()['jti']
        current_user_id = get_jwt_identity()

        result = refresh_tokens(
            jti_string=jti_string,
            user_id=current_user_id,
            ip_address=request.remote_addr,
            user_agent=str(request.user_agent)
        )

        response_data = {
            "msg": "Tokens have been successfully refreshed.",
            "access_token": result['access_token'],
        }
        response = make_response(jsonify(response_data), 200)
        set_refresh_cookies(response, result['refresh_token'])
        return response

    except SessionNotFoundError:
        return jsonify({'error': 'Session not found'}), 401
    except SessionRevokedError:
        return jsonify({'error': 'Session revoked'}), 401
    except Exception:
        return jsonify({'error': 'Token refresh failed'}), 500

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
        "data": "test"
    }), 200


@auth_bp.route("/request_reset-password", methods=["POST"])
def request_password_reset():
    """
    Request a password reset token
    ---
    tags:
      - Authentication
    summary: Generate and send a password reset token to the user's email.
    description: This endpoint generates a password reset token for the provided email address and sends it to the user. The email must be associated with an existing account.
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
              description: The email address of the user requesting the password reset.
    responses:
      200:
        description: Password reset token sent successfully.
        content:
          application/json:
            schema:
              type: object
              properties:
                message:
                  type: string
                  example: Password reset token sent successfully
      400:
        description: Invalid request or missing email.
        content:
          application/json:
            schema:
              type: object
              properties:
                error:
                  type: string
                  example: Email is required
      500:
        description: Internal server error.
    """
    data = request.get_json(silent=True) or {}

    if not data.get("email"):
        return jsonify(
            {
                "error": "field_is_required",
                "details": ["Field 'email' is required."]
            }
        ), 400

    email_validation_results = validate_email(data.get("email"))
    if not email_validation_results["email_ok"]:
        return jsonify(
            {
                "error": "invalid_email",
                "details": email_validation_results["messages"]
            }
        ), 400

    try:
        result = generate_reset_password_token(data["email"], request.remote_addr, request.headers.get("User-Agent"))

        if isinstance(result, dict):
            send_reset_password_email(data["email"], result["reset_link"])
            return jsonify({"message": "Password reset token sent successfully"}), 200
        else:
            return jsonify({"error": result}), 400

    except SQLAlchemyError:
        return jsonify({"error": "A database error occurred. Please try again later."}), 500
    except Exception:
        return jsonify({"error": "Internal server error"}), 500


@auth_bp.route("/reset-password", methods=["POST"])
def reset():
  """
  Reset user password using token
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
          token:
            type: string
          password:
            type: string
            example: password123
  responses:
    200:
      description: Successfully reset password
    400:
      description: Token and password required
    500:
      description: Internal server error
  """

  data = request.get_json()

  token = data.get('token')
  if not token:
    return jsonify({"error": "Token is required"}), 400

  password = data.get('password')
  if not password:
    return jsonify({'error': "Password is required"}), 400

  password_validation_results = validate_password(data.get("password"))
  if not password_validation_results["password_ok"]:
      return jsonify(
          {
              "error": "invalid_password",
              "details": password_validation_results["messages"]
          }
      ), 400

  try:
    user = reset_password(token, password)

    return jsonify({
      'user': {
          "id": str(user.id),
          "email": user.email,
          "is_email_verified": bool(getattr(user, "is_email_verified", False))
      }
    }), 201

  except (TokenNotFoundException, TokenAlreadyUsedException, TokenExpiredException) as e:
      return jsonify({"error": str(e)}), 400
  except SQLAlchemyError:
      return jsonify({"error": "A database error occurred. Please try again later."}), 500
  except Exception:
      return jsonify({"error": "Internal server error"}), 500
