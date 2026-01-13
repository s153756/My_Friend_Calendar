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

    return response.data;
  } catch (error) {
    handleApiError(error);
    useAuthStore.getState().addError("Login failed.")
    throw new Error("Login failed.");
  }
}

export const handleTokenRefresh = async (): Promise<string> => {
  const csrfToken = Cookies.get("csrf_refresh_token");

  if (!csrfToken) {
    useAuthStore.getState().addError("CSRF token not found. Cannot refresh.")
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
      return newAccessToken;
    }
    useAuthStore.getState().addError("Refresh response did not include a new access token.")
    throw new Error("Refresh response did not include a new access token.");
  } catch (error) {
    useAuthStore.getState().addError("Refresh token failed or expired.")
    console.error("Refresh token failed or expired:", error);
    throw error;
  }
};

export async function logoutUser(): Promise<void> {
  try {
    await apiClient.post("/auth/logout");
  } catch (error) {
    useAuthStore.getState().addError("Logout request failed.")
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

    return response.data;
  } catch (error) {
    handleApiError(error);
    useAuthStore.getState().addError("Registration failed")
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
