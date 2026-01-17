import { useState } from "react";
import { useAuthStore } from "../useAuthStore";

const LogoutButton = () => {
  const { logout } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      const { logoutUser } = await import("../api/auth");
      await logoutUser();
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      logout();
      setLoading(false);
    }
  };

  return (
    <button 
      type="button" 
      className="btn btn-outline-danger btn-sm btn-logout" 
      onClick={handleLogout}
      disabled={loading}
    >
      {loading ? "Logging out..." : "Logout"}
    </button>
  );
};

export default LogoutButton;
