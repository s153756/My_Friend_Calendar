import { useState } from "react";
import {
  Calendar,
  momentLocalizer,
  type Event as RBCEvent,
} from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";

interface CalendarEvent extends RBCEvent {
  title: string;
  start: Date;
  end: Date;
}

const localizer = momentLocalizer(moment);

const MainCalendar = () => {
  const [events] = useState<CalendarEvent[]>([
    {
      title: "Spotkanie testowe",
      start: new Date(),
      end: new Date(new Date().setHours(new Date().getHours() + 1)),
    },
  ]);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Calendar</h2>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500, margin: "50px auto", border: "1px solid #ddd" }}
      />
    </div>
  );
};

export default MainCalendar;
