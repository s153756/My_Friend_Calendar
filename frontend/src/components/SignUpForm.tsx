import React, { FormEvent, useState } from "react";
import { registerUser } from "../api/auth";
import { useAuthStore } from "../useAuthStore";
import { Link } from "react-router-dom";

interface SignUpFormProps {
  onSignUpSuccess: () => void;
}

const SignUpForm = ({ onSignUpSuccess }: SignUpFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatedPassword, setRepeatedPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const { setLogin } = useAuthStore();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setLoading(true);

    try {
      const response = await registerUser(
        email,
        password,
        repeatedPassword,
        fullName,
        displayName
      );

      setLogin(response.access_token, response.user);
      onSignUpSuccess();
    } catch{
      console.log("Error")
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card shadow p-4" style={{ maxWidth: '420px', width: '100%' }}>
      <div className="text-center mb-4">
        <h2 className="fw-semibold">Create Account</h2>
        <p className="text-muted mb-0">Fill in your details to get started</p>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="signup-email" className="form-label">Email address</label>
          <input
            id="signup-email"
            type="email"
            className="form-control"
            placeholder="Enter your email"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div className="mb-3">
          <label htmlFor="signup-fullname" className="form-label">Full Name</label>
          <input
            id="signup-fullname"
            type="text"
            className="form-control"
            placeholder="Enter your full name"
            value={fullName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div className="mb-3">
          <label htmlFor="signup-displayname" className="form-label">Display Name</label>
          <input
            id="signup-displayname"
            type="text"
            className="form-control"
            placeholder="Choose a display name"
            value={displayName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDisplayName(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div className="mb-3">
          <label htmlFor="signup-password" className="form-label">Password</label>
          <input
            id="signup-password"
            type="password"
            className="form-control"
            placeholder="Create a password"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div className="mb-3">
          <label htmlFor="signup-repeat-password" className="form-label">Confirm Password</label>
          <input
            id="signup-repeat-password"
            type="password"
            className="form-control"
            placeholder="Repeat your password"
            value={repeatedPassword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRepeatedPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <button type="submit" className="btn btn-primary w-100 mt-2" disabled={loading}>
          {loading ? "Creating account..." : "Create Account"}
        </button>
      </form>
      <div className="text-center mt-4 pt-3 border-top">
        <span className="text-muted">Already have an account? </span>
        <Link to="/login">Sign in</Link>
      </div>
    </div>
  );
};

export default SignUpForm;
