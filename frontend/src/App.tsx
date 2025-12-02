import { useEffect, useState } from 'react';
import type { AxiosError } from 'axios';
import MainCalendar from './components/MainCalendar';
import LoginPage from './pages/LoginPage'
import { useAuthStore } from './useAuthStore';

import apiClient from './api/apiClient';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';


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
    <BrowserRouter>
      <nav>
        <Link to="/">Calendar</Link> |
        <Link to="/login">Login</Link> |
        <Link to="/sign_up">Sign up</Link>
      </nav>

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
          test

        </main>
      </div>
      <Routes>
        <Route path="/" element={<MainCalendar />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/sign_up" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
