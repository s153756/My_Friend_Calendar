import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Calendar, momentLocalizer, type SlotInfo, type View, Views } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";

import CalendarNavigation from "./CalendarNavigation";
import { CreateEventModal } from "./CreateEventModal";
import { useCalendarStore } from "../useCalendarStore";
import { useAuthStore } from "../useAuthStore";
import { useVisibleEvents } from "../hooks/useVisibleEvents";
import type { CalendarEvent, CalendarEventInput } from "../types/calendar";
import { createEvent } from "../api/calendar";

moment.updateLocale(moment.locale(), { week: { dow: 1, doy: 4 } });
const localizer = momentLocalizer(moment);

const formatDateTimeLocal = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export default function MainCalendar() {
  const [view, setView] = useState<View>(Views.MONTH);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [initialFormValues, setInitialFormValues] = useState<any>(null);

  const { events } = useVisibleEvents(view, currentDate);
  const { addEvent, updateEvent, deleteEvent, eventsById, fetchEvents, clearEvents } = useCalendarStore();
  const currentUserEmail = useAuthStore((state) => state.user?.email ?? null);
  const accessToken = useAuthStore((state) => state.accessToken);
  const addNotification = useAuthStore((state) => state.addNotification);
  const isLoggedIn = !!accessToken;

  const selectedEvent = useMemo(
    () => (selectedEventId ? eventsById[selectedEventId] : undefined),
    [selectedEventId, eventsById]
  );


  const handleSelectSlot = useCallback(({ start, end, action }: SlotInfo) => {
    if (!isLoggedIn) {
      addNotification("You must be logged in to create an event. Please log in.", "error");
      return;
    }

    setModalMode("create");
    setSelectedEventId(null);
    
    const isAllDay = action === "select" && view === Views.MONTH;
    let adjustedEnd = end;
    
    if (isAllDay) {
      adjustedEnd = new Date(start);
      adjustedEnd.setHours(23, 59, 59, 999);
    }
    
    setInitialFormValues({
      title: "",
      start: formatDateTimeLocal(start),
      end: formatDateTimeLocal(adjustedEnd),
      allDay: isAllDay,
      color: "#3174ad",
      status: "planned",
      repeatRule: "none"
    });
    setIsModalOpen(true);
  }, [view, isLoggedIn, addNotification]);

 
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    if (!isLoggedIn) {
      addNotification("You must be logged in to edit an event. Please log in.", "error");
      return;
    }

    setModalMode("edit");
    setSelectedEventId(event.id);
    setInitialFormValues({
      ...event,
      start: formatDateTimeLocal(event.start),
      end: formatDateTimeLocal(event.end),
      color: event.color || "#3174ad",
      participants: event.participants?.join(", ") ?? ""
    });
    setIsModalOpen(true);
  }, [isLoggedIn, addNotification]);

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEventId(null);
    setInitialFormValues(null);
  };

  const handleFormSubmit = async (values: CalendarEventInput) => {
    const timestamp = new Date();

    if (modalMode === "edit" && selectedEventId) {
      updateEvent(selectedEventId, { ...values, updatedAt: timestamp });
      closeModal();
    } else {
      try {
        const newEvent = await createEvent({
          title: values.title,
          description: values.description,
          location: values.location,
          color: values.color,
          status: values.status,
          start: values.start,
          end: values.end,
        });

        const fullEvent: CalendarEvent = {
          ...newEvent,
          color: values.color ?? newEvent.color,
          allDay: values.allDay,
          status: values.status ?? newEvent.status,
          repeatRule: values.repeatRule,
          reminder: values.reminder,
          createdAt: timestamp,
          updatedAt: timestamp,
          createdByEmail: currentUserEmail ?? undefined,
        };

        addEvent(fullEvent);
        closeModal();
      } catch (error: any) {
        console.error("Failed to create event:", error);
        alert(error.message || "Failed to create event. Please try again.");
      }
    }
  };

  const handleDelete = () => {
    if (selectedEventId) {
      deleteEvent(selectedEventId);
      closeModal();
    }
  };

  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (currentUserEmail) {
      if (!hasFetchedRef.current) {
        fetchEvents();
        hasFetchedRef.current = true;
      }
    } else {
      clearEvents();
      hasFetchedRef.current = false;
    }
  }, [currentUserEmail, fetchEvents, clearEvents]);

  return (
    <div className="p-3">
      <h2 className="mb-3">Calendar</h2>
      <CalendarNavigation
        view={view}
        date={currentDate}
        onChangeView={setView}
        onGoToToday={() => setCurrentDate(new Date())}
        onChangeDate={setCurrentDate}
        onChangeMonth={(y, m) => setCurrentDate(new Date(y, m, 1))}
        onChangeYear={(y) => setCurrentDate(prev => new Date(y, prev.getMonth(), 1))}
      />
      
      <div className="bg-white border rounded overflow-hidden">
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
          style={{ height: 650 }}
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
      </div>

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