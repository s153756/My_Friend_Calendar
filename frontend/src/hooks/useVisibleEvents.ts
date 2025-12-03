import { useMemo } from "react";
import type { View } from "react-big-calendar";
import { computeVisibleRange } from "../utils/calendarRange";
import { useCalendarEvents } from "../useCalendarStore";

export const useVisibleEvents = (view: View, date: Date) => {
  const events = useCalendarEvents();
  const visibleRange = useMemo(() => computeVisibleRange(view, date), [view, date]);
  const filteredEvents = useMemo(() => {
    const { start, end } = visibleRange;
    return events.filter((event) => event.end >= start && event.start <= end);
  }, [events, visibleRange]);

  return { events: filteredEvents, range: visibleRange };
};
