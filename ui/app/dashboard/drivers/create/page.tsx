'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DriversAPI, OperatorsAPI } from '@/lib/api';
import { toast } from '@/app/components/Toaster';
import { Button } from '@/app/components';
import Icon, { faArrowLeft, faCheck, faUser } from '@/app/components/Icon';

const STATUSES = [
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'BUSY', label: 'Busy' },
  { value: 'OFFLINE', label: 'Offline' },
];

export default function CreateDriverPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingOperators, setLoadingOperators] = useState(true);
  const [operators, setOperators] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    operator_id: '',
    name: '',
    phone: '',
    email: '',
    license_number: '',
    status: 'AVAILABLE',
  });

  // Fetch operators
  useEffect(() => {
    const fetchOperators = async () => {
      try {
        const response = await OperatorsAPI.getAll({ limit: 100, status: 'ACTIVE' });
        setOperators(response.operators || response.data || []);
        // Auto-select first operator if only one
        if ((response.operators || response.data)?.length === 1) {
          setFormData(prev => ({ ...prev, operator_id: (response.operators || response.data)[0].id }));
        }
      } catch (error: any) {
        console.error('Failed to fetch operators:', error);
        toast.error('Failed to load operators');
      } finally {
        setLoadingOperators(false);
      }
    };

    fetchOperators();
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.operator_id.trim()) {
      newErrors.operator_id = 'Operator is required';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?250\d{9}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Invalid phone number format (e.g., +250788123456)';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
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
      const driverData: any = {
        operator_id: formData.operator_id.trim(),
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        status: formData.status,
      };

      if (formData.email.trim()) {
        driverData.email = formData.email.trim();
      }

      if (formData.license_number.trim()) {
        driverData.license_number = formData.license_number.trim();
      }

      const newDriver = await DriversAPI.create(driverData);
      toast.success('Driver created successfully!');
      router.push(`/dashboard/drivers/${newDriver.id}`);
    } catch (error: any) {
      console.error('Failed to create driver:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to create driver. Please try again.';
      toast.error(errorMessage);
      
      // Set field-specific errors if available
      if (error?.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else if (errorMessage.includes('phone')) {
        setErrors({ phone: 'Phone number already exists for this operator' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/drivers">
          <Button variant="ghost" size="sm" icon={faArrowLeft}>
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Driver</h1>
          <p className="text-gray-600 mt-1">Add a new driver to the fleet</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white border border-gray-200 rounded-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Operator */}
            <div>
              <label htmlFor="operator_id" className="block text-sm font-medium text-gray-700 mb-2">
                Operator <span className="text-red-500">*</span>
              </label>
              {loadingOperators ? (
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm text-sm text-gray-500">
                  Loading operators...
                </div>
              ) : (
                <select
                  id="operator_id"
                  value={formData.operator_id}
                  onChange={(e) => setFormData({ ...formData, operator_id: e.target.value })}
                  className={`w-full px-3 py-2 bg-gray-50 border ${errors.operator_id ? 'border-red-300' : 'border-gray-200'} rounded-sm text-gray-900 focus:outline-none focus:bg-white focus:border-[#0b66c2] focus:ring-1 focus:ring-[#0b66c2] text-sm`}
                  required
                  disabled={loading}
                >
                  <option value="">Select operator...</option>
                  {operators.map(op => (
                    <option key={op.id} value={op.id}>{op.name} ({op.code})</option>
                  ))}
                </select>
              )}
              {errors.operator_id && <p className="mt-1 text-xs text-red-600">{errors.operator_id}</p>}
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-3 py-2 bg-gray-50 border ${errors.name ? 'border-red-300' : 'border-gray-200'} rounded-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:bg-white focus:border-[#0b66c2] focus:ring-1 focus:ring-[#0b66c2] text-sm`}
                placeholder="John Doe"
                required
                disabled={loading}
              />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={`w-full px-3 py-2 bg-gray-50 border ${errors.phone ? 'border-red-300' : 'border-gray-200'} rounded-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:bg-white focus:border-[#0b66c2] focus:ring-1 focus:ring-[#0b66c2] text-sm`}
                placeholder="+250788123456"
                required
                disabled={loading}
              />
              {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
            </div>

            {/* Email */}
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
                placeholder="john.doe@example.com"
                disabled={loading}
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>

            {/* License Number */}
            <div>
              <label htmlFor="license_number" className="block text-sm font-medium text-gray-700 mb-2">
                License Number
              </label>
              <input
                id="license_number"
                type="text"
                value={formData.license_number}
                onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:bg-white focus:border-[#0b66c2] focus:ring-1 focus:ring-[#0b66c2] text-sm font-mono"
                placeholder="DL123456"
                disabled={loading}
              />
            </div>

            {/* Status */}
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
                {STATUSES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <Link href="/dashboard/drivers">
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
              Create Driver
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

