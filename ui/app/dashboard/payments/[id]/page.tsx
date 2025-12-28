'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PaymentsAPI } from '@/lib/api';
import Icon, { 
  faArrowLeft, 
  faEdit, 
  faDollarSign,
  faCreditCard,
  faPhone,
  faTruck,
  faBuilding,
  faClock,
  faUser,
  faBox,
  faCheckCircle,
  faTimes,
} from '@/app/components/Icon';
import { toast } from '@/app/components/Toaster';
import { Button } from '@/app/components';
import LoadingSpinner from '@/app/components/LoadingSpinner';

type PaymentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
type PaymentMethod = 'MOBILE_MONEY' | 'CARD' | 'COD' | 'CORPORATE';

const STATUS_OPTIONS: { value: PaymentStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'REFUNDED', label: 'Refunded' },
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

export default function PaymentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const paymentId = params?.id as string | undefined;

  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<PaymentStatus | ''>('');
  const [transactionId, setTransactionId] = useState('');

  useEffect(() => {
    if (!paymentId) {
      setLoading(false);
      return;
    }

    const fetchPayment = async () => {
      setLoading(true);
      try {
        const paymentData = await PaymentsAPI.getById(paymentId);
        setPayment(paymentData);
        setSelectedStatus(paymentData.status);
        setTransactionId(paymentData.transaction_id || '');
      } catch (error: any) {
        console.error('Failed to fetch payment:', error);
        if (error?.response?.status === 404 || error?.response?.status === 403) {
          router.push('/dashboard/payments');
        } else {
          toast.error('Failed to load payment. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPayment();
  }, [paymentId, router]);

  const handleStatusUpdate = async () => {
    if (!payment || !paymentId || !selectedStatus || selectedStatus === payment.status) return;

    setUpdatingStatus(true);
    try {
      const updateData: any = { status: selectedStatus };
      if (transactionId && transactionId !== payment.transaction_id) {
        updateData.transaction_id = transactionId;
      }

      await PaymentsAPI.update(paymentId, updateData);
      toast.success('Payment status updated successfully');
      setStatusModalOpen(false);
      
      // Reload payment
      const paymentData = await PaymentsAPI.getById(paymentId);
      setPayment(paymentData);
      setSelectedStatus(paymentData.status);
      setTransactionId(paymentData.transaction_id || '');
    } catch (error: any) {
      console.error('Failed to update payment status:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to update payment status. Please try again.';
      toast.error(errorMessage);
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner text="Loading payment..." />
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Payment not found</p>
        <Link href="/dashboard/payments" className="text-[#0b66c2] hover:text-[#09529a] mt-4 inline-block">
          Back to Payments
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/payments">
            <Button variant="ghost" size="sm" icon={faArrowLeft}>
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payment Details</h1>
            <p className="text-gray-600 mt-1">Transaction ID: {payment.transaction_id || 'N/A'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {payment.status !== 'COMPLETED' && (
            <button
              onClick={() => {
                setStatusModalOpen(true);
                setSelectedStatus(payment.status);
                setTransactionId(payment.transaction_id || '');
              }}
              className="btn btn-primary text-sm"
            >
              Update Status
            </button>
          )}
        </div>
      </div>

      {/* Status Update Modal */}
      {statusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-sm p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Update Payment Status</h3>
              <button
                onClick={() => {
                  setStatusModalOpen(false);
                  setSelectedStatus(payment.status);
                  setTransactionId(payment.transaction_id || '');
                }}
                className="p-1 hover:bg-gray-100 rounded-sm"
              >
                <Icon icon={faTimes} className="text-gray-500" size="sm" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as PaymentStatus)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm text-gray-900 focus:outline-none focus:bg-white focus:border-[#0b66c2] focus:ring-1 focus:ring-[#0b66c2] text-sm"
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction ID (Optional)
                </label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Enter transaction ID..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm text-gray-900 focus:outline-none focus:bg-white focus:border-[#0b66c2] focus:ring-1 focus:ring-[#0b66c2] text-sm"
                />
              </div>
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => {
                    setStatusModalOpen(false);
                    setSelectedStatus(payment.status);
                    setTransactionId(payment.transaction_id || '');
                  }}
                  className="btn btn-secondary text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStatusUpdate}
                  disabled={!selectedStatus || selectedStatus === payment.status || updatingStatus}
                  className="btn btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updatingStatus ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Status Card */}
        <div className="bg-white border border-gray-200 rounded-sm p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Status</h3>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(payment.status)}`}>
            {payment.status}
          </span>
        </div>

        {/* Amount Card */}
        <div className="bg-white border border-gray-200 rounded-sm p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Amount</h3>
          <p className="text-2xl font-bold text-gray-900">
            RWF {Number(payment.amount).toLocaleString()}
          </p>
        </div>

        {/* Method Card */}
        <div className="bg-white border border-gray-200 rounded-sm p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Payment Method</h3>
          <div className="flex items-center gap-2">
            <Icon icon={getMethodIcon(payment.method)} className="text-[#0b66c2]" />
            <p className="text-sm font-medium text-gray-900">{payment.method.replace(/_/g, ' ')}</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Details */}
          <div className="bg-white border border-gray-200 rounded-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Icon icon={faBox} className="text-[#0b66c2]" />
              <h3 className="text-lg font-semibold text-gray-900">Order Details</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Order Number</p>
                <Link
                  href={`/dashboard/orders/${payment.order.id}`}
                  className="text-sm font-medium text-[#0b66c2] hover:text-[#09529a]"
                >
                  {payment.order.order_number}
                </Link>
              </div>
              <div>
                <p className="text-sm text-gray-500">Order Status</p>
                <p className="text-sm font-medium text-gray-900">{payment.order.status.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Order Total</p>
                <p className="text-sm font-medium text-gray-900">RWF {Number(payment.order.total_price || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="bg-white border border-gray-200 rounded-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Icon icon={faDollarSign} className="text-[#0b66c2]" />
              <h3 className="text-lg font-semibold text-gray-900">Transaction Details</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Transaction ID</p>
                <p className="text-sm font-medium text-gray-900 font-mono">
                  {payment.transaction_id || 'Not provided'}
                </p>
              </div>
              {payment.gateway_response && (
                <div>
                  <p className="text-sm text-gray-500">Gateway Response</p>
                  <pre className="text-xs bg-gray-50 p-3 rounded-sm overflow-auto text-gray-700">
                    {typeof payment.gateway_response === 'string' 
                      ? payment.gateway_response 
                      : JSON.stringify(payment.gateway_response, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white border border-gray-200 rounded-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Icon icon={faUser} className="text-[#0b66c2]" />
              <h3 className="text-lg font-semibold text-gray-900">Customer</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{payment.customer?.name}</p>
              </div>
              {payment.customer?.email && (
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-sm text-gray-900">{payment.customer.email}</p>
                </div>
              )}
              {payment.customer?.phone && (
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="text-sm text-gray-900">{payment.customer.phone}</p>
                </div>
              )}
            </div>
          </div>

          {/* Operator Info */}
          {payment.operator && (
            <div className="bg-white border border-gray-200 rounded-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Icon icon={faBuilding} className="text-[#0b66c2]" />
                <h3 className="text-lg font-semibold text-gray-900">Operator</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{payment.operator.name}</p>
                  {payment.operator.code && (
                    <p className="text-xs text-gray-500">{payment.operator.code}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Payment Info */}
          <div className="bg-white border border-gray-200 rounded-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Icon icon={faClock} className="text-[#0b66c2]" />
              <h3 className="text-lg font-semibold text-gray-900">Payment Info</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Created</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(payment.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              {payment.paid_at && (
                <div>
                  <p className="text-sm text-gray-500">Paid At</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(payment.paid_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Last Updated</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(payment.updated_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

