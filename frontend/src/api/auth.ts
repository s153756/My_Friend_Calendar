import axios, { type AxiosError } from "axios";
import Cookies from "js-cookie";
import apiClient from "./apiClient";
import { useAuthStore } from "../useAuthStore";
import type { LoginResponse } from "../types/auth";

const API_BASE_URL = process.env.REACT_APP_API_URL ?? "http://localhost:5000";

type LoginErrorResponse = {
  error?: string;
};

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
    const axiosError = error as AxiosError<LoginErrorResponse>;

    if (axiosError.response?.data?.error) {
      throw new Error(axiosError.response.data.error);
    }

    throw new Error("Login failed due to network or server error.");
  }
}

export const handleTokenRefresh = async (): Promise<string> => {
  const csrfToken = Cookies.get("csrf_refresh_token");

  if (!csrfToken) {
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

    throw new Error("Refresh response did not include a new access token.");
  } catch (error) {
    console.error("Refresh token failed or expired:", error);
    throw error;
  }
};

export async function logoutUser(): Promise<void> {
  try {
    await apiClient.get("/auth/logout");
  } catch (error) {
    console.error("Logout request failed:", error);
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
    const axiosError = error as AxiosError<{ error?: string; details?: string[] }>;

    if (axiosError.response?.data?.details) {
      throw new Error(axiosError.response.data.details[0]);
    }

    if (axiosError.response?.data?.error) {
      throw new Error(axiosError.response.data.error);
    }

    throw new Error("Registration failed");
  }
}
