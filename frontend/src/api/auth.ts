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
    handleApiError(error);
    useAuthStore.getState().addNotification("Login failed.", "error")
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

export async function resetPasswordWithToken(
  token: string,
  password: string
): Promise<void> {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/auth/reset-password`,
      { token, password },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    if (response.status === 201) {
      useAuthStore.getState().addNotification("Password changed successfully!", "success");
    } else {
      useAuthStore.getState().addNotification("Failed to change password.", "error");
    }
  } catch (error) {
    handleApiError(error);
    useAuthStore.getState().addNotification("An error occurred while changing the password.", "error");
    throw error;
  }
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): Promise<void> {
  // TODO: Implement change password for logged-in users
  // This should call a different endpoint that verifies current password
  throw new Error("Change password for logged-in users not yet implemented");
}

export async function requestPasswordReset(email: string): Promise<void> {
  console.log("requestPasswordReset called with email:", email);
  try {
    const response = await apiClient.post(`${API_BASE_URL}/api/auth/request_reset-password`, { email });
    console.log("API response:", response);
    useAuthStore.getState().addNotification("Password reset token sent successfully!", "success");
  } catch (error) {
    console.error("Error in requestPasswordReset:", error);
    useAuthStore.getState().addNotification("Failed to send password reset token.", "error");
    throw error;
  }
}

