'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { OperatorsAPI } from '@/lib/api';
import { toast } from '@/app/components/Toaster';
import { Button, Input } from '@/app/components';
import Icon, { faArrowLeft, faBuilding, faCheck } from '@/app/components/Icon';

export default function CreateOperatorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    email: '',
    phone: '',
    status: 'ACTIVE',
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = 'Operator code is required';
    } else if (!/^[A-Z0-9_]+$/.test(formData.code)) {
      newErrors.code = 'Code must contain only uppercase letters, numbers, and underscores';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Operator name is required';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (formData.phone && !/^\+?250\d{9}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Invalid phone number format (e.g., +250788123456)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const operatorData = {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        status: formData.status,
      };

      const newOperator = await OperatorsAPI.create(operatorData);
      toast.success('Operator created successfully!');
      router.push(`/dashboard/operators/${newOperator.id}`);
    } catch (error: any) {
      console.error('Failed to create operator:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to create operator. Please try again.';
      toast.error(errorMessage);
      
      // Set field-specific errors if available
      if (error?.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else if (errorMessage.includes('code')) {
        setErrors({ code: 'Operator code already exists' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/operators">
          <Button variant="ghost" size="sm" icon={faArrowLeft}>
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Operator</h1>
          <p className="text-gray-600 mt-1">Add a new logistics operator to the platform</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white border border-gray-200 rounded-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                Operator Code <span className="text-red-500">*</span>
              </label>
              <input
                id="code"
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className={`w-full px-3 py-2 bg-gray-50 border ${errors.code ? 'border-red-300' : 'border-gray-200'} rounded-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:bg-white focus:border-[#0b66c2] focus:ring-1 focus:ring-[#0b66c2] text-sm font-mono`}
                placeholder="OP001"
                required
                disabled={loading}
              />
              {errors.code && <p className="mt-1 text-xs text-red-600">{errors.code}</p>}
              <p className="mt-1 text-xs text-gray-500">Unique identifier (uppercase letters, numbers, underscores only)</p>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Operator Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-3 py-2 bg-gray-50 border ${errors.name ? 'border-red-300' : 'border-gray-200'} rounded-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:bg-white focus:border-[#0b66c2] focus:ring-1 focus:ring-[#0b66c2] text-sm`}
                placeholder="Kigali Express Delivery"
                required
                disabled={loading}
              />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full px-3 py-2 bg-gray-50 border ${errors.email ? 'border-red-300' : 'border-gray-200'} rounded-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:bg-white focus:border-[#0b66c2] focus:ring-1 focus:ring-[#0b66c2] text-sm`}
                placeholder="info@operator.rw"
                disabled={loading}
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={`w-full px-3 py-2 bg-gray-50 border ${errors.phone ? 'border-red-300' : 'border-gray-200'} rounded-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:bg-white focus:border-[#0b66c2] focus:ring-1 focus:ring-[#0b66c2] text-sm`}
                placeholder="+250788123456"
                disabled={loading}
              />
              {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm text-gray-900 focus:outline-none focus:bg-white focus:border-[#0b66c2] focus:ring-1 focus:ring-[#0b66c2] text-sm"
                disabled={loading}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-sm p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> A default configuration will be created automatically for this operator. You can customize it after creation.
            </p>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <Link href="/dashboard/operators">
              <Button variant="secondary" size="md" disabled={loading}>
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={faCheck}
              loading={loading}
            >
              Create Operator
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

