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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery, ApiBody, ApiParam } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto, QueryOrdersDto } from './dto/orders.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Create a new order',
    description: 'Create a new delivery order. The order will be automatically associated with the requesting user\'s operator. An order number will be automatically generated.'
  })
  @ApiBody({ type: CreateOrderDto, description: 'Order creation data' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or invalid operator/customer ID' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async create(@Body() createOrderDto: CreateOrderDto, @Request() req) {
    const user = req.user;
    return this.ordersService.create(createOrderDto, user.id, user.operatorId);
  }

  @Get('track/:orderNumber')
  @ApiOperation({ 
    summary: 'Track order by order number (public endpoint)',
    description: 'Public endpoint to track an order by its order number. No authentication required. Returns order status and tracking events.'
  })
  @ApiParam({ name: 'orderNumber', type: String, description: 'Order number (e.g., ORD-20250101-001)', example: 'ORD-20250101-001' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async trackByOrderNumber(@Param('orderNumber') orderNumber: string) {
    return this.ordersService.findByOrderNumber(orderNumber);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get all orders with pagination and filters',
    description: 'Retrieve a paginated list of orders with optional filtering by status, customer, date range, or search term. Results are automatically filtered by the requesting user\'s operator and role.'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)', example: 10 })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'CONFIRMED', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'], description: 'Filter by order status' })
  @ApiQuery({ name: 'customer_id', required: false, type: String, description: 'Filter by customer ID (UUID)' })
  @ApiQuery({ name: 'start_date', required: false, type: String, description: 'Start date (ISO format)', example: '2025-01-01' })
  @ApiQuery({ name: 'end_date', required: false, type: String, description: 'End date (ISO format)', example: '2025-01-31' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by order number, customer name, or addresses', example: 'ORD-2025' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async findAll(@Query() query: QueryOrdersDto, @Request() req) {
    const user = req.user;
    return this.ordersService.findAll(query, user.id, user.operatorId, user.roles?.[0]?.code);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get order by ID',
    description: 'Retrieve detailed information about a specific order by its UUID. Includes customer details, tracking events, payment information, and assignment history.'
  })
  @ApiParam({ name: 'id', type: String, description: 'Order UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async findOne(@Param('id') id: string, @Request() req) {
    const user = req.user;
    return this.ordersService.findOne(id, user.id, user.operatorId, user.roles?.[0]?.code);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Update order status',
    description: 'Update the status of an order. Status transitions must follow the order lifecycle: PENDING → CONFIRMED → ASSIGNED → PICKED_UP → IN_TRANSIT → DELIVERED. Some roles have restrictions on which statuses they can set.'
  })
  @ApiParam({ name: 'id', type: String, description: 'Order UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiBody({ type: UpdateOrderStatusDto, description: 'New order status and optional notes' })
  @ApiResponse({ status: 200, description: 'Order status updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status transition or validation error' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions for this status change' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateOrderStatusDto,
    @Request() req,
  ) {
    const user = req.user;
    return this.ordersService.updateStatus(id, updateStatusDto, user.id, user.operatorId, user.roles?.[0]?.code);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Delete order (soft delete)',
    description: 'Soft delete an order. The order will be marked as deleted but data will be retained. Only orders in PENDING or CANCELLED status can be deleted. Requires appropriate permissions.'
  })
  @ApiParam({ name: 'id', type: String, description: 'Order UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Order deleted successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete order in current status' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async remove(@Param('id') id: string, @Request() req) {
    const user = req.user;
    return this.ordersService.remove(id, user.id, user.operatorId, user.roles?.[0]?.code);
  }
}

