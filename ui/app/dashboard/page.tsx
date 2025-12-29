'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { DashboardAPI } from '@/lib/api';
import { StatCard, AreaChart, BarChart, DonutChart, LineChart } from '@/app/components';
import Icon, {
  faBox,
  faTruck,
  faUsers,
  faBuilding,
  faReceipt,
  faChartLine,
  faClock,
  faCheckCircle,
  faExclamationCircle,
  faIdCard as faCar,
} from '@/app/components/Icon';
import { DashboardSkeleton } from '@/app/components';

export default function DashboardPage() {
  const { user, loadUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      if (!user) {
        await loadUser();
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Calculate date range (current month by default)
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startDate = firstDayOfMonth.toISOString().split('T')[0];
        const endDate = now.toISOString().split('T')[0];

        const data = await DashboardAPI.get({
          start_date: startDate,
          end_date: endDate,
        });

        setDashboardData(data);
      } catch (err: any) {
        console.error('Dashboard load error:', err);
        setError(err?.response?.data?.message || 'Failed to load dashboard data');
        // Use empty data as fallback
        setDashboardData(null);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [user, loadUser]);

  // Get user role
  const userRole = user?.roles?.[0]?.code || user?.roles?.[0]?.name || 'CUSTOMER';
  const roleCode = typeof userRole === 'string' ? userRole.toUpperCase() : 'CUSTOMER';

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error && !dashboardData) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  // Use API data if available, otherwise use empty defaults
  const stats = dashboardData?.stats || {};
  const trends = dashboardData?.trends || {};

  // Transform API data to chart format
  const ordersByDay = trends.ordersByDay || [
    { x: 'Mon', y: 0 },
    { x: 'Tue', y: 0 },
    { x: 'Wed', y: 0 },
    { x: 'Thu', y: 0 },
    { x: 'Fri', y: 0 },
    { x: 'Sat', y: 0 },
    { x: 'Sun', y: 0 },
  ];

  const ordersByStatus = trends.ordersByStatus || [
    { label: 'Delivered', value: 0 },
    { label: 'In Transit', value: 0 },
    { label: 'Created', value: 0 },
  ];

  const revenueByMonth = trends.revenueByMonth || [
    { x: 'Jan', y: 0 },
    { x: 'Feb', y: 0 },
    { x: 'Mar', y: 0 },
    { x: 'Apr', y: 0 },
    { x: 'May', y: 0 },
    { x: 'Jun', y: 0 },
  ];

  const ordersByOperator = trends.ordersByOperator || [];

  // Render based on role
  if (roleCode === 'CUSTOMER') {
    return <CustomerDashboard stats={stats} ordersByDay={ordersByDay} />;
  }

  if (roleCode === 'SUPER_ADMIN' || roleCode === 'PLATFORM_SUPPORT') {
    return <SuperAdminDashboard stats={stats} ordersByDay={ordersByDay} ordersByStatus={ordersByStatus} revenueByMonth={revenueByMonth} ordersByOperator={ordersByOperator} />;
  }

  if (roleCode === 'OPERATOR_ADMIN') {
    return <OperatorAdminDashboard stats={stats} ordersByDay={ordersByDay} ordersByStatus={ordersByStatus} revenueByMonth={revenueByMonth} />;
  }

  if (roleCode === 'DISPATCHER') {
    return <DispatcherDashboard stats={stats} ordersByDay={ordersByDay} ordersByStatus={ordersByStatus} />;
  }

  if (roleCode === 'DRIVER') {
    return <DriverDashboard stats={stats} />;
  }

  return <CustomerDashboard stats={stats} ordersByDay={ordersByDay} />;
}

// Super Admin Dashboard
function SuperAdminDashboard({ stats, ordersByDay, ordersByStatus, revenueByMonth, ordersByOperator }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Platform Overview</h1>
        <p className="text-gray-600">Complete platform statistics and analytics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Orders"
          value={(stats.totalOrders || 0).toLocaleString()}
          icon={faBox}
          iconColor="#0b66c2"
          iconBgColor="#e6f0ff"
          href="/dashboard/orders"
        />
        <StatCard
          title="Total Operators"
          value={stats.totalOperators || 0}
          icon={faBuilding}
          iconColor="#0b66c2"
          iconBgColor="#e6f0ff"
          href="/dashboard/operators"
        />
        <StatCard
          title="Total Revenue"
          value={`RWF ${((stats.totalRevenue || 0) / 1000).toFixed(0)}K`}
          icon={faReceipt}
          iconColor="#0b66c2"
          iconBgColor="#e6f0ff"
          href="/dashboard/payments"
        />
        <StatCard
          title="Active Orders"
          value={stats.activeOrders || 0}
          icon={faClock}
          iconColor="#0b66c2"
          iconBgColor="#e6f0ff"
          href="/dashboard/orders?status=active"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-sm border border-gray-200 p-6 lg:col-span-2">
          <h3 className="font-semibold text-gray-900 mb-4">Orders Trend (Last 7 Days)</h3>
          <AreaChart data={ordersByDay} height={300} />
        </div>

        <div className="bg-white rounded-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Orders by Status</h3>
          <DonutChart data={ordersByStatus} height={300} />
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Revenue Trend (Last 6 Months)</h3>
          <LineChart data={revenueByMonth} height={300} />
        </div>

        {ordersByOperator.length > 0 && (
          <div className="bg-white rounded-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Orders by Operator</h3>
            <BarChart data={ordersByOperator} height={300} />
          </div>
        )}
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Vehicles"
          value={stats.totalVehicles || 0}
          icon={faCar}
          iconColor="#0b66c2"
          iconBgColor="#e6f0ff"
          href="/dashboard/vehicles"
        />
        <StatCard
          title="Total Drivers"
          value={stats.totalDrivers || 0}
          icon={faUsers}
          iconColor="#0b66c2"
          iconBgColor="#e6f0ff"
          href="/dashboard/drivers"
        />
        <StatCard
          title="Total Customers"
          value={stats.totalCustomers || 0}
          icon={faUsers}
          iconColor="#0b66c2"
          iconBgColor="#e6f0ff"
          href="/dashboard/users"
        />
      </div>
    </div>
  );
}

// Operator Admin Dashboard
function OperatorAdminDashboard({ stats, ordersByDay, ordersByStatus, revenueByMonth }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Operator Dashboard</h1>
        <p className="text-gray-600">Manage your operations and track performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Orders"
          value={(stats.totalOrders || 0).toLocaleString()}
          icon={faBox}
          iconColor="#0b66c2"
          iconBgColor="#e6f0ff"
          href="/dashboard/orders"
        />
        <StatCard
          title="Active Orders"
          value={stats.activeOrders || 0}
          icon={faClock}
          iconColor="#0b66c2"
          iconBgColor="#e6f0ff"
          href="/dashboard/orders?status=active"
        />
        <StatCard
          title="Completed"
          value={stats.completedOrders || 0}
          icon={faCheckCircle}
          iconColor="#0b66c2"
          iconBgColor="#e6f0ff"
          href="/dashboard/orders?status=completed"
        />
        <StatCard
          title="Revenue"
          value={`RWF ${((stats.totalRevenue || 0) / 1000).toFixed(0)}K`}
          icon={faReceipt}
          iconColor="#0b66c2"
          iconBgColor="#e6f0ff"
          href="/dashboard/payments"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Orders Trend</h3>
          <AreaChart data={ordersByDay} height={300} />
        </div>

        <div className="bg-white rounded-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Orders by Status</h3>
          <DonutChart data={ordersByStatus} height={300} />
        </div>
      </div>

      <div className="bg-white rounded-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Revenue Trend</h3>
        <LineChart data={revenueByMonth} height={300} />
      </div>
    </div>
  );
}

// Dispatcher Dashboard
function DispatcherDashboard({ stats, ordersByDay, ordersByStatus }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Dispatcher Dashboard</h1>
        <p className="text-gray-600">Manage order assignments and track deliveries</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Pending Assignment"
          value={stats.pendingOrders || 0}
          icon={faExclamationCircle}
          iconColor="#0b66c2"
          iconBgColor="#e6f0ff"
          href="/dashboard/orders?status=pending"
        />
        <StatCard
          title="In Transit"
          value={stats.inTransitOrders || 0}
          icon={faTruck}
          iconColor="#0b66c2"
          iconBgColor="#e6f0ff"
          href="/dashboard/orders?status=in_transit"
        />
        <StatCard
          title="Completed Today"
          value={stats.completedToday || 0}
          icon={faCheckCircle}
          iconColor="#0b66c2"
          iconBgColor="#e6f0ff"
          href="/dashboard/orders?status=completed"
        />
        <StatCard
          title="Total Active"
          value={stats.activeOrders || 0}
          icon={faBox}
          iconColor="#0b66c2"
          iconBgColor="#e6f0ff"
          href="/dashboard/orders?status=active"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Orders Trend</h3>
          <AreaChart data={ordersByDay} height={300} />
        </div>

        <div className="bg-white rounded-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Orders by Status</h3>
          <DonutChart data={ordersByStatus} height={300} />
        </div>
      </div>
    </div>
  );
}

// Driver Dashboard
function DriverDashboard({ stats }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Driver Dashboard</h1>
        <p className="text-gray-600">Track your deliveries and performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Deliveries"
          value={stats.todayDeliveries || 0}
          icon={faBox}
          iconColor="#0b66c2"
          iconBgColor="#e6f0ff"
          href="/dashboard/orders"
        />
        <StatCard
          title="Completed"
          value={stats.completed || 0}
          icon={faCheckCircle}
          iconColor="#0b66c2"
          iconBgColor="#e6f0ff"
          href="/dashboard/orders?status=completed"
        />
        <StatCard
          title="In Progress"
          value={stats.inProgress || 0}
          icon={faTruck}
          iconColor="#0b66c2"
          iconBgColor="#e6f0ff"
          href="/dashboard/orders?status=in_progress"
        />
        <StatCard
          title="Total This Month"
          value={stats.totalThisMonth || 0}
          icon={faChartLine}
          iconColor="#0b66c2"
          iconBgColor="#e6f0ff"
          href="/dashboard/orders"
        />
      </div>
    </div>
  );
}

// Customer Dashboard
function CustomerDashboard({ stats, ordersByDay }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">My Dashboard</h1>
        <p className="text-gray-600">Track your orders and deliveries</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Orders"
          value={stats.totalOrders || 0}
          icon={faBox}
          iconColor="#0b66c2"
          iconBgColor="#e6f0ff"
          href="/dashboard/orders"
        />
        <StatCard
          title="In Transit"
          value={stats.inTransitOrders || 0}
          icon={faTruck}
          iconColor="#0b66c2"
          iconBgColor="#e6f0ff"
          href="/dashboard/orders?status=in_transit"
        />
        <StatCard
          title="Delivered"
          value={stats.completedOrders || 0}
          icon={faCheckCircle}
          iconColor="#0b66c2"
          iconBgColor="#e6f0ff"
          href="/dashboard/orders?status=delivered"
        />
        <StatCard
          title="Pending"
          value={stats.pendingOrders || 0}
          icon={faClock}
          iconColor="#0b66c2"
          iconBgColor="#e6f0ff"
          href="/dashboard/orders?status=pending"
        />
      </div>

      {/* Chart */}
      <div className="bg-white rounded-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">My Orders Trend</h3>
        <AreaChart data={ordersByDay} height={300} />
      </div>
    </div>
  );
}
