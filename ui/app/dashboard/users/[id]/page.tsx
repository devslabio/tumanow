'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { UsersAPI, OperatorsAPI } from '@/lib/api';
import Icon, { 
  faArrowLeft, 
  faEdit, 
  faUser,
  faShieldAlt,
  faBuilding,
  faEnvelope,
  faPhone,
  faCheck,
  faTimes,
} from '@/app/components/Icon';
import { toast } from '@/app/components/Toaster';
import { Button } from '@/app/components';
import LoadingSpinner from '@/app/components/LoadingSpinner';

const STATUSES = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'SUSPENDED', label: 'Suspended' },
];

const ROLE_CODES = [
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'PLATFORM_SUPPORT', label: 'Platform Support' },
  { value: 'OPERATOR_ADMIN', label: 'Operator Admin' },
  { value: 'DISPATCHER', label: 'Dispatcher' },
  { value: 'CUSTOMER_CARE', label: 'Customer Care' },
  { value: 'DRIVER', label: 'Driver' },
  { value: 'CUSTOMER', label: 'Customer' },
];

const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-100 text-green-800';
    case 'INACTIVE':
      return 'bg-gray-100 text-gray-800';
    case 'SUSPENDED':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = params?.id as string | undefined;
  const isEditMode = searchParams?.get('edit') === 'true';

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assigningRoles, setAssigningRoles] = useState(false);
  const [editMode, setEditMode] = useState(isEditMode);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [loadingOperators, setLoadingOperators] = useState(false);
  const [operators, setOperators] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    operator_id: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
  });

  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchUser = async () => {
      setLoading(true);
      try {
        const userData = await UsersAPI.getById(userId);
        setUser(userData);
        setFormData({
          name: userData.name || '',
          phone: userData.phone || '',
          email: userData.email || '',
          operator_id: userData.operator_id || '',
          status: userData.status || 'ACTIVE',
        });
        setSelectedRoles(userData.user_roles?.map((ur: any) => ur.role.code) || []);
      } catch (error: any) {
        console.error('Failed to fetch user:', error);
        toast.error(error?.response?.data?.message || 'Failed to load user');
        router.push('/dashboard/users');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId, router]);

  // Fetch operators for edit mode
  useEffect(() => {
    if (editMode) {
      const fetchOperators = async () => {
        setLoadingOperators(true);
        try {
          const response = await OperatorsAPI.getAll({ limit: 1000 });
          setOperators(response.data || []);
        } catch (error) {
          console.error('Failed to fetch operators:', error);
        } finally {
          setLoadingOperators(false);
        }
      };
      fetchOperators();
    }
  }, [editMode]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData: any = {};
      
      if (formData.name !== user.name) {
        updateData.name = formData.name;
      }
      if (formData.phone !== user.phone) {
        updateData.phone = formData.phone;
      }
      if (formData.email !== (user.email || '')) {
        updateData.email = formData.email || null;
      }
      if (formData.operator_id !== (user.operator_id || '')) {
        updateData.operator_id = formData.operator_id || null;
      }
      if (formData.status !== user.status) {
        updateData.status = formData.status;
      }

      const updatedUser = await UsersAPI.update(userId!, updateData);
      setUser(updatedUser);
      setEditMode(false);
      toast.success('User updated successfully');
    } catch (error: any) {
      console.error('Failed to update user:', error);
      toast.error(error?.response?.data?.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleAssignRoles = async () => {
    if (selectedRoles.length === 0) {
      toast.error('Please select at least one role');
      return;
    }

    setAssigningRoles(true);
    try {
      const updatedUser = await UsersAPI.assignRoles(userId!, { role_codes: selectedRoles });
      setUser(updatedUser);
      setRoleModalOpen(false);
      toast.success('Roles assigned successfully');
    } catch (error: any) {
      console.error('Failed to assign roles:', error);
      toast.error(error?.response?.data?.message || 'Failed to assign roles');
    } finally {
      setAssigningRoles(false);
    }
  };

  const handleRoleToggle = (roleCode: string) => {
    setSelectedRoles((prev) =>
      prev.includes(roleCode)
        ? prev.filter((r) => r !== roleCode)
        : [...prev, roleCode]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner text="Loading user..." />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/users">
            <Button variant="ghost" size="sm" icon={faArrowLeft}>
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {editMode ? 'Edit User' : 'User Details'}
            </h1>
            <p className="text-gray-600 mt-1">
              {user.name} • {user.phone}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editMode ? (
            <>
              <button
                onClick={() => {
                  setEditMode(false);
                  setFormData({
                    name: user.name || '',
                    phone: user.phone || '',
                    email: user.email || '',
                    operator_id: user.operator_id || '',
                    status: user.status || 'ACTIVE',
                  });
                }}
                className="btn btn-secondary text-sm"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn btn-primary text-sm"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <>
              <Button
                onClick={() => {
                  setSelectedRoles(user.user_roles?.map((ur: any) => ur.role.code) || []);
                  setRoleModalOpen(true);
                }}
                variant="secondary"
                size="sm"
                icon={faShieldAlt}
              >
                Manage Roles
              </Button>
              <Button
                onClick={() => setEditMode(true)}
                variant="primary"
                size="sm"
                icon={faEdit}
              >
                Edit User
              </Button>
            </>
          )}
        </div>
      </div>

      {/* User Info */}
      <div className="bg-white border border-gray-200 rounded-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">User Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            {editMode ? (
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0b66c2] focus:border-[#0b66c2] text-sm"
              />
            ) : (
              <p className="text-sm text-gray-900">{user.name}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            {editMode ? (
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0b66c2] focus:border-[#0b66c2] text-sm"
              />
            ) : (
              <p className="text-sm text-gray-900">{user.phone}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            {editMode ? (
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0b66c2] focus:border-[#0b66c2] text-sm"
              />
            ) : (
              <p className="text-sm text-gray-900">{user.email || 'N/A'}</p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            {editMode ? (
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
            ) : (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(user.status)}`}>
                {user.status}
              </span>
            )}
          </div>

          {/* Operator */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Operator
            </label>
            {editMode ? (
              loadingOperators ? (
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm text-sm text-gray-500">
                  Loading operators...
                </div>
              ) : (
                <select
                  value={formData.operator_id}
                  onChange={(e) => setFormData({ ...formData, operator_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0b66c2] focus:border-[#0b66c2] text-sm"
                >
                  <option value="">Platform User</option>
                  {operators.map((op) => (
                    <option key={op.id} value={op.id}>
                      {op.name} ({op.code})
                    </option>
                  ))}
                </select>
              )
            ) : (
              <p className="text-sm text-gray-900">{user.operator?.name || 'Platform User'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Roles */}
      <div className="bg-white border border-gray-200 rounded-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Roles</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {user.user_roles?.map((ur: any) => (
            <span
              key={ur.role.id}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
            >
              {ur.role.code.replace(/_/g, ' ')}
            </span>
          ))}
          {(!user.user_roles || user.user_roles.length === 0) && (
            <p className="text-sm text-gray-500">No roles assigned</p>
          )}
        </div>
      </div>

      {/* Role Assignment Modal */}
      {roleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-sm p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Manage Roles</h3>
              <button
                onClick={() => {
                  setRoleModalOpen(false);
                  setSelectedRoles(user.user_roles?.map((ur: any) => ur.role.code) || []);
                }}
                className="p-1 hover:bg-gray-100 rounded-sm"
              >
                <Icon icon={faTimes} className="text-gray-500" size="sm" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Select roles to assign to {user.name}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {ROLE_CODES.map((role) => (
                  <label
                    key={role.value}
                    className={`flex items-center gap-2 p-3 border-2 rounded-sm cursor-pointer transition-all ${
                      selectedRoles.includes(role.value)
                        ? 'border-[#0b66c2] bg-[#0b66c2]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes(role.value)}
                      onChange={() => handleRoleToggle(role.value)}
                      className="w-4 h-4 text-[#0b66c2] border-gray-300 rounded focus:ring-[#0b66c2]"
                    />
                    <span className="text-sm font-medium text-gray-700">{role.label}</span>
                  </label>
                ))}
              </div>
              <div className="flex items-center gap-2 justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setRoleModalOpen(false);
                    setSelectedRoles(user.user_roles?.map((ur: any) => ur.role.code) || []);
                  }}
                  className="btn btn-secondary text-sm"
                  disabled={assigningRoles}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignRoles}
                  disabled={assigningRoles || selectedRoles.length === 0}
                  className="btn btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {assigningRoles ? 'Assigning...' : 'Assign Roles'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

