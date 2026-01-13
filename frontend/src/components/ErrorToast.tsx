import React, { useEffect, useRef } from 'react';
import '../css/ErrorToast.css'

interface ErrorToastProps {
  message: string;
  onClose: () => void;
}

const ErrorToast = ({ message, onClose }: ErrorToastProps) => {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const timer = setTimeout(() => {
      closeRef.current();
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  if (!message) return null;

  return (
    <div className="error-toast">
      <div className="error-content">
        <span className="error-icon">✕</span>
        <span className="error-text">{message}</span>
      </div>
      <button className="error-close-x"  onClick={()=> onClose()}>
        &times;
      </button>
    </div>
  );
};

export default ErrorToast;