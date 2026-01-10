import axios, { type AxiosError } from "axios";
import {CalendarUserEventListResponse, BackendCalendarResponse} from '../types/calendar'
import { useAuthStore } from "../useAuthStore";
import apiClient from "../api/apiClient";

const API_BASE_URL = process.env.REACT_APP_API_URL ?? "http://localhost:5000";

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