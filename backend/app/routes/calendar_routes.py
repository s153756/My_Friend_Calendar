from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.calendar_service import create_event
from app.models.event import Event
from app.models.user import User

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

@calendar_bp.route('/events/<int:event_id>', methods=['GET'])
@jwt_required()
def get_event(event_id):

    current_user_id = get_jwt_identity()
    current_user = User.query.get_or_404(current_user_id)

    event = Event.query.get_or_404(event_id)

    if not event.user_has_access(current_user):
        return jsonify({'error': 'Access denied'}), 403

    return jsonify({
        'id': event.id,
        'title': event.title,
        'description': event.description,
        'start_time': event.start_time.isoformat(),
        'end_time': event.end_time.isoformat(),
        'location': event.location,
        'owner': {
            'id': event.owner.id,
            'email': event.owner.email
        },
        'participants': [{
            'id': p.id,
            'email': p.email
        } for p in event.participants.all()],
   }), 200
