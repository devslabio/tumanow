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
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { OperatorsService } from './operators.service';
import { CreateOperatorDto, UpdateOperatorDto, UpdateOperatorConfigDto, QueryOperatorsDto } from './dto/operators.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Operators')
@Controller('operators')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class OperatorsController {
  constructor(private readonly operatorsService: OperatorsService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'PLATFORM_SUPPORT')
  @ApiOperation({ 
    summary: 'Create a new operator',
    description: 'Create a new operator (tenant/courier company). Only SUPER_ADMIN and PLATFORM_SUPPORT can create operators. Each operator operates in complete data isolation.'
  })
  @ApiBody({ type: CreateOperatorDto, description: 'Operator creation data' })
  @ApiResponse({ status: 201, description: 'Operator created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or duplicate code/name' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires SUPER_ADMIN or PLATFORM_SUPPORT role' })
  async create(@Body() createOperatorDto: CreateOperatorDto) {
    return this.operatorsService.create(createOperatorDto);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'PLATFORM_SUPPORT')
  @ApiOperation({ 
    summary: 'Get all operators with pagination and filters',
    description: 'Retrieve a paginated list of all operators. Only SUPER_ADMIN and PLATFORM_SUPPORT can view all operators.'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)', example: 10 })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'], description: 'Filter by operator status' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by name or code', example: 'express' })
  @ApiResponse({ status: 200, description: 'Operators retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires SUPER_ADMIN or PLATFORM_SUPPORT role' })
  async findAll(@Query() query: QueryOperatorsDto) {
    return this.operatorsService.findAll(query);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'PLATFORM_SUPPORT', 'OPERATOR_ADMIN')
  @ApiOperation({ 
    summary: 'Get operator by ID',
    description: 'Retrieve detailed information about a specific operator. OPERATOR_ADMIN can only view their own operator.'
  })
  @ApiParam({ name: 'id', type: String, description: 'Operator UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Operator retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Operator not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - OPERATOR_ADMIN can only view their own operator' })
  async findOne(@Param('id') id: string, @Request() req) {
    const user = req.user;
    
    // Operator admins can only view their own operator
    if (user.roles?.[0]?.code === 'OPERATOR_ADMIN' && user.operatorId !== id) {
      throw new ForbiddenException('You can only view your own operator');
    }
    
    return this.operatorsService.findOne(id);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'PLATFORM_SUPPORT', 'OPERATOR_ADMIN')
  @ApiOperation({ 
    summary: 'Update operator',
    description: 'Update operator information. OPERATOR_ADMIN can only update their own operator. Only specified fields will be updated.'
  })
  @ApiParam({ name: 'id', type: String, description: 'Operator UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiBody({ type: UpdateOperatorDto, description: 'Operator update data (all fields optional)' })
  @ApiResponse({ status: 200, description: 'Operator updated successfully' })
  @ApiResponse({ status: 404, description: 'Operator not found' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Forbidden - OPERATOR_ADMIN can only update their own operator' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async update(@Param('id') id: string, @Body() updateOperatorDto: UpdateOperatorDto, @Request() req) {
    const user = req.user;
    
    // Operator admins can only update their own operator
    if (user.roles?.[0]?.code === 'OPERATOR_ADMIN' && user.operatorId !== id) {
      throw new ForbiddenException('You can only update your own operator');
    }
    
    return this.operatorsService.update(id, updateOperatorDto);
  }

  @Patch(':id/config')
  @Roles('SUPER_ADMIN', 'PLATFORM_SUPPORT', 'OPERATOR_ADMIN')
  @ApiOperation({ 
    summary: 'Update operator configuration/capabilities',
    description: 'Update operator configuration including supported item types, delivery modes, payment methods, and other capabilities. OPERATOR_ADMIN can only update their own operator configuration.'
  })
  @ApiParam({ name: 'id', type: String, description: 'Operator UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiBody({ type: UpdateOperatorConfigDto, description: 'Operator configuration update data' })
  @ApiResponse({ status: 200, description: 'Operator configuration updated successfully' })
  @ApiResponse({ status: 404, description: 'Operator not found' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Forbidden - OPERATOR_ADMIN can only update their own operator config' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async updateConfig(@Param('id') id: string, @Body() updateConfigDto: UpdateOperatorConfigDto, @Request() req) {
    const user = req.user;
    
    // Operator admins can only update their own operator config
    if (user.roles?.[0]?.code === 'OPERATOR_ADMIN' && user.operatorId !== id) {
      throw new ForbiddenException('You can only update your own operator configuration');
    }
    
    return this.operatorsService.updateConfig(id, updateConfigDto);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'PLATFORM_SUPPORT')
  @ApiOperation({ 
    summary: 'Delete operator (soft delete)',
    description: 'Soft delete an operator. The operator will be marked as deleted but data will be retained. Cannot delete operators with active users, orders, or other resources. Only SUPER_ADMIN and PLATFORM_SUPPORT can delete operators.'
  })
  @ApiParam({ name: 'id', type: String, description: 'Operator UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Operator deleted successfully' })
  @ApiResponse({ status: 404, description: 'Operator not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete operator with active users, orders, vehicles, or other resources' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires SUPER_ADMIN or PLATFORM_SUPPORT role' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async remove(@Param('id') id: string) {
    return this.operatorsService.remove(id);
  }
}

