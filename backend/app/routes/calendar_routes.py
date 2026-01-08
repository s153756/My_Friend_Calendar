from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.calendar_service import create_event
from app.models.event import Event
from app.models.user import User
from app.extensions import db

calendar_bp = Blueprint('calendar', __name__, url_prefix='/api/calendar')

@calendar_bp.route('/events/create', methods=['POST'])
@jwt_required()
def create_new_event():
    """
    Create a new calendar event
    ---
    tags:
      - Calendar
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - title
            - start_time
            - end_time
          properties:
            title:
              type: string
              example: Meeting with Team
            description:
              type: string
              example: Project synchronization
            start_time:
              type: string
              format: date-time
              example: "2023-12-24T10:00:00"
            end_time:
              type: string
              format: date-time
              example: "2023-12-24T11:30:00"
    responses:
      201:
        description: Event created successfully
      400:
        description: Missing required fields
      401:
        description: Authentication required
      500:
        description: Server error
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
    """
    Get event details by ID
    ---
    tags:
      - Calendar
    parameters:
      - name: event_id
        in: path
        type: integer
        required: true
        description: Unique ID of the event
    responses:
      200:
        description: Event details retrieved
      403:
        description: Access denied (user is not owner or participant)
      404:
        description: Event not found
      401:
        description: Authentication required
    """
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
        } for p in event.participant_links.all()],
   }), 200

@calendar_bp.route('/events/', methods=['GET'])
@jwt_required()
def get_events():
    """
    Get all user events
    ---
    tags:
      - Calendar
    responses:
      200:
        description: Events details retrieved
      403:
        description: Access denied
      404:
        description: User not found
      401:
        description: Authentication required
    """
    current_user_id = get_jwt_identity()
    current_user = User.query.get_or_404(current_user_id)
 
    events = Event.query.filter(
        (Event.owner_id == current_user.id) | 
        (Event.participant_links.any(user_id=current_user.id))
    ).all()

    events_data = []
    for event in events:
        events_data.append({
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
            } for p in event.participant_links.all()]
        })

    return jsonify(events_data), 200

@calendar_bp.route('/events/<int:event_id>', methods=['DELETE'])
@jwt_required()
def delete_event(event_id):
    """
    Delete an event (Only for owners)
    ---
    tags:
      - Calendar
    parameters:
      - name: event_id
        in: path
        type: integer
        required: true
        description: Unique ID of the event to delete
    responses:
      200:
        description: Event deleted successfully
      403:
        description: Access denied (only owner can delete)
      404:
        description: Event not found
    """
    current_user_id = get_jwt_identity()

    event = Event.query.get_or_404(event_id)

    if str(event.owner_id) != str(current_user_id):
        return jsonify({'error': 'Only the owner can delete this event'}), 403

    try:
        db.session.delete(event)
        db.session.commit()
        return jsonify({'message': 'Event deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500