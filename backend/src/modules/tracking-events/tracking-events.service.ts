import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTrackingEventDto, QueryTrackingEventsDto } from './dto/tracking-events.dto';
import { OrderStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class TrackingEventsService {
  constructor(private prisma: PrismaService) {}

  async create(createEventDto: CreateTrackingEventDto, userId: string, userOperatorId?: string | null, userRole?: string) {
    // Verify order exists
    const order = await this.prisma.order.findFirst({
      where: { id: createEventDto.order_id, deleted_at: null },
      include: { operator: true, customer: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check access
    if (userRole === 'CUSTOMER' && order.customer_id !== userId) {
      throw new ForbiddenException('You can only create tracking events for your own orders');
    }
    if (userOperatorId && userRole !== 'SUPER_ADMIN' && userRole !== 'PLATFORM_SUPPORT') {
      if (order.operator_id !== userOperatorId) {
        throw new ForbiddenException('You do not have permission to create tracking events for this order');
      }
    }

    // Create tracking event
    const eventData: any = {
      order_id: createEventDto.order_id,
      status: createEventDto.status,
      notes: createEventDto.notes,
    };

    if (createEventDto.location_lat !== undefined && createEventDto.location_lng !== undefined) {
      eventData.location_lat = new Decimal(createEventDto.location_lat);
      eventData.location_lng = new Decimal(createEventDto.location_lng);
    }

    const trackingEvent = await this.prisma.trackingEvent.create({
      data: eventData,
      include: {
        order: {
          select: {
            id: true,
            order_number: true,
            status: true,
            pickup_address: true,
            delivery_address: true,
          },
        },
      },
    });

    // Update order status if different from current status
    if (order.status !== createEventDto.status) {
      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          status: createEventDto.status,
          order_history: {
            create: {
              status_from: order.status,
              status_to: createEventDto.status,
              changed_by: userId,
              notes: createEventDto.notes || `Status updated via tracking event`,
            },
          },
        },
      });
    }

    return trackingEvent;
  }

  async findAll(query: QueryTrackingEventsDto, userId: string, userOperatorId?: string | null, userRole?: string) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Apply filters based on user role
    if (userRole === 'CUSTOMER') {
      where.order = { customer_id: userId };
    } else if (userOperatorId && userRole !== 'SUPER_ADMIN' && userRole !== 'PLATFORM_SUPPORT') {
      where.order = { operator_id: userOperatorId };
    }

    if (query.order_id) {
      where.order_id = query.order_id;
    }

    if (query.status) {
      where.status = query.status;
    }

    const [events, total] = await Promise.all([
      this.prisma.trackingEvent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          order: {
            select: {
              id: true,
              order_number: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.trackingEvent.count({ where }),
    ]);

    return {
      data: events,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId: string, userOperatorId?: string | null, userRole?: string) {
    const where: any = { id };

    // Apply role-based access
    if (userRole === 'CUSTOMER') {
      where.order = { customer_id: userId };
    } else if (userOperatorId && userRole !== 'SUPER_ADMIN' && userRole !== 'PLATFORM_SUPPORT') {
      where.order = { operator_id: userOperatorId };
    }

    const event = await this.prisma.trackingEvent.findFirst({
      where,
      include: {
        order: {
          select: {
            id: true,
            order_number: true,
            status: true,
            pickup_address: true,
            delivery_address: true,
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
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Tracking event not found');
    }

    return event;
  }

  async findByOrderPublic(orderId: string) {
    // Public endpoint - verify order exists but no auth required
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, deleted_at: null },
      select: { id: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const events = await this.prisma.trackingEvent.findMany({
      where: { order_id: orderId },
      orderBy: { created_at: 'asc' },
      include: {
        order: {
          select: {
            id: true,
            order_number: true,
            status: true,
          },
        },
      },
    });

    return events;
  }

  async findByOrder(orderId: string, userId: string, userOperatorId?: string | null, userRole?: string) {
    // Verify order exists and user has access
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, deleted_at: null },
      select: { id: true, customer_id: true, operator_id: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check access
    if (userRole === 'CUSTOMER' && order.customer_id !== userId) {
      throw new ForbiddenException('You can only view tracking events for your own orders');
    }
    if (userOperatorId && userRole !== 'SUPER_ADMIN' && userRole !== 'PLATFORM_SUPPORT') {
      if (order.operator_id !== userOperatorId) {
        throw new ForbiddenException('You do not have permission to view tracking events for this order');
      }
    }

    const events = await this.prisma.trackingEvent.findMany({
      where: { order_id: orderId },
      orderBy: { created_at: 'asc' },
      include: {
        order: {
          select: {
            id: true,
            order_number: true,
            status: true,
          },
        },
      },
    });

    return events;
  }

  async remove(id: string, userId: string, userOperatorId?: string | null, userRole?: string) {
    const event = await this.prisma.trackingEvent.findFirst({
      where: { id },
      include: {
        order: {
          select: {
            id: true,
            customer_id: true,
            operator_id: true,
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Tracking event not found');
    }

    // Check access - only operators and admins can delete
    if (userRole === 'CUSTOMER') {
      throw new ForbiddenException('Customers cannot delete tracking events');
    }
    if (userOperatorId && userRole !== 'SUPER_ADMIN' && userRole !== 'PLATFORM_SUPPORT') {
      if (event.order.operator_id !== userOperatorId) {
        throw new ForbiddenException('You do not have permission to delete this tracking event');
      }
    }

    await this.prisma.trackingEvent.delete({
      where: { id },
    });

    return { message: 'Tracking event deleted successfully' };
  }
}

