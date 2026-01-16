import {CalendarUserEventListResponse, BackendCalendarResponse, CalendarEventInput} from '../types/calendar'
import apiClient from "../api/apiClient";

export async function getUserEventsList(): Promise<CalendarUserEventListResponse> {
  try {
    const response = await apiClient.get<BackendCalendarResponse>("/calendar/events/");
    const rawEvents = Array.isArray(response.data.data) 
      ? response.data.data 
      : (Array.isArray(response.data) ? response.data : []);
 
    const mappedEvents = rawEvents.map((event: any) => ({
      id: String(event.id),
      title: event.title,
      start: new Date(event.start_time), 
      end: new Date(event.end_time),  
      description: event.description,
      location: event.location,
      createdByEmail: event.owner?.email || null,
      participants: event.participants || [],
    }));
    return {
      events: mappedEvents
    };
    
  } catch (error: any) {
    console.error("Fetch error:", error.response?.data || error.message);
    throw new Error("Events list fetch failed.");
  }
}

export function updateEventAPI(eventId: string, data: CalendarEventInput) {
  const payload: any = {
    title: data.title,
    start_time: data.start.toISOString(),
    end_time: data.end.toISOString()
  };
  if (data.description) payload.description = data.description;
  if (data.location) payload.location = data.location;
  
  return apiClient.patch(`/calendar/events/${eventId}`, payload);
}