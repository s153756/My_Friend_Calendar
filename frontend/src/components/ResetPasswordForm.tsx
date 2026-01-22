import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { resetPasswordWithToken } from '../api/auth';

interface ResetPasswordFormProps {
  onCancel?: () => void;
}

const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ onCancel }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState<string>('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token') || searchParams.get('Password_ResetPasswordPage') || '';
    setToken(tokenFromUrl);

    if (!tokenFromUrl) {
      console.log('No reset token found in URL');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      console.log('Reset token is missing');
      return;
    }

    if (!password || !confirmPassword) {
      console.log('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      console.log('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await resetPasswordWithToken(token, password);
      navigate('/login');
    } catch (error) {
      console.log('Error', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card shadow p-4" style={{ maxWidth: '420px', width: '100%' }}>
      <div className="text-center mb-4">
        <h2 className="fw-semibold">Reset Your Password</h2>
        <p className="text-muted mb-0">Enter your new password</p>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="password" className="form-label">New Password</label>
          <input
            type="password"
            id="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter new password"
            required
            disabled={isLoading || !token}
          />
        </div>

        <div className="mb-3">
          <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            className="form-control"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            required
            disabled={isLoading || !token}
          />
        </div>

        <button type="submit" className="btn btn-primary w-100 mt-2" disabled={isLoading || !token || !password || !confirmPassword}>
          {isLoading ? 'Resetting...' : 'Reset Password'}
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
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default ResetPasswordForm;