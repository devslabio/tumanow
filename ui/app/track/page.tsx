'use client';

import { useState } from 'react';
import { Button, Input, Card, CardBody, Container, PageHeader, Badge, LoadingSpinner } from '@/app/components';
import Icon, { faSearch, faMapMarkerAlt, faClock, faCheckCircle, faTruck, faUser } from '@/app/components/Icon';
import { TrackingEventsAPI } from '@/lib/api';
import { toast } from '@/app/components/Toaster';
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001/api';

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [trackingEvents, setTrackingEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) {
      toast.error('Please enter an order number');
      return;
    }

    setLoading(true);
    setOrder(null);
    setTrackingEvents([]);
    try {
      // Public endpoint - no auth required
      const response = await axios.get(`${API_BASE}/orders/track/${encodeURIComponent(orderNumber.trim())}`);
      const orderData = response.data;
      setOrder(orderData);

      // Fetch tracking events if order found
      if (orderData.id) {
        setLoadingEvents(true);
        try {
          // For public tracking, we'll need to make this endpoint public too
          // For now, we'll show what we have from the order
          const eventsResponse = await axios.get(`${API_BASE}/tracking-events/order/${orderData.id}`);
          setTrackingEvents(eventsResponse.data || []);
        } catch (err: any) {
          // If tracking events fail (might require auth), just continue without them
          console.error('Failed to fetch tracking events:', err);
        } finally {
          setLoadingEvents(false);
        }
      }
    } catch (error: any) {
      console.error('Failed to track order:', error);
      if (error?.response?.status === 404) {
        toast.error('Order not found. Please check your order number.');
      } else {
        toast.error('Failed to track order. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: 'default' | 'success' | 'warning' | 'error' | 'info'; label: string }> = {
      CREATED: { variant: 'info', label: 'Created' },
      PICKED_UP: { variant: 'info', label: 'Picked Up' },
      IN_TRANSIT: { variant: 'warning', label: 'In Transit' },
      DELIVERED: { variant: 'success', label: 'Delivered' },
      COMPLETED: { variant: 'success', label: 'Completed' },
    };
    const statusInfo = statusMap[status] || { variant: 'default' as const, label: status };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Container maxWidth="xl" className="py-8">
      <PageHeader
        title="Track Your Order"
        subtitle="Enter your order number to track the status of your delivery"
      />

      <Card className="mb-6">
        <CardBody>
          <form onSubmit={handleTrack} className="flex gap-4">
            <Input
              placeholder="Enter order number (e.g., ORD-123456)"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              className="flex-1"
              icon={faSearch}
            />
            <Button type="submit" icon={faSearch} loading={loading}>
              Track
            </Button>
          </form>
        </CardBody>
      </Card>

      {loading && (
        <Card>
          <CardBody>
            <LoadingSpinner text="Tracking order..." />
          </CardBody>
        </Card>
      )}

      {order && !loading && (
        <div className="space-y-6">
          {/* Order Status Card */}
          <Card>
            <CardBody>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="h3">Order #{order.order_number}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Created on {new Date(order.created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                {getStatusBadge(order.status)}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <div className="flex items-start gap-3 mb-2">
                    <Icon icon={faMapMarkerAlt} className="text-primary mt-1" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Pickup Address</p>
                      <p className="text-sm text-gray-600">{order.pickup_address}</p>
                      {order.pickup_contact_phone && (
                        <p className="text-xs text-gray-500 mt-1">Phone: {order.pickup_contact_phone}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex items-start gap-3 mb-2">
                    <Icon icon={faMapMarkerAlt} className="text-green-600 mt-1" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Delivery Address</p>
                      <p className="text-sm text-gray-600">{order.delivery_address}</p>
                      {order.delivery_contact_phone && (
                        <p className="text-xs text-gray-500 mt-1">Phone: {order.delivery_contact_phone}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Assignment Info */}
              {order.order_assignments && order.order_assignments.length > 0 && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Assigned To</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {order.order_assignments[0].vehicle && (
                      <div className="flex items-center gap-2">
                        <Icon icon={faTruck} className="text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {order.order_assignments[0].vehicle.plate_number}
                          </p>
                          <p className="text-xs text-gray-500">
                            {order.order_assignments[0].vehicle.make} {order.order_assignments[0].vehicle.model}
                          </p>
                        </div>
                      </div>
                    )}
                    {order.order_assignments[0].driver && (
                      <div className="flex items-center gap-2">
                        <Icon icon={faUser} className="text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {order.order_assignments[0].driver.name}
                          </p>
                          {order.order_assignments[0].driver.phone && (
                            <p className="text-xs text-gray-500">{order.order_assignments[0].driver.phone}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {order.scheduled_delivery_time && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Icon icon={faClock} className="text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">
                      Scheduled Delivery: {new Date(order.scheduled_delivery_time).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Tracking Timeline */}
          <Card>
            <CardBody>
              <h3 className="h3 mb-6">Tracking History</h3>
              {loadingEvents ? (
                <div className="py-8 text-center">
                  <LoadingSpinner text="Loading tracking events..." />
                </div>
              ) : trackingEvents.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  <p className="text-sm">No tracking events yet</p>
                  <p className="text-xs mt-2">Tracking information will appear here as your order progresses</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {trackingEvents.map((event: any, index: number) => (
                    <div key={event.id || index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${
                          index === trackingEvents.length - 1 ? 'bg-primary' : 'bg-gray-300'
                        }`} />
                        {index < trackingEvents.length - 1 && (
                          <div className="w-0.5 h-12 bg-gray-300 mt-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900">{event.status.replace(/_/g, ' ')}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(event.created_at).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        {event.notes && (
                          <p className="text-sm text-gray-600 mt-1">{event.notes}</p>
                        )}
                        {event.location_lat && event.location_lng && (
                          <p className="text-xs text-gray-500 mt-1">
                            📍 Location: {Number(event.location_lat).toFixed(4)}, {Number(event.location_lng).toFixed(4)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}
      </Container>
    </div>
  );
}

