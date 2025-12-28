import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVehicleDto, UpdateVehicleDto, QueryVehiclesDto } from './dto/vehicles.dto';
import { VehicleStatus } from '@prisma/client';

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  async create(createVehicleDto: CreateVehicleDto, userOperatorId?: string | null) {
    // If user has operator_id, use it; otherwise use the provided operator_id
    const operatorId = userOperatorId || createVehicleDto.operator_id;

    // Check if plate number already exists
    const existingVehicle = await this.prisma.vehicle.findUnique({
      where: { plate_number: createVehicleDto.plate_number },
    });

    if (existingVehicle) {
      throw new ConflictException('Vehicle with this plate number already exists');
    }

    // Generate vehicle code if not provided
    const vehicleCode = `VEH-${createVehicleDto.plate_number.replace(/\s/g, '').toUpperCase()}`;

    // Create vehicle
    const vehicle = await this.prisma.vehicle.create({
      data: {
        operator_id: operatorId,
        plate_number: createVehicleDto.plate_number,
        code: vehicleCode,
        make: createVehicleDto.make,
        model: createVehicleDto.model,
        vehicle_type: createVehicleDto.vehicle_type,
        capacity_kg: createVehicleDto.capacity_kg?.toString(),
        current_location_lat: createVehicleDto.current_location_lat?.toString(),
        current_location_lng: createVehicleDto.current_location_lng?.toString(),
        year: createVehicleDto.year,
        color: createVehicleDto.color,
        status: createVehicleDto.status || VehicleStatus.AVAILABLE,
      },
      include: {
        operator: {
          select: { id: true, name: true, code: true },
        },
        _count: {
          select: {
            vehicle_drivers: true,
            order_assignments: true,
          },
        },
      },
    });

    return vehicle;
  }

  async findAll(query: QueryVehiclesDto, userOperatorId?: string | null, userRole?: string) {
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

    if (query.vehicle_type) {
      where.vehicle_type = query.vehicle_type;
    }

    if (query.search) {
      where.OR = [
        { plate_number: { contains: query.search, mode: 'insensitive' } },
        { make: { contains: query.search, mode: 'insensitive' } },
        { model: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [vehicles, total] = await Promise.all([
      this.prisma.vehicle.findMany({
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
              driver: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                  email: true,
                  license_number: true,
                  status: true,
                },
              },
            },
            take: 3, // Limit to 3 drivers for list view
          },
          _count: {
            select: {
              vehicle_drivers: true,
              order_assignments: true,
            },
          },
        },
      }),
      this.prisma.vehicle.count({ where }),
    ]);

    return {
      data: vehicles,
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

    const vehicle = await this.prisma.vehicle.findFirst({
      where,
      include: {
        operator: {
          select: { id: true, name: true, code: true, email: true, phone: true },
        },
        vehicle_drivers: {
          include: {
            driver: {
              select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                license_number: true,
                status: true,
              },
            },
          },
        },
        order_assignments: {
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
          orderBy: { assigned_at: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            vehicle_drivers: true,
            order_assignments: true,
          },
        },
      },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    return vehicle;
  }

  async update(id: string, updateVehicleDto: UpdateVehicleDto, userOperatorId?: string | null, userRole?: string) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id, deleted_at: null },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    // Check access
    if (userOperatorId && userRole !== 'SUPER_ADMIN' && userRole !== 'PLATFORM_SUPPORT') {
      if (vehicle.operator_id !== userOperatorId) {
        throw new ForbiddenException('You do not have permission to update this vehicle');
      }
    }

    // Check if plate number is being changed and if it conflicts
    if (updateVehicleDto.plate_number && updateVehicleDto.plate_number !== vehicle.plate_number) {
      const existingVehicle = await this.prisma.vehicle.findUnique({
        where: { plate_number: updateVehicleDto.plate_number },
      });

      if (existingVehicle) {
        throw new ConflictException('Vehicle with this plate number already exists');
      }
    }

    const updateData: any = {};

    if (updateVehicleDto.plate_number !== undefined) {
      updateData.plate_number = updateVehicleDto.plate_number;
      // Update code if plate number changes
      updateData.code = `VEH-${updateVehicleDto.plate_number.replace(/\s/g, '').toUpperCase()}`;
    }
    if (updateVehicleDto.make !== undefined) updateData.make = updateVehicleDto.make;
    if (updateVehicleDto.model !== undefined) updateData.model = updateVehicleDto.model;
    if (updateVehicleDto.vehicle_type !== undefined) updateData.vehicle_type = updateVehicleDto.vehicle_type;
    if (updateVehicleDto.capacity_kg !== undefined) updateData.capacity_kg = updateVehicleDto.capacity_kg.toString();
    if (updateVehicleDto.current_location_lat !== undefined) updateData.current_location_lat = updateVehicleDto.current_location_lat.toString();
    if (updateVehicleDto.current_location_lng !== undefined) updateData.current_location_lng = updateVehicleDto.current_location_lng.toString();
    if (updateVehicleDto.status !== undefined) updateData.status = updateVehicleDto.status;
    if (updateVehicleDto.year !== undefined) updateData.year = updateVehicleDto.year;
    if (updateVehicleDto.color !== undefined) updateData.color = updateVehicleDto.color;

    const updatedVehicle = await this.prisma.vehicle.update({
      where: { id },
      data: updateData,
      include: {
        operator: {
          select: { id: true, name: true, code: true },
        },
        _count: {
          select: {
            vehicle_drivers: true,
            order_assignments: true,
          },
        },
      },
    });

    return updatedVehicle;
  }

  async remove(id: string, userOperatorId?: string | null, userRole?: string) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id, deleted_at: null },
      include: {
        _count: {
          select: {
            vehicle_drivers: true,
            order_assignments: true,
          },
        },
      },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    // Check access
    if (userOperatorId && userRole !== 'SUPER_ADMIN' && userRole !== 'PLATFORM_SUPPORT') {
      if (vehicle.operator_id !== userOperatorId) {
        throw new ForbiddenException('You do not have permission to delete this vehicle');
      }
    }

    // Check if vehicle has active assignments
    const hasActiveAssignments = vehicle._count.order_assignments > 0;

    if (hasActiveAssignments) {
      throw new ConflictException(
        'Cannot delete vehicle with active order assignments. Please reassign orders first.'
      );
    }

    // Soft delete
    await this.prisma.vehicle.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    return { message: 'Vehicle deleted successfully' };
  }
}

