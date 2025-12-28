import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePaymentDto, UpdatePaymentDto, QueryPaymentsDto } from './dto/payments.dto';
import { PaymentStatus, OrderStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async create(createPaymentDto: CreatePaymentDto, userId: string, userOperatorId?: string | null, userRole?: string) {
    // Verify order exists
    const order = await this.prisma.order.findFirst({
      where: { id: createPaymentDto.order_id, deleted_at: null },
      include: { operator: true, customer: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check access
    if (userOperatorId && userRole !== 'SUPER_ADMIN' && userRole !== 'PLATFORM_SUPPORT') {
      if (order.operator_id !== userOperatorId) {
        throw new ForbiddenException('You do not have permission to create payment for this order');
      }
    }

    // Verify customer matches authenticated user (if customer)
    if (userRole === 'CUSTOMER' && order.customer_id !== userId) {
      throw new ForbiddenException('You can only create payments for your own orders');
    }

    // Check if payment already exists for this order
    const existingPayment = await this.prisma.payment.findFirst({
      where: {
        order_id: createPaymentDto.order_id,
        status: { not: PaymentStatus.FAILED },
      },
    });

    if (existingPayment) {
      throw new BadRequestException('A payment already exists for this order');
    }

    // Verify amount matches order total (allow small tolerance for rounding)
    const orderTotal = new Decimal(order.total_price || 0);
    const paymentAmount = new Decimal(createPaymentDto.amount);
    const difference = orderTotal.minus(paymentAmount).abs();
    
    if (difference.greaterThan(new Decimal(0.01))) {
      throw new BadRequestException(
        `Payment amount (${paymentAmount}) does not match order total (${orderTotal})`
      );
    }

    // Create payment
    const payment = await this.prisma.payment.create({
      data: {
        operator_id: order.operator_id,
        order_id: createPaymentDto.order_id,
        customer_id: order.customer_id,
        amount: paymentAmount,
        method: createPaymentDto.method,
        status: PaymentStatus.PENDING,
        transaction_id: createPaymentDto.transaction_id,
        gateway_response: createPaymentDto.gateway_response,
      },
      include: {
        order: {
          select: {
            id: true,
            order_number: true,
            status: true,
            total_price: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
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
    });

    return payment;
  }

  async findAll(query: QueryPaymentsDto, userId: string, userOperatorId?: string | null, userRole?: string) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Apply filters based on user role
    if (userRole === 'CUSTOMER') {
      where.customer_id = userId;
    } else if (userOperatorId && userRole !== 'SUPER_ADMIN' && userRole !== 'PLATFORM_SUPPORT') {
      where.operator_id = userOperatorId;
    }

    if (query.operator_id) {
      where.operator_id = query.operator_id;
    }

    if (query.order_id) {
      where.order_id = query.order_id;
    }

    if (query.customer_id) {
      where.customer_id = query.customer_id;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.method) {
      where.method = query.method;
    }

    if (query.search) {
      where.OR = [
        { transaction_id: { contains: query.search, mode: 'insensitive' } },
        { order: { order_number: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
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
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      data: payments,
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
      where.customer_id = userId;
    } else if (userOperatorId && userRole !== 'SUPER_ADMIN' && userRole !== 'PLATFORM_SUPPORT') {
      where.operator_id = userOperatorId;
    }

    const payment = await this.prisma.payment.findFirst({
      where,
      include: {
        order: {
          select: {
            id: true,
            order_number: true,
            status: true,
            total_price: true,
            pickup_address: true,
            delivery_address: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        operator: {
          select: {
            id: true,
            name: true,
            code: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async update(id: string, updatePaymentDto: UpdatePaymentDto, userId: string, userOperatorId?: string | null, userRole?: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id },
      include: {
        order: {
          select: {
            id: true,
            operator_id: true,
            status: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Check access
    if (userRole === 'CUSTOMER' && payment.customer_id !== userId) {
      throw new ForbiddenException('You do not have permission to update this payment');
    }
    if (userOperatorId && userRole !== 'SUPER_ADMIN' && userRole !== 'PLATFORM_SUPPORT') {
      if (payment.operator_id !== userOperatorId) {
        throw new ForbiddenException('You do not have permission to update this payment');
      }
    }

    // If status is being updated to COMPLETED, update order status and set paid_at
    const updateData: any = {};
    if (updatePaymentDto.status !== undefined) {
      updateData.status = updatePaymentDto.status;
      
      if (updatePaymentDto.status === PaymentStatus.COMPLETED && payment.status !== PaymentStatus.COMPLETED) {
        updateData.paid_at = new Date();
        
        // Update order status to PAID if it's not already
        if (payment.order.status !== OrderStatus.PAID && payment.order.status !== OrderStatus.ASSIGNED) {
          await this.prisma.order.update({
            where: { id: payment.order_id },
            data: {
              status: OrderStatus.PAID,
              order_history: {
                create: {
                  status_from: payment.order.status,
                  status_to: OrderStatus.PAID,
                  changed_by: userId,
                  notes: 'Payment completed',
                },
              },
            },
          });
        }
      }
    }
    
    if (updatePaymentDto.transaction_id !== undefined) {
      updateData.transaction_id = updatePaymentDto.transaction_id;
    }
    
    if (updatePaymentDto.gateway_response !== undefined) {
      updateData.gateway_response = updatePaymentDto.gateway_response;
    }

    const updatedPayment = await this.prisma.payment.update({
      where: { id },
      data: updateData,
      include: {
        order: {
          select: {
            id: true,
            order_number: true,
            status: true,
          },
        },
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
    });

    return updatedPayment;
  }

  async remove(id: string, userId: string, userOperatorId?: string | null, userRole?: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Check access
    if (userRole === 'CUSTOMER' && payment.customer_id !== userId) {
      throw new ForbiddenException('You do not have permission to delete this payment');
    }
    if (userOperatorId && userRole !== 'SUPER_ADMIN' && userRole !== 'PLATFORM_SUPPORT') {
      if (payment.operator_id !== userOperatorId) {
        throw new ForbiddenException('You do not have permission to delete this payment');
      }
    }

    // Only allow deletion of PENDING or FAILED payments
    if (payment.status === PaymentStatus.COMPLETED) {
      throw new BadRequestException('Cannot delete a completed payment');
    }

    await this.prisma.payment.delete({
      where: { id },
    });

    return { message: 'Payment deleted successfully' };
  }
}

