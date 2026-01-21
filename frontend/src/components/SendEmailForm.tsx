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
      console.error('Password reset request failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="send-email-form">
      <h3>Reset Password</h3>
      <div className="form-group">
        <label htmlFor="email">Email Address</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
          disabled={isLoading}
        />
      </div>
      <div className="form-actions">
        <button type="submit" disabled={isLoading || !email}>
          {isLoading ? 'Sending...' : 'Send Reset Link'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} disabled={isLoading}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default SendEmailForm;