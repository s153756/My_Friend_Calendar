import { useEffect, useState } from 'react';
import type { AxiosError } from 'axios';
import LoginForm from './components/LoginForm';
import TestCalendar from './components/TestCalendar';
import { useAuthStore } from './useAuthStore';
import type { LoginResponse } from './types/auth';
import apiClient from './api/apiClient';

function App() {
  const { user, setLogin, logout, statusMessage, statusType } = useAuthStore();
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    const fetchFirstUser = async () => {
      try {
        const response = await apiClient.get('/users/first');
        if (!isMounted) {
          return;
        }
        const data = response.data as { email?: string; message?: string };
        setMessage(data.email ?? data.message ?? '');
      } catch (err) {
        if (!isMounted) {
          return;
        }
        const error = err as AxiosError;
        if (error.response) {
          setMessage(`Backend Error: ${error.response.status}`);
        } else {
          setMessage('Error connecting to backend');
        }
      }
    };

    fetchFirstUser();

    return () => {
      isMounted = false;
    };
  }, [statusMessage]);

  const handleLoginSuccess = (data: LoginResponse) => {
    const { access_token, user: loggedInUser } = data;
    setLogin(access_token, loggedInUser);
  };

  const handleLogout = async () => {
    try {
      const { logoutUser } = await import('./api/auth');
      await logoutUser();
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      logout();
    }
  };

  return (
    <div className="App">
      {statusMessage && (
        <div className={`status-banner ${statusType ?? ''}`}>
          {statusMessage}
        </div>
      )}

      {message && (
        <div className="backend-message">
          {message}
        </div>
      )}

      <main className="App-main">
        {!user ? (
          <LoginForm onLoginSuccess={handleLoginSuccess} />
        ) : (
          <div className="user-dashboard">
            <h2>Welcome, {user.email}!</h2>
            <p>User ID: {user.id}</p>
            <p>Email verified: {user.is_email_verified ? 'Yes' : 'No'}</p>
            <button type="button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}

        <TestCalendar />
      </main>
    </div>
  );
}

export default App;
