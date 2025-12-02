import { useMemo, useState } from "react";
import {
  Calendar,
  momentLocalizer,
  type View,
  Views,
} from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import CalendarNavigation from "./CalendarNavigation";

type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
};

moment.updateLocale(moment.locale(), { week: { dow: 1, doy: 4 } });
const localizer = momentLocalizer(moment);

export default function MainCalendar() {
  const [view, setView] = useState<View>(Views.MONTH);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  const events = useMemo<CalendarEvent[]>(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + 7);
    const nextWeekEnd = new Date(nextWeek);
    nextWeekEnd.setHours(nextWeek.getHours() + 2);

    return [
      {
        id: "1",
        title: "Spotkanie testowe",
        start: now,
        end: new Date(now.getTime() + 60 * 60 * 1000),
      },
      {
        id: "2",
        title: "Planowanie sprintu",
        start: nextWeek,
        end: nextWeekEnd,
      },
      {
        id: "3",
        title: "Urlop",
        start: tomorrow,
        end: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000),
        allDay: true,
      },
    ];
  }, []);

  const handleViewChange = (nextView: View) => {
    setView(nextView);
  };

  const handleNavigate = (nextDate: Date) => {
    setCurrentDate(nextDate);
  };

  const handleGoToToday = () => {
    setCurrentDate(new Date());
  };

  const handleSpecificDateChange = (date: Date) => {
    setCurrentDate(date);
  };

  const handleMonthChange = (year: number, monthIndex: number) => {
    setCurrentDate(new Date(year, monthIndex, 1));
  };

  const handleYearChange = (year: number) => {
    setCurrentDate((prev) => new Date(year, prev.getMonth(), 1));
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Calendar</h2>
      <CalendarNavigation
        view={view}
        date={currentDate}
        onChangeView={handleViewChange}
        onGoToToday={handleGoToToday}
        onChangeDate={handleSpecificDateChange}
        onChangeMonth={handleMonthChange}
        onChangeYear={handleYearChange}
      />
      <Calendar
        localizer={localizer}
        events={events}
        view={view}
        onView={handleViewChange}
        date={currentDate}
        onNavigate={handleNavigate}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 650, marginTop: "1rem", border: "1px solid #ddd" }}
        toolbar={false}
      />
    </div>
  );
}
