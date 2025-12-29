'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UsersAPI } from '@/lib/api';
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
import { DataTable, Pagination, Button } from '@/app/components';
import LoadingSpinner from '@/app/components/LoadingSpinner';

const STATUSES = [
  { value: '', label: 'All Status' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'SUSPENDED', label: 'Suspended' },
];

const ROLE_CODES = [
  { value: '', label: 'All Roles' },
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

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
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

        if (roleFilter) {
          params.role_code = roleFilter;
        }

        const response = await UsersAPI.getAll(params);
        setUsers(response.data || []);
        setTotal(response.meta?.total || 0);
      } catch (error: any) {
        console.error('Failed to fetch users:', error);
        toast.error(error?.response?.data?.message || 'Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [page, pageSize, search, statusFilter, roleFilter]);

  const totalPages = Math.ceil(total / pageSize);

  const handleDelete = async () => {
    if (!userToDelete) return;

    setDeleting(true);
    try {
      await UsersAPI.delete(userToDelete.id);
      toast.success('User deleted successfully');
      setDeleteModalOpen(false);
      setUserToDelete(null);
      
      // Reload users
      const params: any = { page, limit: pageSize };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (roleFilter) params.role_code = roleFilter;
      const response = await UsersAPI.getAll(params);
      setUsers(response.data || []);
      setTotal(response.meta?.total || 0);
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      toast.error(error?.response?.data?.message || 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Name',
      sortable: false,
      render: (_: any, row: any) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#0b66c2]/10 rounded-full flex items-center justify-center">
            <Icon icon={faUser} className="text-[#0b66c2]" size="sm" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{row?.name || '-'}</p>
            {row?.email && (
              <p className="text-xs text-gray-500">{row.email}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      label: 'Phone',
      sortable: false,
      render: (_: any, row: any) => (
        <span className="text-sm text-gray-900">{row?.phone || '-'}</span>
      ),
    },
    {
      key: 'roles',
      label: 'Roles',
      sortable: false,
      render: (_: any, row: any) => (
        <div className="flex flex-wrap gap-1">
          {row?.user_roles && row.user_roles.length > 0 ? (
            row.user_roles.map((ur: any) => (
              <span
                key={ur.role.id}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
              >
                {ur.role.code.replace(/_/g, ' ')}
              </span>
            ))
          ) : (
            <span className="text-xs text-gray-400">No roles</span>
          )}
        </div>
      ),
    },
    {
      key: 'operator',
      label: 'Operator',
      sortable: false,
      render: (_: any, row: any) => (
        <span className="text-sm text-gray-600">
          {row?.operator?.name || 'Platform User'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: false,
      render: (_: any, row: any) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(row?.status || '')}`}>
          {row?.status || '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_: any, row: any) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Link
            href={`/dashboard/users/${row.id}`}
            className="p-1.5 text-gray-600 hover:text-[#0b66c2] hover:bg-[#0b66c2]/10 rounded-sm transition-colors"
            title="View"
          >
            <Icon icon={faEye} size="sm" />
          </Link>
          <Link
            href={`/dashboard/users/${row.id}?edit=true`}
            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-sm transition-colors"
            title="Edit"
          >
            <Icon icon={faEdit} size="sm" />
          </Link>
          <button
            onClick={() => {
              setUserToDelete(row);
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
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600 mt-1">Manage system users and their roles</p>
        </div>
        <Link href="/dashboard/users/create">
          <Button variant="primary" size="md" icon={faPlus}>
            Create User
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Icon
                icon={faSearch}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size="sm"
              />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0b66c2] focus:border-[#0b66c2] text-sm"
              />
              {search && (
                <button
                  onClick={() => {
                    setSearch('');
                    setPage(1);
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <Icon icon={faTimes} size="xs" />
                </button>
              )}
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0b66c2] focus:border-[#0b66c2] text-sm"
            >
              {STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0b66c2] focus:border-[#0b66c2] text-sm"
            >
              {ROLE_CODES.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        onRowClick={(row) => router.push(`/dashboard/users/${row.id}`)}
        emptyMessage="No users found"
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

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-sm p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete User</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete <strong>{userToDelete?.name}</strong>? This will set their status to INACTIVE.
            </p>
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setUserToDelete(null);
                }}
                className="btn btn-secondary text-sm"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="btn btn-primary text-sm bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

