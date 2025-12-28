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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Create a new notification' })
  @ApiResponse({ status: 201, description: 'Notification created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
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
  @ApiOperation({ summary: 'Get all notifications with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@Query() query: QueryNotificationsDto, @Request() req) {
    const user = req.user;
    return this.notificationsService.findAll(query, user.id, user.operatorId, user.roles?.[0]?.code);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count for current user' })
  @ApiResponse({ status: 200, description: 'Unread count retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUnreadCount(@Request() req) {
    const user = req.user;
    return this.notificationsService.getUnreadCount(user.id, user.operatorId, user.roles?.[0]?.code);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification by ID' })
  @ApiResponse({ status: 200, description: 'Notification retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(@Param('id') id: string, @Request() req) {
    const user = req.user;
    return this.notificationsService.findOne(id, user.id, user.operatorId, user.roles?.[0]?.code);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async markAsRead(@Param('id') id: string, @Request() req) {
    const user = req.user;
    return this.notificationsService.markAsRead(id, user.id, user.operatorId, user.roles?.[0]?.code);
  }

  @Patch('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read for current user' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async markAllAsRead(@Request() req) {
    const user = req.user;
    return this.notificationsService.markAllAsRead(user.id, user.operatorId, user.roles?.[0]?.code);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete notification' })
  @ApiResponse({ status: 200, description: 'Notification deleted successfully' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async remove(@Param('id') id: string, @Request() req) {
    const user = req.user;
    return this.notificationsService.remove(id, user.id, user.operatorId, user.roles?.[0]?.code);
  }
}

