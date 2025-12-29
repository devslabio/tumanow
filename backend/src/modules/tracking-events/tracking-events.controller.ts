import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { TrackingEventsService } from './tracking-events.service';
import { CreateTrackingEventDto, QueryTrackingEventsDto } from './dto/tracking-events.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Tracking Events')
@Controller('tracking-events')
export class TrackingEventsController {
  constructor(private readonly trackingEventsService: TrackingEventsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Create a new tracking event',
    description: 'Create a new tracking event for an order. Tracking events are used to record order status changes, location updates, and delivery milestones. Events can include location data, photos, or signatures for proof of delivery.'
  })
  @ApiBody({ type: CreateTrackingEventDto, description: 'Tracking event creation data' })
  @ApiResponse({ status: 201, description: 'Tracking event created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or order not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async create(@Body() createEventDto: CreateTrackingEventDto, @Request() req) {
    const user = req.user;
    return this.trackingEventsService.create(
      createEventDto,
      user.id,
      user.operatorId,
      user.roles?.[0]?.code
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get all tracking events with pagination and filters',
    description: 'Retrieve a paginated list of tracking events with optional filtering by order, event type, or date range. Results are automatically filtered by the requesting user\'s operator and role.'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)', example: 10 })
  @ApiQuery({ name: 'order_id', required: false, type: String, description: 'Filter by order ID (UUID)' })
  @ApiQuery({ name: 'event_type', required: false, type: String, description: 'Filter by event type', example: 'STATUS_CHANGE' })
  @ApiQuery({ name: 'start_date', required: false, type: String, description: 'Start date (ISO format)', example: '2025-01-01' })
  @ApiQuery({ name: 'end_date', required: false, type: String, description: 'End date (ISO format)', example: '2025-01-31' })
  @ApiResponse({ status: 200, description: 'Tracking events retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async findAll(@Query() query: QueryTrackingEventsDto, @Request() req) {
    const user = req.user;
    return this.trackingEventsService.findAll(query, user.id, user.operatorId, user.roles?.[0]?.code);
  }

  @Get('order/:orderId')
  @ApiOperation({ 
    summary: 'Get all tracking events for a specific order (public endpoint)',
    description: 'Public endpoint to retrieve all tracking events for a specific order. No authentication required. Used for public order tracking pages.'
  })
  @ApiParam({ name: 'orderId', type: String, description: 'Order UUID or order number', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Tracking events retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findByOrder(@Param('orderId') orderId: string) {
    // Public endpoint - no auth required for order tracking
    return this.trackingEventsService.findByOrderPublic(orderId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get tracking event by ID',
    description: 'Retrieve detailed information about a specific tracking event by its UUID. Includes location data, photos, and other event details.'
  })
  @ApiParam({ name: 'id', type: String, description: 'Tracking event UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Tracking event retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Tracking event not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async findOne(@Param('id') id: string, @Request() req) {
    const user = req.user;
    return this.trackingEventsService.findOne(id, user.id, user.operatorId, user.roles?.[0]?.code);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Delete tracking event',
    description: 'Delete a tracking event. Only users with appropriate permissions can delete tracking events. Typically restricted to admins.'
  })
  @ApiParam({ name: 'id', type: String, description: 'Tracking event UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Tracking event deleted successfully' })
  @ApiResponse({ status: 404, description: 'Tracking event not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async remove(@Param('id') id: string, @Request() req) {
    const user = req.user;
    return this.trackingEventsService.remove(id, user.id, user.operatorId, user.roles?.[0]?.code);
  }
}

