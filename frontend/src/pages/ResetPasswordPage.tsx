import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ResetPasswordForm } from "../components/ResetPasswordForm";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [serverMessage, setServerMessage] = useState<string | null>(null);

  const handleSuccess = (message: string) => {
    setServerMessage(message);
  };

  if (!token) {
    return <p>Invalid or missing token.</p>;
  }

  return (
    <div className="reset-password-page">
      <h1>Reset Your Password</h1>
      {serverMessage && <p className="alert">{serverMessage}</p>}
      <ResetPasswordForm token={token} onSuccess={handleSuccess} />
    </div>
  );
}