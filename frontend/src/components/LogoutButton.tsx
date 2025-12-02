import { FormEvent, useState } from "react";
import type { LoginResponse } from "../types/auth";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../useAuthStore";

interface LoginFormProps {
  onLoginSuccess: (data: LoginResponse) => void;
}

const LogoutButton = () => {
  const { logout } = useAuthStore();
  const handleLogout = async () => {
    try {
      const { logoutUser } = await import("../api/auth");
      await logoutUser();
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      logout();
    }
  };

  return (
    <button type="button" onClick={handleLogout}>
      Logout
    </button>
  );
};

export default LogoutButton;
