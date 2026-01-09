import pytest
from datetime import datetime
from unittest.mock import patch, MagicMock
from app.services.calendar_service import patch_event

@pytest.fixture
def sample_event():
    event = MagicMock()

    event.id = 1
    event.title = "Team Meeting"
    event.description = "Weekly sync"
    event.start_time = datetime(2024, 1, 15, 10, 0)
    event.end_time = datetime(2024, 1, 15, 11, 0)
    event.owner_id = 1

    mock_query = MagicMock()
    mock_query.delete = MagicMock(return_value=None)

    event.participant_links = mock_query

    return event

class TestPatchEventFunction:
    """Unit tests for the patch_event function"""

    @patch('app.services.calendar_service.db.session')
    def test_update_title(self, mock_db, sample_event):
        """Test updating event title"""
        data = {'title': 'Updated Meeting'}

        updated_event, was_updated = patch_event(sample_event, data)

        assert was_updated is True
        assert updated_event.title == 'Updated Meeting'
        mock_db.commit.assert_called_once()

    @patch('app.services.calendar_service.db.session')
    def test_update_description(self, mock_db, sample_event):
        """Test updating event description"""
        data = {'description': 'New description'}

        updated_event, was_updated = patch_event(sample_event, data)

        assert was_updated is True
        assert updated_event.description == 'New description'
        mock_db.commit.assert_called_once()

    @patch('app.services.calendar_service.db.session')
    def test_update_datetime_fields(self, mock_db, sample_event):
        """Test updating start_time and end_time with ISO strings"""
        data = {
            'start_time': '2024-01-16T14:00:00',
            'end_time': '2024-01-16T15:00:00'
        }

        updated_event, was_updated = patch_event(sample_event, data)

        assert was_updated is True
        assert updated_event.start_time == datetime(2024, 1, 16, 14, 0)
        assert updated_event.end_time == datetime(2024, 1, 16, 15, 0)
        mock_db.commit.assert_called_once()

    @patch('app.services.calendar_service.db.session')
    def test_invalid_endtime_before_starttime(self, mock_db, sample_event):
        data = {
            'end_time': '2024-01-16T14:00:00',
            'start_time': '2024-01-16T15:00:00'
        }

        with pytest.raises(ValueError, match="start_time must be before end_time."):
            patch_event(sample_event, data)

    @patch('app.services.calendar_service.db.session')
    def test_invalid_datetime_format_raises_error(self, mock_db, sample_event):
        """Test that invalid datetime format raises ValueError"""
        data = {'start_time': 'invalid-date'}

        with pytest.raises(ValueError, match="Invalid format for start_time"):
            patch_event(sample_event, data)

    @patch('app.services.calendar_service.db.session')
    def test_update_participants(self, mock_db, sample_event):
        """Test updating participant list"""
        data = {'participant_ids': [2, 3, 4]}

        updated_event, was_updated = patch_event(sample_event, data)

        assert was_updated is True
        assert mock_db.add.call_count == 3
        mock_db.commit.assert_called_once()

    @patch('app.services.calendar_service.db.session')
    def test_no_valid_fields_returns_false(self, mock_db, sample_event):
        """Test that no valid fields returns was_updated=False"""
        data = {'invalid_field': 'value'}

        updated_event, was_updated = patch_event(sample_event, data)

        assert was_updated is False
        mock_db.commit.assert_not_called()

    @patch('app.services.calendar_service.db.session')
    def test_empty_data_returns_false(self, mock_db, sample_event):
        """Test that empty data returns was_updated=False"""
        data = {}

        updated_event, was_updated = patch_event(sample_event, data)

        assert was_updated is False
        mock_db.commit.assert_not_called()

    @patch('app.services.calendar_service.db.session')
    def test_update_multiple_fields(self, mock_db, sample_event):
        """Test updating multiple fields at once"""
        data = {
            'title': 'New Title',
            'description': 'New Description',
            'start_time': '2023-02-01T09:00:00'
        }

        updated_event, was_updated = patch_event(sample_event, data)

        assert was_updated is True
        assert updated_event.title == 'New Title'
        assert updated_event.description == 'New Description'
        assert updated_event.start_time == datetime(2023, 2, 1, 9, 0)
        mock_db.commit.assert_called_once()