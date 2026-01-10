import pytest
from app.models import Event, User



@pytest.fixture
def test_participants(session):
    participants = []
    for i in range(3):
        user = User()
        user.email = f'participant{i}@test.com'
        user.password_hash = 'hashed_password'
        user.password_algorithm = 'pbkdf2:sha256'
        user.is_email_verified = True
        user.is_active = True
        session.add(user)
        participants.append(user)
    session.flush()
    for p in participants:
        session.refresh(p)
    return participants


@pytest.fixture
def auth_token(user, app):
    from flask_jwt_extended import create_access_token

    with app.app_context():
        token = create_access_token(identity=user.id)
    return token


@pytest.fixture
def auth_headers(auth_token):
    return {
        'Authorization': f'Bearer {auth_token}',
        'Content-Type': 'application/json'
    }


@pytest.fixture
def created_event(client, auth_headers, user, session):
    event_data = {
        'title': 'Original Event Title',
        'description': 'Original description',
        'start_time': '2024-06-15T10:00:00',
        'end_time': '2024-06-15T11:00:00',
        'participant_ids': []
    }

    response = client.post(
        '/api/calendar/events/create',
        json=event_data,
        headers=auth_headers
    )

    assert response.status_code == 201
    return response.get_json()

class TestUpdateEventEndpointIntegration:

    def test_update_event_title(self, client, auth_headers, created_event, session):
        event_id = created_event['id']
        update_data = {'title': 'Updated Event Title'}

        response = client.patch(
            f'api/calendar/events/{event_id}',
            json=update_data,
            headers=auth_headers
        )

        assert response.status_code == 200
        response_data = response.get_json()
        assert response_data['title'] == 'Updated Event Title'

        event = session.query(Event).filter_by(id=event_id).first()
        assert event is not None
        assert event.title == 'Updated Event Title'
        assert event.description == 'Original description'

    def test_update_event_description(self, client, auth_headers, created_event, session):
        event_id = created_event['id']
        update_data = {'description': 'Brand new description'}

        response = client.patch(
            f'api/calendar/events/{event_id}',
            json=update_data,
            headers=auth_headers
        )

        assert response.status_code == 200

        event = session.query(Event).filter_by(id=event_id).first()
        assert event.description == 'Brand new description'
        assert event.title == 'Original Event Title'

    def test_update_event_int_time(self, client, auth_headers, created_event, session):
        event_id = created_event['id']

        update_data = {"start_time": 121231313}
        response = client.patch(
            f'api/calendar/events/{event_id}',
            json=update_data,
            headers=auth_headers
        )

        assert response.status_code == 400

    def test_update_event_not_existing_users(self, client, auth_headers, created_event, session):
        update_data = {"participant_ids": ["550e8400-e29b-41d4-a716-446655440000", "123e4567-e89b-12d3-a456-426614174000"]}

        event_id = created_event['id']
        response = client.patch(
            f'api/calendar/events/{event_id}',
            json=update_data,
            headers=auth_headers
        )

        assert response.status_code == 400