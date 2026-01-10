import { memo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { EventForm, type CreateEventFormValues } from "./EventForm";
import type { CalendarEventInput } from "../types/calendar";

const focusableSelectors =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

interface CreateEventModalProps {
  open: boolean;
  onClose: () => void;
  initialValues?: Partial<CreateEventFormValues>;
  onSubmit: (values: CalendarEventInput) => void;
  mode?: "create" | "edit";
  submitLabel?: string;
  onDelete?: () => void;
  creatorEmail?: string | null;
}

export const CreateEventModal = memo(function CreateEventModal({
  open,
  onClose,
  initialValues,
  onSubmit,
  mode = "create",
  submitLabel,
  onDelete,
  creatorEmail,
}: CreateEventModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const heading = mode === "edit" ? "Edytuj" : "Nowe wydarzenie";
  const resolvedSubmitLabel = submitLabel ?? (mode === "edit" ? "Zapisz zmiany" : "Utwórz wydarzenie");
  const titleId = "event-modal-title";

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === "Tab") {
        trapFocus(event);
      }
    };

    const trapFocus = (event: KeyboardEvent) => {
      if (!dialogRef.current) {
        return;
      }

      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(focusableSelectors);
      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(focusableSelectors);
    firstFocusable?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const modalContent = (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={dialogRef}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        style={{
          backgroundColor: "#fff",
          borderRadius: "8px",
          width: "100%",
          maxWidth: "520px",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "24px",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 id={titleId} style={{ margin: 0 }}>
            {heading}
          </h2>
          <button type="button" onClick={onClose} aria-label="Zamknij modal">
            ×
          </button>
        </div>
        <EventForm
          defaultValues={initialValues}
          submitLabel={resolvedSubmitLabel}
          onSubmit={(values) => {
            onSubmit(values);
            onClose();
          }}
          onCancel={onClose}
          createdByEmail={creatorEmail ?? undefined}
          onDelete={mode === "edit" ? onDelete : undefined}
        />
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
});