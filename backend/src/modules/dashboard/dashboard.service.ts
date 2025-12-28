import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DashboardQueryDto } from './dto/dashboard.dto';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getUserWithRoles(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        operator_id: true,
        user_roles: {
          include: {
            role: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  async getDashboardStats(userId: string, userRole: string, operatorId: string | null, query: DashboardQueryDto) {
    const startDate = query.start_date ? new Date(query.start_date) : new Date(new Date().setDate(1)); // First day of current month
    const endDate = query.end_date ? new Date(query.end_date) : new Date();

    // Base where clause based on role and operator
    const baseWhere: any = {
      created_at: {
        gte: startDate,
        lte: endDate,
      },
    };

    // Add operator filter if user belongs to an operator
    if (operatorId) {
      baseWhere.operator_id = operatorId;
    }

    // Role-specific stats
    if (userRole === 'SUPER_ADMIN' || userRole === 'PLATFORM_SUPPORT') {
      return this.getPlatformStats(baseWhere, startDate, endDate);
    }

    if (userRole === 'OPERATOR_ADMIN') {
      return this.getOperatorStats(operatorId, baseWhere, startDate, endDate);
    }

    if (userRole === 'DISPATCHER') {
      return this.getDispatcherStats(operatorId, baseWhere, startDate, endDate);
    }

    if (userRole === 'DRIVER') {
      return this.getDriverStats(userId, baseWhere, startDate, endDate);
    }

    if (userRole === 'CUSTOMER') {
      return this.getCustomerStats(userId, baseWhere, startDate, endDate);
    }

    return this.getCustomerStats(userId, baseWhere, startDate, endDate);
  }

  private async getPlatformStats(where: any, startDate: Date, endDate: Date) {
    const [
      totalOrders,
      activeOrders,
      completedOrders,
      totalOperators,
      totalVehicles,
      totalDrivers,
      totalCustomers,
      ordersByDay,
      ordersByStatus,
      revenueByMonth,
      ordersByOperator,
    ] = await Promise.all([
      // Total orders
      this.prisma.order.count({
        where: { deleted_at: null },
      }),
      // Active orders (IN_TRANSIT, CREATED, ASSIGNED)
      this.prisma.order.count({
        where: {
          deleted_at: null,
          status: { in: ['IN_TRANSIT', 'CREATED', 'ASSIGNED'] },
        },
      }),
      // Completed orders
      this.prisma.order.count({
        where: {
          deleted_at: null,
          status: 'DELIVERED',
        },
      }),
      // Total operators
      this.prisma.operator.count({
        where: { deleted_at: null, status: 'ACTIVE' },
      }),
      // Total vehicles
      this.prisma.vehicle.count({
        where: { deleted_at: null },
      }),
      // Total drivers
      this.prisma.driver.count({
        where: { deleted_at: null, status: 'AVAILABLE' },
      }),
      // Total customers
      this.prisma.user.count({
        where: { deleted_at: null, is_customer: true, status: 'ACTIVE' },
      }),
      // Orders by day (last 7 days)
      this.getOrdersByDay(startDate, endDate),
      // Orders by status
      this.getOrdersByStatus(),
      // Revenue by month (last 6 months)
      this.getRevenueByMonth(),
      // Orders by operator
      this.getOrdersByOperator(),
    ]);

    // Calculate total revenue
    const payments = await this.prisma.payment.findMany({
      where: {
        status: 'COMPLETED',
        created_at: { gte: startDate, lte: endDate },
      },
      select: { amount: true },
    });
    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

    return {
      stats: {
        totalOrders,
        activeOrders,
        completedOrders,
        totalOperators,
        totalVehicles,
        totalDrivers,
        totalCustomers,
        totalRevenue,
      },
      trends: {
        ordersByDay,
        ordersByStatus,
        revenueByMonth,
        ordersByOperator,
      },
    };
  }

  private async getOperatorStats(operatorId: string | null, where: any, startDate: Date, endDate: Date) {
    if (!operatorId) {
      throw new Error('Operator ID is required for operator admin');
    }

    const operatorWhere = { ...where, operator_id: operatorId, deleted_at: null };

    const [
      totalOrders,
      activeOrders,
      completedOrders,
      ordersByDay,
      ordersByStatus,
      revenueByMonth,
    ] = await Promise.all([
      this.prisma.order.count({ where: operatorWhere }),
      this.prisma.order.count({
        where: {
          ...operatorWhere,
          status: { in: ['IN_TRANSIT', 'CREATED', 'ASSIGNED'] },
        },
      }),
      this.prisma.order.count({
        where: { ...operatorWhere, status: 'DELIVERED' },
      }),
      this.getOrdersByDay(startDate, endDate, operatorId),
      this.getOrdersByStatus(operatorId),
      this.getRevenueByMonth(operatorId),
    ]);

    const payments = await this.prisma.payment.findMany({
      where: {
        operator_id: operatorId,
        status: 'COMPLETED',
        created_at: { gte: startDate, lte: endDate },
      },
      select: { amount: true },
    });
    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

    return {
      stats: {
        totalOrders,
        activeOrders,
        completedOrders,
        totalRevenue,
      },
      trends: {
        ordersByDay,
        ordersByStatus,
        revenueByMonth,
      },
    };
  }

  private async getDispatcherStats(operatorId: string | null, where: any, startDate: Date, endDate: Date) {
    if (!operatorId) {
      throw new Error('Operator ID is required for dispatcher');
    }

    const operatorWhere = { ...where, operator_id: operatorId, deleted_at: null };

    const [
      pendingOrders,
      inTransitOrders,
      completedToday,
      activeOrders,
      ordersByDay,
      ordersByStatus,
    ] = await Promise.all([
      this.prisma.order.count({
        where: { ...operatorWhere, status: 'CREATED' },
      }),
      this.prisma.order.count({
        where: { ...operatorWhere, status: 'IN_TRANSIT' },
      }),
      this.prisma.order.count({
        where: {
          ...operatorWhere,
          status: 'DELIVERED',
          updated_at: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      this.prisma.order.count({
        where: {
          ...operatorWhere,
          status: { in: ['IN_TRANSIT', 'CREATED', 'ASSIGNED'] },
        },
      }),
      this.getOrdersByDay(startDate, endDate, operatorId),
      this.getOrdersByStatus(operatorId),
    ]);

    return {
      stats: {
        pendingOrders,
        inTransitOrders,
        completedToday,
        activeOrders,
      },
      trends: {
        ordersByDay,
        ordersByStatus,
      },
    };
  }

  private async getDriverStats(userId: string, where: any, startDate: Date, endDate: Date) {
    // Get driver's vehicle assignments
    const driver = await this.prisma.driver.findFirst({
      where: { user_id: userId, deleted_at: null },
      include: { vehicle_drivers: { include: { vehicle: true } } },
    });

    if (!driver) {
      return {
        stats: { todayDeliveries: 0, completed: 0, inProgress: 0, totalThisMonth: 0 },
      };
    }

    const vehicleIds = driver.vehicle_drivers.map((vd) => vd.vehicle_id);
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));

    const [
      todayDeliveries,
      completed,
      inProgress,
      totalThisMonth,
    ] = await Promise.all([
      this.prisma.order.count({
        where: {
          ...where,
          vehicle_id: { in: vehicleIds },
          created_at: { gte: todayStart },
        },
      }),
      this.prisma.order.count({
        where: {
          ...where,
          vehicle_id: { in: vehicleIds },
          status: 'DELIVERED',
          updated_at: { gte: todayStart },
        },
      }),
      this.prisma.order.count({
        where: {
          ...where,
          vehicle_id: { in: vehicleIds },
          status: { in: ['IN_TRANSIT', 'ASSIGNED'] },
        },
      }),
      this.prisma.order.count({
        where: {
          ...where,
          vehicle_id: { in: vehicleIds },
        },
      }),
    ]);

    return {
      stats: {
        todayDeliveries,
        completed,
        inProgress,
        totalThisMonth,
      },
    };
  }

  private async getCustomerStats(userId: string, where: any, startDate: Date, endDate: Date) {
    const customerWhere = { ...where, customer_id: userId, deleted_at: null };

    const [
      totalOrders,
      inTransitOrders,
      completedOrders,
      pendingOrders,
      ordersByDay,
    ] = await Promise.all([
      this.prisma.order.count({ where: customerWhere }),
      this.prisma.order.count({
        where: { ...customerWhere, status: 'IN_TRANSIT' },
      }),
      this.prisma.order.count({
        where: { ...customerWhere, status: 'DELIVERED' },
      }),
      this.prisma.order.count({
        where: { ...customerWhere, status: 'CREATED' },
      }),
      this.getOrdersByDay(startDate, endDate, null, userId),
    ]);

    return {
      stats: {
        totalOrders,
        inTransitOrders,
        completedOrders,
        pendingOrders,
      },
      trends: {
        ordersByDay,
      },
    };
  }

  private async getOrdersByDay(startDate: Date, endDate: Date, operatorId?: string | null, customerId?: string | null) {
    const where: any = {
      created_at: { gte: startDate, lte: endDate },
      deleted_at: null,
    };
    if (operatorId) where.operator_id = operatorId;
    if (customerId) where.customer_id = customerId;

    const orders = await this.prisma.order.findMany({
      where,
      select: { created_at: true },
    });

    // Group by day
    const grouped: Record<string, number> = {};
    orders.forEach((order) => {
      const date = new Date(order.created_at).toISOString().split('T')[0];
      grouped[date] = (grouped[date] || 0) + 1;
    });

    // Get last 7 days
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      days.push({
        x: dayName,
        y: grouped[dateStr] || 0,
      });
    }

    return days;
  }

  private async getOrdersByStatus(operatorId?: string | null) {
    const where: any = { deleted_at: null };
    if (operatorId) where.operator_id = operatorId;

    const statusCounts = await this.prisma.order.groupBy({
      by: ['status'],
      where,
      _count: { status: true },
    });

    return statusCounts.map((sc) => ({
      label: sc.status,
      value: sc._count.status,
    }));
  }

  private async getRevenueByMonth(operatorId?: string | null) {
    const where: any = {
      status: 'COMPLETED',
    };
    if (operatorId) where.operator_id = operatorId;

    const payments = await this.prisma.payment.findMany({
      where,
      select: { amount: true, created_at: true },
    });

    // Group by month (last 6 months)
    const grouped: Record<string, number> = {};
    payments.forEach((payment) => {
      const date = new Date(payment.created_at);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
      grouped[monthKey] = (grouped[monthKey] || 0) + Number(payment.amount || 0);
    });

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((month) => ({
      x: month,
      y: grouped[month] || 0,
    }));
  }

  private async getOrdersByOperator() {
    const operatorCounts = await this.prisma.order.groupBy({
      by: ['operator_id'],
      where: { deleted_at: null },
      _count: { operator_id: true },
    });

    const operators = await this.prisma.operator.findMany({
      where: { id: { in: operatorCounts.map((oc) => oc.operator_id).filter(Boolean) as string[] } },
      select: { id: true, name: true },
    });

    return operatorCounts
      .map((oc) => {
        const operator = operators.find((o) => o.id === oc.operator_id);
        return {
          x: operator?.name || 'Unknown',
          y: oc._count.operator_id,
        };
      })
      .slice(0, 5); // Top 5
  }
}

