import { useEffect, useState } from "react";
import type { AxiosError } from "axios";
import MainCalendar from "./components/MainCalendar";
import LoginPage from "./pages/LoginPage";
import { useAuthStore } from "./useAuthStore";

import apiClient from "./api/apiClient";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import LogoutButton from "./components/LogoutButton";
import SignUpPage from "./pages/SignUpPage";
import MainCalendarPage from "./pages/MainCalendarPage";
import UserProfilePage from "./pages/UserProfilePage";
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

function App() {
  const { user, statusMessage, statusType } = useAuthStore();
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    let isMounted = true;

    const fetchFirstUser = async () => {
      try {
        const response = await apiClient.get("/users/first");
        if (!isMounted) {
          return;
        }
        const data = response.data as { email?: string; message?: string };
        setMessage(data.email ?? data.message ?? "");
      } catch (err) {
        if (!isMounted) {
          return;
        }
        const error = err as AxiosError;
        if (error.response) {
          setMessage(`Backend Error: ${error.response.status}`);
        } else {
          setMessage("Error connecting to backend");
        }
      }
    };

    fetchFirstUser();

    return () => {
      isMounted = false;
    };
  }, [statusMessage]);

  return (
    <BrowserRouter>
      {!user ? (
        <>
          <Link to="/">Calendar</Link> |<Link to="/login">Login</Link> |
          <Link to="/sign_up">Sign up</Link> |
        </>
      ) : (
        <>
          <Link to="/">Calendar</Link>
          <div>{user.email}</div>
          <LogoutButton />
        </>
      )}

      {statusMessage && (
        <div className={`status-banner ${statusType ?? ""}`}>
          {statusMessage}
        </div>
      )}

      {message && <div className="backend-message">{message}</div>}

      <Routes>
        <Route path="/" element={<MainCalendarPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/sign_up" element={<SignUpPage />} />
        <Route element={<ProtectedRoute />}>
            <Route path="/user-profile" element={<UserProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
