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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Assign an order to a vehicle (and optionally a driver)' })
  @ApiResponse({ status: 201, description: 'Order assigned successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or invalid order status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Order already has an assignment' })
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
  @ApiOperation({ summary: 'Get all order assignments with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Assignments retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@Query() query: QueryOrderAssignmentsDto, @Request() req) {
    const user = req.user;
    return this.orderAssignmentsService.findAll(query, user.operatorId, user.roles?.[0]?.code);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order assignment by ID' })
  @ApiResponse({ status: 200, description: 'Assignment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(@Param('id') id: string, @Request() req) {
    const user = req.user;
    return this.orderAssignmentsService.findOne(id, user.operatorId, user.roles?.[0]?.code);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update order assignment (change vehicle or driver)' })
  @ApiResponse({ status: 200, description: 'Assignment updated successfully' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiOperation({ summary: 'Remove order assignment' })
  @ApiResponse({ status: 200, description: 'Assignment removed successfully' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  @ApiResponse({ status: 400, description: 'Cannot remove assignment due to order status' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async remove(@Param('id') id: string, @Request() req) {
    const user = req.user;
    return this.orderAssignmentsService.remove(id, user.id, user.operatorId, user.roles?.[0]?.code);
  }
}

