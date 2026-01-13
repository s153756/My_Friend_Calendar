import { useEffect, useState } from "react";
import LoginPage from "./pages/LoginPage";
import { useAuthStore } from "./useAuthStore";

import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import LogoutButton from "./components/LogoutButton";
import { ChangePasswordModal } from "./components/ChangePasswordModal";
import SignUpPage from "./pages/SignUpPage";
import MainCalendarPage from "./pages/MainCalendarPage";
import UserProfilePage from "./pages/UserProfilePage";
import { Navigate, Outlet } from 'react-router-dom';
import ErrorToast from "./components/ErrorToast";

const ProtectedRoute = () => {
  const { user } = useAuthStore();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

function App() {
  const { user, errors, successMessage, statusType, removeError} = useAuthStore();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  console.log(errors)
  return (
    <BrowserRouter>
      <div className="toast-container">
        {errors.map((err) => (
          <ErrorToast 
            key={err.id} 
            message={err.message} 
            onClose={() => removeError(err.id)}
          />
        ))}
      </div>
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
