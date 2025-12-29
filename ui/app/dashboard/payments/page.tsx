'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PaymentsAPI } from '@/lib/api';
import { exportData, ExportColumn } from '@/lib/export';
import { fetchAll } from '@/lib/fetchAll';
import Icon, { 
  faSearch, 
  faTimes, 
  faDownload,
  faDollarSign,
  faCreditCard,
  faPhone,
  faTruck,
  faBuilding,
} from '@/app/components/Icon';
import { toast } from '@/app/components/Toaster';
import { DataTable, Pagination, Button, StatusBadge, PageSkeleton } from '@/app/components';

type PaymentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
type PaymentMethod = 'MOBILE_MONEY' | 'CARD' | 'COD' | 'CORPORATE';

const STATUSES = [
  { value: '', label: 'All Status' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'REFUNDED', label: 'Refunded' },
];

const METHODS = [
  { value: '', label: 'All Methods' },
  { value: 'MOBILE_MONEY', label: 'Mobile Money' },
  { value: 'CARD', label: 'Card' },
  { value: 'COD', label: 'Cash on Delivery' },
  { value: 'CORPORATE', label: 'Corporate' },
];

const getStatusBadgeColor = (status: PaymentStatus) => {
  switch (status) {
    case 'COMPLETED':
      return 'bg-green-100 text-green-800';
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800';
    case 'PROCESSING':
      return 'bg-blue-100 text-blue-800';
    case 'FAILED':
      return 'bg-red-100 text-red-800';
    case 'REFUNDED':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getMethodIcon = (method: PaymentMethod) => {
  switch (method) {
    case 'MOBILE_MONEY':
      return faPhone;
    case 'CARD':
      return faCreditCard;
    case 'COD':
      return faTruck;
    case 'CORPORATE':
      return faBuilding;
    default:
      return faDollarSign;
  }
};

export default function PaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | ''>('');
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | ''>('');

  // Fetch payments
  useEffect(() => {
    const fetchPayments = async () => {
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

        if (methodFilter) {
          params.method = methodFilter;
        }

        const response = await PaymentsAPI.getAll(params);
        setPayments(response.data || []);
        setTotal(response.meta?.total || 0);
      } catch (error: any) {
        console.error('Failed to fetch payments:', error);
        toast.error(error?.response?.data?.message || 'Failed to load payments');
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [page, pageSize, search, statusFilter, methodFilter]);

  const totalPages = Math.ceil(total / pageSize);

  const handleExport = async (format: 'CSV' | 'EXCEL' = 'EXCEL') => {
    try {
      toast.info('Preparing export...');
      
      const baseParams: any = {};
      if (search.trim()) baseParams.search = search.trim();
      if (statusFilter) baseParams.status = statusFilter;
      if (methodFilter) baseParams.method = methodFilter;

      const allPayments = await fetchAll(
        (params) => PaymentsAPI.getAll(params),
        baseParams,
        100
      );

      if (allPayments.length === 0) {
        toast.warning('No data to export');
        return;
      }

      const exportColumns: ExportColumn[] = [
        { 
          key: 'order', 
          label: 'Order Number',
          format: (value) => value?.order_number || 'N/A'
        },
        { 
          key: 'amount', 
          label: 'Amount',
          format: (value) => `RWF ${Number(value || 0).toLocaleString()}`
        },
        { 
          key: 'method', 
          label: 'Payment Method',
          format: (value) => value?.replace(/_/g, ' ') || ''
        },
        { key: 'status', label: 'Status' },
        { 
          key: 'transaction_id', 
          label: 'Transaction ID'
        },
        { 
          key: 'customer', 
          label: 'Customer',
          format: (value) => value?.name || 'N/A'
        },
        { 
          key: 'operator', 
          label: 'Operator',
          format: (value) => value?.name || 'N/A'
        },
        { 
          key: 'created_at', 
          label: 'Created Date',
          format: (value) => value ? new Date(value).toLocaleDateString('en-US') : ''
        },
        { 
          key: 'paid_at', 
          label: 'Paid Date',
          format: (value) => value ? new Date(value).toLocaleDateString('en-US') : 'N/A'
        },
      ];

      exportData(allPayments, exportColumns, format, 'payments');
      toast.success(`Exported ${allPayments.length} payments successfully`);
    } catch (error: any) {
      console.error('Failed to export payments:', error);
      toast.error(error?.response?.data?.message || 'Failed to export payments');
    }
  };

  const columns = [
    {
      key: 'order',
      label: 'Order',
      sortable: false,
      render: (_: any, row: any) => (
        <Link
          href={`/dashboard/orders/${row?.order?.id || '#'}`}
          className="text-[#0b66c2] hover:text-[#09529a] font-medium"
        >
          {row?.order?.order_number || 'N/A'}
        </Link>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: false,
      render: (_: any, row: any) => (
        <span className="font-semibold text-gray-900">
          RWF {Number(row?.amount || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'method',
      label: 'Method',
      sortable: false,
      render: (_: any, row: any) => (
        <div className="flex items-center gap-2">
          <Icon icon={getMethodIcon(row?.method || '')} className="text-gray-400" size="sm" />
          <span className="text-sm text-gray-700">{(row?.method || '').replace(/_/g, ' ')}</span>
        </div>
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
      key: 'customer',
      label: 'Customer',
      sortable: false,
      render: (_: any, row: any) => (
        <div>
          <p className="text-sm font-medium text-gray-900">{row?.customer?.name || 'N/A'}</p>
          {row?.customer?.phone && (
            <p className="text-xs text-gray-500">{row.customer.phone}</p>
          )}
        </div>
      ),
    },
    {
      key: 'transaction_id',
      label: 'Transaction ID',
      sortable: false,
      render: (_: any, row: any) => (
        <span className="text-sm text-gray-600 font-mono">
          {row?.transaction_id || 'N/A'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Date',
      sortable: false,
      render: (_: any, row: any) => (
        <div>
          <p className="text-sm text-gray-900">
            {row?.created_at ? new Date(row.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }) : '-'}
          </p>
          {row?.created_at && (
            <p className="text-xs text-gray-500">
              {new Date(row.created_at).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return <PageSkeleton showHeader showFilters showTable tableColumns={7} tableRows={5} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600 mt-1">Manage and track all payments</p>
        </div>
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
                placeholder="Search by transaction ID or order number..."
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
                setStatusFilter(e.target.value as PaymentStatus | '');
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

          {/* Method Filter */}
          <div>
            <select
              value={methodFilter}
              onChange={(e) => {
                setMethodFilter(e.target.value as PaymentMethod | '');
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0b66c2] focus:border-[#0b66c2] text-sm"
            >
              {METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={payments}
        loading={loading}
        onRowClick={(row) => row?.id && router.push(`/dashboard/payments/${row.id}`)}
        emptyMessage="No payments found"
        showNumbering={true}
        numberingStart={(page - 1) * pageSize + 1}
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

