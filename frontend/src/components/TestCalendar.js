import React, { useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

const TestCalendar = () => {
  const [events, setEvents] = useState([
    {
      title: 'Spotkanie testowe',
      start: new Date(),
      end: new Date(new Date().setHours(new Date().getHours() + 1)),
    },
  ]);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Test Calendar</h2>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500, margin: '50px auto', border: '1px solid #ddd' }}
      />
    </div>
  );
};

export default TestCalendar;