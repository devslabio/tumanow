'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { Container, Card, CardBody, CardHeader, PageHeader, Button, Badge } from '@/app/components';
import Icon, { faPlus, faBox, faMapMarkerAlt, faClock, faChevronRight } from '@/app/components/Icon';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loadUser } = useAuthStore();

  useEffect(() => {
    if (!user) {
      loadUser();
    }
  }, [user, loadUser]);

  // Mock orders data
  const orders = [
    {
      id: '1',
      orderNumber: 'ORD-123456',
      status: 'IN_TRANSIT',
      pickupAddress: '123 Main St, Kigali',
      deliveryAddress: '456 Market St, Kigali',
      createdAt: '2025-12-28',
      estimatedDelivery: '2025-12-29',
    },
    {
      id: '2',
      orderNumber: 'ORD-123457',
      status: 'DELIVERED',
      pickupAddress: '789 Park Ave, Kigali',
      deliveryAddress: '321 Center St, Kigali',
      createdAt: '2025-12-27',
      estimatedDelivery: '2025-12-28',
    },
  ];

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: 'default' | 'success' | 'warning' | 'error' | 'info'; label: string }> = {
      CREATED: { variant: 'info', label: 'Created' },
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
        title={`Welcome, ${user?.name || 'User'}`}
        subtitle="Manage your orders and track deliveries"
        actions={
          <Link href="/create-order">
            <Button icon={faPlus}>Create Order</Button>
          </Link>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <Icon icon={faBox} className="text-primary" size="lg" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">In Transit</p>
                <p className="text-2xl font-bold text-gray-900">
                  {orders.filter(o => o.status === 'IN_TRANSIT').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Icon icon={faClock} className="text-yellow-600" size="lg" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Delivered</p>
                <p className="text-2xl font-bold text-gray-900">
                  {orders.filter(o => o.status === 'DELIVERED').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Icon icon={faMapMarkerAlt} className="text-green-600" size="lg" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <h2 className="h2">Recent Orders</h2>
        </CardHeader>
        <CardBody>
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <Icon icon={faBox} className="text-gray-400 mx-auto mb-4" size="2x" />
              <p className="text-gray-600 mb-4">No orders yet</p>
              <Link href="/create-order">
                <Button icon={faPlus}>Create Your First Order</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="block p-4 border border-gray-200 rounded-lg hover:border-primary hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-gray-900">{order.orderNumber}</span>
                        {getStatusBadge(order.status)}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">From:</span> {order.pickupAddress}
                        </div>
                        <div>
                          <span className="font-medium">To:</span> {order.deliveryAddress}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Created: {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Icon icon={faChevronRight} className="text-gray-400 ml-4" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
      </Container>
    </div>
  );
}

