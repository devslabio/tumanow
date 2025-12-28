'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PaymentsAPI } from '@/lib/api';
import Icon, { 
  faSearch, 
  faTimes, 
  faEye,
  faDollarSign,
  faCreditCard,
  faPhone,
  faTruck,
  faBuilding,
} from '@/app/components/Icon';
import { toast } from '@/app/components/Toaster';
import { DataTable, Pagination, Button, StatusBadge } from '@/app/components';
import LoadingSpinner from '@/app/components/LoadingSpinner';

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

  const columns = [
    {
      key: 'order',
      label: 'Order',
      sortable: false,
      render: (row: any) => (
        <Link
          href={`/dashboard/orders/${row.order.id}`}
          className="text-[#0b66c2] hover:text-[#09529a] font-medium"
        >
          {row.order.order_number}
        </Link>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: false,
      render: (row: any) => (
        <span className="font-semibold text-gray-900">
          RWF {Number(row.amount).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'method',
      label: 'Method',
      sortable: false,
      render: (row: any) => (
        <div className="flex items-center gap-2">
          <Icon icon={getMethodIcon(row.method)} className="text-gray-400" size="sm" />
          <span className="text-sm text-gray-700">{row.method.replace(/_/g, ' ')}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: false,
      render: (row: any) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(row.status)}`}>
          {row.status}
        </span>
      ),
    },
    {
      key: 'customer',
      label: 'Customer',
      sortable: false,
      render: (row: any) => (
        <div>
          <p className="text-sm font-medium text-gray-900">{row.customer?.name || 'N/A'}</p>
          {row.customer?.phone && (
            <p className="text-xs text-gray-500">{row.customer.phone}</p>
          )}
        </div>
      ),
    },
    {
      key: 'transaction_id',
      label: 'Transaction ID',
      sortable: false,
      render: (row: any) => (
        <span className="text-sm text-gray-600 font-mono">
          {row.transaction_id || 'N/A'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Date',
      sortable: false,
      render: (row: any) => (
        <div>
          <p className="text-sm text-gray-900">
            {new Date(row.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
          <p className="text-xs text-gray-500">
            {new Date(row.created_at).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (row: any) => (
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/payments/${row.id}`}>
            <button className="p-2 text-gray-400 hover:text-[#0b66c2] transition-colors">
              <Icon icon={faEye} size="sm" />
            </button>
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
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600 mt-1">Manage and track all payments</p>
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
        onRowClick={(row) => router.push(`/dashboard/payments/${row.id}`)}
        emptyMessage="No payments found"
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

