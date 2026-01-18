import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { changePassword } from "../api/auth";

interface ResetPasswordFormProps {
  token: string;
  onSuccess: (message: string) => void;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ token, onSuccess }) => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverMessage, setServerMessage] = useState<string | null>(null);

  const onSubmit = async (data: { newPassword: string; confirmPassword: string }) => {
    if (data.newPassword !== data.confirmPassword) {
      setServerMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    setServerMessage(null);
    try {
      await changePassword(token, data.newPassword, data.confirmPassword);
      onSuccess("Password reset successful! You can now log in with your new password.");
    } catch (error) {
      setServerMessage("An error occurred while resetting your password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {serverMessage && <p className="alert">{serverMessage}</p>}
      <div>
        <label>New Password</label>
        <input
          type="password"
          {...register("newPassword", {
            required: "New password is required",
            minLength: { value: 8, message: "Password must be at least 8 characters long" },
          })}
          disabled={isSubmitting}
        />
        {errors.newPassword && <p>{errors.newPassword.message}</p>}
      </div>
      <div>
        <label>Confirm Password</label>
        <input
          type="password"
          {...register("confirmPassword", {
            required: "Please confirm your password",
            validate: (value) => value === watch("newPassword") || "Passwords do not match",
          })}
          disabled={isSubmitting}
        />
        {errors.confirmPassword && <p>{errors.confirmPassword.message}</p>}
      </div>
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Resetting..." : "Reset Password"}
      </button>
    </form>
  );
};