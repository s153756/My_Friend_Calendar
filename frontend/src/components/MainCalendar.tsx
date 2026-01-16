import { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, momentLocalizer, type SlotInfo, type View, Views } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";

import CalendarNavigation from "./CalendarNavigation";
import { CreateEventModal } from "./CreateEventModal";
import { useCalendarStore } from "../useCalendarStore";
import { useAuthStore } from "../useAuthStore";
import { useVisibleEvents } from "../hooks/useVisibleEvents";
import type { CalendarEvent, CalendarEventInput } from "../types/calendar";
import { updateEventAPI } from "../api/calendar";

moment.updateLocale(moment.locale(), { week: { dow: 1, doy: 4 } });
const localizer = momentLocalizer(moment);

const toDateTimeLocal = (date: Date) => {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

export default function MainCalendar() {
  const [view, setView] = useState<View>(Views.MONTH);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [initialFormValues, setInitialFormValues] = useState<any>(null);

  const { events } = useVisibleEvents(view, currentDate);
  const { addEvent, updateEvent, deleteEvent, eventsById, fetchEvents } = useCalendarStore();
  const currentUserEmail = useAuthStore((state) => state.user?.email ?? null);

  const selectedEvent = useMemo(
    () => (selectedEventId ? eventsById[selectedEventId] : undefined),
    [selectedEventId, eventsById]
  );


  const handleSelectSlot = useCallback(({ start, end, action }: SlotInfo) => {
    setModalMode("create");
    setSelectedEventId(null);
    setInitialFormValues({
      title: "",
      start: toDateTimeLocal(start),
      end: toDateTimeLocal(end),
      allDay: action === "select" && view === Views.MONTH,
      status: "planned",
      repeatRule: "none"
    });
    setIsModalOpen(true);
  }, [view]);

 
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setModalMode("edit");
    setSelectedEventId(event.id);
    setInitialFormValues({
      ...event,
      start: toDateTimeLocal(event.start),
      end: toDateTimeLocal(event.end),
      participants: event.participants?.join(", ") ?? ""
    });
    setIsModalOpen(true);
  }, []);

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEventId(null);
    setInitialFormValues(null);
  };

  const handleFormSubmit = (values: CalendarEventInput) => {
    const timestamp = new Date();

    if (modalMode === "edit" && selectedEventId) {
      updateEventAPI(selectedEventId, values)
        .then(() => {
          updateEvent(selectedEventId, { ...values, updatedAt: timestamp });
          closeModal();
        })
        .catch((error) => {
          console.error("Update failed:", error);
        });
    } else {
      const newEvent: CalendarEvent = {
        ...values,
        id: crypto.randomUUID(),
        createdAt: timestamp,
        updatedAt: timestamp,
        createdByEmail: currentUserEmail ?? undefined,
      };
      addEvent(newEvent);
      closeModal();
    }
  };

  const handleDelete = () => {
    if (selectedEventId) {
      deleteEvent(selectedEventId);
      closeModal();
    }
  };

  useEffect(() => {
    if (currentUserEmail) fetchEvents();
  }, [currentUserEmail, fetchEvents]);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Calendar</h2>
      <CalendarNavigation
        view={view}
        date={currentDate}
        onChangeView={setView}
        onGoToToday={() => setCurrentDate(new Date())}
        onChangeDate={setCurrentDate}
        onChangeMonth={(y, m) => setCurrentDate(new Date(y, m, 1))}
        onChangeYear={(y) => setCurrentDate(prev => new Date(y, prev.getMonth(), 1))}
      />
      
      <Calendar
        localizer={localizer}
        events={events}
        view={view}
        onView={setView}
        date={currentDate}
        onNavigate={setCurrentDate}
        selectable
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        startAccessor="start"
        endAccessor="end"
        toolbar={false}
        style={{ height: 650, marginTop: "1rem", border: "1px solid #ddd" }}
        eventPropGetter={(event: CalendarEvent) => ({
          style: {
            backgroundColor: event.color || "#3174ad",
            opacity: event.isCancelled ? 0.5 : 1,
            textDecoration: event.isCancelled ? "line-through" : "none",
            color: "white",
            borderRadius: "4px"
          }
        })}
      />

      <CreateEventModal
        open={isModalOpen}
        onClose={closeModal}
        initialValues={initialFormValues}
        mode={modalMode}
        onSubmit={handleFormSubmit}
        onDelete={modalMode === "edit" ? handleDelete : undefined}
        creatorEmail={selectedEvent?.createdByEmail || null}
      />
    </div>
  );
}