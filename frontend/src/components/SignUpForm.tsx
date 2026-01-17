import React, { FormEvent, useState } from "react";
import { registerUser } from "../api/auth";
import { useAuthStore } from "../useAuthStore";

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
    <div>
      <h2>Sign Up</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
        <input
          type="text"
          placeholder="Full Name"
          value={fullName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
          required
          disabled={loading}
        />
        <input
          type="text"
          placeholder="Display Name"
          value={displayName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDisplayName(e.target.value)}
          required
          disabled={loading}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
          required
          disabled={loading}
        />
        <input
          type="password"
          placeholder="Repeat Password"
          value={repeatedPassword}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRepeatedPassword(e.target.value)}
          required
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Registering..." : "Sign Up"}
        </button>
      </form>
    </div>
  );
};

export default SignUpForm;
