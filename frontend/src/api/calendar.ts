import { useAuthStore } from '../useAuthStore';
import apiClient, { handleApiError } from "./apiClient";
import { CalendarUserEventListResponse, CalendarEvent } from '../types/calendar';

export async function getUserEventsList(): Promise<CalendarUserEventListResponse> {
  try {
    const response = await apiClient.get("/calendar/events/");
    const rawEvents = Array.isArray(response.data) 
      ? response.data 
      : (Array.isArray(response.data.data) ? response.data.data : []);
 
    const mappedEvents = rawEvents.map((event: any) => ({
      id: String(event.id),
      title: event.title,
      start: new Date(event.start_time), 
      end: new Date(event.end_time),  
      description: event.description,
      location: event.location,
      color: event.color,
      status: event.status,
      createdByEmail: event.owner?.email || null,
      participants: event.participants?.map((p: any) => p.email) || [],
    }));
    if (response.status === 200) {
      useAuthStore.getState().addNotification("Your events have been loaded successfully!", "success")
    }
    return {
      events: mappedEvents
    };
    
  } catch (error: any) {
    handleApiError(error);
    throw new Error("Events list fetch failed.");
  }
}

export async function createEvent(eventData: {
  title: string;
  description?: string;
  location?: string;
  color?: string;
  status?: "planned" | "in_progress" | "cancelled" | "completed";
  start: Date;
  end: Date;
}): Promise<CalendarEvent> {
  try {
    const formatLocalISO = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    };

    const payload = {
      title: eventData.title,
      description: eventData.description,
      location: eventData.location,
      color: eventData.color,
      status: eventData.status,
      start_time: formatLocalISO(eventData.start),
      end_time: formatLocalISO(eventData.end),
    };

    const response = await apiClient.post("/calendar/events/create", payload);
    useAuthStore.getState().addNotification("Event created successfully!", "success");
    
    return {
      id: String(response.data.id),
      title: response.data.title,
      description: response.data.description,
      location: response.data.location,
      color: response.data.color,
      status: response.data.status,
      start: new Date(response.data.start_time),
      end: new Date(response.data.end_time),
      createdByEmail: null,
      participants: [],
    };
  } catch (error: any) {
    handleApiError(error);
    throw new Error("Event creation failed.");
  }
}