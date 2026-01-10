import { memo } from "react";
import { Modal } from "./Modal";
import { EventForm, type CreateEventFormValues } from "./EventForm";
import type { CalendarEventInput } from "../types/calendar";

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
  const heading = mode === "edit" ? "Edytuj wydarzenie" : "Nowe wydarzenie";
  const resolvedSubmitLabel = submitLabel ?? (mode === "edit" ? "Zapisz zmiany" : "Utwórz wydarzenie");

  return (
    <Modal open={open} onClose={onClose} title={heading} maxWidth="520px">
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
    </Modal>
  );
});
