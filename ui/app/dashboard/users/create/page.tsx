'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UsersAPI, OperatorsAPI } from '@/lib/api';
import Icon, { faArrowLeft, faCheck, faUser } from '@/app/components/Icon';
import { toast } from '@/app/components/Toaster';
import { Button } from '@/app/components';
import LoadingSpinner from '@/app/components/LoadingSpinner';

const ROLE_CODES = [
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'PLATFORM_SUPPORT', label: 'Platform Support' },
  { value: 'OPERATOR_ADMIN', label: 'Operator Admin' },
  { value: 'DISPATCHER', label: 'Dispatcher' },
  { value: 'CUSTOMER_CARE', label: 'Customer Care' },
  { value: 'DRIVER', label: 'Driver' },
  { value: 'CUSTOMER', label: 'Customer' },
];

const STATUSES = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'SUSPENDED', label: 'Suspended' },
];

export default function CreateUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingOperators, setLoadingOperators] = useState(false);
  const [operators, setOperators] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    operator_id: '',
    role_codes: [] as string[],
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch operators
  useEffect(() => {
    const fetchOperators = async () => {
      setLoadingOperators(true);
      try {
        const response = await OperatorsAPI.getAll({ limit: 1000 });
        setOperators(response.data || []);
      } catch (error) {
        console.error('Failed to fetch operators:', error);
        // Don't show error, operators are optional
      } finally {
        setLoadingOperators(false);
      }
    };

    fetchOperators();
  }, []);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required';
    } else if (!/^\+?[0-9]{10,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Invalid phone number format';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.role_codes.length === 0) {
      newErrors.role_codes = 'At least one role is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        role_codes: formData.role_codes,
        status: formData.status,
      };

      if (formData.email.trim()) {
        payload.email = formData.email.trim();
      }

      if (formData.password.trim()) {
        payload.password = formData.password.trim();
      }

      if (formData.operator_id) {
        payload.operator_id = formData.operator_id;
      }

      await UsersAPI.create(payload);
      toast.success('User created successfully');
      router.push('/dashboard/users');
    } catch (error: any) {
      console.error('Failed to create user:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to create user';
      toast.error(errorMessage);

      // Set field-specific errors if available
      if (error?.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRoleToggle = (roleCode: string) => {
    setFormData((prev) => ({
      ...prev,
      role_codes: prev.role_codes.includes(roleCode)
        ? prev.role_codes.filter((r) => r !== roleCode)
        : [...prev.role_codes, roleCode],
    }));
    if (errors.role_codes) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.role_codes;
        return newErrors;
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/users">
          <Button variant="ghost" size="sm" icon={faArrowLeft}>
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create User</h1>
          <p className="text-gray-600 mt-1">Add a new user to the system</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-sm p-6">
        <div className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (errors.name) {
                      setErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.name;
                        return newErrors;
                      });
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0b66c2] focus:border-[#0b66c2] text-sm ${
                    errors.name ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="Enter full name"
                />
                {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => {
                    setFormData({ ...formData, phone: e.target.value });
                    if (errors.phone) {
                      setErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.phone;
                        return newErrors;
                      });
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0b66c2] focus:border-[#0b66c2] text-sm ${
                    errors.phone ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="+250788123456"
                />
                {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (errors.email) {
                      setErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.email;
                        return newErrors;
                      });
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0b66c2] focus:border-[#0b66c2] text-sm ${
                    errors.email ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="user@example.com"
                />
                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    if (errors.password) {
                      setErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.password;
                        return newErrors;
                      });
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0b66c2] focus:border-[#0b66c2] text-sm ${
                    errors.password ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="Minimum 6 characters"
                />
                {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Operator</label>
                {loadingOperators ? (
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm text-sm text-gray-500">
                    Loading operators...
                  </div>
                ) : (
                  <select
                    value={formData.operator_id}
                    onChange={(e) => setFormData({ ...formData, operator_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0b66c2] focus:border-[#0b66c2] text-sm"
                  >
                    <option value="">Select operator (optional)</option>
                    {operators.map((op) => (
                      <option key={op.id} value={op.id}>
                        {op.name} ({op.code})
                      </option>
                    ))}
                  </select>
                )}
                <p className="mt-1 text-xs text-gray-500">Leave empty for platform users</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0b66c2] focus:border-[#0b66c2] text-sm"
                >
                  {STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Roles */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Roles <span className="text-red-500">*</span>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {ROLE_CODES.map((role) => (
                <label
                  key={role.value}
                  className={`flex items-center gap-2 p-3 border-2 rounded-sm cursor-pointer transition-all ${
                    formData.role_codes.includes(role.value)
                      ? 'border-[#0b66c2] bg-[#0b66c2]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.role_codes.includes(role.value)}
                    onChange={() => handleRoleToggle(role.value)}
                    className="w-4 h-4 text-[#0b66c2] border-gray-300 rounded focus:ring-[#0b66c2]"
                  />
                  <span className="text-sm font-medium text-gray-700">{role.label}</span>
                </label>
              ))}
            </div>
            {errors.role_codes && <p className="mt-2 text-xs text-red-600">{errors.role_codes}</p>}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 justify-end pt-4 border-t border-gray-200">
            <Link href="/dashboard/users">
              <Button variant="secondary" size="md" disabled={loading}>
                Cancel
              </Button>
            </Link>
            <Button type="submit" variant="primary" size="md" icon={faCheck} loading={loading}>
              Create User
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

