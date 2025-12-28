import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDriverDto, UpdateDriverDto, QueryDriversDto } from './dto/drivers.dto';
import { DriverStatus } from '@prisma/client';

@Injectable()
export class DriversService {
  constructor(private prisma: PrismaService) {}

  async create(createDriverDto: CreateDriverDto, userOperatorId?: string | null) {
    // If user has operator_id, use it; otherwise use the provided operator_id
    const operatorId = userOperatorId || createDriverDto.operator_id;

    // Check if phone already exists for this operator
    const existingDriver = await this.prisma.driver.findFirst({
      where: {
        operator_id: operatorId,
        phone: createDriverDto.phone,
        deleted_at: null,
      },
    });

    if (existingDriver) {
      throw new ConflictException('Driver with this phone number already exists for this operator');
    }

    // If user_id is provided, check if it's already assigned to another driver
    if (createDriverDto.user_id) {
      const existingDriverWithUser = await this.prisma.driver.findFirst({
        where: {
          user_id: createDriverDto.user_id,
          deleted_at: null,
        },
      });

      if (existingDriverWithUser) {
        throw new ConflictException('This user is already assigned to another driver');
      }
    }

    // Create driver
    const driver = await this.prisma.driver.create({
      data: {
        operator_id: operatorId,
        name: createDriverDto.name,
        phone: createDriverDto.phone,
        email: createDriverDto.email,
        license_number: createDriverDto.license_number,
        status: createDriverDto.status || DriverStatus.AVAILABLE,
        user_id: createDriverDto.user_id,
      },
      include: {
        operator: {
          select: { id: true, name: true, code: true },
        },
        _count: {
          select: {
            vehicle_drivers: true,
          },
        },
      },
    });

    return driver;
  }

  async findAll(query: QueryDriversDto, userOperatorId?: string | null, userRole?: string) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      deleted_at: null,
    };

    // Apply filters based on user role
    if (userOperatorId && userRole !== 'SUPER_ADMIN' && userRole !== 'PLATFORM_SUPPORT') {
      where.operator_id = userOperatorId;
    }

    if (query.operator_id) {
      where.operator_id = query.operator_id;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
        { license_number: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [drivers, total] = await Promise.all([
      this.prisma.driver.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          operator: {
            select: { id: true, name: true, code: true },
          },
          vehicle_drivers: {
            include: {
              vehicle: {
                select: { id: true, plate_number: true, make: true, model: true },
              },
            },
            take: 3, // Limit to 3 vehicles for list view
          },
          _count: {
            select: {
              vehicle_drivers: true,
            },
          },
        },
      }),
      this.prisma.driver.count({ where }),
    ]);

    return {
      data: drivers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userOperatorId?: string | null, userRole?: string) {
    const where: any = { id, deleted_at: null };

    // Apply role-based access
    if (userOperatorId && userRole !== 'SUPER_ADMIN' && userRole !== 'PLATFORM_SUPPORT') {
      where.operator_id = userOperatorId;
    }

    const driver = await this.prisma.driver.findFirst({
      where,
      include: {
        operator: {
          select: { id: true, name: true, code: true, email: true, phone: true },
        },
        vehicle_drivers: {
          include: {
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
        },
        _count: {
          select: {
            vehicle_drivers: true,
          },
        },
      },
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    return driver;
  }

  async update(id: string, updateDriverDto: UpdateDriverDto, userOperatorId?: string | null, userRole?: string) {
    const driver = await this.prisma.driver.findFirst({
      where: { id, deleted_at: null },
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    // Check access
    if (userOperatorId && userRole !== 'SUPER_ADMIN' && userRole !== 'PLATFORM_SUPPORT') {
      if (driver.operator_id !== userOperatorId) {
        throw new ForbiddenException('You do not have permission to update this driver');
      }
    }

    // Check if phone is being changed and if it conflicts
    if (updateDriverDto.phone && updateDriverDto.phone !== driver.phone) {
      const existingDriver = await this.prisma.driver.findFirst({
        where: {
          operator_id: driver.operator_id,
          phone: updateDriverDto.phone,
          deleted_at: null,
          id: { not: id },
        },
      });

      if (existingDriver) {
        throw new ConflictException('Driver with this phone number already exists for this operator');
      }
    }

    // If user_id is being changed, check if it's already assigned to another driver
    if (updateDriverDto.user_id && updateDriverDto.user_id !== driver.user_id) {
      const existingDriverWithUser = await this.prisma.driver.findFirst({
        where: {
          user_id: updateDriverDto.user_id,
          deleted_at: null,
          id: { not: id },
        },
      });

      if (existingDriverWithUser) {
        throw new ConflictException('This user is already assigned to another driver');
      }
    }

    const updateData: any = {};
    if (updateDriverDto.name !== undefined) updateData.name = updateDriverDto.name;
    if (updateDriverDto.phone !== undefined) updateData.phone = updateDriverDto.phone;
    if (updateDriverDto.email !== undefined) updateData.email = updateDriverDto.email;
    if (updateDriverDto.license_number !== undefined) updateData.license_number = updateDriverDto.license_number;
    if (updateDriverDto.status !== undefined) updateData.status = updateDriverDto.status;
    if (updateDriverDto.user_id !== undefined) updateData.user_id = updateDriverDto.user_id;

    const updatedDriver = await this.prisma.driver.update({
      where: { id },
      data: updateData,
      include: {
        operator: {
          select: { id: true, name: true, code: true },
        },
        _count: {
          select: {
            vehicle_drivers: true,
          },
        },
      },
    });

    return updatedDriver;
  }

  async remove(id: string, userOperatorId?: string | null, userRole?: string) {
    const driver = await this.prisma.driver.findFirst({
      where: { id, deleted_at: null },
      include: {
        _count: {
          select: {
            vehicle_drivers: true,
          },
        },
      },
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    // Check access
    if (userOperatorId && userRole !== 'SUPER_ADMIN' && userRole !== 'PLATFORM_SUPPORT') {
      if (driver.operator_id !== userOperatorId) {
        throw new ForbiddenException('You do not have permission to delete this driver');
      }
    }

    // Check if driver has active vehicle assignments
    const hasActiveAssignments = driver._count.vehicle_drivers > 0;

    if (hasActiveAssignments) {
      throw new ConflictException(
        'Cannot delete driver with active vehicle assignments. Please unassign vehicles first.'
      );
    }

    // Soft delete
    await this.prisma.driver.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    return { message: 'Driver deleted successfully' };
  }
}

