export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  description?: string;
  location?: string;
  color?: string;
  isCancelled?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  createdByEmail?: string | null;
  participants?: string[];
  repeatRule?: "none" | "daily" | "weekly" | "monthly";
  category?: string;
  status?: "planned" | "in_progress" | "cancelled" | "completed";
  reminder?: "hour_before" | "day_before" | "week_before" | "none";
  tag?: string;
}

export type CalendarEventInput = Omit<
  CalendarEvent,
  "id" | "createdByEmail" | "participants"
> & {
  participants?: string[];
};
