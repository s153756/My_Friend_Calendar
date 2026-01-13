import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "../useAuthStore";

const API_BASE_URL = process.env.REACT_APP_API_URL ?? "http://localhost:5000";

type RequestConfigWithRetry = InternalAxiosRequestConfig & { _retry?: boolean };

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

apiClient.interceptors.request.use(
  (config: RequestConfigWithRetry) => {
    const accessToken = useAuthStore.getState().accessToken;

    if (accessToken) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RequestConfigWithRetry | undefined;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const { handleTokenRefresh } = await import("./auth");
        const newAccessToken = await handleTokenRefresh();
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return apiClient(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        window.location.href = "/";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const handleApiError = (error: unknown): string => {
  const axiosError = error as AxiosError<{ error?: string; details?: string | string[] }>;
  const data = axiosError.response?.data;
  const { addError } = useAuthStore.getState();

  let errorMessages: string[] = [];

  if (data?.details) {
    errorMessages = Array.isArray(data.details) ? data.details : [data.details];
  } else {
    errorMessages = [data?.error || "An unexpected error occurred"];
  }

  errorMessages.forEach((msg) => addError(msg));
  return errorMessages[0];
};

export default apiClient;
