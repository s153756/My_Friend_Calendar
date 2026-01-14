import React, { useEffect, useRef } from 'react';
import '../css/NotificationToast.css';

interface ToastProps {
  message: string;
  type: 'error' | 'success';
  onClose: () => void;
}

const Toast = ({ message, type, onClose }: ToastProps) => {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const duration = type === 'error' ? 10000 : 5000;
    const timer = setTimeout(() => {
      closeRef.current();
    }, duration);

    return () => clearTimeout(timer);
  }, [type]);

  if (!message) return null;

  const icon = type === 'success' ? '✓' : '✕';

  return (
    <div className={`app-toast app-toast-${type}`}>
      <div className="app-toast-content">
        <span className="app-toast-icon">{icon}</span>
        <span className="app-toast-text">{message}</span>
      </div>
      <button className="app-toast-close-x" onClick={onClose}>
        &times;
      </button>
    </div>
  );
};

export default Toast;