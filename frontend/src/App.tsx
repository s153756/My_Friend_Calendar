import { useState } from "react";
import LoginPage from "./pages/LoginPage";
import { useAuthStore } from "./useAuthStore";

import { BrowserRouter, Routes, Route, NavLink, useLocation } from "react-router-dom";
import LogoutButton from "./components/LogoutButton";
import { ChangePasswordModal } from "./components/ChangePasswordModal";
import SignUpPage from "./pages/SignUpPage";
import MainCalendarPage from "./pages/MainCalendarPage";
import UserProfilePage from "./pages/UserProfilePage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import { Navigate, Outlet } from 'react-router-dom';
import Toast from "./components/NotificationToast";

const ProtectedRoute = () => {
  const { user } = useAuthStore();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

function AppLayout() {
  const { user, notifications, removeNotification} = useAuthStore();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const location = useLocation();
  const isAuthRoute = location.pathname === "/login" || location.pathname === "/sign_up" || location.pathname === "/reset-password";
  const mainClassName = isAuthRoute
    ? "flex-grow-1 d-flex align-items-center justify-content-center auth-page-bg px-3"
    : "flex-grow-1 p-3";

  return (
    <div className="d-flex flex-column min-vh-100">
      <div className="app-toast-container">
        {notifications.map((notification) => (
          <Toast 
            key={notification.id} 
            message={notification.message} 
            type={notification.type}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>

      <nav className="navbar navbar-expand bg-white border-bottom shadow-sm px-3 py-2">
        <div className="container-fluid">
          <div className="navbar-nav me-auto gap-1">
            <NavLink to="/" className={({ isActive }: { isActive: boolean }) => `nav-link ${isActive ? "active fw-semibold" : ""}`}>
              Calendar
            </NavLink>
            {!user && (
              <>
                <NavLink to="/login" className={({ isActive }: { isActive: boolean }) => `nav-link ${isActive ? "active fw-semibold" : ""}`}>
                  Login
                </NavLink>
                <NavLink to="/sign_up" className={({ isActive }: { isActive: boolean }) => `nav-link ${isActive ? "active fw-semibold" : ""}`}>
                  Sign Up
                </NavLink>
              </>
            )}
          </div>

          {user && (
            <div className="d-flex align-items-center gap-3">
              <span className="text-muted small">{user.email}</span>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setIsPasswordModalOpen(true)}
              >
                Change Password
              </button>
              <LogoutButton />
            </div>
          )}
        </div>
      </nav>

      <main className={mainClassName}>
        <Routes>
          <Route path="/" element={<MainCalendarPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/sign_up" element={<SignUpPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/user-profile" element={<UserProfilePage />} />
          </Route>
        </Routes>
      </main>

      {user && (
        <ChangePasswordModal
          open={isPasswordModalOpen}
          onClose={() => setIsPasswordModalOpen(false)}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;
