import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const formSchema = z
  .object({
    currentPassword: z.string().min(1, "Obecne hasło jest wymagane"),
    newPassword: z.string().min(6, "Hasło musi mieć minimum 6 znaków"),
    confirmPassword: z.string().min(1, "Potwierdź nowe hasło"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Hasła muszą się zgadzać",
    path: ["confirmPassword"],
  });

export type ChangePasswordFormValues = z.infer<typeof formSchema>;

interface ChangePasswordFormProps {
  onSubmit: (values: ChangePasswordFormValues) => Promise<void>;
  onCancel: () => void;
}

export function ChangePasswordForm({ onSubmit, onCancel }: ChangePasswordFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);

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
    setServerError(null);
    try {
      await onSubmit(values);
      reset();
    } catch (err) {
      const error = err as Error;
      setServerError(error.message || "Wystąpił błąd podczas zmiany hasła");
    }
  });

  return (
    <form onSubmit={onInternalSubmit}>
      {serverError && (
        <div className="alert alert-danger" role="alert">
          {serverError}
        </div>
      )}

      <div className="mb-3">
        <label htmlFor="currentPassword" className="form-label">
          Obecne hasło
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
          Nowe hasło
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
          Potwierdź nowe hasło
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
          Anuluj
        </button>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? "Zapisywanie..." : "Zmień hasło"}
        </button>
      </div>
    </form>
  );
}
