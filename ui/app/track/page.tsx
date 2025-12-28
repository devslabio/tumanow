'use client';

import { useState } from 'react';
import { Button, Input, Card, CardBody, Container, PageHeader, Badge, LoadingSpinner } from '@/app/components';
import Icon, { faSearch, faMapMarkerAlt, faClock, faCheckCircle } from '@/app/components/Icon';

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) return;

    setLoading(true);
    // TODO: Implement order tracking API call
    setTimeout(() => {
      setOrder({
        orderNumber: orderNumber,
        status: 'IN_TRANSIT',
        pickupAddress: '123 Main St, Kigali',
        deliveryAddress: '456 Market St, Kigali',
        estimatedDelivery: '2025-12-29 14:00',
        trackingEvents: [
          { status: 'CREATED', timestamp: '2025-12-28 10:00', location: 'Kigali' },
          { status: 'PICKED_UP', timestamp: '2025-12-28 11:30', location: 'Kigali' },
          { status: 'IN_TRANSIT', timestamp: '2025-12-28 13:00', location: 'In Transit' },
        ],
      });
      setLoading(false);
    }, 1000);
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
    <Container maxWidth="lg" className="py-8">
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
                  <h3 className="h3">Order #{order.orderNumber}</h3>
                  <p className="text-sm text-gray-600 mt-1">Created on {new Date().toLocaleDateString()}</p>
                </div>
                {getStatusBadge(order.status)}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <div className="flex items-start gap-3 mb-2">
                    <Icon icon={faMapMarkerAlt} className="text-primary mt-1" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Pickup Address</p>
                      <p className="text-sm text-gray-600">{order.pickupAddress}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex items-start gap-3 mb-2">
                    <Icon icon={faMapMarkerAlt} className="text-green-600 mt-1" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Delivery Address</p>
                      <p className="text-sm text-gray-600">{order.deliveryAddress}</p>
                    </div>
                  </div>
                </div>
              </div>

              {order.estimatedDelivery && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Icon icon={faClock} className="text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">
                      Estimated Delivery: {order.estimatedDelivery}
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
              <div className="space-y-4">
                {order.trackingEvents?.map((event: any, index: number) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${
                        index === order.trackingEvents.length - 1 ? 'bg-primary' : 'bg-gray-300'
                      }`} />
                      {index < order.trackingEvents.length - 1 && (
                        <div className="w-0.5 h-12 bg-gray-300 mt-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900">{event.status.replace('_', ' ')}</p>
                        <p className="text-sm text-gray-500">{event.timestamp}</p>
                      </div>
                      {event.location && (
                        <p className="text-sm text-gray-600 mt-1">{event.location}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </Container>
  );
}

