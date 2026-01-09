import { memo, useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

const focusableSelectors =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
}

export const Modal = memo(function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = "520px",
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = `modal-title-${title.replace(/\s+/g, "-").toLowerCase()}`;

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
      className="modal d-block"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
      onClick={onClose}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth }}>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          ref={dialogRef}
          tabIndex={-1}
          onClick={(event) => event.stopPropagation()}
          className="modal-content"
        >
          <div className="modal-header">
            <h5 id={titleId} className="modal-title">
              {title}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Zamknij"
            />
          </div>
          <div className="modal-body">{children}</div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
});
