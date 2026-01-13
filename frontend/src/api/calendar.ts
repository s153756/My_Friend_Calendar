import {CalendarUserEventListResponse, BackendCalendarResponse} from '../types/calendar'
import apiClient, { handleApiError } from "./apiClient";

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
    handleApiError(error);
    throw new Error("Events list fetch failed.");
  }
}