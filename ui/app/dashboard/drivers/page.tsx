'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DriversAPI } from '@/lib/api';
import Icon, { 
  faSearch, 
  faPlus, 
  faTimes, 
  faEye,
  faEdit,
  faTrash,
  faUser,
} from '@/app/components/Icon';
import { toast } from '@/app/components/Toaster';
import { DataTable, Pagination, Button, PageSkeleton } from '@/app/components';

const STATUSES = [
  { value: '', label: 'All Status' },
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'BUSY', label: 'Busy' },
  { value: 'OFFLINE', label: 'Offline' },
];

export default function DriversPage() {
  const router = useRouter();
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [driverToDelete, setDriverToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch drivers
  useEffect(() => {
    const fetchDrivers = async () => {
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

        const response = await DriversAPI.getAll(params);
        setDrivers(response.data || []);
        setTotal(response.meta?.total || 0);
      } catch (error: any) {
        console.error('Failed to fetch drivers:', error);
        toast.error(error?.response?.data?.message || 'Failed to load drivers');
      } finally {
        setLoading(false);
      }
    };

    fetchDrivers();
  }, [page, pageSize, search, statusFilter]);

  const totalPages = Math.ceil(total / pageSize);

  const handleDelete = async () => {
    if (!driverToDelete) return;

    setDeleting(true);
    try {
      await DriversAPI.delete(driverToDelete.id);
      toast.success('Driver deleted successfully');
      setDeleteModalOpen(false);
      setDriverToDelete(null);
      // Reload drivers
      const params: any = { page, limit: pageSize };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      const response = await DriversAPI.getAll(params);
      setDrivers(response.data || []);
      setTotal(response.meta?.total || 0);
    } catch (error: any) {
      console.error('Failed to delete driver:', error);
      toast.error(error?.response?.data?.message || 'Failed to delete driver');
    } finally {
      setDeleting(false);
    }
  };

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

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (value: string, row: any) => (
        <Link
          href={`/dashboard/drivers/${row.id}`}
          className="font-medium text-sm text-[#0b66c2] hover:text-[#09529a]"
          onClick={(e) => e.stopPropagation()}
        >
          {value}
        </Link>
      ),
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (value: string) => (
        <span className="text-sm text-gray-700">{value || '-'}</span>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (value: string) => (
        <span className="text-sm text-gray-700">{value || '-'}</span>
      ),
    },
    {
      key: 'license_number',
      label: 'License',
      render: (value: string) => (
        <span className="text-sm text-gray-700 font-mono">{value || '-'}</span>
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
      key: 'counts',
      label: 'Vehicles',
      render: (_: any, row: any) => (
        <span className="text-sm text-gray-600">{row._count?.vehicle_drivers || 0}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, row: any) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Link
            href={`/dashboard/drivers/${row.id}`}
            className="p-1.5 text-gray-600 hover:text-[#0b66c2] hover:bg-[#0b66c2]/10 rounded-sm transition-colors"
            title="View"
          >
            <Icon icon={faEye} size="sm" />
          </Link>
          <Link
            href={`/dashboard/drivers/${row.id}?edit=true`}
            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-sm transition-colors"
            title="Edit"
          >
            <Icon icon={faEdit} size="sm" />
          </Link>
          <button
            onClick={() => {
              setDriverToDelete(row);
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
          <h1 className="text-2xl font-bold text-gray-900">Drivers</h1>
          <p className="text-gray-600 mt-1">Manage drivers and their vehicle assignments</p>
        </div>
        <Link href="/dashboard/drivers/create">
          <Button variant="primary" size="md" icon={faPlus}>
            Add Driver
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Icon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size="sm" />
              <input
                type="text"
                placeholder="Search drivers..."
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
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && driverToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-sm p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Delete Driver</h3>
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setDriverToDelete(null);
                }}
                className="p-1 hover:bg-gray-100 rounded-sm"
              >
                <Icon icon={faTimes} className="text-gray-500" size="sm" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Are you sure you want to delete driver <strong>{driverToDelete.name}</strong>?
              </p>
              {(driverToDelete._count?.vehicle_drivers > 0) && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-sm">
                  <p className="text-sm text-yellow-800">
                    This driver has {driverToDelete._count.vehicle_drivers} active vehicle assignment(s).
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Drivers with active vehicle assignments cannot be deleted. Please unassign vehicles first.
                  </p>
                </div>
              )}
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => {
                    setDeleteModalOpen(false);
                    setDriverToDelete(null);
                  }}
                  className="btn btn-secondary text-sm"
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting || driverToDelete._count?.vehicle_drivers > 0}
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
        data={drivers}
        loading={loading}
        onRowClick={(row) => router.push(`/dashboard/drivers/${row.id}`)}
        emptyMessage="No drivers found"
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

