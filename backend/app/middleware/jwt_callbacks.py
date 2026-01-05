from flask import jsonify
from app.extensions import jwt


def configure_jwt_callbacks():
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({
            "error": "token_expired",
            "message": "Your session has expired. Please log in again."
        }), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error_string):
        return jsonify({
            "error": "invalid_token",
            "message": "Token verification failed"
        }), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error_string):
        return jsonify({
            "error": "authorization_required",
            "message": "Access token is missing or invalid"
        }), 401

    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        return jsonify({
            "error": "token_revoked",
            "message": "Token has been revoked"
        }), 401

    @jwt.token_verification_failed_loader
    def token_verification_failed_callback(jwt_header, jwt_payload):
        return jsonify({
            "error": "token_verification_failed",
            "message": "Token claims verification failed"
        }), 401
