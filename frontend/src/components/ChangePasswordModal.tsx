import { memo, useState } from "react";
import { Modal } from "./Modal";
import { ChangePasswordForm, type ChangePasswordFormValues } from "./ChangePasswordForm";
import { changePassword } from "../api/auth";

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
}

export const ChangePasswordModal = memo(function ChangePasswordModal({
  open,
  onClose,
}: ChangePasswordModalProps) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleClose = () => {
    setSuccessMessage(null);
    onClose();
  };

  const handleSubmit = async (values: ChangePasswordFormValues) => {
    await changePassword(
      values.currentPassword,
      values.newPassword,
      values.confirmPassword
    );
    setSuccessMessage("Password was changed successfully!");
    setTimeout(() => {
      handleClose();
    }, 1500);
  };

  return (
    <Modal open={open} onClose={handleClose} title="Zmiana hasła" maxWidth="420px">
      {successMessage ? (
        <div className="alert alert-success mb-0" role="alert">
          {successMessage}
        </div>
      ) : (
        <ChangePasswordForm onSubmit={handleSubmit} onCancel={handleClose} />
      )}
    </Modal>
  );
});
