'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Icon, { faEnvelope, faTruck, faCheckCircle } from '@/app/components/Icon';
import AnalogClock from '../../../src/app/components/AnalogClock';
import { AuthAPI } from '@/lib/api';
import { toast } from '@/app/components/Toaster';
import Image from 'next/image';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!emailOrPhone.trim()) {
      setError('Phone or email is required');
      return;
    }

    setLoading(true);
    try {
      const response = await AuthAPI.forgotPassword(emailOrPhone);
      setSuccess(true);
      toast.success(response.message || 'Password reset instructions have been sent.');
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || 'Failed to send reset instructions. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Forgot Password Form */}
      <div className="w-full lg:w-[40%] flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-white">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="mb-8">
            <div className="w-16 h-16 bg-[#0b66c2] rounded-full flex items-center justify-center mb-4">
              <Icon icon={faTruck} className="text-white" size="2x" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h1>
            <p className="text-sm text-gray-600">
              Enter your phone number or email address and we'll send you instructions to reset your password.
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-sm">
              <div className="flex items-start gap-3">
                <Icon icon={faCheckCircle} className="text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-900">Instructions Sent</p>
                  <p className="text-sm text-green-700 mt-1">
                    If an account exists, password reset instructions have been sent to your registered phone/email.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && !success && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-sm text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Forgot Password Form */}
          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Phone/Email Field */}
              <div>
                <label htmlFor="emailOrPhone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone or Email
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <Icon icon={faEnvelope} size="sm" />
                  </div>
                  <input
                    id="emailOrPhone"
                    type="text"
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:bg-white focus:border-[#0b66c2] focus:ring-1 focus:ring-[#0b66c2] text-sm"
                    placeholder="Enter your phone or email"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Sending...</span>
                  </>
                ) : (
                  'Send Reset Instructions'
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <Link
                href="/auth/login"
                className="btn btn-primary w-full flex items-center justify-center gap-2 text-sm"
              >
                Back to Login
              </Link>
            </div>
          )}

          {/* Back to Login Link */}
          {!success && (
            <div className="mt-6 text-center">
              <Link
                href="/auth/login"
                className="text-sm text-[#0b66c2] hover:text-[#09529a] font-medium"
              >
                Back to Login
              </Link>
            </div>
          )}

          {/* Footer */}
          <div className="mt-12 text-center">
            <p className="text-xs text-gray-500 mb-2">© {new Date().getFullYear()} TumaNow</p>
            <p className="text-xs text-gray-500">
              Multi-company courier and delivery management platform
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Cover Image */}
      <div className="hidden lg:flex lg:w-[60%] relative">
        <Image
          src="/images/auth-cover.jpg"
          alt="TumaNow Auth Cover"
          fill
          className="object-cover"
          priority
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/70"></div>
        {/* Analog Clock */}
        <div className="relative z-10 flex items-center justify-center w-full">
          <AnalogClock />
        </div>
      </div>
    </div>
  );
}

