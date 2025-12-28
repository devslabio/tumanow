import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOperatorDto, UpdateOperatorDto, UpdateOperatorConfigDto, QueryOperatorsDto } from './dto/operators.dto';

@Injectable()
export class OperatorsService {
  constructor(private prisma: PrismaService) {}

  async create(createOperatorDto: CreateOperatorDto) {
    // Check if operator code already exists
    const existingOperator = await this.prisma.operator.findUnique({
      where: { code: createOperatorDto.code },
    });

    if (existingOperator) {
      throw new ConflictException('Operator with this code already exists');
    }

    // Create operator
    const operator = await this.prisma.operator.create({
      data: {
        code: createOperatorDto.code,
        name: createOperatorDto.name,
        email: createOperatorDto.email,
        phone: createOperatorDto.phone,
        status: createOperatorDto.status || 'ACTIVE',
      },
      include: {
        operator_config: true,
      },
    });

    // Create default config
    await this.prisma.operatorConfig.create({
      data: {
        operator_id: operator.id,
        supports_documents: true,
        supports_small_parcel: true,
        supports_electronics: true,
        supports_fragile: true,
        supports_perishables: false,
        supports_bulky: false,
        supports_same_day: true,
        supports_next_day: true,
        supports_scheduled: true,
        supports_express: true,
        supports_intercity: true,
        supports_prepaid: true,
        supports_cod: true,
        supports_corporate: false,
      },
    });

    // Return operator with config
    return this.prisma.operator.findUnique({
      where: { id: operator.id },
      include: {
        operator_config: true,
        _count: {
          select: {
            users: true,
            vehicles: true,
            drivers: true,
            orders: true,
          },
        },
      },
    });
  }

  async findAll(query: QueryOperatorsDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      deleted_at: null,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [operators, total] = await Promise.all([
      this.prisma.operator.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          operator_config: true,
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
      this.prisma.operator.count({ where }),
    ]);

    return {
      data: operators,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const operator = await this.prisma.operator.findFirst({
      where: { id, deleted_at: null },
      include: {
        operator_config: true,
        _count: {
          select: {
            users: true,
            vehicles: true,
            drivers: true,
            orders: true,
          },
        },
      },
    });

    if (!operator) {
      throw new NotFoundException('Operator not found');
    }

    return operator;
  }

  async update(id: string, updateOperatorDto: UpdateOperatorDto) {
    const operator = await this.prisma.operator.findFirst({
      where: { id, deleted_at: null },
    });

    if (!operator) {
      throw new NotFoundException('Operator not found');
    }

    const updatedOperator = await this.prisma.operator.update({
      where: { id },
      data: {
        ...(updateOperatorDto.name && { name: updateOperatorDto.name }),
        ...(updateOperatorDto.email !== undefined && { email: updateOperatorDto.email }),
        ...(updateOperatorDto.phone !== undefined && { phone: updateOperatorDto.phone }),
        ...(updateOperatorDto.status && { status: updateOperatorDto.status }),
      },
      include: {
        operator_config: true,
        _count: {
          select: {
            users: true,
            vehicles: true,
            drivers: true,
            orders: true,
          },
        },
      },
    });

    return updatedOperator;
  }

  async updateConfig(operatorId: string, updateConfigDto: UpdateOperatorConfigDto) {
    const operator = await this.prisma.operator.findFirst({
      where: { id: operatorId, deleted_at: null },
    });

    if (!operator) {
      throw new NotFoundException('Operator not found');
    }

    // Check if config exists
    let config = await this.prisma.operatorConfig.findUnique({
      where: { operator_id: operatorId },
    });

    const configData: any = {};

    // Item handling
    if (updateConfigDto.supports_documents !== undefined) configData.supports_documents = updateConfigDto.supports_documents;
    if (updateConfigDto.supports_small_parcel !== undefined) configData.supports_small_parcel = updateConfigDto.supports_small_parcel;
    if (updateConfigDto.supports_electronics !== undefined) configData.supports_electronics = updateConfigDto.supports_electronics;
    if (updateConfigDto.supports_fragile !== undefined) configData.supports_fragile = updateConfigDto.supports_fragile;
    if (updateConfigDto.supports_perishables !== undefined) configData.supports_perishables = updateConfigDto.supports_perishables;
    if (updateConfigDto.supports_bulky !== undefined) configData.supports_bulky = updateConfigDto.supports_bulky;

    // Limits
    if (updateConfigDto.max_weight_kg !== undefined) configData.max_weight_kg = updateConfigDto.max_weight_kg.toString();
    if (updateConfigDto.max_dimensions_cm !== undefined) configData.max_dimensions_cm = updateConfigDto.max_dimensions_cm;

    // Delivery modes
    if (updateConfigDto.supports_same_day !== undefined) configData.supports_same_day = updateConfigDto.supports_same_day;
    if (updateConfigDto.supports_next_day !== undefined) configData.supports_next_day = updateConfigDto.supports_next_day;
    if (updateConfigDto.supports_scheduled !== undefined) configData.supports_scheduled = updateConfigDto.supports_scheduled;
    if (updateConfigDto.supports_express !== undefined) configData.supports_express = updateConfigDto.supports_express;
    if (updateConfigDto.supports_intercity !== undefined) configData.supports_intercity = updateConfigDto.supports_intercity;

    // Payment types
    if (updateConfigDto.supports_cod !== undefined) configData.supports_cod = updateConfigDto.supports_cod;
    if (updateConfigDto.supports_card !== undefined) configData.supports_card = updateConfigDto.supports_card;
    if (updateConfigDto.supports_corporate !== undefined) configData.supports_corporate = updateConfigDto.supports_corporate;

    // Note: requires_pod, pod_type, and service_area are not in the schema
    // They can be added later if needed

    if (config) {
      // Update existing config
      await this.prisma.operatorConfig.update({
        where: { operator_id: operatorId },
        data: configData,
      });
    } else {
      // Create new config
      await this.prisma.operatorConfig.create({
        data: {
          operator_id: operatorId,
          ...configData,
        },
      });
    }

    return this.findOne(operatorId);
  }

  async remove(id: string) {
    const operator = await this.prisma.operator.findFirst({
      where: { id, deleted_at: null },
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
    });

    if (!operator) {
      throw new NotFoundException('Operator not found');
    }

    // Check if operator has active resources
    const hasActiveResources =
      operator._count.users > 0 ||
      operator._count.vehicles > 0 ||
      operator._count.drivers > 0 ||
      operator._count.orders > 0;

    if (hasActiveResources) {
      throw new BadRequestException(
        'Cannot delete operator with active users, vehicles, drivers, or orders. Please deactivate instead.'
      );
    }

    // Soft delete
    await this.prisma.operator.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    return { message: 'Operator deleted successfully' };
  }
}

