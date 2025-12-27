from datetime import datetime, timedelta, timezone
from werkzeug.security import generate_password_hash
from app.models import Event, EventParticipant, User


class TestEventModel:
    def test_create_event(self, session, user):
        event = Event(
            title="Test Event",
            description="Test Description",
            start_time=datetime.now(timezone.utc),
            end_time=datetime.now(timezone.utc) + timedelta(hours=1),
            location="Test Location",
            owner_id=user.id,
        )

        session.add(event)
        session.flush()

        assert event.id is not None
        assert event.title == "Test Event"
        assert event.owner_id == user.id
        assert event.owner == user

    def test_event_owner_has_access(self, session, user):
        event = Event(
            title="Owner Access Event",
            start_time=datetime.now(timezone.utc),
            end_time=datetime.now(timezone.utc) + timedelta(hours=2),
            owner_id=user.id,
        )

        session.add(event)
        session.flush()

        assert event.user_has_access(user) is True

    def test_event_participant_has_access(self, session, user):
        owner = User(
            email="owner@example.com",
            password_hash=generate_password_hash("pass123"),
            password_algorithm="pbkdf2:sha256",
            is_email_verified=True,
            is_active=True,
        )
        session.add(owner)
        session.flush()

        event = Event(
            title="Participant Access Event",
            start_time=datetime.now(timezone.utc),
            end_time=datetime.now(timezone.utc) + timedelta(hours=2),
            owner_id=owner.id,
        )
        session.add(event)
        session.flush()

        participant_link = EventParticipant(
            event_id=event.id,
            user_id=user.id,
        )
        session.add(participant_link)
        session.flush()

        assert event.user_has_access(user) is True

    def test_user_without_access(self, session, user):
        owner = User(
            email="owner2@example.com",
            password_hash=generate_password_hash("pass123"),
            password_algorithm="pbkdf2:sha256",
            is_email_verified=True,
            is_active=True,
        )
        session.add(owner)
        session.flush()

        event = Event(
            title="No Access Event",
            start_time=datetime.now(timezone.utc),
            end_time=datetime.now(timezone.utc) + timedelta(hours=1),
            owner_id=owner.id,
        )
        session.add(event)
        session.flush()

        assert event.user_has_access(user) is False

    def test_event_participant_relationship(self, session, user):
        event = Event(
            title="Relationship Test Event",
            start_time=datetime.now(timezone.utc),
            end_time=datetime.now(timezone.utc) + timedelta(hours=1),
            owner_id=user.id,
        )
        session.add(event)
        session.flush()

        participant = EventParticipant(
            event_id=event.id,
            user_id=user.id,
        )
        session.add(participant)
        session.flush()

        assert event.participant_links.count() == 1
        
        assert event.participant_links.first().user_id == user.id


class TestEventParticipantModel:
    def test_create_event_participant(self, session, user):
        event = Event(
            title="Participant Model Event",
            start_time=datetime.now(timezone.utc),
            end_time=datetime.now(timezone.utc) + timedelta(hours=1),
            owner_id=user.id,
        )
        session.add(event)
        session.flush()

        participant = EventParticipant(
            event_id=event.id,
            user_id=user.id,
        )
        session.add(participant)
        session.flush()

        assert participant.event_id == event.id
        assert participant.user_id == user.id
        assert participant.status == "confirmed"
        assert participant.joined_at is not None

    def test_event_participant_relationships(self, session, user):
        event = Event(
            title="Relationship Check Event",
            start_time=datetime.now(timezone.utc),
            end_time=datetime.now(timezone.utc) + timedelta(hours=1),
            owner_id=user.id,
        )
        session.add(event)
        session.flush()

        participant = EventParticipant(
            event_id=event.id,
            user_id=user.id,
        )
        session.add(participant)
        session.flush()

        assert participant.event == event
        assert participant.user == user

    def test_event_participant_cascade_delete(self, session, user):
        event = Event(
            title="Cascade Delete Event",
            start_time=datetime.now(timezone.utc),
            end_time=datetime.now(timezone.utc) + timedelta(hours=1),
            owner_id=user.id,
        )
        session.add(event)
        session.flush()

        participant = EventParticipant(
            event_id=event.id,
            user_id=user.id,
        )
        session.add(participant)
        session.flush()

        session.delete(event)
        session.flush()

        remaining = (
            session.query(EventParticipant)
            .filter_by(event_id=event.id, user_id=user.id)
            .first()
        )

        assert remaining is None
