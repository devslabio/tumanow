import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryAuditLogsDto } from './dto/audit-logs.dto';

@Injectable()
export class AuditLogsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryAuditLogsDto, userId: string, userOperatorId?: string | null, userRole?: string) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Apply role-based access control
    if (userOperatorId && userRole !== 'SUPER_ADMIN' && userRole !== 'PLATFORM_SUPPORT') {
      where.operator_id = userOperatorId;
    }

    if (query.operator_id) {
      where.operator_id = query.operator_id;
    }

    if (query.user_id) {
      where.user_id = query.user_id;
    }

    if (query.action) {
      where.action = query.action;
    }

    if (query.entity_type) {
      where.entity_type = query.entity_type;
    }

    if (query.entity_id) {
      where.entity_id = query.entity_id;
    }

    if (query.start_date || query.end_date) {
      where.created_at = {};
      if (query.start_date) {
        where.created_at.gte = new Date(query.start_date);
      }
      if (query.end_date) {
        where.created_at.lte = new Date(query.end_date);
      }
    }

    if (query.search) {
      where.OR = [
        { action: { contains: query.search, mode: 'insensitive' } },
        { entity_type: { contains: query.search, mode: 'insensitive' } },
        { entity_id: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    // Fetch user details for logs that have user_id
    const userIds = [...new Set(logs.filter(log => log.user_id).map(log => log.user_id!))];
    const users = userIds.length > 0
      ? await this.prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, email: true, phone: true },
        })
      : [];

    const userMap = new Map(users.map(u => [u.id, u]));

    const logsWithUsers = logs.map(log => ({
      ...log,
      user: log.user_id ? userMap.get(log.user_id) || null : null,
    }));

    return {
      data: logsWithUsers,
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

    // Apply role-based access control
    if (userOperatorId && userRole !== 'SUPER_ADMIN' && userRole !== 'PLATFORM_SUPPORT') {
      where.operator_id = userOperatorId;
    }

    const log = await this.prisma.auditLog.findFirst({
      where,
    });

    if (!log) {
      throw new NotFoundException('Audit log not found');
    }

    // Fetch user if exists
    const user = log.user_id
      ? await this.prisma.user.findUnique({
          where: { id: log.user_id },
          select: { id: true, name: true, email: true, phone: true },
        })
      : null;

    return {
      ...log,
      user,
    };
  }

  async findByEntity(entityType: string, entityId: string, userId: string, userOperatorId?: string | null, userRole?: string) {
    const where: any = {
      entity_type: entityType,
      entity_id: entityId,
    };

    // Apply role-based access control
    if (userOperatorId && userRole !== 'SUPER_ADMIN' && userRole !== 'PLATFORM_SUPPORT') {
      where.operator_id = userOperatorId;
    }

    const logs = await this.prisma.auditLog.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });

    // Fetch user details for logs that have user_id
    const userIds = [...new Set(logs.filter(log => log.user_id).map(log => log.user_id!))];
    const users = userIds.length > 0
      ? await this.prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, email: true, phone: true },
        })
      : [];

    const userMap = new Map(users.map(u => [u.id, u]));

    return logs.map(log => ({
      ...log,
      user: log.user_id ? userMap.get(log.user_id) || null : null,
    }));
  }
}

