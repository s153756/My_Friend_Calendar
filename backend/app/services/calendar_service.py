from app.models.event import Event, EventParticipant
from app.models.user import User
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


def set_proposed_time(event, data):
    proposed_start = event.start_time
    proposed_end = event.end_time

    if 'start_time' in data:
        value = data['start_time']
        if isinstance(value, str):
            try:
                proposed_start = datetime.fromisoformat(value)
            except ValueError:
                raise ValueError("INVALID_DATE: Invalid format for start_time")
        else:
            raise TypeError(f"Invalid type for start_time: {type(value).__name__}")

    if 'end_time' in data:
        value = data['end_time']
        if isinstance(value, str):
            try:
                proposed_end = datetime.fromisoformat(value)
            except ValueError:
                raise ValueError("INVALID_DATE: Invalid format for end_time")
        else:
            raise TypeError(f"Invalid type for start_time: {type(value).__name__}")

    if proposed_start and proposed_end:
        check_start = proposed_start.replace(tzinfo=None) if proposed_start.tzinfo else proposed_start
        check_end = proposed_end.replace(tzinfo=None) if proposed_end.tzinfo else proposed_end

        if check_end <= check_start:
            raise ValueError("start_time must be before end_time.")

    return proposed_start, proposed_end


def patch_event(event, data):
    allowed_fields = ['title', 'location', 'description', 'start_time', 'end_time']
    updated_any = False

    proposed_start, proposed_end = set_proposed_time(event, data)

    for field in allowed_fields:
        if field in data:
            value = data[field]

            if field == 'start_time':
                value = proposed_start
            elif field == 'end_time':
                value = proposed_end

            if getattr(event, field) != value:
                setattr(event, field, value)
                updated_any = True

    if 'participant_ids' in data:
        new_ids = set(data['participant_ids'])

        current_ids = {p.user_id for p in event.participant_links.all()}

        if new_ids != current_ids:
            existing_users = db.session.query(User.id).filter(User.id.in_(new_ids)).all()
            existing_user_ids = {user.id for user in existing_users}
            invalid_ids = new_ids - existing_user_ids

            if invalid_ids:
                raise ValueError(f"NOT_FOUND Invalid user IDs: {', '.join(map(str, invalid_ids))}")

            for link in event.participant_links.all():
                db.session.delete(link)

            for u_id in new_ids:
                new_link = EventParticipant(event_id=event.id, user_id=u_id)
                db.session.add(new_link)
            updated_any = True

    if updated_any:
        db.session.commit()


    return event, updated_any
