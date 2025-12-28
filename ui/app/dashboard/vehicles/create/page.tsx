'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { VehiclesAPI, OperatorsAPI } from '@/lib/api';
import { toast } from '@/app/components/Toaster';
import { Button } from '@/app/components';
import Icon, { faArrowLeft, faCheck, faTruck } from '@/app/components/Icon';

const VEHICLE_TYPES = [
  { value: 'MOTORCYCLE', label: 'Motorcycle' },
  { value: 'CAR', label: 'Car' },
  { value: 'VAN', label: 'Van' },
  { value: 'TRUCK', label: 'Truck' },
];

const STATUSES = [
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'IN_TRANSIT', label: 'In Transit' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'OFFLINE', label: 'Offline' },
];

export default function CreateVehiclePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingOperators, setLoadingOperators] = useState(true);
  const [operators, setOperators] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    operator_id: '',
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

  // Fetch operators
  useEffect(() => {
    const fetchOperators = async () => {
      try {
        const response = await OperatorsAPI.getAll({ limit: 100, status: 'ACTIVE' });
        setOperators(response.operators || []);
        // Auto-select first operator if only one
        if (response.operators?.length === 1) {
          setFormData(prev => ({ ...prev, operator_id: response.operators[0].id }));
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

    if (!formData.plate_number.trim()) {
      newErrors.plate_number = 'Plate number is required';
    }

    if (!formData.make.trim()) {
      newErrors.make = 'Make is required';
    }

    if (!formData.model.trim()) {
      newErrors.model = 'Model is required';
    }

    if (formData.capacity_kg && parseFloat(formData.capacity_kg) < 0) {
      newErrors.capacity_kg = 'Capacity must be a positive number';
    }

    if (formData.year) {
      const year = parseInt(formData.year);
      if (isNaN(year) || year < 1900 || year > 2100) {
        newErrors.year = 'Year must be between 1900 and 2100';
      }
    }

    if (formData.current_location_lat && (isNaN(parseFloat(formData.current_location_lat)) || parseFloat(formData.current_location_lat) < -90 || parseFloat(formData.current_location_lat) > 90)) {
      newErrors.current_location_lat = 'Latitude must be between -90 and 90';
    }

    if (formData.current_location_lng && (isNaN(parseFloat(formData.current_location_lng)) || parseFloat(formData.current_location_lng) < -180 || parseFloat(formData.current_location_lng) > 180)) {
      newErrors.current_location_lng = 'Longitude must be between -180 and 180';
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
      const vehicleData: any = {
        operator_id: formData.operator_id.trim(),
        plate_number: formData.plate_number.trim(),
        make: formData.make.trim(),
        model: formData.model.trim(),
        vehicle_type: formData.vehicle_type,
        status: formData.status,
      };

      if (formData.capacity_kg.trim()) {
        vehicleData.capacity_kg = parseFloat(formData.capacity_kg);
      }

      if (formData.year.trim()) {
        vehicleData.year = parseInt(formData.year);
      }

      if (formData.color.trim()) {
        vehicleData.color = formData.color.trim();
      }

      if (formData.current_location_lat.trim()) {
        vehicleData.current_location_lat = parseFloat(formData.current_location_lat);
      }

      if (formData.current_location_lng.trim()) {
        vehicleData.current_location_lng = parseFloat(formData.current_location_lng);
      }

      const newVehicle = await VehiclesAPI.create(vehicleData);
      toast.success('Vehicle created successfully!');
      router.push(`/dashboard/vehicles/${newVehicle.id}`);
    } catch (error: any) {
      console.error('Failed to create vehicle:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to create vehicle. Please try again.';
      toast.error(errorMessage);
      
      // Set field-specific errors if available
      if (error?.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else if (errorMessage.includes('plate number')) {
        setErrors({ plate_number: 'Plate number already exists' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/vehicles">
          <Button variant="ghost" size="sm" icon={faArrowLeft}>
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Vehicle</h1>
          <p className="text-gray-600 mt-1">Add a new vehicle to the fleet</p>
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

            {/* Plate Number */}
            <div>
              <label htmlFor="plate_number" className="block text-sm font-medium text-gray-700 mb-2">
                Plate Number <span className="text-red-500">*</span>
              </label>
              <input
                id="plate_number"
                type="text"
                value={formData.plate_number}
                onChange={(e) => setFormData({ ...formData, plate_number: e.target.value.toUpperCase() })}
                className={`w-full px-3 py-2 bg-gray-50 border ${errors.plate_number ? 'border-red-300' : 'border-gray-200'} rounded-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:bg-white focus:border-[#0b66c2] focus:ring-1 focus:ring-[#0b66c2] text-sm font-mono`}
                placeholder="RAA123A"
                required
                disabled={loading}
              />
              {errors.plate_number && <p className="mt-1 text-xs text-red-600">{errors.plate_number}</p>}
            </div>

            {/* Make */}
            <div>
              <label htmlFor="make" className="block text-sm font-medium text-gray-700 mb-2">
                Make <span className="text-red-500">*</span>
              </label>
              <input
                id="make"
                type="text"
                value={formData.make}
                onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                className={`w-full px-3 py-2 bg-gray-50 border ${errors.make ? 'border-red-300' : 'border-gray-200'} rounded-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:bg-white focus:border-[#0b66c2] focus:ring-1 focus:ring-[#0b66c2] text-sm`}
                placeholder="Toyota"
                required
                disabled={loading}
              />
              {errors.make && <p className="mt-1 text-xs text-red-600">{errors.make}</p>}
            </div>

            {/* Model */}
            <div>
              <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-2">
                Model <span className="text-red-500">*</span>
              </label>
              <input
                id="model"
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className={`w-full px-3 py-2 bg-gray-50 border ${errors.model ? 'border-red-300' : 'border-gray-200'} rounded-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:bg-white focus:border-[#0b66c2] focus:ring-1 focus:ring-[#0b66c2] text-sm`}
                placeholder="Hilux"
                required
                disabled={loading}
              />
              {errors.model && <p className="mt-1 text-xs text-red-600">{errors.model}</p>}
            </div>

            {/* Vehicle Type */}
            <div>
              <label htmlFor="vehicle_type" className="block text-sm font-medium text-gray-700 mb-2">
                Vehicle Type <span className="text-red-500">*</span>
              </label>
              <select
                id="vehicle_type"
                value={formData.vehicle_type}
                onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm text-gray-900 focus:outline-none focus:bg-white focus:border-[#0b66c2] focus:ring-1 focus:ring-[#0b66c2] text-sm"
                required
                disabled={loading}
              >
                {VEHICLE_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
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

            {/* Year */}
            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
                Year
              </label>
              <input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                className={`w-full px-3 py-2 bg-gray-50 border ${errors.year ? 'border-red-300' : 'border-gray-200'} rounded-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:bg-white focus:border-[#0b66c2] focus:ring-1 focus:ring-[#0b66c2] text-sm`}
                placeholder="2023"
                min="1900"
                max="2100"
                disabled={loading}
              />
              {errors.year && <p className="mt-1 text-xs text-red-600">{errors.year}</p>}
            </div>

            {/* Color */}
            <div>
              <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <input
                id="color"
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:bg-white focus:border-[#0b66c2] focus:ring-1 focus:ring-[#0b66c2] text-sm"
                placeholder="White"
                disabled={loading}
              />
            </div>

            {/* Capacity */}
            <div>
              <label htmlFor="capacity_kg" className="block text-sm font-medium text-gray-700 mb-2">
                Capacity (kg)
              </label>
              <input
                id="capacity_kg"
                type="number"
                value={formData.capacity_kg}
                onChange={(e) => setFormData({ ...formData, capacity_kg: e.target.value })}
                className={`w-full px-3 py-2 bg-gray-50 border ${errors.capacity_kg ? 'border-red-300' : 'border-gray-200'} rounded-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:bg-white focus:border-[#0b66c2] focus:ring-1 focus:ring-[#0b66c2] text-sm`}
                placeholder="500"
                min="0"
                step="0.01"
                disabled={loading}
              />
              {errors.capacity_kg && <p className="mt-1 text-xs text-red-600">{errors.capacity_kg}</p>}
            </div>

            {/* Location */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Location (Optional)
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    type="number"
                    value={formData.current_location_lat}
                    onChange={(e) => setFormData({ ...formData, current_location_lat: e.target.value })}
                    className={`w-full px-3 py-2 bg-gray-50 border ${errors.current_location_lat ? 'border-red-300' : 'border-gray-200'} rounded-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:bg-white focus:border-[#0b66c2] focus:ring-1 focus:ring-[#0b66c2] text-sm`}
                    placeholder="Latitude (-90 to 90)"
                    step="any"
                    disabled={loading}
                  />
                  {errors.current_location_lat && <p className="mt-1 text-xs text-red-600">{errors.current_location_lat}</p>}
                </div>
                <div>
                  <input
                    type="number"
                    value={formData.current_location_lng}
                    onChange={(e) => setFormData({ ...formData, current_location_lng: e.target.value })}
                    className={`w-full px-3 py-2 bg-gray-50 border ${errors.current_location_lng ? 'border-red-300' : 'border-gray-200'} rounded-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:bg-white focus:border-[#0b66c2] focus:ring-1 focus:ring-[#0b66c2] text-sm`}
                    placeholder="Longitude (-180 to 180)"
                    step="any"
                    disabled={loading}
                  />
                  {errors.current_location_lng && <p className="mt-1 text-xs text-red-600">{errors.current_location_lng}</p>}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <Link href="/dashboard/vehicles">
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
              Create Vehicle
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

