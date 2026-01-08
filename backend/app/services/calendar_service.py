from app.models.event import Event, EventParticipant
from app.extensions import db
from datetime import datetime

def create_event(data, owner_id):
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
        owner_id=owner_id,
    )


    db.session.add(new_event)
    db.session.commit()

    return new_event

def patch_event(event, data):

    allowed_fields = ['title', 'description', 'start_time', 'end_time']
    updated_any = False

    for field in allowed_fields:
        if field in data:
            value = data[field]

            if field in ['start_time', 'end_time'] and isinstance(value, str):
                try:
                    value = datetime.fromisoformat(value)
                except ValueError:
                    raise ValueError(f"Invalid format for {field}")

            setattr(event, field, value)
            updated_any = True

    if 'participant_ids' in data:
        new_ids = set(data['participant_ids'])

        event.participant_links.delete()

        for u_id in new_ids:
            new_link = EventParticipant(event_id=event.id, user_id=u_id)
            db.session.add(new_link)
        updated_any = True

    if updated_any:
        db.session.commit()

    return event, updated_any