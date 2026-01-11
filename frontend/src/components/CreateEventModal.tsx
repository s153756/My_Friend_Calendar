import { memo } from "react";
import { Modal } from "./Modal";
import { EventForm } from "./EventForm";
import type { CalendarEventInput } from "../types/calendar";

interface CreateEventModalProps {
  open: boolean;
  onClose: () => void;
  initialValues?: any;
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
  const heading = mode === "edit" ? "Edit event" : "New event";
  const resolvedSubmitLabel =
    submitLabel ?? (mode === "edit" ? "Save changes" : "Create event");

  return (
    <Modal open={open} onClose={onClose} title={heading}>
      <EventForm
        defaultValues={initialValues}
        submitLabel={resolvedSubmitLabel}
        onSubmit={(values: CalendarEventInput) => {
          onSubmit(values);
          onClose();
        }}
        onCancel={onClose}
        createdByEmail={creatorEmail}
        onDelete={mode === "edit" ? onDelete : undefined}
      />
    </Modal>
  );
});