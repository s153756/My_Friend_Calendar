import { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  momentLocalizer,
  type SlotInfo,
  type View,
  Views,
} from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import CalendarNavigation from "./CalendarNavigation";
import { CreateEventModal } from "./CreateEventModal";
import type { CreateEventFormValues } from "./EventForm";
import { useCalendarStore } from "../useCalendarStore";
import { useAuthStore } from "../useAuthStore";
import { useVisibleEvents } from "../hooks/useVisibleEvents";
import type { CalendarEvent, CalendarEventInput } from "../types/calendar";

moment.updateLocale(moment.locale(), { week: { dow: 1, doy: 4 } });
const localizer = momentLocalizer(moment);

type ModalMode = "create" | "edit";

const logDebug = (message: string, payload?: unknown) => {
  if (process.env.NODE_ENV !== "production") {
    console.debug(`[MainCalendar] ${message}`, payload);
  }
};

const formatDateForInput = (date: Date): string => {
  const pad = (value: number) => value.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
};

const generateEventId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `evt_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

const mapEventToFormDefaults = (
  event: CalendarEvent
): Partial<CreateEventFormValues> => ({
  title: event.title,
  description: event.description ?? "",
  location: event.location ?? "",
  color: event.color ?? "#3174ad",
  allDay: Boolean(event.allDay),
  start: formatDateForInput(event.start),
  end: formatDateForInput(event.end),
  isCancelled: Boolean(event.isCancelled),
  participants: event.participants?.join(", ") ?? "",
  repeatRule: event.repeatRule ?? "none",
  category: event.category ?? "",
  status: event.status ?? "planned",
  reminder: event.reminder ?? "none",
  tag: event.tag ?? "",
});

export default function MainCalendar() {
  const [view, setView] = useState<View>(Views.MONTH);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [initialFormValues, setInitialFormValues] =
    useState<Partial<CreateEventFormValues>>();
  const { events } = useVisibleEvents(view, currentDate);
  const addEvent = useCalendarStore((state) => state.addEvent);
  const updateEvent = useCalendarStore((state) => state.updateEvent);
  const deleteEvent = useCalendarStore((state) => state.deleteEvent);
  const eventsById = useCalendarStore((state) => state.eventsById);
  const currentUserEmail = useAuthStore((state) => state.user?.email ?? null);
  const editingEvent = useMemo(
    () => (editingEventId ? eventsById[editingEventId] : undefined),
    [editingEventId, eventsById]
  );

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

  const handleSelectSlot = useCallback(
    (slotInfo: SlotInfo) => {
      logDebug("Slot selected", {
        action: slotInfo.action,
        start: slotInfo.start,
        end: slotInfo.end,
      });
      setModalMode("create");
      setEditingEventId(null);
      setInitialFormValues({
        title: "",
        start: formatDateForInput(slotInfo.start),
        end: formatDateForInput(slotInfo.end),
        allDay: slotInfo.action === "select" && view === Views.MONTH,
      });
      setIsCreateModalOpen(true);
    },
    [view]
  );

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    logDebug("Event selected for editing", { id: event.id, title: event.title });
    setModalMode("edit");
    setEditingEventId(event.id);
    setInitialFormValues(mapEventToFormDefaults(event));
    setIsCreateModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    logDebug("Closing modal", { mode: modalMode, editingEventId });
    setIsCreateModalOpen(false);
    setEditingEventId(null);
    setModalMode("create");
    setInitialFormValues(undefined);
  }, [editingEventId, modalMode]);

  const handleDeleteEvent = useCallback(() => {
    if (!editingEventId) {
      return;
    }
    logDebug("Deleting event", { id: editingEventId });
    startTransition(() => {
      deleteEvent(editingEventId);
    });
    closeModal();
  }, [closeModal, deleteEvent, editingEventId]);

  const handleSubmitEvent = useCallback(
    (values: CalendarEventInput) => {
      const timestamp = new Date();
      if (modalMode === "edit" && editingEventId) {
        logDebug("Updating event", { id: editingEventId });
        startTransition(() => {
          updateEvent(editingEventId, {
            ...values,
            updatedAt: timestamp,
          });
        });
        return;
      }

      const event: CalendarEvent = {
        ...values,
        id: generateEventId(),
        createdAt: timestamp,
        updatedAt: timestamp,
        createdByEmail: currentUserEmail ?? undefined,
      };

      // TODO: replace local-only event creation with backend API call (createEvent)
      logDebug("Creating new event", { id: event.id, title: event.title });
      startTransition(() => {
        addEvent(event);
      });
    },
    [addEvent, currentUserEmail, editingEventId, modalMode, updateEvent]
  );

  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    return {
      style: {
        backgroundColor: event.color || "#3174ad",
        opacity: event.isCancelled ? 0.6 : 1,
        textDecoration: event.isCancelled ? "line-through" : "none",
        borderRadius: "4px",
        color: "#fff",
      },
    };
  }, []);

  useEffect(() => {
    logDebug("Events count changed", { count: events.length });
  }, [events.length]);

  useEffect(() => {
    logDebug("Modal state update", {
      open: isCreateModalOpen,
      mode: modalMode,
      editingEventId,
    });
  }, [editingEventId, isCreateModalOpen, modalMode]);

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
        selectable
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        eventPropGetter={eventStyleGetter}
      />
      <CreateEventModal
        open={isCreateModalOpen}
        onClose={closeModal}
        initialValues={initialFormValues}
        mode={modalMode}
        onSubmit={handleSubmitEvent}
        onDelete={modalMode === "edit" ? handleDeleteEvent : undefined}
        creatorEmail={modalMode === "edit" ? editingEvent?.createdByEmail ?? null : null}
      />
    </div>
  );
}
