import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto, UpdateOrderStatusDto, QueryOrdersDto } from './dto/orders.dto';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(createOrderDto: CreateOrderDto, userId: string, userOperatorId?: string | null) {
    // If user has operator_id, use it; otherwise use the provided operator_id
    const operatorId = userOperatorId || createOrderDto.operator_id;

    // Generate order number
    const orderNumber = await this.generateOrderNumber();

    // Create order
    const order = await this.prisma.order.create({
      data: {
        operator_id: operatorId,
        customer_id: createOrderDto.customer_id,
        order_number: orderNumber,
        status: OrderStatus.CREATED,
        pickup_address: createOrderDto.pickup_address,
        pickup_lat: createOrderDto.pickup_lat?.toString(),
        pickup_lng: createOrderDto.pickup_lng?.toString(),
        pickup_contact_name: createOrderDto.pickup_contact_name,
        pickup_contact_phone: createOrderDto.pickup_contact_phone,
        delivery_address: createOrderDto.delivery_address,
        delivery_lat: createOrderDto.delivery_lat?.toString(),
        delivery_lng: createOrderDto.delivery_lng?.toString(),
        delivery_contact_name: createOrderDto.delivery_contact_name,
        delivery_contact_phone: createOrderDto.delivery_contact_phone,
        item_type: createOrderDto.item_type,
        item_description: createOrderDto.item_description,
        weight_kg: createOrderDto.weight_kg?.toString(),
        dimensions_cm: createOrderDto.dimensions_cm,
        declared_value: createOrderDto.declared_value?.toString(),
        is_fragile: createOrderDto.is_fragile || false,
        is_insured: createOrderDto.is_insured || false,
        delivery_mode: createOrderDto.delivery_mode,
        scheduled_pickup_time: createOrderDto.scheduled_pickup_time ? new Date(createOrderDto.scheduled_pickup_time) : null,
        scheduled_delivery_time: createOrderDto.scheduled_delivery_time ? new Date(createOrderDto.scheduled_delivery_time) : null,
        base_price: createOrderDto.base_price.toString(),
        distance_km: createOrderDto.distance_km?.toString(),
        surcharges: (createOrderDto.surcharges || 0).toString(),
        insurance_fee: (createOrderDto.insurance_fee || 0).toString(),
        total_price: createOrderDto.total_price.toString(),
      },
      include: {
        operator: {
          select: { id: true, name: true, code: true },
        },
        customer: {
          select: { id: true, name: true, phone: true, email: true },
        },
      },
    });

    return order;
  }

  async findAll(query: QueryOrdersDto, userId: string, userOperatorId?: string | null, userRole?: string) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      deleted_at: null,
    };

    // Apply filters based on user role
    if (userRole === 'CUSTOMER') {
      where.customer_id = userId;
    } else if (userOperatorId && userRole !== 'SUPER_ADMIN' && userRole !== 'PLATFORM_SUPPORT') {
      where.operator_id = userOperatorId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.operator_id) {
      where.operator_id = query.operator_id;
    }

    if (query.customer_id) {
      where.customer_id = query.customer_id;
    }

    if (query.search) {
      where.OR = [
        { order_number: { contains: query.search, mode: 'insensitive' } },
        { pickup_address: { contains: query.search, mode: 'insensitive' } },
        { delivery_address: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          operator: {
            select: { id: true, name: true, code: true },
          },
          customer: {
            select: { id: true, name: true, phone: true, email: true },
          },
          order_assignments: {
            include: {
              vehicle: {
                select: { id: true, plate_number: true, make: true, model: true },
              },
            },
          },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByOrderNumber(orderNumber: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        order_number: orderNumber,
        deleted_at: null,
      },
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
        order_assignments: {
          include: {
            vehicle: {
              select: {
                id: true,
                plate_number: true,
                make: true,
                model: true,
              },
            },
          },
          take: 1,
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async findOne(id: string, userId: string, userOperatorId?: string | null, userRole?: string) {
    const where: any = { id, deleted_at: null };

    // Apply role-based access
    if (userRole === 'CUSTOMER') {
      where.customer_id = userId;
    } else if (userOperatorId && userRole !== 'SUPER_ADMIN' && userRole !== 'PLATFORM_SUPPORT') {
      where.operator_id = userOperatorId;
    }

    const order = await this.prisma.order.findFirst({
      where,
      include: {
        operator: {
          select: { id: true, name: true, code: true, email: true, phone: true },
        },
        customer: {
          select: { id: true, name: true, phone: true, email: true },
        },
        order_assignments: {
          include: {
            vehicle: {
              select: { id: true, plate_number: true, make: true, model: true, vehicle_type: true },
            },
          },
        },
        payments: {
          orderBy: { created_at: 'desc' },
        },
        tracking_events: {
          orderBy: { created_at: 'desc' },
          take: 10,
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async updateStatus(id: string, updateStatusDto: UpdateOrderStatusDto, userId: string, userOperatorId?: string | null, userRole?: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, deleted_at: null },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check access
    if (userRole === 'CUSTOMER' && order.customer_id !== userId) {
      throw new ForbiddenException('You do not have permission to update this order');
    }

    if (userOperatorId && userRole !== 'SUPER_ADMIN' && userRole !== 'PLATFORM_SUPPORT') {
      if (order.operator_id !== userOperatorId) {
        throw new ForbiddenException('You do not have permission to update this order');
      }
    }

    // Validate status transition
    this.validateStatusTransition(order.status, updateStatusDto.status);

    const updateData: any = {
      status: updateStatusDto.status,
    };

    if (updateStatusDto.rejection_reason) {
      updateData.rejection_reason = updateStatusDto.rejection_reason;
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        operator: {
          select: { id: true, name: true, code: true },
        },
        customer: {
          select: { id: true, name: true, phone: true, email: true },
        },
      },
    });

    return updatedOrder;
  }

  async remove(id: string, userId: string, userOperatorId?: string | null, userRole?: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, deleted_at: null },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check access
    if (userRole === 'CUSTOMER' && order.customer_id !== userId) {
      throw new ForbiddenException('You do not have permission to delete this order');
    }

    if (userOperatorId && userRole !== 'SUPER_ADMIN' && userRole !== 'PLATFORM_SUPPORT') {
      if (order.operator_id !== userOperatorId) {
        throw new ForbiddenException('You do not have permission to delete this order');
      }
    }

    // Soft delete
    await this.prisma.order.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    return { message: 'Order deleted successfully' };
  }

  private async generateOrderNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ORD-${dateStr}-${random}`;
  }

  private validateStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus) {
    // Define valid status transitions
    const validTransitions: Partial<Record<OrderStatus, OrderStatus[]>> = {
      CREATED: [OrderStatus.PENDING_OPERATOR_ACTION, OrderStatus.CANCELLED],
      PENDING_OPERATOR_ACTION: [OrderStatus.APPROVED, OrderStatus.REJECTED, OrderStatus.CANCELLED],
      APPROVED: [OrderStatus.AWAITING_PAYMENT, OrderStatus.CANCELLED],
      AWAITING_PAYMENT: [OrderStatus.PAID, OrderStatus.CANCELLED],
      PAID: [OrderStatus.ASSIGNED, OrderStatus.CANCELLED],
      ASSIGNED: [OrderStatus.PICKED_UP, OrderStatus.CANCELLED],
      PICKED_UP: [OrderStatus.IN_TRANSIT, OrderStatus.CANCELLED],
      IN_TRANSIT: [OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.FAILED],
      DELIVERED: [OrderStatus.COMPLETED],
      COMPLETED: [],
      REJECTED: [],
      CANCELLED: [],
      FAILED: [],
    };

    const allowedStatuses = validTransitions[currentStatus] || [];
    if (allowedStatuses.length > 0 && !allowedStatuses.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}. Allowed transitions: ${allowedStatuses.join(', ')}`
      );
    }
  }
}

