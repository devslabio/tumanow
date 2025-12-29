import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto, QueryNotificationsDto, MarkAsReadDto } from './dto/notifications.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Create a new notification',
    description: 'Create a new notification for one or more users. Notifications can be sent via multiple channels (in-app, email, SMS, push). Requires appropriate permissions.'
  })
  @ApiBody({ type: CreateNotificationDto, description: 'Notification creation data' })
  @ApiResponse({ status: 201, description: 'Notification created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or invalid user IDs' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async create(@Body() createNotificationDto: CreateNotificationDto, @Request() req) {
    const user = req.user;
    return this.notificationsService.create(
      createNotificationDto,
      user.id,
      user.operatorId,
      user.roles?.[0]?.code
    );
  }

  @Get()
  @ApiOperation({ 
    summary: 'Get all notifications with pagination and filters',
    description: 'Retrieve a paginated list of notifications for the current user. Results are automatically filtered by the requesting user\'s operator and role. Users can only see their own notifications unless they have admin permissions.'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)', example: 10 })
  @ApiQuery({ name: 'is_read', required: false, type: Boolean, description: 'Filter by read status', example: false })
  @ApiQuery({ name: 'type', required: false, type: String, description: 'Filter by notification type', example: 'ORDER_UPDATE' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async findAll(@Query() query: QueryNotificationsDto, @Request() req) {
    const user = req.user;
    return this.notificationsService.findAll(query, user.id, user.operatorId, user.roles?.[0]?.code);
  }

  @Get('unread-count')
  @ApiOperation({ 
    summary: 'Get unread notification count for current user',
    description: 'Get the total count of unread notifications for the current authenticated user. Useful for displaying notification badges.'
  })
  @ApiResponse({ status: 200, description: 'Unread count retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async getUnreadCount(@Request() req) {
    const user = req.user;
    return this.notificationsService.getUnreadCount(user.id, user.operatorId, user.roles?.[0]?.code);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get notification by ID',
    description: 'Retrieve detailed information about a specific notification. Users can only view their own notifications unless they have admin permissions.'
  })
  @ApiParam({ name: 'id', type: String, description: 'Notification UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Notification retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot access this notification' })
  async findOne(@Param('id') id: string, @Request() req) {
    const user = req.user;
    return this.notificationsService.findOne(id, user.id, user.operatorId, user.roles?.[0]?.code);
  }

  @Patch(':id/read')
  @ApiOperation({ 
    summary: 'Mark notification as read',
    description: 'Mark a specific notification as read. Users can only mark their own notifications as read.'
  })
  @ApiParam({ name: 'id', type: String, description: 'Notification UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot mark this notification as read' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async markAsRead(@Param('id') id: string, @Request() req) {
    const user = req.user;
    return this.notificationsService.markAsRead(id, user.id, user.operatorId, user.roles?.[0]?.code);
  }

  @Patch('mark-all-read')
  @ApiOperation({ 
    summary: 'Mark all notifications as read for current user',
    description: 'Mark all unread notifications for the current authenticated user as read. Useful for "mark all as read" functionality.'
  })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async markAllAsRead(@Request() req) {
    const user = req.user;
    return this.notificationsService.markAllAsRead(user.id, user.operatorId, user.roles?.[0]?.code);
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Delete notification',
    description: 'Delete a notification. Users can only delete their own notifications unless they have admin permissions.'
  })
  @ApiParam({ name: 'id', type: String, description: 'Notification UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Notification deleted successfully' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot delete this notification' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async remove(@Param('id') id: string, @Request() req) {
    const user = req.user;
    return this.notificationsService.remove(id, user.id, user.operatorId, user.roles?.[0]?.code);
  }
}

