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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Create a new operator' })
  @ApiResponse({ status: 201, description: 'Operator created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async create(@Body() createOperatorDto: CreateOperatorDto) {
    return this.operatorsService.create(createOperatorDto);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'PLATFORM_SUPPORT')
  @ApiOperation({ summary: 'Get all operators with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Operators retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@Query() query: QueryOperatorsDto) {
    return this.operatorsService.findAll(query);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'PLATFORM_SUPPORT', 'OPERATOR_ADMIN')
  @ApiOperation({ summary: 'Get operator by ID' })
  @ApiResponse({ status: 200, description: 'Operator retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Operator not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiOperation({ summary: 'Update operator' })
  @ApiResponse({ status: 200, description: 'Operator updated successfully' })
  @ApiResponse({ status: 404, description: 'Operator not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiOperation({ summary: 'Update operator configuration/capabilities' })
  @ApiResponse({ status: 200, description: 'Operator configuration updated successfully' })
  @ApiResponse({ status: 404, description: 'Operator not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiOperation({ summary: 'Delete operator (soft delete)' })
  @ApiResponse({ status: 200, description: 'Operator deleted successfully' })
  @ApiResponse({ status: 404, description: 'Operator not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete operator with active resources' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async remove(@Param('id') id: string) {
    return this.operatorsService.remove(id);
  }
}

