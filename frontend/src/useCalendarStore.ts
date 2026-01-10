import { create } from "zustand";
import type { CalendarEvent } from "./types/calendar";
import {getUserEventsList} from "./api/calendar"

type EventsDictionary = Record<string, CalendarEvent>;

interface CalendarEventState {
  eventsById: EventsDictionary;
  order: string[];
  events: CalendarEvent[];
  isLoading: boolean;
  error: string | null;
  addEvent: (event: CalendarEvent) => void;
  updateEvent: (eventId: string, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (eventId: string) => void;
  fetchEvents: () => void;
}

const materializeEvents = (
  eventsById: EventsDictionary,
  order: string[]
): CalendarEvent[] =>
  order
    .map((id) => eventsById[id])
    .filter((event): event is CalendarEvent => Boolean(event));

export const useCalendarStore = create<CalendarEventState>((set, get) => ({
  eventsById: {},
  order: [],
  events: [],
  isLoading: false,
  error: null,
  addEvent: (event) =>
    set((state) => {
      const nextEventsById: EventsDictionary = {
        ...state.eventsById,
        [event.id]: event,
      };
      const nextOrder = state.order.includes(event.id)
        ? state.order
        : [...state.order, event.id];
      return {
        eventsById: nextEventsById,
        order: nextOrder,
        events: materializeEvents(nextEventsById, nextOrder),
      };
    }),
  updateEvent: (eventId, updates) =>
    set((state) => {
      const existing = state.eventsById[eventId];
      if (!existing) {
        return state;
      }
      const nextEventsById: EventsDictionary = {
        ...state.eventsById,
        [eventId]: {
          ...existing,
          ...updates,
          updatedAt: updates.updatedAt ?? new Date(),
        },
      };
      return {
        eventsById: nextEventsById,
        order: state.order,
        events: materializeEvents(nextEventsById, state.order),
      };
    }),
  deleteEvent: (eventId) =>
    set((state) => {
      if (!state.eventsById[eventId]) {
        return state;
      }
      const { [eventId]: _removed, ...rest } = state.eventsById;
      const nextOrder = state.order.filter((id) => id !== eventId);
      return {
        eventsById: rest,
        order: nextOrder,
        events: materializeEvents(rest, nextOrder),
      };
    }),
  fetchEvents: async () => {
    set({ isLoading: true, error: null });

    try {
      const data = await getUserEventsList();
      
      const nextEventsById: EventsDictionary = {};
      const nextOrder: string[] = [];
      data.events.forEach((event) => {
        nextEventsById[event.id] = event;
        nextOrder.push(event.id);
      });
      set({
        eventsById: nextEventsById,
        order: nextOrder,
        events: materializeEvents(nextEventsById, nextOrder),
        isLoading: false,
      });
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      set({ error: errorMessage, isLoading: false });
      console.error("[Store: fetchEvents] Error:", errorMessage);
    }
  },
}));

export const useCalendarEvents = () =>
  useCalendarStore((state) => state.events);
