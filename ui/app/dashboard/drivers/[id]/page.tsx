'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { DriversAPI } from '@/lib/api';
import Icon, { 
  faArrowLeft, 
  faEdit, 
  faTrash,
  faTimes,
  faUser,
  faTruck,
} from '@/app/components/Icon';
import { toast } from '@/app/components/Toaster';
import { Button, ConfirmDialog } from '@/app/components';
import LoadingSpinnerComponent from '@/app/components/LoadingSpinner';

const STATUSES = [
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'BUSY', label: 'Busy' },
  { value: 'OFFLINE', label: 'Offline' },
];

export default function DriverDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const driverId = params?.id as string | undefined;
  const isEditMode = searchParams?.get('edit') === 'true';

  const [driver, setDriver] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(isEditMode);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    license_number: '',
    status: 'AVAILABLE',
  });

  useEffect(() => {
    if (!driverId) {
      setLoading(false);
      return;
    }

    const fetchDriver = async () => {
      setLoading(true);
      try {
        const driverData = await DriversAPI.getById(driverId);
        setDriver(driverData);
        setFormData({
          name: driverData.name || '',
          phone: driverData.phone || '',
          email: driverData.email || '',
          license_number: driverData.license_number || '',
          status: driverData.status || 'AVAILABLE',
        });
      } catch (error: any) {
        console.error('Failed to fetch driver:', error);
        toast.error(error?.response?.data?.message || 'Failed to load driver');
        router.push('/dashboard/drivers');
      } finally {
        setLoading(false);
      }
    };

    fetchDriver();
  }, [driverId, router]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData: any = {};
      
      if (formData.name !== driver.name) {
        updateData.name = formData.name;
      }
      if (formData.phone !== driver.phone) {
        updateData.phone = formData.phone;
      }
      if (formData.email !== (driver.email || '')) {
        updateData.email = formData.email;
      }
      if (formData.license_number !== (driver.license_number || '')) {
        updateData.license_number = formData.license_number;
      }
      if (formData.status !== driver.status) {
        updateData.status = formData.status;
      }

      const updatedDriver = await DriversAPI.update(driverId!, updateData);
      setDriver(updatedDriver);
      setEditMode(false);
      toast.success('Driver updated successfully');
    } catch (error: any) {
      console.error('Failed to update driver:', error);
      toast.error(error?.response?.data?.message || 'Failed to update driver');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!driverId) return;

    setDeleting(true);
    try {
      await DriversAPI.delete(driverId);
      toast.success('Driver deleted successfully');
      router.push('/dashboard/drivers');
    } catch (error: any) {
      console.error('Failed to delete driver:', error);
      toast.error(error?.response?.data?.message || 'Failed to delete driver');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinnerComponent />
      </div>
    );
  }

  if (!driver) {
    return null;
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'status-resolved';
      case 'ASSIGNED':
      case 'BUSY':
        return 'status-open';
      case 'OFFLINE':
        return 'status-closed';
      default:
        return 'status-new';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/drivers"
            className="p-2 hover:bg-gray-100 rounded-sm transition-colors"
          >
            <Icon icon={faArrowLeft} className="text-gray-600" size="sm" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {editMode ? 'Edit Driver' : 'Driver Details'}
            </h1>
            <p className="text-gray-600 mt-1">
              {driver.name} • {driver.phone}
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
                    name: driver.name || '',
                    phone: driver.phone || '',
                    email: driver.email || '',
                    license_number: driver.license_number || '',
                    status: driver.status || 'AVAILABLE',
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
                onClick={() => setEditMode(true)}
                variant="primary"
                size="sm"
                icon={faEdit}
              >
                Edit Driver
              </Button>
              <Button
                onClick={() => setDeleteModalOpen(true)}
                variant="secondary"
                size="sm"
                icon={faTrash}
                className="bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700"
              >
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Driver"
        message={
          <>
            Are you sure you want to delete driver <strong>{driver?.name}</strong>?
          </>
        }
        warningMessage={
          driver?._count?.vehicle_drivers > 0 ? (
            <>
              <p className="text-sm text-yellow-800">
                This driver has {driver._count.vehicle_drivers} active vehicle assignment(s).
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Drivers with active vehicle assignments cannot be deleted. Please unassign vehicles first.
              </p>
            </>
          ) : undefined
        }
        confirmText="Delete"
        variant="danger"
        loading={deleting}
        disabled={driver?._count?.vehicle_drivers > 0}
      />

      {/* Driver Info */}
      <div className="bg-white border border-gray-200 rounded-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Driver Information</h2>
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
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm text-gray-900 focus:outline-none focus:bg-white focus:border-[#0b66c2] focus:ring-1 focus:ring-[#0b66c2] text-sm"
                placeholder="John Doe"
              />
            ) : (
              <p className="text-sm text-gray-900">{driver.name}</p>
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
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm text-gray-900 focus:outline-none focus:bg-white focus:border-[#0b66c2] focus:ring-1 focus:ring-[#0b66c2] text-sm"
                placeholder="+250788123456"
              />
            ) : (
              <p className="text-sm text-gray-900">{driver.phone}</p>
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
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm text-gray-900 focus:outline-none focus:bg-white focus:border-[#0b66c2] focus:ring-1 focus:ring-[#0b66c2] text-sm"
                placeholder="john.doe@example.com"
              />
            ) : (
              <p className="text-sm text-gray-900">{driver.email || '-'}</p>
            )}
          </div>

          {/* License Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              License Number
            </label>
            {editMode ? (
              <input
                type="text"
                value={formData.license_number}
                onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm text-gray-900 focus:outline-none focus:bg-white focus:border-[#0b66c2] focus:ring-1 focus:ring-[#0b66c2] text-sm font-mono"
                placeholder="DL123456"
              />
            ) : (
              <p className="text-sm text-gray-900 font-mono">{driver.license_number || '-'}</p>
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
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm text-gray-900 focus:outline-none focus:bg-white focus:border-[#0b66c2] focus:ring-1 focus:ring-[#0b66c2] text-sm"
              >
                {STATUSES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            ) : (
              <span className={`status-badge ${getStatusBadgeClass(driver.status)}`}>
                {driver.status?.replace(/_/g, ' ')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Operator Info */}
      <div className="bg-white border border-gray-200 rounded-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Icon icon={faTruck} className="text-[#0b66c2]" size="sm" />
          Operator
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <p className="text-sm text-gray-900">{driver.operator?.name || '-'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
            <p className="text-sm text-gray-900 font-mono">{driver.operator?.code || '-'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <p className="text-sm text-gray-900">{driver.operator?.email || '-'}</p>
          </div>
        </div>
      </div>

      {/* Vehicle Assignments */}
      <div className="bg-white border border-gray-200 rounded-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Icon icon={faTruck} className="text-[#0b66c2]" size="sm" />
          Assigned Vehicles ({driver._count?.vehicle_drivers || 0})
        </h2>
        {driver.vehicle_drivers && driver.vehicle_drivers.length > 0 ? (
          <div className="space-y-3">
            {driver.vehicle_drivers.map((vd: any) => (
              <Link
                key={vd.id}
                href={`/dashboard/vehicles/${vd.vehicle.id}`}
                className="block p-3 bg-gray-50 rounded-sm hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{vd.vehicle.plate_number}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {vd.vehicle.make} {vd.vehicle.model} • {vd.vehicle.vehicle_type?.replace(/_/g, ' ')}
                    </p>
                  </div>
                  {vd.is_primary && (
                    <span className="text-xs bg-[#0b66c2] text-white px-2 py-1 rounded-sm">Primary</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No vehicles assigned</p>
        )}
      </div>
    </div>
  );
}

