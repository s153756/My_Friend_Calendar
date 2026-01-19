from flask import Blueprint, request, jsonify, g
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.calendar_service import create_event, patch_event
from app.models.event import Event
from app.models.user import User
from app.extensions import db
from app.middleware.auth_getters import get_resource
from app.middleware.auth_decorators import require_owner_or_role

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
            "location": event.location,
          "color": event.color,
          "status": event.status,
            "start_time": event.start_time.isoformat(),
            "end_time": event.end_time.isoformat(),
            "owner_id": str(event.owner_id)
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@calendar_bp.route('/events/<int:event_id>', methods=['GET'])
@require_owner_or_role(resource_owner_getter=get_resource(Event, 'event_id'))
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
    event = g.current_resource

    return jsonify(event.to_dict()), 200


@calendar_bp.route('/events/<int:event_id>', methods=['PATCH'])
@require_owner_or_role(resource_owner_getter=get_resource(Event, 'event_id'))
def update_event(event_id):
    """
    Edit an event (Only for owners)
    ---
    tags:
      - Calendar
    parameters:
      - name: event_id
        in: path
        type: integer
        required: true
        description: Unique ID of the event to edit
      - name: body
        in: body
        required: true
        schema:
          id: EventUpdate
          properties:
            title:
              type: string
              description: The new title of the event
              example: "Team Sync Meeting"
            location:
              type: string
              description: The new location of the event
              example: "Kielce"
            description:
              type: string
              description: The new description
              example: "Discussing Q1 goals"
            start_time:
              type: string
              format: date-time
              example: "2024-05-20T09:00:00Z"
            end_time:
              type: string
              format: date-time
              example: "2025-05-20T09:00:00Z"
            participant_ids:
              type: array
              items:
                type: string
                format: uuid
              description: List of User UUIDs participating in the event
              example: ["550e8400-e29b-41d4-a716-446655440000", "123e4567-e89b-12d3-a456-426614174000"]
    responses:
      200:
        description: Event edited successfully
      400:
        description: Bad request
      403:
        description: Access denied (only owner can edit)
      404:
        description: Event not found
      500:
        description: Internal Server Error (Database failure or unexpected crash)
    """

    event = g.current_resource
    data = request.get_json()

    if not data:
        return jsonify({
            "error": "no_data",
            "message": "No data provided"
        }), 400

    try:
        updated_event, was_updated = patch_event(event, data)

        if not was_updated:
            return jsonify({"message": "No valid fields provided"}), 400

        return jsonify(updated_event.to_dict()), 200

    except TypeError:
        return jsonify({"error": "Invalid type for time value: str(te)"}), 400
    except ValueError as ve:
      error_msg = str(ve)
      if error_msg.startswith("NOT_FOUND:"):
          return jsonify({"error": "Resource not found", "details": error_msg.replace("NOT_FOUND: ", "")}), 404
      elif error_msg.startswith("INVALID_DATE:"):
          return jsonify({"error": "Invalid date format", "details": error_msg.replace("INVALID_DATE: ", "")}), 400
      else:
          return jsonify({"error": "Invalid value", "details": error_msg}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Internal server error", "details": str(e)}), 500


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
            'color': event.color,
            'status': event.status,
            'owner': {
                'id': str(event.owner.id),
                'email': event.owner.email
            },
            'participants': [{
                'id': str(p.user.id),
                'email': p.user.email
            } for p in event.participant_links.all()]
        })

    return jsonify(events_data), 200