import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const formSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

export type ChangePasswordFormValues = z.infer<typeof formSchema>;

interface ChangePasswordFormProps {
  onSubmit: (values: ChangePasswordFormValues) => Promise<void>;
  onCancel: () => void;
}

export function ChangePasswordForm({ onSubmit, onCancel }: ChangePasswordFormProps) {

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onInternalSubmit = handleSubmit(async (values) => {
    try {
      await onSubmit(values);
      reset();
    } catch (err) {
      const error = err as Error;
    }
  });

  return (
    <form onSubmit={onInternalSubmit}>


      <div className="mb-3">
        <label htmlFor="currentPassword" className="form-label">
          Current password
        </label>
        <input
          type="password"
          id="currentPassword"
          className={`form-control ${errors.currentPassword ? "is-invalid" : ""}`}
          {...register("currentPassword")}
          disabled={isSubmitting}
        />
        {errors.currentPassword && (
          <div className="invalid-feedback">{errors.currentPassword.message}</div>
        )}
      </div>

      <div className="mb-3">
        <label htmlFor="newPassword" className="form-label">
          New password
        </label>
        <input
          type="password"
          id="newPassword"
          className={`form-control ${errors.newPassword ? "is-invalid" : ""}`}
          {...register("newPassword")}
          disabled={isSubmitting}
        />
        {errors.newPassword && (
          <div className="invalid-feedback">{errors.newPassword.message}</div>
        )}
      </div>

      <div className="mb-3">
        <label htmlFor="confirmPassword" className="form-label">
          Repeat new password
        </label>
        <input
          type="password"
          id="confirmPassword"
          className={`form-control ${errors.confirmPassword ? "is-invalid" : ""}`}
          {...register("confirmPassword")}
          disabled={isSubmitting}
        />
        {errors.confirmPassword && (
          <div className="invalid-feedback">{errors.confirmPassword.message}</div>
        )}
      </div>

      <div className="d-flex justify-content-end gap-2">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Change password"}
        </button>
      </div>
    </form>
  );
}
