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
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, UpdatePaymentDto, QueryPaymentsDto } from './dto/payments.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Create a new payment',
    description: 'Create a new payment record for an order. Payments can be PREPAID, COD, or CORPORATE. Only one payment per order is allowed.'
  })
  @ApiBody({ type: CreatePaymentDto, description: 'Payment creation data' })
  @ApiResponse({ status: 201, description: 'Payment created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error, payment already exists, or order not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async create(@Body() createPaymentDto: CreatePaymentDto, @Request() req) {
    const user = req.user;
    return this.paymentsService.create(
      createPaymentDto,
      user.id,
      user.operatorId,
      user.roles?.[0]?.code
    );
  }

  @Get()
  @ApiOperation({ 
    summary: 'Get all payments with pagination and filters',
    description: 'Retrieve a paginated list of payments with optional filtering by status, method, order, or date range. Results are automatically filtered by the requesting user\'s operator and role.'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)', example: 10 })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'], description: 'Filter by payment status' })
  @ApiQuery({ name: 'method', required: false, enum: ['CASH', 'MOBILE_MONEY', 'BANK_TRANSFER', 'CARD'], description: 'Filter by payment method' })
  @ApiQuery({ name: 'order_id', required: false, type: String, description: 'Filter by order ID (UUID)' })
  @ApiQuery({ name: 'start_date', required: false, type: String, description: 'Start date (ISO format)', example: '2025-01-01' })
  @ApiQuery({ name: 'end_date', required: false, type: String, description: 'End date (ISO format)', example: '2025-01-31' })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async findAll(@Query() query: QueryPaymentsDto, @Request() req) {
    const user = req.user;
    return this.paymentsService.findAll(query, user.id, user.operatorId, user.roles?.[0]?.code);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get payment by ID',
    description: 'Retrieve detailed information about a specific payment by its UUID. Includes order details and transaction information.'
  })
  @ApiParam({ name: 'id', type: String, description: 'Payment UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Payment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async findOne(@Param('id') id: string, @Request() req) {
    const user = req.user;
    return this.paymentsService.findOne(id, user.id, user.operatorId, user.roles?.[0]?.code);
  }

  @Patch(':id')
  @ApiOperation({ 
    summary: 'Update payment (status, transaction ID, gateway response)',
    description: 'Update payment information such as status, transaction ID, or gateway response. Typically used to mark payments as completed or failed after processing.'
  })
  @ApiParam({ name: 'id', type: String, description: 'Payment UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiBody({ type: UpdatePaymentDto, description: 'Payment update data (all fields optional)' })
  @ApiResponse({ status: 200, description: 'Payment updated successfully' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiResponse({ status: 400, description: 'Validation error or invalid status transition' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async update(@Param('id') id: string, @Body() updatePaymentDto: UpdatePaymentDto, @Request() req) {
    const user = req.user;
    return this.paymentsService.update(
      id,
      updatePaymentDto,
      user.id,
      user.operatorId,
      user.roles?.[0]?.code
    );
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Delete payment (only PENDING or FAILED)',
    description: 'Delete a payment record. Only payments with PENDING or FAILED status can be deleted. Completed payments cannot be deleted.'
  })
  @ApiParam({ name: 'id', type: String, description: 'Payment UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Payment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete payment with COMPLETED or REFUNDED status' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async remove(@Param('id') id: string, @Request() req) {
    const user = req.user;
    return this.paymentsService.remove(id, user.id, user.operatorId, user.roles?.[0]?.code);
  }
}

