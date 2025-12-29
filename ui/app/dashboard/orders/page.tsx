'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { OrdersAPI } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import Icon, { 
  faSearch, 
  faPlus, 
  faFilter, 
  faTable,
  faTh,
  faTimes, 
  faDownload,
  faChevronUp,
  faChevronDown,
  faEye,
  faEdit,
  faTrash,
} from '@/app/components/Icon';
import { toast } from '@/app/components/Toaster';
import { DataTable, Pagination, StatusBadge, Button, PageSkeleton, Skeleton } from '@/app/components';
// Order Status types
type OrderStatus = 
  | 'CREATED'
  | 'PENDING_OPERATOR_ACTION'
  | 'APPROVED'
  | 'REJECTED'
  | 'AWAITING_PAYMENT'
  | 'PAID'
  | 'ASSIGNED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'FAILED';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const STATUSES: { value: OrderStatus | ''; label: string }[] = [
  { value: '', label: 'All Status' },
  { value: 'CREATED', label: 'Created' },
  { value: 'PENDING_OPERATOR_ACTION', label: 'Pending Operator Action' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'AWAITING_PAYMENT', label: 'Awaiting Payment' },
  { value: 'PAID', label: 'Paid' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'PICKED_UP', label: 'Picked Up' },
  { value: 'IN_TRANSIT', label: 'In Transit' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'FAILED', label: 'Failed' },
];

type SortField = 'order_number' | 'status' | 'created_at' | 'updated_at' | 'total_price';
type SortDirection = 'asc' | 'desc';
type ViewMode = 'table' | 'cards';

// Mobile Order Card Component
function MobileOrderCard({ order, isSelected, onSelect }: { order: any; isSelected: boolean; onSelect: (id: string, checked: boolean) => void }) {
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Link href={`/dashboard/orders/${order.id}`} className="block">
      <div className="bg-white border border-gray-200 rounded-sm p-4 hover:border-gray-300 transition-all">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => onSelect(order.id, e.target.checked)}
                className="mt-1 rounded border-gray-300 text-[#0b66c2] focus:ring-[#0b66c2]"
                onClick={(e) => e.stopPropagation()}
              />
              <div>
                <div className="font-mono text-sm text-[#0b66c2] font-medium">
                  {order.order_number}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            </div>
            <StatusBadge status={order.status} />
          </div>
          
          <div className="space-y-1">
            <div className="text-sm text-gray-600">
              <span className="font-medium">From:</span> {order.pickup_address}
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">To:</span> {order.delivery_address}
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-700 font-medium">
              RWF {Number(order.total_price || 0).toLocaleString()}
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Updated</div>
              <div className="text-gray-700">{formatTimeAgo(order.updated_at)}</div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function OrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [sortKey, setSortKey] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | ''>('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Initialize from URL params
  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam) {
      setStatusFilter(statusParam as OrderStatus);
    }
  }, [searchParams]);

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
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

        const response = await OrdersAPI.getAll(params);
        setOrders(response.data || []);
        setTotal(response.meta?.total || 0);
      } catch (error: any) {
        console.error('Failed to fetch orders:', error);
        toast.error(error?.response?.data?.message || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [page, pageSize, search, statusFilter]);

  const totalPages = Math.ceil(total / pageSize);

  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    setSortKey(key as SortField);
    setSortDirection(direction);
    // TODO: Implement backend sorting
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(orders.map(o => o.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkStatusUpdate = async () => {
    if (!selectedStatus || selectedIds.size === 0) return;

    setUpdatingStatus(true);
    try {
      const promises = Array.from(selectedIds).map(id =>
        OrdersAPI.updateStatus(id, selectedStatus)
      );
      await Promise.all(promises);
      toast.success(`Status updated for ${selectedIds.size} order(s)`);
      setStatusModalOpen(false);
      setSelectedStatus('');
      setSelectedIds(new Set());
      // Reload orders
      const params: any = { page, limit: pageSize };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      const response = await OrdersAPI.getAll(params);
      setOrders(response.data || []);
    } catch (error: any) {
      console.error('Failed to update status:', error);
      toast.error(error?.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this order?')) return;

    try {
      await OrdersAPI.delete(id);
      toast.success('Order deleted successfully');
      // Reload orders
      const params: any = { page, limit: pageSize };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      const response = await OrdersAPI.getAll(params);
      setOrders(response.data || []);
      setTotal(response.meta?.total || 0);
    } catch (error: any) {
      console.error('Failed to delete order:', error);
      toast.error(error?.response?.data?.message || 'Failed to delete order');
    }
  };

  const columns = [
    {
      key: 'order_number',
      label: 'Order Number',
      sortable: true,
      render: (value: string, row: any) => (
        <Link
          href={`/dashboard/orders/${row.id}`}
          className="font-mono text-sm text-[#0b66c2] font-medium hover:text-[#09529a]"
          onClick={(e) => e.stopPropagation()}
        >
          {value}
        </Link>
      ),
    },
    {
      key: 'pickup_address',
      label: 'Pickup',
      render: (value: string) => (
        <span className="text-sm text-gray-900 line-clamp-1 max-w-xs">{value}</span>
      ),
    },
    {
      key: 'delivery_address',
      label: 'Delivery',
      render: (value: string) => (
        <span className="text-sm text-gray-900 line-clamp-1 max-w-xs">{value}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: string) => <StatusBadge status={value} />,
    },
    {
      key: 'total_price',
      label: 'Total Price',
      sortable: true,
      render: (value: string) => (
        <span className="text-sm font-medium text-gray-900">
          RWF {Number(value || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      render: (value: string) => (
        <span className="text-sm text-gray-600">
          {new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, row: any) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Link
            href={`/dashboard/orders/${row.id}`}
            className="p-1.5 text-gray-600 hover:text-[#0b66c2] hover:bg-[#0b66c2]/10 rounded-sm transition-colors"
            title="View"
          >
            <Icon icon={faEye} size="sm" />
          </Link>
          <button
            onClick={() => handleDelete(row.id)}
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
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600 mt-1">Manage and track all orders</p>
        </div>
        <Link href="/create-order">
          <Button variant="primary" size="md" icon={faPlus}>
            Create Order
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
                placeholder="Search orders..."
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
              setStatusFilter(e.target.value as OrderStatus | '');
              setPage(1);
            }}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm text-gray-900 focus:outline-none focus:bg-white focus:border-[#0b66c2] focus:ring-1 focus:ring-[#0b66c2] text-sm"
          >
            {STATUSES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          {/* Page Size */}
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm text-gray-900 focus:outline-none focus:bg-white focus:border-[#0b66c2] focus:ring-1 focus:ring-[#0b66c2] text-sm"
          >
            {PAGE_SIZE_OPTIONS.map(size => (
              <option key={size} value={size}>{size} / page</option>
            ))}
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="bg-white border border-gray-200 rounded-sm p-4 flex items-center justify-between flex-wrap gap-3">
          <span className="text-sm text-gray-700">
            {selectedIds.size} {selectedIds.size === 1 ? 'order' : 'orders'} selected
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setStatusModalOpen(true)}
              disabled={selectedIds.size === 0}
              className="px-3 py-2 text-sm border border-gray-200 rounded-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
            >
              Update Status
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {statusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-sm p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Update Status</h3>
              <button
                onClick={() => {
                  setStatusModalOpen(false);
                  setSelectedStatus('');
                }}
                className="p-1 hover:bg-gray-100 rounded-sm"
              >
                <Icon icon={faTimes} className="text-gray-500" size="sm" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm text-gray-900 focus:outline-none focus:bg-white focus:border-[#0b66c2] focus:ring-1 focus:ring-[#0b66c2] text-sm"
                >
                  <option value="">Select status...</option>
                  {STATUSES.filter(s => s.value).map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => {
                    setStatusModalOpen(false);
                    setSelectedStatus('');
                  }}
                  className="btn btn-secondary text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkStatusUpdate}
                  disabled={!selectedStatus || updatingStatus}
                  className="btn btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updatingStatus ? 'Updating...' : `Update ${selectedIds.size} ${selectedIds.size === 1 ? 'order' : 'orders'}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Mode Toggle (Mobile) */}
      <div className="md:hidden flex items-center gap-1 bg-gray-100 rounded-sm p-1 justify-end">
        <button
          onClick={() => setViewMode('table')}
          className={`px-3 py-1.5 text-sm rounded-sm transition-colors ${
            viewMode === 'table'
              ? 'bg-white text-[#0b66c2]'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          aria-label="Table view"
        >
          <Icon icon={faTable} size="sm" />
        </button>
        <button
          onClick={() => setViewMode('cards')}
          className={`px-3 py-1.5 text-sm rounded-sm transition-colors ${
            viewMode === 'cards'
              ? 'bg-white text-[#0b66c2]'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          aria-label="Card view"
        >
          <Icon icon={faTh} size="sm" />
        </button>
      </div>

      {/* Card View */}
      {viewMode === 'cards' && (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-full">
              {viewMode === 'table' ? (
                <PageSkeleton showHeader={false} showFilters={false} showTable tableColumns={7} tableRows={5} showActions />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bg-white border border-gray-200 rounded-sm p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <Skeleton height={16} width={120} />
                          <Skeleton height={20} width={80} rounded="full" />
                        </div>
                        <Skeleton height={14} width="60%" />
                        <Skeleton height={14} width="80%" />
                        <div className="flex items-center gap-2 pt-2">
                          <Skeleton height={32} width={32} rounded="md" />
                          <Skeleton height={32} width={32} rounded="md" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : orders.length === 0 ? (
            <div className="col-span-full bg-white border border-gray-200 rounded-sm p-12 text-center">
              <p className="text-gray-500">No orders found</p>
            </div>
          ) : (
            orders.map((order) => (
              <MobileOrderCard
                key={order.id}
                order={order}
                isSelected={selectedIds.has(order.id)}
                onSelect={handleSelectOne}
              />
            ))
          )}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <DataTable
          columns={columns}
          data={orders}
          loading={loading}
          onSort={handleSort}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onRowClick={(row) => router.push(`/dashboard/orders/${row.id}`)}
          emptyMessage="No orders found"
        />
      )}

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

