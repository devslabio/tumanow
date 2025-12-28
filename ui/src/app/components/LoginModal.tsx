'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { toast } from '@/app/components/Toaster';
import { Button, Input, Modal } from '@/app/components';
import Icon, { faEnvelope, faLock, faSignIn } from '@/app/components/Icon';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
  onSwitchToForgotPassword: () => void;
}

export default function LoginModal({ isOpen, onClose, onSwitchToRegister, onSwitchToForgotPassword }: LoginModalProps) {
  const router = useRouter();
  const { login, loading } = useAuthStore();
  const [formData, setFormData] = useState({
    phoneOrEmail: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.phoneOrEmail.trim()) {
      newErrors.phoneOrEmail = 'Phone or email is required';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    const result = await login(formData.phoneOrEmail, formData.password);
    
    if ('error' in result) {
      toast.error(result.error);
    } else {
      toast.success('Login successful!');
      onClose();
      router.push('/dashboard');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Welcome Back" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Phone or Email"
          type="text"
          icon={faEnvelope}
          placeholder="Enter your phone or email"
          value={formData.phoneOrEmail}
          onChange={(e) => setFormData({ ...formData, phoneOrEmail: e.target.value })}
          error={errors.phoneOrEmail}
          required
        />

        <Input
          label="Password"
          type="password"
          icon={faLock}
          placeholder="Enter your password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          error={errors.password}
          required
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" />
            <span className="text-sm text-gray-600">Remember me</span>
          </label>
          <button
            type="button"
            className="text-sm text-primary hover:underline"
            onClick={() => {
              onClose();
              onSwitchToForgotPassword();
            }}
          >
            Forgot password?
          </button>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          icon={faSignIn}
          loading={loading}
          className="w-full"
        >
          Sign In
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={() => {
              onClose();
              onSwitchToRegister();
            }}
            className="text-primary font-medium hover:underline"
          >
            Sign up
          </button>
        </p>
      </div>
    </Modal>
  );
}

