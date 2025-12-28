'use client';

import { useState } from 'react';
import { AuthAPI } from '@/lib/api';
import { toast } from '@/app/components/Toaster';
import { Button, Input, Modal } from '@/app/components';
import Icon, { faEnvelope, faLock, faCheckCircle } from '@/app/components/Icon';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export default function ForgotPasswordModal({ isOpen, onClose, onSwitchToLogin }: ForgotPasswordModalProps) {
  const [loading, setLoading] = useState(false);
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState<'request' | 'reset'>('request');

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!emailOrPhone.trim()) {
      setError('Phone or email is required');
      return;
    }

    setLoading(true);
    try {
      const response = await AuthAPI.forgotPassword(emailOrPhone);
      // In production, token won't be returned - user will receive it via email/SMS
      // For demo, we'll use the token if provided
      if (response.token) {
        setResetToken(response.token);
        setStep('reset');
      } else {
        setSuccess(true);
        toast.success('Password reset instructions have been sent to your registered phone/email.');
      }
    } catch (error: any) {
      setError(error?.response?.data?.message || 'Failed to send reset instructions. Please try again.');
      toast.error(error?.response?.data?.message || 'Failed to send reset instructions.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newPassword) {
      setError('New password is required');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!resetToken) {
      setError('Reset token is missing. Please request a new reset link.');
      return;
    }

    setLoading(true);
    try {
      await AuthAPI.resetPassword(resetToken, newPassword);
      toast.success('Password has been reset successfully!');
      onClose();
      onSwitchToLogin();
    } catch (error: any) {
      setError(error?.response?.data?.message || 'Failed to reset password. Please try again.');
      toast.error(error?.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('request');
    setEmailOrPhone('');
    setResetToken('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Reset Password" size="md">
      {step === 'request' ? (
        <form onSubmit={handleRequestReset} className="space-y-6">
          <p className="text-sm text-gray-600 mb-4">
            Enter your phone number or email address and we'll send you instructions to reset your password.
          </p>

          <Input
            label="Phone or Email"
            type="text"
            icon={faEnvelope}
            placeholder="Enter your phone or email"
            value={emailOrPhone}
            onChange={(e) => {
              setEmailOrPhone(e.target.value);
              setError('');
            }}
            error={error}
            required
          />

          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <Icon icon={faCheckCircle} className="text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-900">Instructions Sent</p>
                <p className="text-sm text-green-700 mt-1">
                  If an account exists, password reset instructions have been sent to your registered phone/email.
                </p>
              </div>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            className="w-full"
          >
            Send Reset Instructions
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                handleClose();
                onSwitchToLogin();
              }}
              className="text-sm text-primary font-medium hover:underline"
            >
              Back to Login
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-6">
          <p className="text-sm text-gray-600 mb-4">
            Enter your new password below.
          </p>

          <Input
            label="New Password"
            type="password"
            icon={faLock}
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setError('');
            }}
            error={error && error.includes('password') ? error : ''}
            required
          />

          <Input
            label="Confirm New Password"
            type="password"
            icon={faLock}
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setError('');
            }}
            error={error && error.includes('match') ? error : ''}
            required
          />

          {error && !error.includes('password') && !error.includes('match') && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            className="w-full"
          >
            Reset Password
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setStep('request');
                setResetToken('');
                setNewPassword('');
                setConfirmPassword('');
                setError('');
              }}
              className="text-sm text-primary font-medium hover:underline"
            >
              Back
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

