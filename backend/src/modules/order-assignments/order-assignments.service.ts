import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderAssignmentDto, UpdateOrderAssignmentDto, QueryOrderAssignmentsDto } from './dto/order-assignments.dto';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrderAssignmentsService {
  constructor(private prisma: PrismaService) {}

  async create(createAssignmentDto: CreateOrderAssignmentDto, userId: string, userOperatorId?: string | null, userRole?: string) {
    // Verify order exists and is in a valid state for assignment
    const order = await this.prisma.order.findFirst({
      where: { id: createAssignmentDto.order_id, deleted_at: null },
      include: { operator: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check access
    if (userOperatorId && userRole !== 'SUPER_ADMIN' && userRole !== 'PLATFORM_SUPPORT') {
      if (order.operator_id !== userOperatorId) {
        throw new ForbiddenException('You do not have permission to assign this order');
      }
    }

    // Order must be PAID before assignment
    if (order.status !== OrderStatus.PAID) {
      throw new BadRequestException(`Order must be PAID before assignment. Current status: ${order.status}`);
    }

    // Check if order already has an assignment
    const existingAssignment = await this.prisma.orderAssignment.findFirst({
      where: {
        order_id: createAssignmentDto.order_id,
      },
    });

    if (existingAssignment) {
      throw new ConflictException('Order already has an assignment. Update the existing assignment instead.');
    }

    // Verify vehicle exists and belongs to the same operator
    const vehicle = await this.prisma.vehicle.findFirst({
      where: {
        id: createAssignmentDto.vehicle_id,
        operator_id: order.operator_id,
        deleted_at: null,
      },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found or does not belong to the order operator');
    }

    // If driver is provided, verify it exists and belongs to the same operator
    if (createAssignmentDto.driver_id) {
      const driver = await this.prisma.driver.findFirst({
        where: {
          id: createAssignmentDto.driver_id,
          operator_id: order.operator_id,
          deleted_at: null,
        },
      });

      if (!driver) {
        throw new NotFoundException('Driver not found or does not belong to the order operator');
      }

      // Verify driver is assigned to the vehicle
      const vehicleDriver = await this.prisma.vehicleDriver.findFirst({
        where: {
          vehicle_id: createAssignmentDto.vehicle_id,
          driver_id: createAssignmentDto.driver_id,
        },
      });

      if (!vehicleDriver) {
        throw new BadRequestException('Driver is not assigned to the selected vehicle');
      }
    }

    // Create assignment
    const assignment = await this.prisma.orderAssignment.create({
      data: {
        order_id: createAssignmentDto.order_id,
        vehicle_id: createAssignmentDto.vehicle_id,
        driver_id: createAssignmentDto.driver_id,
        assigned_by: userId,
      },
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
        vehicle: {
          select: {
            id: true,
            plate_number: true,
            make: true,
            model: true,
            vehicle_type: true,
          },
        },
      },
    });

    // Update order status to ASSIGNED
    await this.prisma.order.update({
      where: { id: createAssignmentDto.order_id },
      data: {
        status: OrderStatus.ASSIGNED,
        order_history: {
          create: {
            status_from: OrderStatus.PAID,
            status_to: OrderStatus.ASSIGNED,
            changed_by: userId,
            notes: `Order assigned to vehicle ${vehicle.plate_number}`,
          },
        },
      },
    });

    return assignment;
  }

  async findAll(query: QueryOrderAssignmentsDto, userOperatorId?: string | null, userRole?: string) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Apply filters based on user role
    if (userOperatorId && userRole !== 'SUPER_ADMIN' && userRole !== 'PLATFORM_SUPPORT') {
      where.order = {
        operator_id: userOperatorId,
        deleted_at: null,
      };
    } else {
      where.order = {
        deleted_at: null,
      };
    }

    if (query.order_id) {
      where.order_id = query.order_id;
    }

    if (query.vehicle_id) {
      where.vehicle_id = query.vehicle_id;
    }

    if (query.driver_id) {
      where.driver_id = query.driver_id;
    }

    const [assignments, total] = await Promise.all([
      this.prisma.orderAssignment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { assigned_at: 'desc' },
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
          vehicle: {
            select: {
              id: true,
              plate_number: true,
              make: true,
              model: true,
            },
          },
        },
      }),
      this.prisma.orderAssignment.count({ where }),
    ]);

    return {
      data: assignments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userOperatorId?: string | null, userRole?: string) {
    const where: any = { id };

    // Apply role-based access
    if (userOperatorId && userRole !== 'SUPER_ADMIN' && userRole !== 'PLATFORM_SUPPORT') {
      where.order = {
        operator_id: userOperatorId,
        deleted_at: null,
      };
    } else {
      where.order = {
        deleted_at: null,
      };
    }

    const assignment = await this.prisma.orderAssignment.findFirst({
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
                email: true,
              },
            },
          },
        },
        vehicle: {
          select: {
            id: true,
            plate_number: true,
            make: true,
            model: true,
            vehicle_type: true,
            status: true,
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException('Order assignment not found');
    }

    // Get driver info if assigned
    if (assignment.driver_id) {
      const driver = await this.prisma.driver.findFirst({
        where: { id: assignment.driver_id },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          license_number: true,
          status: true,
        },
      });
      return { ...assignment, driver };
    }

    return assignment;
  }

  async update(id: string, updateAssignmentDto: UpdateOrderAssignmentDto, userId: string, userOperatorId?: string | null, userRole?: string) {
    const assignment = await this.prisma.orderAssignment.findFirst({
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

    if (!assignment) {
      throw new NotFoundException('Order assignment not found');
    }

    // Check access
    if (userOperatorId && userRole !== 'SUPER_ADMIN' && userRole !== 'PLATFORM_SUPPORT') {
      if (assignment.order.operator_id !== userOperatorId) {
        throw new ForbiddenException('You do not have permission to update this assignment');
      }
    }

    // Verify vehicle if being changed
    if (updateAssignmentDto.vehicle_id && updateAssignmentDto.vehicle_id !== assignment.vehicle_id) {
      const vehicle = await this.prisma.vehicle.findFirst({
        where: {
          id: updateAssignmentDto.vehicle_id,
          operator_id: assignment.order.operator_id,
          deleted_at: null,
        },
      });

      if (!vehicle) {
        throw new NotFoundException('Vehicle not found or does not belong to the order operator');
      }
    }

    // Verify driver if being changed
    if (updateAssignmentDto.driver_id !== undefined) {
      if (updateAssignmentDto.driver_id) {
        const driver = await this.prisma.driver.findFirst({
          where: {
            id: updateAssignmentDto.driver_id,
            operator_id: assignment.order.operator_id,
            deleted_at: null,
          },
        });

        if (!driver) {
          throw new NotFoundException('Driver not found or does not belong to the order operator');
        }

        // Verify driver is assigned to the vehicle
        const vehicleId = updateAssignmentDto.vehicle_id || assignment.vehicle_id;
        const vehicleDriver = await this.prisma.vehicleDriver.findFirst({
          where: {
            vehicle_id: vehicleId,
            driver_id: updateAssignmentDto.driver_id,
          },
        });

        if (!vehicleDriver) {
          throw new BadRequestException('Driver is not assigned to the selected vehicle');
        }
      }
    }

    const updateData: any = {};
    if (updateAssignmentDto.vehicle_id !== undefined) updateData.vehicle_id = updateAssignmentDto.vehicle_id;
    if (updateAssignmentDto.driver_id !== undefined) updateData.driver_id = updateAssignmentDto.driver_id;

    const updatedAssignment = await this.prisma.orderAssignment.update({
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
        vehicle: {
          select: {
            id: true,
            plate_number: true,
            make: true,
            model: true,
          },
        },
      },
    });

    return updatedAssignment;
  }

  async remove(id: string, userId: string, userOperatorId?: string | null, userRole?: string) {
    const assignment = await this.prisma.orderAssignment.findFirst({
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

    if (!assignment) {
      throw new NotFoundException('Order assignment not found');
    }

    // Check access
    if (userOperatorId && userRole !== 'SUPER_ADMIN' && userRole !== 'PLATFORM_SUPPORT') {
      if (assignment.order.operator_id !== userOperatorId) {
        throw new ForbiddenException('You do not have permission to delete this assignment');
      }
    }

    // Only allow deletion if order is still ASSIGNED or PICKED_UP
    if (assignment.order.status !== OrderStatus.ASSIGNED && assignment.order.status !== OrderStatus.PICKED_UP) {
      throw new BadRequestException(
        `Cannot remove assignment. Order status is ${assignment.order.status}. Only ASSIGNED or PICKED_UP orders can have assignments removed.`
      );
    }

    // Delete assignment
    await this.prisma.orderAssignment.delete({
      where: { id },
    });

    // Revert order status to PAID if it was ASSIGNED
    if (assignment.order.status === OrderStatus.ASSIGNED) {
      await this.prisma.order.update({
        where: { id: assignment.order.id },
        data: {
          status: OrderStatus.PAID,
          order_history: {
            create: {
              status_from: OrderStatus.ASSIGNED,
              status_to: OrderStatus.PAID,
              changed_by: userId,
              notes: 'Order assignment removed',
            },
          },
        },
      });
    }

    return { message: 'Order assignment removed successfully' };
  }
}

