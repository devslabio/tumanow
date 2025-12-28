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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { TrackingEventsService } from './tracking-events.service';
import { CreateTrackingEventDto, QueryTrackingEventsDto } from './dto/tracking-events.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Tracking Events')
@Controller('tracking-events')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TrackingEventsController {
  constructor(private readonly trackingEventsService: TrackingEventsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new tracking event' })
  @ApiResponse({ status: 201, description: 'Tracking event created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
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
  @ApiOperation({ summary: 'Get all tracking events with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Tracking events retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@Query() query: QueryTrackingEventsDto, @Request() req) {
    const user = req.user;
    return this.trackingEventsService.findAll(query, user.id, user.operatorId, user.roles?.[0]?.code);
  }

  @Get('order/:orderId')
  @ApiOperation({ summary: 'Get all tracking events for a specific order' })
  @ApiResponse({ status: 200, description: 'Tracking events retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findByOrder(@Param('orderId') orderId: string, @Request() req) {
    const user = req.user;
    return this.trackingEventsService.findByOrder(orderId, user.id, user.operatorId, user.roles?.[0]?.code);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tracking event by ID' })
  @ApiResponse({ status: 200, description: 'Tracking event retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Tracking event not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(@Param('id') id: string, @Request() req) {
    const user = req.user;
    return this.trackingEventsService.findOne(id, user.id, user.operatorId, user.roles?.[0]?.code);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete tracking event' })
  @ApiResponse({ status: 200, description: 'Tracking event deleted successfully' })
  @ApiResponse({ status: 404, description: 'Tracking event not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async remove(@Param('id') id: string, @Request() req) {
    const user = req.user;
    return this.trackingEventsService.remove(id, user.id, user.operatorId, user.roles?.[0]?.code);
  }
}

