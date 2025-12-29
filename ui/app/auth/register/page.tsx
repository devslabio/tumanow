'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Icon, { faEye, faEyeSlash, faUser, faEnvelope, faPhone, faLock, faTruck } from '@/app/components/Icon';
import { AuthAPI } from '@/lib/api';
import { toast } from '@/app/components/Toaster';
import Image from 'next/image';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    customerType: 'INDIVIDUAL' as 'INDIVIDUAL' | 'BUSINESS',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      await AuthAPI.register({
        name: formData.name,
        phone: formData.phone,
        email: formData.email || undefined,
        password: formData.password,
        customerType: formData.customerType,
      });
      
      toast.success('Account created successfully! Please login.');
      router.push('/auth/login?registered=true');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Registration Form */}
      <div className="w-full lg:w-[40%] flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-white overflow-y-auto">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="mb-8">
            <div className="w-16 h-16 bg-[#0b66c2] rounded-full flex items-center justify-center mb-4">
              <Icon icon={faTruck} className="text-white" size="2x" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
            <p className="text-sm text-gray-600">
              Sign up to start sending packages
            </p>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <Icon icon={faUser} size="sm" />
                </div>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border ${errors.name ? 'border-red-300' : 'border-gray-200'} rounded-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:bg-white focus:border-[#0b66c2] focus:ring-1 focus:ring-[#0b66c2] text-sm`}
                  placeholder="Enter your full name"
                  required
                  disabled={loading}
                />
              </div>
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <Icon icon={faPhone} size="sm" />
                </div>
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border ${errors.phone ? 'border-red-300' : 'border-gray-200'} rounded-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:bg-white focus:border-[#0b66c2] focus:ring-1 focus:ring-[#0b66c2] text-sm`}
                  placeholder="+250788123456"
                  required
                  disabled={loading}
                />
              </div>
              {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
            </div>

            {/* Email (Optional) */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email (Optional)
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <Icon icon={faEnvelope} size="sm" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border ${errors.email ? 'border-red-300' : 'border-gray-200'} rounded-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:bg-white focus:border-[#0b66c2] focus:ring-1 focus:ring-[#0b66c2] text-sm`}
                  placeholder="your@email.com"
                  disabled={loading}
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>

            {/* Account Type */}
            <div>
              <label htmlFor="customerType" className="block text-sm font-medium text-gray-700 mb-2">
                Account Type
              </label>
              <select
                id="customerType"
                value={formData.customerType}
                onChange={(e) => setFormData({ ...formData, customerType: e.target.value as 'INDIVIDUAL' | 'BUSINESS' })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-sm text-gray-900 focus:outline-none focus:bg-white focus:border-[#0b66c2] focus:ring-1 focus:ring-[#0b66c2] text-sm"
                disabled={loading}
              >
                <option value="INDIVIDUAL">Individual</option>
                <option value="BUSINESS">Business</option>
              </select>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <Icon icon={faLock} size="sm" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`w-full pl-10 pr-12 py-2.5 bg-gray-50 border ${errors.password ? 'border-red-300' : 'border-gray-200'} rounded-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:bg-white focus:border-[#0b66c2] focus:ring-1 focus:ring-[#0b66c2] text-sm`}
                  placeholder="Create a password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  <Icon icon={showPassword ? faEyeSlash : faEye} size="sm" />
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <Icon icon={faLock} size="sm" />
                </div>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className={`w-full pl-10 pr-12 py-2.5 bg-gray-50 border ${errors.confirmPassword ? 'border-red-300' : 'border-gray-200'} rounded-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:bg-white focus:border-[#0b66c2] focus:ring-1 focus:ring-[#0b66c2] text-sm`}
                  placeholder="Confirm your password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  <Icon icon={showConfirmPassword ? faEyeSlash : faEye} size="sm" />
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>}
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
                  <span>Creating account...</span>
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-[#0b66c2] hover:text-[#09529a] font-medium">
                Sign In
              </Link>
            </p>
          </div>

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
      </div>
    </div>
  );
}

