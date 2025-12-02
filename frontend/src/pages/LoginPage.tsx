import LoginForm from "../components/LoginForm";
import { useAuthStore } from "../useAuthStore";
import { useNavigate } from "react-router-dom";
import type { LoginResponse } from '../types/auth';



export default function LoginPage() {
  const { user, setLogin, logout, statusMessage, statusType } = useAuthStore();
  const handleLoginSuccess = (data: LoginResponse) => {
    const { access_token, user: loggedInUser } = data;
    setLogin(access_token, loggedInUser);
  };
  const navigate = useNavigate();

  async function submit(email: string, password: string) {
    if (user) {
      navigate("/");
    }
  }

  return (
    <div className="login-page">
      <LoginForm onLoginSuccess={handleLoginSuccess} />
    </div>
  );
}