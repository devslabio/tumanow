'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DriversAPI } from '@/lib/api';
import { exportData, ExportColumn } from '@/lib/export';
import Icon, { 
  faSearch, 
  faPlus, 
  faTimes, 
  faDownload,
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

  const handleExport = async (format: 'CSV' | 'EXCEL' = 'EXCEL') => {
    try {
      toast.info('Preparing export...');
      
      const params: any = { limit: 10000 };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;

      const response = await DriversAPI.getAll(params);
      const allDrivers = response.data || [];

      if (allDrivers.length === 0) {
        toast.warning('No data to export');
        return;
      }

      // Transform data to include count fields directly
      const transformedData = allDrivers.map(driver => ({
        ...driver,
        vehicles_assigned: driver._count?.vehicle_drivers || 0,
      }));

      const exportColumns: ExportColumn[] = [
        { key: 'name', label: 'Name' },
        { key: 'phone', label: 'Phone' },
        { key: 'email', label: 'Email' },
        { key: 'license_number', label: 'License Number' },
        { 
          key: 'status', 
          label: 'Status',
          format: (value) => value?.replace(/_/g, ' ') || ''
        },
        { 
          key: 'operator', 
          label: 'Operator',
          format: (value) => value?.name || 'N/A'
        },
        { key: 'vehicles_assigned', label: 'Vehicles Assigned' },
        { 
          key: 'created_at', 
          label: 'Created Date',
          format: (value) => value ? new Date(value).toLocaleDateString('en-US') : ''
        },
      ];

      exportData(transformedData, exportColumns, format, 'drivers');

      toast.success(`Exported ${allDrivers.length} drivers successfully`);
    } catch (error: any) {
      console.error('Failed to export drivers:', error);
      toast.error(error?.response?.data?.message || 'Failed to export drivers');
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
  ];

  if (loading) {
    return <PageSkeleton showHeader showFilters showTable tableColumns={6} tableRows={5} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Drivers</h1>
          <p className="text-gray-600 mt-1">Manage drivers and their vehicle assignments</p>
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
          <Link href="/dashboard/drivers/create">
            <Button variant="primary" size="md" icon={faPlus}>
              Add Driver
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

