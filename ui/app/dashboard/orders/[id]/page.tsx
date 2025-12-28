'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { OrdersAPI, OrderAssignmentsAPI, VehiclesAPI, DriversAPI } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import Icon, { 
  faArrowLeft, 
  faEdit, 
  faCheck, 
  faTimes,
  faMapMarkerAlt,
  faBox,
  faDollarSign,
  faClock,
  faTruck,
  faUser,
  faPhone,
  faEnvelope,
} from '@/app/components/Icon';
import { toast } from '@/app/components/Toaster';
import { StatusBadge, Button } from '@/app/components';
import LoadingSpinner from '@/app/components/LoadingSpinner';

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

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
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

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const orderId = params?.id as string | undefined;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | ''>('');
  const [rejectionReason, setRejectionReason] = useState('');
  
  // Assignment states
  const [assignment, setAssignment] = useState<any>(null);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({
    vehicle_id: '',
    driver_id: '',
  });

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      setLoading(true);
      try {
        const orderData = await OrdersAPI.getById(orderId);
        setOrder(orderData);
        setSelectedStatus(orderData.status);
        
        // Set assignment if exists (order includes assignment data)
        if (orderData.order_assignments && orderData.order_assignments.length > 0) {
          const assignmentData = orderData.order_assignments[0];
          // Fetch full assignment details to get driver info
          try {
            const fullAssignment = await OrderAssignmentsAPI.getById(assignmentData.id);
            setAssignment(fullAssignment);
          } catch (err) {
            // If full fetch fails, use the basic assignment data
            setAssignment(assignmentData);
          }
        } else {
          setAssignment(null);
        }
      } catch (error: any) {
        console.error('Failed to fetch order:', error);
        if (error?.response?.status === 404 || error?.response?.status === 403) {
          router.push('/dashboard/orders');
        } else {
          toast.error('Failed to load order. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, router]);
  
  // Fetch vehicles and drivers when assignment modal opens
  useEffect(() => {
    if (assignmentModalOpen && order) {
      const fetchVehiclesAndDrivers = async () => {
        setLoadingVehicles(true);
        setLoadingDrivers(true);
        try {
          // Fetch vehicles from same operator
          const vehiclesResponse = await VehiclesAPI.getAll({
            operator_id: order.operator_id,
            status: 'AVAILABLE',
            limit: 100,
          });
          setVehicles(vehiclesResponse.data || []);
          
          // Fetch drivers from same operator
          const driversResponse = await DriversAPI.getAll({
            operator_id: order.operator_id,
            status: 'AVAILABLE',
            limit: 100,
          });
          setDrivers(driversResponse.data || []);
        } catch (error: any) {
          console.error('Failed to fetch vehicles/drivers:', error);
          toast.error('Failed to load vehicles and drivers');
        } finally {
          setLoadingVehicles(false);
          setLoadingDrivers(false);
        }
      };
      
      fetchVehiclesAndDrivers();
    }
  }, [assignmentModalOpen, order]);

  const handleStatusUpdate = async () => {
    if (!order || !orderId || !selectedStatus || selectedStatus === order.status) return;

    setUpdatingStatus(true);
    try {
      await OrdersAPI.updateStatus(
        orderId,
        selectedStatus,
        selectedStatus === 'REJECTED' ? rejectionReason : undefined
      );
      toast.success('Status updated successfully');
      setStatusModalOpen(false);
      setRejectionReason('');
      // Reload order
      const orderData = await OrdersAPI.getById(orderId);
      setOrder(orderData);
      setSelectedStatus(orderData.status);
    } catch (error: any) {
      console.error('Failed to update status:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to update status. Please try again.';
      toast.error(errorMessage);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) return;

    try {
      await OrdersAPI.delete(orderId!);
      toast.success('Order deleted successfully');
      router.push('/dashboard/orders');
    } catch (error: any) {
      console.error('Failed to delete order:', error);
      toast.error(error?.response?.data?.message || 'Failed to delete order');
    }
  };
  
  const handleAssignOrder = async () => {
    if (!assignmentForm.vehicle_id) {
      toast.error('Please select a vehicle');
      return;
    }

    setAssigning(true);
    try {
      const assignmentData = await OrderAssignmentsAPI.create({
        order_id: orderId!,
        vehicle_id: assignmentForm.vehicle_id,
        driver_id: assignmentForm.driver_id || undefined,
      });
      
      toast.success('Order assigned successfully');
      setAssignmentModalOpen(false);
      setAssignmentForm({ vehicle_id: '', driver_id: '' });
      
      // Reload order to get updated status and assignment
      const orderData = await OrdersAPI.getById(orderId!);
      setOrder(orderData);
      if (orderData.order_assignments && orderData.order_assignments.length > 0) {
        try {
          const assignmentDetails = await OrderAssignmentsAPI.getById(orderData.order_assignments[0].id);
          setAssignment(assignmentDetails);
        } catch (err) {
          setAssignment(orderData.order_assignments[0]);
        }
      } else {
        setAssignment(null);
      }
    } catch (error: any) {
      console.error('Failed to assign order:', error);
      toast.error(error?.response?.data?.message || 'Failed to assign order');
    } finally {
      setAssigning(false);
    }
  };
  
  const handleUpdateAssignment = async () => {
    if (!assignment) return;

    setAssigning(true);
    try {
      const updateData: any = {};
      if (assignmentForm.vehicle_id && assignmentForm.vehicle_id !== assignment.vehicle_id) {
        updateData.vehicle_id = assignmentForm.vehicle_id;
      }
      if (assignmentForm.driver_id !== assignment.driver_id) {
        updateData.driver_id = assignmentForm.driver_id || null;
      }

      await OrderAssignmentsAPI.update(assignment.id, updateData);
      toast.success('Assignment updated successfully');
      setAssignmentModalOpen(false);
      setAssignmentForm({ vehicle_id: '', driver_id: '' });
      
      // Reload assignment
      const assignmentData = await OrderAssignmentsAPI.getById(assignment.id);
      setAssignment(assignmentData);
    } catch (error: any) {
      console.error('Failed to update assignment:', error);
      toast.error(error?.response?.data?.message || 'Failed to update assignment');
    } finally {
      setAssigning(false);
    }
  };
  
  const handleRemoveAssignment = async () => {
    if (!assignment || !confirm('Are you sure you want to remove this assignment? The order status will revert to PAID.')) return;

    try {
      await OrderAssignmentsAPI.delete(assignment.id);
      toast.success('Assignment removed successfully');
      setAssignment(null);
      
      // Reload order to get updated status
      const orderData = await OrdersAPI.getById(orderId!);
      setOrder(orderData);
    } catch (error: any) {
      console.error('Failed to remove assignment:', error);
      toast.error(error?.response?.data?.message || 'Failed to remove assignment');
    }
  };
  
  const openAssignmentModal = () => {
    if (assignment) {
      // Editing existing assignment
      setAssignmentForm({
        vehicle_id: assignment.vehicle_id,
        driver_id: assignment.driver_id || '',
      });
    } else {
      // Creating new assignment
      setAssignmentForm({ vehicle_id: '', driver_id: '' });
    }
    setAssignmentModalOpen(true);
  };
  
  // Get available drivers for selected vehicle
  const getAvailableDrivers = () => {
    if (!assignmentForm.vehicle_id) return [];
    const selectedVehicle = vehicles.find(v => v.id === assignmentForm.vehicle_id);
    if (!selectedVehicle || !selectedVehicle.vehicle_drivers) return [];
    return selectedVehicle.vehicle_drivers.map((vd: any) => vd.driver);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner text="Loading order..." />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Order not found</p>
        <Link href="/dashboard/orders" className="text-[#0b66c2] hover:text-[#09529a] mt-4 inline-block">
          Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/orders">
            <Button variant="ghost" size="sm" icon={faArrowLeft}>
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{order.order_number}</h1>
            <p className="text-gray-600 mt-1">Order Details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {order.status === 'PAID' && !assignment && (
            <Button
              onClick={openAssignmentModal}
              variant="primary"
              size="sm"
              icon={faTruck}
            >
              Assign Order
            </Button>
          )}
          {assignment && (
            <>
              <Button
                onClick={openAssignmentModal}
                variant="secondary"
                size="sm"
                icon={faEdit}
              >
                Update Assignment
              </Button>
              <button
                onClick={handleRemoveAssignment}
                className="btn btn-secondary text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Remove Assignment
              </button>
            </>
          )}
          <button
            onClick={() => setStatusModalOpen(true)}
            className="btn btn-primary text-sm"
          >
            Update Status
          </button>
          <button
            onClick={handleDelete}
            className="btn btn-secondary text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Status Update Modal */}
      {statusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-sm p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Update Order Status</h3>
              <button
                onClick={() => {
                  setStatusModalOpen(false);
                  setSelectedStatus(order.status);
                  setRejectionReason('');
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
                  onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm text-gray-900 focus:outline-none focus:bg-white focus:border-[#0b66c2] focus:ring-1 focus:ring-[#0b66c2] text-sm"
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              {selectedStatus === 'REJECTED' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm text-gray-900 focus:outline-none focus:bg-white focus:border-[#0b66c2] focus:ring-1 focus:ring-[#0b66c2] text-sm"
                    rows={3}
                    placeholder="Enter rejection reason..."
                  />
                </div>
              )}
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => {
                    setStatusModalOpen(false);
                    setSelectedStatus(order.status);
                    setRejectionReason('');
                  }}
                  className="btn btn-secondary text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStatusUpdate}
                  disabled={!selectedStatus || selectedStatus === order.status || updatingStatus}
                  className="btn btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updatingStatus ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {assignmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-sm p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {assignment ? 'Update Assignment' : 'Assign Order'}
              </h3>
              <button
                onClick={() => {
                  setAssignmentModalOpen(false);
                  setAssignmentForm({ vehicle_id: '', driver_id: '' });
                }}
                className="p-1 hover:bg-gray-100 rounded-sm"
              >
                <Icon icon={faTimes} className="text-gray-500" size="sm" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vehicle <span className="text-red-500">*</span>
                </label>
                {loadingVehicles ? (
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm text-sm text-gray-500">
                    Loading vehicles...
                  </div>
                ) : (
                  <select
                    value={assignmentForm.vehicle_id}
                    onChange={(e) => {
                      setAssignmentForm({ ...assignmentForm, vehicle_id: e.target.value, driver_id: '' });
                    }}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm text-gray-900 focus:outline-none focus:bg-white focus:border-[#0b66c2] focus:ring-1 focus:ring-[#0b66c2] text-sm"
                    required
                    disabled={assigning}
                  >
                    <option value="">Select vehicle...</option>
                    {vehicles.map(vehicle => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.plate_number} - {vehicle.make} {vehicle.model} ({vehicle.vehicle_type?.replace(/_/g, ' ')})
                      </option>
                    ))}
                  </select>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Driver (Optional)
                </label>
                {loadingDrivers ? (
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm text-sm text-gray-500">
                    Loading drivers...
                  </div>
                ) : (
                  <select
                    value={assignmentForm.driver_id}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, driver_id: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm text-gray-900 focus:outline-none focus:bg-white focus:border-[#0b66c2] focus:ring-1 focus:ring-[#0b66c2] text-sm"
                    disabled={assigning || !assignmentForm.vehicle_id}
                  >
                    <option value="">Select driver (optional)...</option>
                    {getAvailableDrivers().map((driver: any) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.name} {driver.license_number ? `(${driver.license_number})` : ''}
                      </option>
                    ))}
                  </select>
                )}
                {assignmentForm.vehicle_id && getAvailableDrivers().length === 0 && (
                  <p className="mt-1 text-xs text-gray-500">No drivers assigned to this vehicle</p>
                )}
              </div>
              
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => {
                    setAssignmentModalOpen(false);
                    setAssignmentForm({ vehicle_id: '', driver_id: '' });
                  }}
                  className="btn btn-secondary text-sm"
                  disabled={assigning}
                >
                  Cancel
                </button>
                <button
                  onClick={assignment ? handleUpdateAssignment : handleAssignOrder}
                  disabled={assigning || !assignmentForm.vehicle_id}
                  className="btn btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {assigning ? 'Processing...' : (assignment ? 'Update' : 'Assign')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Status Card */}
        <div className="bg-white border border-gray-200 rounded-sm p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Status</h3>
          <StatusBadge status={order.status} />
        </div>

        {/* Total Price Card */}
        <div className="bg-white border border-gray-200 rounded-sm p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Price</h3>
          <p className="text-2xl font-bold text-gray-900">
            RWF {Number(order.total_price || 0).toLocaleString()}
          </p>
        </div>

        {/* Created Date Card */}
        <div className="bg-white border border-gray-200 rounded-sm p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Created</h3>
          <p className="text-sm text-gray-900">
            {new Date(order.created_at).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(order.created_at).toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pickup Details */}
          <div className="bg-white border border-gray-200 rounded-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Icon icon={faMapMarkerAlt} className="text-[#0b66c2]" />
              <h3 className="text-lg font-semibold text-gray-900">Pickup Details</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="text-sm font-medium text-gray-900">{order.pickup_address}</p>
              </div>
              {order.pickup_contact_name && (
                <div>
                  <p className="text-sm text-gray-500">Contact Name</p>
                  <p className="text-sm font-medium text-gray-900">{order.pickup_contact_name}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Contact Phone</p>
                <p className="text-sm font-medium text-gray-900">{order.pickup_contact_phone}</p>
              </div>
            </div>
          </div>

          {/* Delivery Details */}
          <div className="bg-white border border-gray-200 rounded-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Icon icon={faTruck} className="text-[#0b66c2]" />
              <h3 className="text-lg font-semibold text-gray-900">Delivery Details</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="text-sm font-medium text-gray-900">{order.delivery_address}</p>
              </div>
              {order.delivery_contact_name && (
                <div>
                  <p className="text-sm text-gray-500">Contact Name</p>
                  <p className="text-sm font-medium text-gray-900">{order.delivery_contact_name}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Contact Phone</p>
                <p className="text-sm font-medium text-gray-900">{order.delivery_contact_phone}</p>
              </div>
            </div>
          </div>

          {/* Item Details */}
          <div className="bg-white border border-gray-200 rounded-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Icon icon={faBox} className="text-[#0b66c2]" />
              <h3 className="text-lg font-semibold text-gray-900">Item Details</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Item Type</p>
                <p className="text-sm font-medium text-gray-900">{order.item_type?.replace(/_/g, ' ')}</p>
              </div>
              {order.item_description && (
                <div>
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="text-sm font-medium text-gray-900">{order.item_description}</p>
                </div>
              )}
              {order.weight_kg && (
                <div>
                  <p className="text-sm text-gray-500">Weight</p>
                  <p className="text-sm font-medium text-gray-900">{order.weight_kg} kg</p>
                </div>
              )}
              <div className="flex items-center gap-4">
                {order.is_fragile && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Fragile
                  </span>
                )}
                {order.is_insured && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Insured
                  </span>
                )}
              </div>
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
                <p className="text-sm font-medium text-gray-900">{order.customer?.name}</p>
              </div>
              {order.customer?.email && (
                <div className="flex items-center gap-2">
                  <Icon icon={faEnvelope} className="text-gray-400" size="xs" />
                  <p className="text-sm text-gray-600">{order.customer.email}</p>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Icon icon={faPhone} className="text-gray-400" size="xs" />
                <p className="text-sm text-gray-600">{order.customer?.phone}</p>
              </div>
            </div>
          </div>

          {/* Operator Info */}
          {order.operator && (
            <div className="bg-white border border-gray-200 rounded-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Icon icon={faTruck} className="text-[#0b66c2]" />
                <h3 className="text-lg font-semibold text-gray-900">Operator</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{order.operator.name}</p>
                  {order.operator.code && (
                    <p className="text-xs text-gray-500">{order.operator.code}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Pricing Breakdown */}
          <div className="bg-white border border-gray-200 rounded-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Icon icon={faDollarSign} className="text-[#0b66c2]" />
              <h3 className="text-lg font-semibold text-gray-900">Pricing</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Base Price</span>
                <span className="font-medium text-gray-900">RWF {Number(order.base_price || 0).toLocaleString()}</span>
              </div>
              {Number(order.surcharges || 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Surcharges</span>
                  <span className="font-medium text-gray-900">RWF {Number(order.surcharges || 0).toLocaleString()}</span>
                </div>
              )}
              {Number(order.insurance_fee || 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Insurance</span>
                  <span className="font-medium text-gray-900">RWF {Number(order.insurance_fee || 0).toLocaleString()}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="font-bold text-lg text-gray-900">RWF {Number(order.total_price || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Info */}
          <div className="bg-white border border-gray-200 rounded-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Icon icon={faClock} className="text-[#0b66c2]" />
              <h3 className="text-lg font-semibold text-gray-900">Order Info</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Delivery Mode</p>
                <p className="text-sm font-medium text-gray-900">{order.delivery_mode?.replace(/_/g, ' ')}</p>
              </div>
              {order.distance_km && (
                <div>
                  <p className="text-sm text-gray-500">Distance</p>
                  <p className="text-sm font-medium text-gray-900">{order.distance_km} km</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Last Updated</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(order.updated_at).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Assignment Info */}
          {assignment && (
            <div className="bg-white border border-gray-200 rounded-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Icon icon={faTruck} className="text-[#0b66c2]" />
                <h3 className="text-lg font-semibold text-gray-900">Assignment</h3>
              </div>
              <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Vehicle</p>
                <Link
                  href={`/dashboard/vehicles/${assignment.vehicle.id}`}
                  className="text-sm font-medium text-[#0b66c2] hover:text-[#09529a]"
                >
                  {assignment.vehicle.plate_number} - {assignment.vehicle.make} {assignment.vehicle.model}
                </Link>
              </div>
              {assignment.driver ? (
                <div>
                  <p className="text-sm text-gray-500">Driver</p>
                  <Link
                    href={`/dashboard/drivers/${assignment.driver.id}`}
                    className="text-sm font-medium text-[#0b66c2] hover:text-[#09529a]"
                  >
                    {assignment.driver.name}
                  </Link>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-500">Driver</p>
                  <p className="text-sm text-gray-400">Not assigned</p>
                </div>
              )}
                <div>
                  <p className="text-sm text-gray-500">Assigned At</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(assignment.assigned_at).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

