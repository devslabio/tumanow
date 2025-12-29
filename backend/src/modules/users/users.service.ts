import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto, AssignRolesDto, QueryUsersDto } from './dto/users.dto';
import { UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(createUserDto: CreateUserDto, userId: string, userOperatorId?: string | null, userRole?: string) {
    // Check if email already exists (excluding deleted users)
    if (createUserDto.email) {
      const existingEmail = await this.prisma.user.findFirst({
        where: {
          email: createUserDto.email,
          deleted_at: null,
        },
      });
      if (existingEmail) {
        throw new ConflictException('Email already exists');
      }
    }

    // Check if phone already exists (excluding deleted users)
    const existingPhone = await this.prisma.user.findFirst({
      where: {
        phone: createUserDto.phone,
        deleted_at: null,
      },
    });
    if (existingPhone) {
      throw new ConflictException('Phone number already exists');
    }

    // Check access - operators can only create users for their operator
    if (userOperatorId && userRole !== 'SUPER_ADMIN' && userRole !== 'PLATFORM_SUPPORT') {
      if (createUserDto.operator_id && createUserDto.operator_id !== userOperatorId) {
        throw new ForbiddenException('You can only create users for your own operator');
      }
      // Force operator_id to user's operator
      createUserDto.operator_id = userOperatorId;
    }

    // Hash password if provided
    let passwordHash = null;
    if (createUserDto.password) {
      passwordHash = await bcrypt.hash(createUserDto.password, 10);
    }

    // Create user
    const user = await this.prisma.user.create({
      data: {
        name: createUserDto.name,
        email: createUserDto.email,
        phone: createUserDto.phone,
        password_hash: passwordHash,
        operator_id: createUserDto.operator_id,
        status: createUserDto.status || UserStatus.ACTIVE,
        user_roles: {
          create: createUserDto.role_codes.map((roleCode) => ({
            role: {
              connect: {
                code: roleCode,
              },
            },
          })),
        },
      },
      include: {
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
        operator: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return user;
  }

  async findAll(query: QueryUsersDto, userId: string, userOperatorId?: string | null, userRole?: string) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      deleted_at: null, // Exclude soft-deleted users
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
        { email: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Filter by role if specified
    let roleFilter = {};
    if (query.role_code) {
      roleFilter = {
        user_roles: {
          some: {
            role: {
              code: query.role_code,
            },
          },
        },
      };
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: { ...where, ...roleFilter },
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
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
          operator: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where: { ...where, ...roleFilter } }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId: string, userOperatorId?: string | null, userRole?: string) {
    const where: any = { id, deleted_at: null };

    // Apply role-based access
    if (userOperatorId && userRole !== 'SUPER_ADMIN' && userRole !== 'PLATFORM_SUPPORT') {
      where.operator_id = userOperatorId;
    }

    const user = await this.prisma.user.findFirst({
      where,
      include: {
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
        operator: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto, userId: string, userOperatorId?: string | null, userRole?: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deleted_at: null },
      select: { id: true, operator_id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check access
    if (userOperatorId && userRole !== 'SUPER_ADMIN' && userRole !== 'PLATFORM_SUPPORT') {
      if (user.operator_id !== userOperatorId) {
        throw new ForbiddenException('You do not have permission to update this user');
      }
      // Prevent changing operator_id
      delete updateUserDto.operator_id;
    }

    // Check for email/phone conflicts
    if (updateUserDto.email) {
      const existingEmail = await this.prisma.user.findFirst({
        where: {
          email: updateUserDto.email,
          id: { not: id },
        },
      });
      if (existingEmail) {
        throw new ConflictException('Email already exists');
      }
    }

    if (updateUserDto.phone) {
      const existingPhone = await this.prisma.user.findFirst({
        where: {
          phone: updateUserDto.phone,
          id: { not: id },
        },
      });
      if (existingPhone) {
        throw new ConflictException('Phone number already exists');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      include: {
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
        operator: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    // Invalidate user roles cache if roles might have changed
    await this.cacheManager.del(`user:roles:${id}`);

    return updatedUser;
  }

  async assignRoles(id: string, assignRolesDto: AssignRolesDto, userId: string, userOperatorId?: string | null, userRole?: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deleted_at: null },
      select: { id: true, operator_id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check access
    if (userOperatorId && userRole !== 'SUPER_ADMIN' && userRole !== 'PLATFORM_SUPPORT') {
      if (user.operator_id !== userOperatorId) {
        throw new ForbiddenException('You do not have permission to assign roles to this user');
      }
    }

    // Verify all roles exist
    const roles = await this.prisma.role.findMany({
      where: {
        code: { in: assignRolesDto.role_codes },
      },
    });

    if (roles.length !== assignRolesDto.role_codes.length) {
      throw new BadRequestException('One or more role codes are invalid');
    }

    // Remove existing roles
    await this.prisma.userRole.deleteMany({
      where: { user_id: id },
    });

    // Assign new roles
    await this.prisma.userRole.createMany({
      data: assignRolesDto.role_codes.map((roleCode) => ({
        user_id: id,
        role_id: roles.find((r) => r.code === roleCode)!.id,
      })),
    });

    // Invalidate user roles cache
    await this.cacheManager.del(`user:roles:${id}`);

    // Return updated user
    return this.findOne(id, userId, userOperatorId, userRole);
  }

  async remove(id: string, userId: string, userOperatorId?: string | null, userRole?: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deleted_at: null },
      include: {
        orders: { take: 1 },
        payments: { take: 1 },
        notifications: { take: 1 },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check access
    if (userOperatorId && userRole !== 'SUPER_ADMIN' && userRole !== 'PLATFORM_SUPPORT') {
      if (user.operator_id !== userOperatorId) {
        throw new ForbiddenException('You do not have permission to delete this user');
      }
    }

    // Prevent deleting user with associated data
    if (user.orders.length > 0) {
      throw new BadRequestException('Cannot delete user with associated orders');
    }
    if (user.payments.length > 0) {
      throw new BadRequestException('Cannot delete user with associated payments');
    }

    // Soft delete - set status to INACTIVE
    await this.prisma.user.update({
      where: { id },
      data: {
        status: UserStatus.INACTIVE,
      },
    });

    return { message: 'User deleted successfully' };
  }
}

