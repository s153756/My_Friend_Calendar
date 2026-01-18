import axios, { type AxiosError } from "axios";
import Cookies from "js-cookie";
import apiClient, { handleApiError } from "./apiClient";
import { useAuthStore } from "../useAuthStore";
import type { LoginResponse } from "../types/auth";

const API_BASE_URL = process.env.REACT_APP_API_URL ?? "http://localhost:5000";


type RefreshResponse = {
  access_token: string;
};

export async function loginUser(
  email: string,
  password: string
): Promise<LoginResponse> {
  try {
    const response = await axios.post<LoginResponse>(
      `${API_BASE_URL}/api/auth/login`,
      { email, password },
      {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      }
    );
    
    useAuthStore.getState().addNotification("Logged in successfully!", "success")
    return response.data;
  } catch (error) {
    const reason = handleApiError(error, { notify: false });
    useAuthStore.getState().addNotification(`Login error: ${reason}`, "error")
    throw new Error("Login failed.");
  }
}

export const handleTokenRefresh = async (): Promise<string> => {
  const csrfToken = Cookies.get("csrf_refresh_token");

  if (!csrfToken) {
    useAuthStore.getState().addNotification("CSRF token not found. Cannot refresh.", "error")
    throw new Error("CSRF token not found. Cannot refresh.");
  }

  try {
    const response = await axios.post<RefreshResponse>(
      `${API_BASE_URL}/api/auth/refresh`,
      {},
      {
        withCredentials: true,
        headers: {
          "X-CSRF-TOKEN": csrfToken,
        },
      }
    );

    const newAccessToken = response.data.access_token;

    if (newAccessToken) {
      useAuthStore.getState().setAccessToken(newAccessToken);
      useAuthStore.getState().addNotification("Login token has been refreshed!", "success")
      return newAccessToken;
    }
    useAuthStore.getState().addNotification("Refresh response did not include a new access token.", "error")
    throw new Error("Refresh response did not include a new access token.");
  } catch (error) {
    useAuthStore.getState().addNotification("Refresh token failed or expired.", "error")
    console.error("Refresh token failed or expired:", error);
    throw error;
  }
};

export async function logoutUser(): Promise<void> {
  try {
    await apiClient.post("/auth/logout");
    useAuthStore.getState().addNotification("Logged out successfully!", "success")
  } catch (error) {
    useAuthStore.getState().addNotification("Logout request failed.", "error")
  }
}

export async function registerUser(
  email: string,
  password: string,
  repeatedPassword: string,
  fullName: string,
  displayName: string
): Promise<LoginResponse> {
  try {
    const response = await axios.post<LoginResponse>(
      `${API_BASE_URL}/api/auth/register`,
      {
        email,
        password,
        repeated_password: repeatedPassword,
        full_name: fullName,
        display_name: displayName,
      },
      {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      }
    );
    if (response.status == 201){
      useAuthStore.getState().addNotification("Registration completed successfully!", "success")
    }
    return response.data;
  } catch (error) {
    handleApiError(error);
    useAuthStore.getState().addNotification("Registration failed", "error")
    throw new Error("Registration failed")
  }
}

export async function changePassword(
  _currentPassword: string,
  _newPassword: string,
  _confirmPassword: string
): Promise<void> {
  console.log("changePassword TODO");
  return Promise.resolve();
}
