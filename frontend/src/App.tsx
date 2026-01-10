import { useEffect, useState } from "react";
import type { AxiosError } from "axios";
import MainCalendar from "./components/MainCalendar";
import LoginPage from "./pages/LoginPage";
import { useAuthStore } from "./useAuthStore";

import apiClient from "./api/apiClient";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import LogoutButton from "./components/LogoutButton";
import { ChangePasswordModal } from "./components/ChangePasswordModal";
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
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkBackendConnection = async () => {
      try {
        const response = await apiClient.get("/users/first");
        if (!isMounted) {
          return;
        }
        console.log("[App] Backend connection OK:", response.data);
      } catch (err) {
        if (!isMounted) {
          return;
        }
        const error = err as AxiosError;
        console.error("[App] Backend connection error:", error.response?.status ?? error.message);
      }
    };

    checkBackendConnection();

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
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setIsPasswordModalOpen(true)}
            >
              Reset password
            </button>
            <LogoutButton />
          </div>
          <ChangePasswordModal
            open={isPasswordModalOpen}
            onClose={() => setIsPasswordModalOpen(false)}
          />
        </>
      )}

      {statusMessage && (
        <div className={`status-banner ${statusType ?? ""}`}>
          {statusMessage}
        </div>
      )}

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
