import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateNotificationDto, QueryNotificationsDto, MarkAsReadDto } from './dto/notifications.dto';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(createNotificationDto: CreateNotificationDto, userId: string, userOperatorId?: string | null, userRole?: string) {
    // Verify user exists
    const targetUser = await this.prisma.user.findUnique({
      where: { id: createNotificationDto.user_id },
      select: { id: true, operator_id: true },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // Check access - operators can only notify their own users (unless super admin)
    if (userOperatorId && userRole !== 'SUPER_ADMIN' && userRole !== 'PLATFORM_SUPPORT') {
      if (targetUser.operator_id !== userOperatorId) {
        throw new ForbiddenException('You do not have permission to create notifications for this user');
      }
    }

    // Create notification
    const notification = await this.prisma.notification.create({
      data: {
        operator_id: targetUser.operator_id,
        user_id: createNotificationDto.user_id,
        type: createNotificationDto.type,
        title: createNotificationDto.title,
        message: createNotificationDto.message,
        data: createNotificationDto.data,
        sent_email: createNotificationDto.send_email || false,
        sent_sms: createNotificationDto.send_sms || false,
        sent_push: createNotificationDto.send_push || false,
        sent_in_app: createNotificationDto.send_in_app !== false, // Default to true
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
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

    // TODO: Trigger actual email/SMS/push notifications here
    // This would integrate with:
    // - Email service (SendGrid, AWS SES, etc.)
    // - SMS service (Twilio, AWS SNS, etc.)
    // - Firebase Cloud Messaging for push notifications

    return notification;
  }

  async findAll(query: QueryNotificationsDto, userId: string, userOperatorId?: string | null, userRole?: string) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Apply filters based on user role
    if (userRole === 'CUSTOMER' || userRole === 'DRIVER') {
      // Users can only see their own notifications
      where.user_id = userId;
    } else if (userOperatorId && userRole !== 'SUPER_ADMIN' && userRole !== 'PLATFORM_SUPPORT') {
      // Operators can see notifications for their users
      where.operator_id = userOperatorId;
    }

    if (query.user_id) {
      where.user_id = query.user_id;
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.read !== undefined) {
      if (query.read) {
        where.read_at = { not: null };
      } else {
        where.read_at = null;
      }
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
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
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      data: notifications,
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
    if (userRole === 'CUSTOMER' || userRole === 'DRIVER') {
      where.user_id = userId;
    } else if (userOperatorId && userRole !== 'SUPER_ADMIN' && userRole !== 'PLATFORM_SUPPORT') {
      where.operator_id = userOperatorId;
    }

    const notification = await this.prisma.notification.findFirst({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
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

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  async markAsRead(id: string, userId: string, userOperatorId?: string | null, userRole?: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id },
      select: { id: true, user_id: true, operator_id: true, read_at: true },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    // Check access - users can only mark their own notifications as read
    if (userRole === 'CUSTOMER' || userRole === 'DRIVER') {
      if (notification.user_id !== userId) {
        throw new ForbiddenException('You can only mark your own notifications as read');
      }
    } else if (userOperatorId && userRole !== 'SUPER_ADMIN' && userRole !== 'PLATFORM_SUPPORT') {
      if (notification.operator_id !== userOperatorId) {
        throw new ForbiddenException('You do not have permission to update this notification');
      }
    }

    if (notification.read_at) {
      return notification; // Already read
    }

    const updated = await this.prisma.notification.update({
      where: { id },
      data: { read_at: new Date() },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return updated;
  }

  async markAllAsRead(userId: string, userOperatorId?: string | null, userRole?: string) {
    const where: any = { read_at: null };

    // Users can only mark their own notifications as read
    if (userRole === 'CUSTOMER' || userRole === 'DRIVER') {
      where.user_id = userId;
    } else if (userOperatorId && userRole !== 'SUPER_ADMIN' && userRole !== 'PLATFORM_SUPPORT') {
      where.operator_id = userOperatorId;
      where.user_id = userId; // Still limit to specific user if provided
    } else {
      // For admins, require user_id to be specified
      where.user_id = userId;
    }

    const result = await this.prisma.notification.updateMany({
      where,
      data: { read_at: new Date() },
    });

    return { message: `${result.count} notifications marked as read` };
  }

  async getUnreadCount(userId: string, userOperatorId?: string | null, userRole?: string) {
    const where: any = { read_at: null };

    // Users can only see their own unread count
    if (userRole === 'CUSTOMER' || userRole === 'DRIVER') {
      where.user_id = userId;
    } else if (userOperatorId && userRole !== 'SUPER_ADMIN' && userRole !== 'PLATFORM_SUPPORT') {
      where.operator_id = userOperatorId;
      where.user_id = userId;
    } else {
      where.user_id = userId;
    }

    const count = await this.prisma.notification.count({ where });

    return { unread_count: count };
  }

  async remove(id: string, userId: string, userOperatorId?: string | null, userRole?: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id },
      select: { id: true, user_id: true, operator_id: true },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    // Check access
    if (userRole === 'CUSTOMER' || userRole === 'DRIVER') {
      if (notification.user_id !== userId) {
        throw new ForbiddenException('You can only delete your own notifications');
      }
    } else if (userOperatorId && userRole !== 'SUPER_ADMIN' && userRole !== 'PLATFORM_SUPPORT') {
      if (notification.operator_id !== userOperatorId) {
        throw new ForbiddenException('You do not have permission to delete this notification');
      }
    }

    await this.prisma.notification.delete({
      where: { id },
    });

    return { message: 'Notification deleted successfully' };
  }
}

