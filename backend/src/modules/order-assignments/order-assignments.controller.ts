import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { OrderAssignmentsService } from './order-assignments.service';
import { CreateOrderAssignmentDto, UpdateOrderAssignmentDto, QueryOrderAssignmentsDto } from './dto/order-assignments.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Order Assignments')
@Controller('order-assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class OrderAssignmentsController {
  constructor(private readonly orderAssignmentsService: OrderAssignmentsService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Assign an order to a vehicle (and optionally a driver)',
    description: 'Assign an order to a vehicle. Optionally assign a specific driver to the vehicle. Orders must be in CONFIRMED status to be assigned. Only one active assignment per order is allowed.'
  })
  @ApiBody({ type: CreateOrderAssignmentDto, description: 'Order assignment data' })
  @ApiResponse({ status: 201, description: 'Order assigned successfully' })
  @ApiResponse({ status: 400, description: 'Validation error, invalid order status, or order/vehicle not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 409, description: 'Order already has an active assignment' })
  async create(@Body() createAssignmentDto: CreateOrderAssignmentDto, @Request() req) {
    const user = req.user;
    return this.orderAssignmentsService.create(
      createAssignmentDto,
      user.id,
      user.operatorId,
      user.roles?.[0]?.code
    );
  }

  @Get()
  @ApiOperation({ 
    summary: 'Get all order assignments with pagination and filters',
    description: 'Retrieve a paginated list of order assignments with optional filtering by order, vehicle, driver, or status. Results are automatically filtered by the requesting user\'s operator.'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)', example: 10 })
  @ApiQuery({ name: 'order_id', required: false, type: String, description: 'Filter by order ID (UUID)' })
  @ApiQuery({ name: 'vehicle_id', required: false, type: String, description: 'Filter by vehicle ID (UUID)' })
  @ApiQuery({ name: 'driver_id', required: false, type: String, description: 'Filter by driver ID (UUID)' })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'COMPLETED', 'CANCELLED'], description: 'Filter by assignment status' })
  @ApiResponse({ status: 200, description: 'Assignments retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async findAll(@Query() query: QueryOrderAssignmentsDto, @Request() req) {
    const user = req.user;
    return this.orderAssignmentsService.findAll(query, user.operatorId, user.roles?.[0]?.code);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get order assignment by ID',
    description: 'Retrieve detailed information about a specific order assignment by its UUID. Includes order, vehicle, and driver details.'
  })
  @ApiParam({ name: 'id', type: String, description: 'Assignment UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Assignment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async findOne(@Param('id') id: string, @Request() req) {
    const user = req.user;
    return this.orderAssignmentsService.findOne(id, user.operatorId, user.roles?.[0]?.code);
  }

  @Patch(':id')
  @ApiOperation({ 
    summary: 'Update order assignment (change vehicle or driver)',
    description: 'Update an order assignment to change the assigned vehicle or driver. Useful for reassigning orders when needed.'
  })
  @ApiParam({ name: 'id', type: String, description: 'Assignment UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiBody({ type: UpdateOrderAssignmentDto, description: 'Assignment update data (all fields optional)' })
  @ApiResponse({ status: 200, description: 'Assignment updated successfully' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  @ApiResponse({ status: 400, description: 'Validation error or invalid vehicle/driver' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async update(@Param('id') id: string, @Body() updateAssignmentDto: UpdateOrderAssignmentDto, @Request() req) {
    const user = req.user;
    return this.orderAssignmentsService.update(
      id,
      updateAssignmentDto,
      user.id,
      user.operatorId,
      user.roles?.[0]?.code
    );
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Remove order assignment',
    description: 'Remove an order assignment. The order will be unassigned from the vehicle/driver. Cannot remove assignments for orders that are already in transit or delivered.'
  })
  @ApiParam({ name: 'id', type: String, description: 'Assignment UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Assignment removed successfully' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  @ApiResponse({ status: 400, description: 'Cannot remove assignment - order is in transit or already delivered' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async remove(@Param('id') id: string, @Request() req) {
    const user = req.user;
    return this.orderAssignmentsService.remove(id, user.id, user.operatorId, user.roles?.[0]?.code);
  }
}

