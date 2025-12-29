'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuditLogsAPI } from '@/lib/api';
import Icon, { 
  faSearch, 
  faTimes, 
  faEye,
  faUser,
} from '@/app/components/Icon';
import { toast } from '@/app/components/Toaster';
import { DataTable, Pagination, Button } from '@/app/components';
import LoadingSpinner from '@/app/components/LoadingSpinner';

const ACTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'CREATE', label: 'Create' },
  { value: 'UPDATE', label: 'Update' },
  { value: 'DELETE', label: 'Delete' },
  { value: 'APPROVE', label: 'Approve' },
  { value: 'REJECT', label: 'Reject' },
  { value: 'ASSIGN', label: 'Assign' },
  { value: 'CANCEL', label: 'Cancel' },
];

const ENTITY_TYPES = [
  { value: '', label: 'All Entities' },
  { value: 'Order', label: 'Order' },
  { value: 'User', label: 'User' },
  { value: 'Vehicle', label: 'Vehicle' },
  { value: 'Driver', label: 'Driver' },
  { value: 'Operator', label: 'Operator' },
  { value: 'Payment', label: 'Payment' },
];

const getActionBadgeColor = (action: string) => {
  switch (action) {
    case 'CREATE':
      return 'bg-green-100 text-green-800';
    case 'UPDATE':
      return 'bg-blue-100 text-blue-800';
    case 'DELETE':
      return 'bg-red-100 text-red-800';
    case 'APPROVE':
      return 'bg-green-100 text-green-800';
    case 'REJECT':
      return 'bg-red-100 text-red-800';
    case 'ASSIGN':
      return 'bg-purple-100 text-purple-800';
    case 'CANCEL':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function AuditLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Fetch audit logs
  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const params: any = {
          page,
          limit: pageSize,
        };

        if (search.trim()) {
          params.search = search.trim();
        }

        if (actionFilter) {
          params.action = actionFilter;
        }

        if (entityTypeFilter) {
          params.entity_type = entityTypeFilter;
        }

        if (startDate) {
          params.start_date = startDate;
        }

        if (endDate) {
          params.end_date = endDate;
        }

        const response = await AuditLogsAPI.getAll(params);
        setLogs(response.data || []);
        setTotal(response.meta?.total || 0);
      } catch (error: any) {
        console.error('Failed to fetch audit logs:', error);
        toast.error(error?.response?.data?.message || 'Failed to load audit logs');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [page, pageSize, search, actionFilter, entityTypeFilter, startDate, endDate]);

  const totalPages = Math.ceil(total / pageSize);

  const columns = [
    {
      key: 'action',
      label: 'Action',
      sortable: false,
      render: (row: any) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionBadgeColor(row.action)}`}>
          {row.action}
        </span>
      ),
    },
    {
      key: 'entity',
      label: 'Entity',
      sortable: false,
      render: (row: any) => (
        <div>
          <p className="text-sm font-medium text-gray-900">{row.entity_type}</p>
          <p className="text-xs text-gray-500">{row.entity_id.substring(0, 8)}...</p>
        </div>
      ),
    },
    {
      key: 'user',
      label: 'User',
      sortable: false,
      render: (row: any) => (
        <div className="flex items-center gap-2">
          {row.user ? (
            <>
              <div className="w-8 h-8 bg-[#0b66c2]/10 rounded-full flex items-center justify-center">
                <Icon icon={faUser} className="text-[#0b66c2]" size="xs" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{row.user.name}</p>
                <p className="text-xs text-gray-500">{row.user.email || row.user.phone}</p>
              </div>
            </>
          ) : (
            <span className="text-sm text-gray-400">System</span>
          )}
        </div>
      ),
    },
    {
      key: 'ip_address',
      label: 'IP Address',
      sortable: false,
      render: (row: any) => (
        <span className="text-sm text-gray-600">{row.ip_address || 'N/A'}</span>
      ),
    },
    {
      key: 'created_at',
      label: 'Date & Time',
      sortable: false,
      render: (row: any) => (
        <div>
          <p className="text-sm text-gray-900">
            {new Date(row.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </p>
          <p className="text-xs text-gray-500">
            {new Date(row.created_at).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_: any, row: any) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Link
            href={`/dashboard/audit-logs/${row.id}`}
            className="p-1.5 text-gray-600 hover:text-[#0b66c2] hover:bg-[#0b66c2]/10 rounded-sm transition-colors"
            title="View Details"
          >
            <Icon icon={faEye} size="sm" />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600 mt-1">Track system activities and user actions</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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
                placeholder="Search actions, entities..."
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

          {/* Action Filter */}
          <div>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0b66c2] focus:border-[#0b66c2] text-sm"
            >
              {ACTIONS.map((action) => (
                <option key={action.value} value={action.value}>
                  {action.label}
                </option>
              ))}
            </select>
          </div>

          {/* Entity Type Filter */}
          <div>
            <select
              value={entityTypeFilter}
              onChange={(e) => {
                setEntityTypeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0b66c2] focus:border-[#0b66c2] text-sm"
            >
              {ENTITY_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0b66c2] focus:border-[#0b66c2] text-sm"
              placeholder="Start Date"
            />
          </div>

          {/* End Date */}
          <div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0b66c2] focus:border-[#0b66c2] text-sm"
              placeholder="End Date"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={logs}
        loading={loading}
        emptyMessage="No audit logs found"
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

