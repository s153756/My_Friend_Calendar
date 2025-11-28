import axios from 'axios';
import { useAuthStore } from '../useAuthStore';
import Cookies from 'js-cookie';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export async function loginUser(email, password) {
  try {
    const response = await axios.post(
      `${API_URL}/api/auth/login`,
      { email, password },
      {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' },
      }
    );

    return response.data;

  } catch (error) {
    if (error.response && error.response.data && error.response.data.error) {
      throw new Error(error.response.data.error);
    }

    throw new Error('Login failed due to network or server error.');
  }
}

export const handleTokenRefresh = async () => {
  const csrfToken = Cookies.get('csrf_refresh_token');

  if (!csrfToken) {
      throw new Error("CSRF token not found. Cannot refresh.");
  }

  try {
    const response = await axios.post(
      'http://localhost:5000/api/auth/refresh',
      {},
      {
        withCredentials: true,
        headers: {
          'X-CSRF-TOKEN': csrfToken
        }
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