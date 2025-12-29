'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { VehiclesAPI } from '@/lib/api';
import Icon, { 
  faArrowLeft, 
  faEdit, 
  faTrash,
  faTimes,
  faTruck,
  faMapMarkerAlt,
  faUser,
  faBox,
  faCheckCircle,
  faTimesCircle,
} from '@/app/components/Icon';
import { toast } from '@/app/components/Toaster';
import { Button, ConfirmDialog } from '@/app/components';
import LoadingSpinnerComponent from '@/app/components/LoadingSpinner';

const STATUSES = [
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'IN_TRANSIT', label: 'In Transit' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'OFFLINE', label: 'Offline' },
];

const VEHICLE_TYPES = [
  { value: 'MOTORCYCLE', label: 'Motorcycle' },
  { value: 'CAR', label: 'Car' },
  { value: 'VAN', label: 'Van' },
  { value: 'TRUCK', label: 'Truck' },
];

export default function VehicleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const vehicleId = params?.id as string | undefined;
  const isEditMode = searchParams?.get('edit') === 'true';

  const [vehicle, setVehicle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(isEditMode);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    plate_number: '',
    make: '',
    model: '',
    vehicle_type: 'VAN',
    capacity_kg: '',
    year: '',
    color: '',
    status: 'AVAILABLE',
    current_location_lat: '',
    current_location_lng: '',
  });

  useEffect(() => {
    if (!vehicleId) {
      setLoading(false);
      return;
    }

    const fetchVehicle = async () => {
      setLoading(true);
      try {
        const vehicleData = await VehiclesAPI.getById(vehicleId);
        setVehicle(vehicleData);
        setFormData({
          plate_number: vehicleData.plate_number || '',
          make: vehicleData.make || '',
          model: vehicleData.model || '',
          vehicle_type: vehicleData.vehicle_type || 'VAN',
          capacity_kg: vehicleData.capacity_kg || '',
          year: vehicleData.year?.toString() || '',
          color: vehicleData.color || '',
          status: vehicleData.status || 'AVAILABLE',
          current_location_lat: vehicleData.current_location_lat || '',
          current_location_lng: vehicleData.current_location_lng || '',
        });
      } catch (error: any) {
        console.error('Failed to fetch vehicle:', error);
        toast.error(error?.response?.data?.message || 'Failed to load vehicle');
        router.push('/dashboard/vehicles');
      } finally {
        setLoading(false);
      }
    };

    fetchVehicle();
  }, [vehicleId, router]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData: any = {};
      
      if (formData.plate_number !== vehicle.plate_number) {
        updateData.plate_number = formData.plate_number;
      }
      if (formData.make !== vehicle.make) {
        updateData.make = formData.make;
      }
      if (formData.model !== vehicle.model) {
        updateData.model = formData.model;
      }
      if (formData.vehicle_type !== vehicle.vehicle_type) {
        updateData.vehicle_type = formData.vehicle_type;
      }
      if (formData.capacity_kg !== vehicle.capacity_kg) {
        updateData.capacity_kg = formData.capacity_kg ? parseFloat(formData.capacity_kg) : undefined;
      }
      if (formData.year !== (vehicle.year?.toString() || '')) {
        updateData.year = formData.year ? parseInt(formData.year) : undefined;
      }
      if (formData.color !== vehicle.color) {
        updateData.color = formData.color;
      }
      if (formData.status !== vehicle.status) {
        updateData.status = formData.status;
      }
      if (formData.current_location_lat !== (vehicle.current_location_lat || '')) {
        updateData.current_location_lat = formData.current_location_lat ? parseFloat(formData.current_location_lat) : undefined;
      }
      if (formData.current_location_lng !== (vehicle.current_location_lng || '')) {
        updateData.current_location_lng = formData.current_location_lng ? parseFloat(formData.current_location_lng) : undefined;
      }

      const updatedVehicle = await VehiclesAPI.update(vehicleId!, updateData);
      setVehicle(updatedVehicle);
      setEditMode(false);
      toast.success('Vehicle updated successfully');
    } catch (error: any) {
      console.error('Failed to update vehicle:', error);
      toast.error(error?.response?.data?.message || 'Failed to update vehicle');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!vehicleId) return;

    setDeleting(true);
    try {
      await VehiclesAPI.delete(vehicleId);
      toast.success('Vehicle deleted successfully');
      router.push('/dashboard/vehicles');
    } catch (error: any) {
      console.error('Failed to delete vehicle:', error);
      toast.error(error?.response?.data?.message || 'Failed to delete vehicle');
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

  if (!vehicle) {
    return null;
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'status-resolved';
      case 'ASSIGNED':
      case 'IN_TRANSIT':
        return 'status-open';
      case 'MAINTENANCE':
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
            href="/dashboard/vehicles"
            className="p-2 hover:bg-gray-100 rounded-sm transition-colors"
          >
            <Icon icon={faArrowLeft} className="text-gray-600" size="sm" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {editMode ? 'Edit Vehicle' : 'Vehicle Details'}
            </h1>
            <p className="text-gray-600 mt-1">
              {vehicle.plate_number} • {vehicle.make} {vehicle.model}
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
                    plate_number: vehicle.plate_number || '',
                    make: vehicle.make || '',
                    model: vehicle.model || '',
                    vehicle_type: vehicle.vehicle_type || 'VAN',
                    capacity_kg: vehicle.capacity_kg || '',
                    year: vehicle.year?.toString() || '',
                    color: vehicle.color || '',
                    status: vehicle.status || 'AVAILABLE',
                    current_location_lat: vehicle.current_location_lat || '',
                    current_location_lng: vehicle.current_location_lng || '',
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
                Edit Vehicle
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
        title="Delete Vehicle"
        message={
          <>
            Are you sure you want to delete vehicle <strong>{vehicle?.plate_number}</strong>?
          </>
        }
        warningMessage={
          vehicle?._count?.order_assignments > 0 ? (
            <>
              <p className="text-sm text-yellow-800">
                This vehicle has {vehicle._count.order_assignments} active order assignment(s).
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Vehicles with active assignments cannot be deleted. Please reassign orders first.
              </p>
            </>
          ) : undefined
        }
        confirmText="Delete"
        variant="danger"
        loading={deleting}
        disabled={vehicle?._count?.order_assignments > 0}
      />

      {/* Vehicle Info */}
      <div className="bg-white border border-gray-200 rounded-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Plate Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Plate Number
            </label>
            {editMode ? (
              <input
                type="text"
                value={formData.plate_number}
                onChange={(e) => setFormData({ ...formData, plate_number: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm text-gray-900 focus:outline-none focus:bg-white focus:border-[#0b66c2] focus:ring-1 focus:ring-[#0b66c2] text-sm"
                placeholder="RAA123A"
              />
            ) : (
              <p className="text-sm text-gray-900 font-mono">{vehicle.plate_number}</p>
            )}
          </div>

          {/* Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vehicle Code
            </label>
            <p className="text-sm text-gray-900 font-mono">{vehicle.code || '-'}</p>
          </div>

          {/* Make */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Make
            </label>
            {editMode ? (
              <input
                type="text"
                value={formData.make}
                onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm text-gray-900 focus:outline-none focus:bg-white focus:border-[#0b66c2] focus:ring-1 focus:ring-[#0b66c2] text-sm"
                placeholder="Toyota"
              />
            ) : (
              <p className="text-sm text-gray-900">{vehicle.make || '-'}</p>
            )}
          </div>

          {/* Model */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model
            </label>
            {editMode ? (
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm text-gray-900 focus:outline-none focus:bg-white focus:border-[#0b66c2] focus:ring-1 focus:ring-[#0b66c2] text-sm"
                placeholder="Hilux"
              />
            ) : (
              <p className="text-sm text-gray-900">{vehicle.model || '-'}</p>
            )}
          </div>

          {/* Vehicle Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vehicle Type
            </label>
            {editMode ? (
              <select
                value={formData.vehicle_type}
                onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm text-gray-900 focus:outline-none focus:bg-white focus:border-[#0b66c2] focus:ring-1 focus:ring-[#0b66c2] text-sm"
              >
                {VEHICLE_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-gray-900">{vehicle.vehicle_type?.replace(/_/g, ' ') || '-'}</p>
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
              <span className={`status-badge ${getStatusBadgeClass(vehicle.status)}`}>
                {vehicle.status?.replace(/_/g, ' ')}
              </span>
            )}
          </div>

          {/* Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year
            </label>
            {editMode ? (
              <input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm text-gray-900 focus:outline-none focus:bg-white focus:border-[#0b66c2] focus:ring-1 focus:ring-[#0b66c2] text-sm"
                placeholder="2023"
                min="1900"
                max="2100"
              />
            ) : (
              <p className="text-sm text-gray-900">{vehicle.year || '-'}</p>
            )}
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            {editMode ? (
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm text-gray-900 focus:outline-none focus:bg-white focus:border-[#0b66c2] focus:ring-1 focus:ring-[#0b66c2] text-sm"
                placeholder="White"
              />
            ) : (
              <p className="text-sm text-gray-900">{vehicle.color || '-'}</p>
            )}
          </div>

          {/* Capacity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Capacity (kg)
            </label>
            {editMode ? (
              <input
                type="number"
                value={formData.capacity_kg}
                onChange={(e) => setFormData({ ...formData, capacity_kg: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm text-gray-900 focus:outline-none focus:bg-white focus:border-[#0b66c2] focus:ring-1 focus:ring-[#0b66c2] text-sm"
                placeholder="500"
                min="0"
                step="0.01"
              />
            ) : (
              <p className="text-sm text-gray-900">{vehicle.capacity_kg ? `${vehicle.capacity_kg} kg` : '-'}</p>
            )}
          </div>

          {/* Location */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Location
            </label>
            {editMode ? (
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  value={formData.current_location_lat}
                  onChange={(e) => setFormData({ ...formData, current_location_lat: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm text-gray-900 focus:outline-none focus:bg-white focus:border-[#0b66c2] focus:ring-1 focus:ring-[#0b66c2] text-sm"
                  placeholder="Latitude"
                  step="any"
                />
                <input
                  type="number"
                  value={formData.current_location_lng}
                  onChange={(e) => setFormData({ ...formData, current_location_lng: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm text-gray-900 focus:outline-none focus:bg-white focus:border-[#0b66c2] focus:ring-1 focus:ring-[#0b66c2] text-sm"
                  placeholder="Longitude"
                  step="any"
                />
              </div>
            ) : (
              <p className="text-sm text-gray-900">
                {vehicle.current_location_lat && vehicle.current_location_lng
                  ? `${vehicle.current_location_lat}, ${vehicle.current_location_lng}`
                  : 'Not set'}
              </p>
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
            <p className="text-sm text-gray-900">{vehicle.operator?.name || '-'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
            <p className="text-sm text-gray-900 font-mono">{vehicle.operator?.code || '-'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <p className="text-sm text-gray-900">{vehicle.operator?.email || '-'}</p>
          </div>
        </div>
      </div>

      {/* Assignments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Drivers */}
        <div className="bg-white border border-gray-200 rounded-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Icon icon={faUser} className="text-[#0b66c2]" size="sm" />
            Assigned Drivers ({vehicle._count?.vehicle_drivers || 0})
          </h2>
          {vehicle.vehicle_drivers && vehicle.vehicle_drivers.length > 0 ? (
            <div className="space-y-3">
              {vehicle.vehicle_drivers.map((vd: any) => (
                <div key={vd.id} className="p-3 bg-gray-50 rounded-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{vd.driver.name}</p>
                      <p className="text-xs text-gray-600">{vd.driver.phone}</p>
                      {vd.driver.license_number && (
                        <p className="text-xs text-gray-500 mt-1">License: {vd.driver.license_number}</p>
                      )}
                    </div>
                    {vd.is_primary && (
                      <span className="text-xs bg-[#0b66c2] text-white px-2 py-1 rounded-sm">Primary</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No drivers assigned</p>
          )}
        </div>

        {/* Orders */}
        <div className="bg-white border border-gray-200 rounded-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Icon icon={faBox} className="text-[#0b66c2]" size="sm" />
            Order Assignments ({vehicle._count?.order_assignments || 0})
          </h2>
          {vehicle.order_assignments && vehicle.order_assignments.length > 0 ? (
            <div className="space-y-3">
              {vehicle.order_assignments.map((oa: any) => (
                <Link
                  key={oa.id}
                  href={`/dashboard/orders/${oa.order.id}`}
                  className="block p-3 bg-gray-50 rounded-sm hover:bg-gray-100 transition-colors"
                >
                  <p className="text-sm font-medium text-gray-900">{oa.order.order_number}</p>
                  <p className="text-xs text-gray-600 mt-1">{oa.order.status?.replace(/_/g, ' ')}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No order assignments</p>
          )}
        </div>
      </div>
    </div>
  );
}

