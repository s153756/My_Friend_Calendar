from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.calendar_service import create_event

calendar_bp = Blueprint('calendar', __name__, url_prefix='/api/calendar')

@calendar_bp.route('/events/create', methods=['POST'])
@jwt_required()
def create_new_event():
    """
    Endpoint to create a new event. Requires authentication.
    """
    user_id = get_jwt_identity()
    data = request.get_json()

    if not all(key in data for key in ['title', 'start_time', 'end_time']):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        event = create_event(data, user_id)
        return jsonify({
            "id": event.id,
            "title": event.title,
            "description": event.description,
            "start_time": event.start_time,
            "end_time": event.end_time,
            "owner_id": event.owner_id
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
