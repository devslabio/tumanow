'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { OperatorsAPI } from '@/lib/api';
import Icon, { 
  faSearch, 
  faPlus, 
  faTimes, 
  faEye,
  faEdit,
  faTrash,
  faCog,
  faBuilding,
} from '@/app/components/Icon';
import { toast } from '@/app/components/Toaster';
import { DataTable, Pagination, Button, PageSkeleton } from '@/app/components';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const STATUSES = [
  { value: '', label: 'All Status' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'SUSPENDED', label: 'Suspended' },
];

export default function OperatorsPage() {
  const router = useRouter();
  const [operators, setOperators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [operatorToDelete, setOperatorToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch operators
  useEffect(() => {
    const fetchOperators = async () => {
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

        const response = await OperatorsAPI.getAll(params);
        setOperators(response.data || []);
        setTotal(response.meta?.total || 0);
      } catch (error: any) {
        console.error('Failed to fetch operators:', error);
        toast.error(error?.response?.data?.message || 'Failed to load operators');
      } finally {
        setLoading(false);
      }
    };

    fetchOperators();
  }, [page, pageSize, search, statusFilter]);

  const totalPages = Math.ceil(total / pageSize);

  const handleDelete = async () => {
    if (!operatorToDelete) return;

    setDeleting(true);
    try {
      await OperatorsAPI.delete(operatorToDelete.id);
      toast.success('Operator deleted successfully');
      setDeleteModalOpen(false);
      setOperatorToDelete(null);
      // Reload operators
      const params: any = { page, limit: pageSize };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      const response = await OperatorsAPI.getAll(params);
      setOperators(response.data || []);
      setTotal(response.meta?.total || 0);
    } catch (error: any) {
      console.error('Failed to delete operator:', error);
      toast.error(error?.response?.data?.message || 'Failed to delete operator');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'status-resolved';
      case 'INACTIVE':
        return 'status-open';
      case 'SUSPENDED':
        return 'status-closed';
      default:
        return 'status-new';
    }
  };

  const columns = [
    {
      key: 'code',
      label: 'Code',
      render: (value: string, row: any) => (
        <span className="font-mono text-sm text-[#0b66c2] font-medium">{value}</span>
      ),
    },
    {
      key: 'name',
      label: 'Name',
      render: (value: string, row: any) => (
        <Link
          href={`/dashboard/operators/${row.id}`}
          className="text-sm font-medium text-gray-900 hover:text-[#0b66c2]"
          onClick={(e) => e.stopPropagation()}
        >
          {value}
        </Link>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (value: string) => (
        <span className="text-sm text-gray-600">{value || '-'}</span>
      ),
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (value: string) => (
        <span className="text-sm text-gray-600">{value || '-'}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <span className={`status-badge ${getStatusBadgeClass(value)}`}>
          {value}
        </span>
      ),
    },
    {
      key: 'counts',
      label: 'Resources',
      render: (_: any, row: any) => (
        <div className="flex items-center gap-4 text-xs text-gray-600">
          <span>{row._count?.users || 0} users</span>
          <span>{row._count?.vehicles || 0} vehicles</span>
          <span>{row._count?.drivers || 0} drivers</span>
          <span>{row._count?.orders || 0} orders</span>
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, row: any) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Link
            href={`/dashboard/operators/${row.id}`}
            className="p-1.5 text-gray-600 hover:text-[#0b66c2] hover:bg-[#0b66c2]/10 rounded-sm transition-colors"
            title="View"
          >
            <Icon icon={faEye} size="sm" />
          </Link>
          <Link
            href={`/dashboard/operators/${row.id}?edit=true`}
            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-sm transition-colors"
            title="Edit"
          >
            <Icon icon={faEdit} size="sm" />
          </Link>
          <button
            onClick={() => {
              setOperatorToDelete(row);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Operators</h1>
          <p className="text-gray-600 mt-1">Manage logistics operators and their configurations</p>
        </div>
        <Link href="/dashboard/operators/create">
          <Button variant="primary" size="md" icon={faPlus}>
            Create Operator
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
                placeholder="Search operators..."
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
      {deleteModalOpen && operatorToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-sm p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Delete Operator</h3>
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setOperatorToDelete(null);
                }}
                className="p-1 hover:bg-gray-100 rounded-sm"
              >
                <Icon icon={faTimes} className="text-gray-500" size="sm" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Are you sure you want to delete <strong>{operatorToDelete.name}</strong> ({operatorToDelete.code})?
              </p>
              {(operatorToDelete._count?.users > 0 || 
                operatorToDelete._count?.vehicles > 0 || 
                operatorToDelete._count?.drivers > 0 || 
                operatorToDelete._count?.orders > 0) && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-sm">
                  <p className="text-sm text-yellow-800">
                    This operator has active resources:
                  </p>
                  <ul className="text-xs text-yellow-700 mt-1 list-disc list-inside">
                    {operatorToDelete._count?.users > 0 && <li>{operatorToDelete._count.users} users</li>}
                    {operatorToDelete._count?.vehicles > 0 && <li>{operatorToDelete._count.vehicles} vehicles</li>}
                    {operatorToDelete._count?.drivers > 0 && <li>{operatorToDelete._count.drivers} drivers</li>}
                    {operatorToDelete._count?.orders > 0 && <li>{operatorToDelete._count.orders} orders</li>}
                  </ul>
                  <p className="text-xs text-yellow-800 mt-2">
                    Operators with active resources cannot be deleted. Please deactivate instead.
                  </p>
                </div>
              )}
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => {
                    setDeleteModalOpen(false);
                    setOperatorToDelete(null);
                  }}
                  className="btn btn-secondary text-sm"
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting || (operatorToDelete._count?.users > 0 || 
                    operatorToDelete._count?.vehicles > 0 || 
                    operatorToDelete._count?.drivers > 0 || 
                    operatorToDelete._count?.orders > 0)}
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
        data={operators}
        loading={loading}
        onRowClick={(row) => router.push(`/dashboard/operators/${row.id}`)}
        emptyMessage="No operators found"
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

