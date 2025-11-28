import axios from 'axios';
import { useAuthStore } from '../useAuthStore';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export async function loginUser(email, password) {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Login failed');
  }

  return response.json();
}


export const handleTokenRefresh = async () => {
  try {
    const response = await axios.post(
      'http://localhost:5000/auth/refresh',
      {},
      {
        withCredentials: true,
      }
    );

    const newAccessToken = response.data.access_token;

    if (newAccessToken) {
      useAuthStore.getState().setAccessToken(newAccessToken);

      console.log("Token successfully refreshed.");
      return newAccessToken;
    }

  } catch (error) {
    console.error("Refresh token failed or expired:", error);

    throw error;
  }
};