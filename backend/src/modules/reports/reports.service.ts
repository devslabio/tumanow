import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportQueryDto, ReportType } from './dto/reports.dto';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { Prisma } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async generateReport(query: ReportQueryDto, userId: string, userOperatorId?: string | null, userRole?: string) {
    const { type, start_date, end_date, operator_id, order_status } = query;

    // Set default date range if not provided (last 30 days)
    const endDate = end_date ? new Date(end_date) : new Date();
    const startDate = start_date ? new Date(start_date) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Apply operator filter based on role
    let operatorFilter = operator_id;
    if (userOperatorId && userRole !== 'SUPER_ADMIN' && userRole !== 'PLATFORM_SUPPORT') {
      operatorFilter = userOperatorId;
    }

    switch (type) {
      case ReportType.ORDERS:
        return this.generateOrdersReport(startDate, endDate, operatorFilter, order_status);
      case ReportType.REVENUE:
        return this.generateRevenueReport(startDate, endDate, operatorFilter);
      case ReportType.PERFORMANCE:
        return this.generatePerformanceReport(startDate, endDate, operatorFilter);
      case ReportType.OPERATOR:
        return this.generateOperatorReport(startDate, endDate, operatorFilter);
      default:
        throw new BadRequestException('Invalid report type');
    }
  }

  private async generateOrdersReport(startDate: Date, endDate: Date, operatorId?: string, orderStatus?: string) {
    const where: any = {
      created_at: {
        gte: startDate,
        lte: endDate,
      },
      deleted_at: null,
    };

    if (operatorId) {
      where.operator_id = operatorId;
    }

    if (orderStatus) {
      where.status = orderStatus;
    }

    const [orders, totalOrders, ordersByStatus, ordersByDay] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          operator: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        take: 1000, // Limit for performance
      }),
      this.prisma.order.count({ where }),
      this.prisma.order.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      operatorId
        ? this.prisma.$queryRaw(Prisma.sql`
            SELECT 
              DATE(created_at) as date,
              COUNT(*)::int as count
            FROM orders
            WHERE created_at >= ${startDate}::timestamp
              AND created_at <= ${endDate}::timestamp
              AND deleted_at IS NULL
              AND operator_id = ${operatorId}::uuid
            GROUP BY DATE(created_at)
            ORDER BY date ASC
          `)
        : this.prisma.$queryRaw(Prisma.sql`
            SELECT 
              DATE(created_at) as date,
              COUNT(*)::int as count
            FROM orders
            WHERE created_at >= ${startDate}::timestamp
              AND created_at <= ${endDate}::timestamp
              AND deleted_at IS NULL
            GROUP BY DATE(created_at)
            ORDER BY date ASC
          `),
    ]);

    const statusBreakdown = ordersByStatus.map((item) => ({
      status: item.status,
      count: item._count,
    }));

    return {
      type: 'ORDERS',
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      summary: {
        total_orders: totalOrders,
        status_breakdown: statusBreakdown,
      },
      daily_trend: ordersByDay,
      orders: orders.slice(0, 100), // Return first 100 for preview
      total_records: orders.length,
    };
  }

  private async generateRevenueReport(startDate: Date, endDate: Date, operatorId?: string) {
    const where: any = {
      created_at: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (operatorId) {
      where.operator_id = operatorId;
    }

    const [payments, revenueByStatus, revenueByMethod, revenueByMonth] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              order_number: true,
            },
          },
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        take: 1000,
      }),
      this.prisma.payment.groupBy({
        by: ['status'],
        where,
        _sum: {
          amount: true,
        },
        _count: true,
      }),
      this.prisma.payment.groupBy({
        by: ['method'],
        where: {
          ...where,
          status: PaymentStatus.COMPLETED,
        },
        _sum: {
          amount: true,
        },
        _count: true,
      }),
      operatorId
        ? this.prisma.$queryRaw(Prisma.sql`
            SELECT 
              DATE_TRUNC('month', created_at) as month,
              SUM(amount)::decimal as total,
              COUNT(*)::int as count
            FROM payments
            WHERE created_at >= ${startDate}::timestamp
              AND created_at <= ${endDate}::timestamp
              AND status = 'COMPLETED'
              AND operator_id = ${operatorId}::uuid
            GROUP BY DATE_TRUNC('month', created_at)
            ORDER BY month ASC
          `)
        : this.prisma.$queryRaw(Prisma.sql`
            SELECT 
              DATE_TRUNC('month', created_at) as month,
              SUM(amount)::decimal as total,
              COUNT(*)::int as count
            FROM payments
            WHERE created_at >= ${startDate}::timestamp
              AND created_at <= ${endDate}::timestamp
              AND status = 'COMPLETED'
            GROUP BY DATE_TRUNC('month', created_at)
            ORDER BY month ASC
          `),
    ]);

    const totalRevenue = payments
      .filter((p) => p.status === PaymentStatus.COMPLETED)
      .reduce((sum, p) => sum.plus(p.amount), new Decimal(0));

    const statusBreakdown = revenueByStatus.map((item) => ({
      status: item.status,
      total: item._sum.amount || 0,
      count: item._count,
    }));

    const methodBreakdown = revenueByMethod.map((item) => ({
      method: item.method,
      total: item._sum.amount || 0,
      count: item._count,
    }));

    return {
      type: 'REVENUE',
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      summary: {
        total_revenue: totalRevenue.toString(),
        total_payments: payments.length,
        completed_payments: payments.filter((p) => p.status === PaymentStatus.COMPLETED).length,
        status_breakdown: statusBreakdown,
        method_breakdown: methodBreakdown,
      },
      monthly_trend: revenueByMonth,
      payments: payments.slice(0, 100),
      total_records: payments.length,
    };
  }

  private async generatePerformanceReport(startDate: Date, endDate: Date, operatorId?: string) {
    const orderWhere: any = {
      created_at: {
        gte: startDate,
        lte: endDate,
      },
      deleted_at: null,
    };

    if (operatorId) {
      orderWhere.operator_id = operatorId;
    }

    const [orders, assignments, deliveries] = await Promise.all([
      this.prisma.order.findMany({
        where: orderWhere,
        select: {
          id: true,
          status: true,
          created_at: true,
          updated_at: true,
        },
      }),
      this.prisma.orderAssignment.findMany({
        where: {
          assigned_at: {
            gte: startDate,
            lte: endDate,
          },
          order: operatorId ? { operator_id: operatorId } : undefined,
        },
        include: {
          order: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.order.findMany({
        where: {
          ...orderWhere,
          status: OrderStatus.DELIVERED,
        },
        select: {
          id: true,
          created_at: true,
          updated_at: true,
        },
      }),
    ]);

    // Calculate average delivery time
    const deliveryTimes = deliveries.map((order) => {
      const created = new Date(order.created_at).getTime();
      const delivered = new Date(order.updated_at).getTime();
      return (delivered - created) / (1000 * 60 * 60); // Hours
    });

    const avgDeliveryTime = deliveryTimes.length > 0
      ? deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length
      : 0;

    // Calculate assignment rate
    const assignmentRate = orders.length > 0
      ? (assignments.length / orders.filter((o) => o.status !== OrderStatus.CANCELLED && o.status !== OrderStatus.REJECTED).length) * 100
      : 0;

    // Calculate completion rate
    const completionRate = orders.length > 0
      ? (deliveries.length / orders.filter((o) => o.status !== OrderStatus.CANCELLED && o.status !== OrderStatus.REJECTED).length) * 100
      : 0;

    return {
      type: 'PERFORMANCE',
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      metrics: {
        total_orders: orders.length,
        assigned_orders: assignments.length,
        delivered_orders: deliveries.length,
        cancelled_orders: orders.filter((o) => o.status === OrderStatus.CANCELLED).length,
        assignment_rate: Number(assignmentRate.toFixed(2)),
        completion_rate: Number(completionRate.toFixed(2)),
        average_delivery_time_hours: Number(avgDeliveryTime.toFixed(2)),
      },
      status_distribution: orders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  private async generateOperatorReport(startDate: Date, endDate: Date, operatorId?: string) {
    const where: any = {
      created_at: {
        gte: startDate,
        lte: endDate,
      },
      deleted_at: null,
    };

    if (operatorId) {
      where.operator_id = operatorId;
    }

    const [operators, operatorStats] = await Promise.all([
      operatorId
        ? this.prisma.operator.findMany({
            where: { id: operatorId },
            include: {
              _count: {
                select: {
                  users: true,
                  vehicles: true,
                  drivers: true,
                  orders: true,
                },
              },
            },
          })
        : this.prisma.operator.findMany({
            include: {
              _count: {
                select: {
                  users: true,
                  vehicles: true,
                  drivers: true,
                  orders: true,
                },
              },
            },
          }),
      operatorId
        ? this.prisma.$queryRaw(Prisma.sql`
            SELECT 
              o.id,
              o.name,
              o.code,
              COUNT(DISTINCT ord.id)::int as total_orders,
              COUNT(DISTINCT CASE WHEN ord.status = 'DELIVERED' THEN ord.id END)::int as delivered_orders,
              SUM(CASE WHEN p.status = 'COMPLETED' THEN p.amount ELSE 0 END)::decimal as total_revenue,
              COUNT(DISTINCT v.id)::int as total_vehicles,
              COUNT(DISTINCT d.id)::int as total_drivers
            FROM operators o
            LEFT JOIN orders ord ON ord.operator_id = o.id 
              AND ord.created_at >= ${startDate}::timestamp
              AND ord.created_at <= ${endDate}::timestamp
              AND ord.deleted_at IS NULL
            LEFT JOIN payments p ON p.order_id = ord.id
            LEFT JOIN vehicles v ON v.operator_id = o.id AND v.deleted_at IS NULL
            LEFT JOIN drivers d ON d.operator_id = o.id AND d.deleted_at IS NULL
            WHERE o.id = ${operatorId}::uuid
            GROUP BY o.id, o.name, o.code
            ORDER BY total_orders DESC
          `)
        : this.prisma.$queryRaw(Prisma.sql`
            SELECT 
              o.id,
              o.name,
              o.code,
              COUNT(DISTINCT ord.id)::int as total_orders,
              COUNT(DISTINCT CASE WHEN ord.status = 'DELIVERED' THEN ord.id END)::int as delivered_orders,
              SUM(CASE WHEN p.status = 'COMPLETED' THEN p.amount ELSE 0 END)::decimal as total_revenue,
              COUNT(DISTINCT v.id)::int as total_vehicles,
              COUNT(DISTINCT d.id)::int as total_drivers
            FROM operators o
            LEFT JOIN orders ord ON ord.operator_id = o.id 
              AND ord.created_at >= ${startDate}::timestamp
              AND ord.created_at <= ${endDate}::timestamp
              AND ord.deleted_at IS NULL
            LEFT JOIN payments p ON p.order_id = ord.id
            LEFT JOIN vehicles v ON v.operator_id = o.id AND v.deleted_at IS NULL
            LEFT JOIN drivers d ON d.operator_id = o.id AND d.deleted_at IS NULL
            GROUP BY o.id, o.name, o.code
            ORDER BY total_orders DESC
          `),
    ]);

    return {
      type: 'OPERATOR',
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      operators: operators,
      statistics: operatorStats,
    };
  }
}

