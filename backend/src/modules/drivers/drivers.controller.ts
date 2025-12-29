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
import { DriversService } from './drivers.service';
import { CreateDriverDto, UpdateDriverDto, QueryDriversDto } from './dto/drivers.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Drivers')
@Controller('drivers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Create a new driver',
    description: 'Create a new driver for the operator. The driver will be automatically associated with the requesting user\'s operator. A user account will be created if user_id is not provided.'
  })
  @ApiBody({ type: CreateDriverDto, description: 'Driver creation data' })
  @ApiResponse({ status: 201, description: 'Driver created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 409, description: 'Phone number or user already exists' })
  async create(@Body() createDriverDto: CreateDriverDto, @Request() req) {
    const user = req.user;
    return this.driversService.create(createDriverDto, user.operatorId);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Get all drivers with pagination and filters',
    description: 'Retrieve a paginated list of drivers with optional filtering by status, vehicle, or search term. Results are automatically filtered by the requesting user\'s operator.'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)', example: 10 })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'], description: 'Filter by driver status' })
  @ApiQuery({ name: 'vehicle_id', required: false, type: String, description: 'Filter by assigned vehicle ID (UUID)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by name, phone, or license number', example: 'john' })
  @ApiResponse({ status: 200, description: 'Drivers retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async findAll(@Query() query: QueryDriversDto, @Request() req) {
    const user = req.user;
    return this.driversService.findAll(query, user.operatorId, user.roles?.[0]?.code);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get driver by ID',
    description: 'Retrieve detailed information about a specific driver by their UUID. Includes vehicle assignments and order history.'
  })
  @ApiParam({ name: 'id', type: String, description: 'Driver UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Driver retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Driver not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async findOne(@Param('id') id: string, @Request() req) {
    const user = req.user;
    return this.driversService.findOne(id, user.operatorId, user.roles?.[0]?.code);
  }

  @Patch(':id')
  @ApiOperation({ 
    summary: 'Update driver',
    description: 'Update driver information. Only specified fields will be updated.'
  })
  @ApiParam({ name: 'id', type: String, description: 'Driver UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiBody({ type: UpdateDriverDto, description: 'Driver update data (all fields optional)' })
  @ApiResponse({ status: 200, description: 'Driver updated successfully' })
  @ApiResponse({ status: 404, description: 'Driver not found' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async update(@Param('id') id: string, @Body() updateDriverDto: UpdateDriverDto, @Request() req) {
    const user = req.user;
    return this.driversService.update(id, updateDriverDto, user.operatorId, user.roles?.[0]?.code);
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Delete driver (soft delete)',
    description: 'Soft delete a driver. The driver will be marked as deleted but data will be retained. Cannot delete drivers with active vehicle assignments.'
  })
  @ApiParam({ name: 'id', type: String, description: 'Driver UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Driver deleted successfully' })
  @ApiResponse({ status: 404, description: 'Driver not found' })
  @ApiResponse({ status: 409, description: 'Driver has active vehicle assignments and cannot be deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async remove(@Param('id') id: string, @Request() req) {
    const user = req.user;
    return this.driversService.remove(id, user.operatorId, user.roles?.[0]?.code);
  }
}

