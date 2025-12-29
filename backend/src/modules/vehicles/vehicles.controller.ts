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
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto, UpdateVehicleDto, QueryVehiclesDto } from './dto/vehicles.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Vehicles')
@Controller('vehicles')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Create a new vehicle',
    description: 'Create a new vehicle for the operator. The vehicle will be automatically associated with the requesting user\'s operator. Plate number must be unique within the operator.'
  })
  @ApiBody({ type: CreateVehicleDto, description: 'Vehicle creation data' })
  @ApiResponse({ status: 201, description: 'Vehicle created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 409, description: 'Plate number already exists for this operator' })
  async create(@Body() createVehicleDto: CreateVehicleDto, @Request() req) {
    const user = req.user;
    return this.vehiclesService.create(createVehicleDto, user.operatorId);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Get all vehicles with pagination and filters',
    description: 'Retrieve a paginated list of vehicles with optional filtering by status, type, or search term. Results are automatically filtered by the requesting user\'s operator.'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)', example: 10 })
  @ApiQuery({ name: 'status', required: false, enum: ['AVAILABLE', 'ASSIGNED', 'IN_TRANSIT', 'MAINTENANCE'], description: 'Filter by vehicle status' })
  @ApiQuery({ name: 'vehicle_type', required: false, type: String, description: 'Filter by vehicle type', example: 'MOTORCYCLE' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by plate number, make, or model', example: 'RAB' })
  @ApiResponse({ status: 200, description: 'Vehicles retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async findAll(@Query() query: QueryVehiclesDto, @Request() req) {
    const user = req.user;
    return this.vehiclesService.findAll(query, user.operatorId, user.roles?.[0]?.code);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get vehicle by ID',
    description: 'Retrieve detailed information about a specific vehicle by its UUID. Includes driver assignments and order history.'
  })
  @ApiParam({ name: 'id', type: String, description: 'Vehicle UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Vehicle retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async findOne(@Param('id') id: string, @Request() req) {
    const user = req.user;
    return this.vehiclesService.findOne(id, user.operatorId, user.roles?.[0]?.code);
  }

  @Patch(':id')
  @ApiOperation({ 
    summary: 'Update vehicle',
    description: 'Update vehicle information. Only specified fields will be updated. Cannot update plate number if vehicle has active assignments.'
  })
  @ApiParam({ name: 'id', type: String, description: 'Vehicle UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiBody({ type: UpdateVehicleDto, description: 'Vehicle update data (all fields optional)' })
  @ApiResponse({ status: 200, description: 'Vehicle updated successfully' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  @ApiResponse({ status: 400, description: 'Validation error or cannot update plate number' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async update(@Param('id') id: string, @Body() updateVehicleDto: UpdateVehicleDto, @Request() req) {
    const user = req.user;
    return this.vehiclesService.update(id, updateVehicleDto, user.operatorId, user.roles?.[0]?.code);
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Delete vehicle (soft delete)',
    description: 'Soft delete a vehicle. The vehicle will be marked as deleted but data will be retained. Cannot delete vehicles with active order assignments.'
  })
  @ApiParam({ name: 'id', type: String, description: 'Vehicle UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Vehicle deleted successfully' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  @ApiResponse({ status: 409, description: 'Vehicle has active order assignments and cannot be deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async remove(@Param('id') id: string, @Request() req) {
    const user = req.user;
    return this.vehiclesService.remove(id, user.operatorId, user.roles?.[0]?.code);
  }
}

