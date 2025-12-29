'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { VehiclesAPI } from '@/lib/api';
import Icon, { 
  faSearch, 
  faPlus, 
  faTimes, 
  faEye,
  faEdit,
  faTrash,
  faTruck,
} from '@/app/components/Icon';
import { toast } from '@/app/components/Toaster';
import { DataTable, Pagination, Button, PageSkeleton } from '@/app/components';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const STATUSES = [
  { value: '', label: 'All Status' },
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'IN_TRANSIT', label: 'In Transit' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'OFFLINE', label: 'Offline' },
];

const VEHICLE_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'MOTORCYCLE', label: 'Motorcycle' },
  { value: 'CAR', label: 'Car' },
  { value: 'VAN', label: 'Van' },
  { value: 'TRUCK', label: 'Truck' },
];

export default function VehiclesPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch vehicles
  useEffect(() => {
    const fetchVehicles = async () => {
      setLoading(true);
      try {
        const params: any = {
          page,
          limit: pageSize,
        };

        if (search.trim()) {
          params.search = search.trim();
        }

        if (statusFilter) {
          params.status = statusFilter;
        }

        if (typeFilter) {
          params.vehicle_type = typeFilter;
        }

        const response = await VehiclesAPI.getAll(params);
        setVehicles(response.data || []);
        setTotal(response.meta?.total || 0);
      } catch (error: any) {
        console.error('Failed to fetch vehicles:', error);
        toast.error(error?.response?.data?.message || 'Failed to load vehicles');
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, [page, pageSize, search, statusFilter, typeFilter]);

  const totalPages = Math.ceil(total / pageSize);

  const handleDelete = async () => {
    if (!vehicleToDelete) return;

    setDeleting(true);
    try {
      await VehiclesAPI.delete(vehicleToDelete.id);
      toast.success('Vehicle deleted successfully');
      setDeleteModalOpen(false);
      setVehicleToDelete(null);
      // Reload vehicles
      const params: any = { page, limit: pageSize };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.vehicle_type = typeFilter;
      const response = await VehiclesAPI.getAll(params);
      setVehicles(response.data || []);
      setTotal(response.meta?.total || 0);
    } catch (error: any) {
      console.error('Failed to delete vehicle:', error);
      toast.error(error?.response?.data?.message || 'Failed to delete vehicle');
    } finally {
      setDeleting(false);
    }
  };

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

  const columns = [
    {
      key: 'plate_number',
      label: 'Plate Number',
      render: (value: string, row: any) => (
        <Link
          href={`/dashboard/vehicles/${row.id}`}
          className="font-mono text-sm text-[#0b66c2] font-medium hover:text-[#09529a]"
          onClick={(e) => e.stopPropagation()}
        >
          {value}
        </Link>
      ),
    },
    {
      key: 'make',
      label: 'Make & Model',
      render: (_: any, row: any) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{row.make} {row.model}</div>
          {row.year && <div className="text-xs text-gray-500">{row.year}</div>}
        </div>
      ),
    },
    {
      key: 'vehicle_type',
      label: 'Type',
      render: (value: string) => (
        <span className="text-sm text-gray-700">{value?.replace(/_/g, ' ') || '-'}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <span className={`status-badge ${getStatusBadgeClass(value)}`}>
          {value?.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'capacity_kg',
      label: 'Capacity',
      render: (value: string) => (
        <span className="text-sm text-gray-600">{value ? `${value} kg` : '-'}</span>
      ),
    },
    {
      key: 'counts',
      label: 'Assignments',
      render: (_: any, row: any) => (
        <div className="flex items-center gap-4 text-xs text-gray-600">
          <span>{row._count?.vehicle_drivers || 0} drivers</span>
          <span>{row._count?.order_assignments || 0} orders</span>
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, row: any) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Link
            href={`/dashboard/vehicles/${row.id}`}
            className="p-1.5 text-gray-600 hover:text-[#0b66c2] hover:bg-[#0b66c2]/10 rounded-sm transition-colors"
            title="View"
          >
            <Icon icon={faEye} size="sm" />
          </Link>
          <Link
            href={`/dashboard/vehicles/${row.id}?edit=true`}
            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-sm transition-colors"
            title="Edit"
          >
            <Icon icon={faEdit} size="sm" />
          </Link>
          <button
            onClick={() => {
              setVehicleToDelete(row);
              setDeleteModalOpen(true);
            }}
            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-sm transition-colors"
            title="Delete"
          >
            <Icon icon={faTrash} size="sm" />
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return <PageSkeleton showHeader showFilters showTable tableColumns={6} tableRows={5} showActions />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vehicles</h1>
          <p className="text-gray-600 mt-1">Manage fleet vehicles and assignments</p>
        </div>
        <Link href="/dashboard/vehicles/create">
          <Button variant="primary" size="md" icon={faPlus}>
            Add Vehicle
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Icon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size="sm" />
              <input
                type="text"
                placeholder="Search vehicles..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:bg-white focus:border-[#0b66c2] focus:ring-1 focus:ring-[#0b66c2] text-sm"
              />
            </div>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm text-gray-900 focus:outline-none focus:bg-white focus:border-[#0b66c2] focus:ring-1 focus:ring-[#0b66c2] text-sm"
          >
            {STATUSES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm text-gray-900 focus:outline-none focus:bg-white focus:border-[#0b66c2] focus:ring-1 focus:ring-[#0b66c2] text-sm"
          >
            {VEHICLE_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && vehicleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-sm p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Delete Vehicle</h3>
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setVehicleToDelete(null);
                }}
                className="p-1 hover:bg-gray-100 rounded-sm"
              >
                <Icon icon={faTimes} className="text-gray-500" size="sm" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Are you sure you want to delete vehicle <strong>{vehicleToDelete.plate_number}</strong>?
              </p>
              {(vehicleToDelete._count?.order_assignments > 0) && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-sm">
                  <p className="text-sm text-yellow-800">
                    This vehicle has {vehicleToDelete._count.order_assignments} active order assignment(s).
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Vehicles with active assignments cannot be deleted. Please reassign orders first.
                  </p>
                </div>
              )}
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => {
                    setDeleteModalOpen(false);
                    setVehicleToDelete(null);
                  }}
                  className="btn btn-secondary text-sm"
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting || vehicleToDelete._count?.order_assignments > 0}
                  className="btn btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed bg-red-600 hover:bg-red-700"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <DataTable
        columns={columns}
        data={vehicles}
        loading={loading}
        onRowClick={(row) => router.push(`/dashboard/vehicles/${row.id}`)}
        emptyMessage="No vehicles found"
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={total}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}

