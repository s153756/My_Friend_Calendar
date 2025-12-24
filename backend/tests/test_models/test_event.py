import pytest
from datetime import datetime, timedelta
from app.models import Event, User

def test_event_creation_and_owner_relationship(session, user):
    
    event = Event(
        title="Team Sync",
        start_time=datetime.now(),
        end_time=datetime.now() + timedelta(hours=1),
        owner=user
    )
    session.add(event)
    session.commit()

    assert event.id is not None
    assert event.owner.id == user.id
    assert event in user.owned_events
