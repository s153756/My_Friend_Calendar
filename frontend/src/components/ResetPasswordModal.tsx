import { useState } from "react";
import { Modal } from "./Modal";
import { ResetPasswordForm } from "./ResetPasswordForm";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { sendResetPasswordEmail, resetPassword } from "../api/auth";

const resetPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address").nonempty("Email is required"),
});

const resetPasswordTokenSchema = z.object({
  token: z.string().nonempty("Token is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters long"),
});

export function ResetPasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");
  const [serverMessage, setServerMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(step === "request" ? resetPasswordSchema : resetPasswordTokenSchema),
  });

  const handleRequestReset = async (data: { email: string }) => {
    try {
      setServerMessage(null);
      const response = await sendResetPasswordEmail(data.email);
      setEmail(data.email);
      setServerMessage("A reset token has been sent to your email.");
      setStep("reset");
    } catch (error) {
      setServerMessage(error.message || "An error occurred while requesting a reset token.");
    }
  };

  const handleResetPassword = async (data: { token: string; newPassword: string }) => {
    try {
      setServerMessage(null);
      await resetPassword(data.token, data.newPassword);
      setServerMessage("Your password has been successfully reset.");
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      setServerMessage(error.message || "An error occurred while resetting your password.");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Reset Password">
      {serverMessage && <div className="alert alert-info">{serverMessage}</div>}
      {step === "request" ? (
        <form onSubmit={handleSubmit(handleRequestReset)}>
          <div>
            <label>Email Address</label>
            <input
              type="email"
              {...register("email")}
              className="input input-bordered w-full"
              disabled={isSubmitting}
            />
            {errors.email && <p className="text-red-500">{errors.email.message}</p>}
          </div>
          <div className="flex justify-end mt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              Request Reset Token
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleSubmit(handleResetPassword)}>
          <div>
            <label>Reset Token</label>
            <input
              type="text"
              {...register("token")}
              className="input input-bordered w-full"
              disabled={isSubmitting}
            />
            {errors.token && <p className="text-red-500">{errors.token.message}</p>}
          </div>
          <div>
            <label>New Password</label>
            <input
              type="password"
              {...register("newPassword")}
              className="input input-bordered w-full"
              disabled={isSubmitting}
            />
            {errors.newPassword && <p className="text-red-500">{errors.newPassword.message}</p>}
          </div>
          <div className="flex justify-end mt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              Reset Password
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}