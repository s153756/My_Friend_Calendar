from backend.app.models.event import Event
from backend.app.extensions import db
from datetime import datetime

def create_event(data, user_id):
    """
    Create a new event for the authenticated user.
    """
    try:
        start_time = datetime.fromisoformat(data['start_time'])
        end_time = datetime.fromisoformat(data['end_time'])
    except ValueError:
        raise ValueError("start_time or end_time format is invalid. Use ISO format.")

    if start_time >= end_time:
        raise ValueError("start_time must be before end_time.")

    new_event = Event(
        title=data['title'],
        description=data.get('description'),
        start_time=start_time,
        end_time=end_time,
        user_id=user_id
    )
    db.session.add(new_event)
    db.session.commit()
    return new_event
