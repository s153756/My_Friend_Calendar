import React, { useState } from 'react';
import { requestPasswordReset } from '../api/auth';

interface SendEmailFormProps {
  onCancel?: () => void;
}

const SendEmailForm: React.FC<SendEmailFormProps> = ({ onCancel }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      return;
    }

    setIsLoading(true);
    try {
      await requestPasswordReset(email);
      setEmail('');
    } catch (error) {
      console.log('Error', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-4">
        <h2 className="fw-semibold">Reset Password</h2>
        <p className="text-muted mb-0">Enter your email to receive a reset link</p>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="email" className="form-label">Email Address</label>
          <input
            type="email"
            id="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            disabled={isLoading}
          />
        </div>
        <button type="submit" className="btn btn-primary w-100 mt-2" disabled={isLoading || !email}>
          {isLoading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>
      
      {onCancel && (
        <div className="text-center mt-3">
          <button
            type="button"
            className="btn btn-link"
            onClick={onCancel}
            disabled={isLoading}
          >
            Back to Login
          </button>
        </div>
      )}
    </div>
  );
};

export default SendEmailForm;