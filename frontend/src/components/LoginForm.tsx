import { FormEvent, useState } from "react";
import type { LoginResponse } from "../types/auth";
import { useNavigate, Link } from "react-router-dom";
import SendEmailForm from "./SendEmailForm";

interface LoginFormProps {
  onLoginSuccess: (data: LoginResponse) => void;
}

const LoginForm = ({ onLoginSuccess }: LoginFormProps) => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showResetPassword, setShowResetPassword] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      const { loginUser } = await import("../api/auth");
      const data = await loginUser(email, password);
      onLoginSuccess(data);
      navigate("/");
    } catch (err) {
      console.log("Error", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card shadow p-4" style={{ maxWidth: '420px', width: '100%' }}>
      <div className="text-center mb-4">
        <h2 className="fw-semibold">Welcome Back</h2>
        <p className="text-muted mb-0">Sign in to your account</p>
      </div>
      
      {showResetPassword ? (
        <SendEmailForm onCancel={() => setShowResetPassword(false)} />
      ) : (
        <>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">Email address</label>
              <input
                id="email"
                type="email"
                className="form-control"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email"
                required
                disabled={loading}
              />
            </div>
            <div className="mb-3">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                id="password"
                type="password"
                className="form-control"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                required
                disabled={loading}
              />
            </div>
            <button type="submit" className="btn btn-primary w-100 mt-2" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
          <div className="text-center mt-4 pt-3 border-top">
            <span className="text-muted">Don't have an account? </span>
            <Link to="/sign_up">Create one</Link>
          </div>
          <div className="text-center mt-3">
            <button
              type="button"
              className="btn btn-link"
              onClick={() => setShowResetPassword(true)}
            >
              Forgot your password?
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default LoginForm;
