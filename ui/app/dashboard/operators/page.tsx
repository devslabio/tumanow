'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { OperatorsAPI } from '@/lib/api';
import { exportData, ExportColumn } from '@/lib/export';
import Icon, { 
  faSearch, 
  faPlus, 
  faTimes, 
  faDownload,
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

  const handleExport = async (format: 'CSV' | 'EXCEL' = 'EXCEL') => {
    try {
      toast.info('Preparing export...');
      
      const params: any = { limit: 10000 };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;

      const response = await OperatorsAPI.getAll(params);
      const allOperators = response.data || [];

      if (allOperators.length === 0) {
        toast.warning('No data to export');
        return;
      }

      // Transform data to include count fields directly
      const transformedData = allOperators.map(op => ({
        ...op,
        users_count: op._count?.users || 0,
        vehicles_count: op._count?.vehicles || 0,
        drivers_count: op._count?.drivers || 0,
        orders_count: op._count?.orders || 0,
      }));

      const exportColumns: ExportColumn[] = [
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'status', label: 'Status' },
        { key: 'users_count', label: 'Users' },
        { key: 'vehicles_count', label: 'Vehicles' },
        { key: 'drivers_count', label: 'Drivers' },
        { key: 'orders_count', label: 'Orders' },
        { 
          key: 'created_at', 
          label: 'Created Date',
          format: (value) => value ? new Date(value).toLocaleDateString('en-US') : ''
        },
      ];

      exportData(transformedData, exportColumns, format, 'operators');

      exportData(allOperators, exportColumns, format, 'operators');
      toast.success(`Exported ${allOperators.length} operators successfully`);
    } catch (error: any) {
      console.error('Failed to export operators:', error);
      toast.error(error?.response?.data?.message || 'Failed to export operators');
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
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Operators</h1>
          <p className="text-gray-600 mt-1">Manage logistics operators and their configurations</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative group">
            <Button 
              variant="secondary" 
              size="md" 
              icon={faDownload}
              onClick={() => handleExport('EXCEL')}
            >
              Export
            </Button>
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-sm shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button
                onClick={() => handleExport('EXCEL')}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 whitespace-nowrap"
              >
                Export as Excel
              </button>
              <button
                onClick={() => handleExport('CSV')}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 whitespace-nowrap"
              >
                Export as CSV
              </button>
            </div>
          </div>
          <Link href="/dashboard/operators/create">
            <Button variant="primary" size="md" icon={faPlus}>
              Create Operator
            </Button>
          </Link>
        </div>
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

