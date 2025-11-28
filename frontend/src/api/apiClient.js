import axios from 'axios';
import { useAuthStore } from '../useAuthStore';
import { handleTokenRefresh } from './api/auth.js';

const apiClient = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // IMPORTANT: Allows sending the httpOnly refresh token cookie
});

// Request Interceptor: Inject Access Token
apiClient.interceptors.request.use(
  (config) => {
    // 1. Read the access token directly from the Zustand store
    const accessToken = useAuthStore.getState().accessToken;

    if (accessToken) {
      // 2. Attach the token to the Authorization header
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle Token Expiration (401)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if the error is a 401 and it hasn't been retried yet
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh the token
        const newAccessToken = await handleTokenRefresh();
        
        // Update the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        
        // Resend the original request
        return apiClient(originalRequest);
        
      } catch (refreshError) {
        // If refresh fails (e.g., refresh token expired), log out the user
        useAuthStore.getState().logout();
        // Redirect to login (e.g., using history/navigate depending on router)
        window.location.href = '/'; 
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;