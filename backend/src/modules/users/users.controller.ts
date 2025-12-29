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
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, AssignRolesDto, QueryUsersDto } from './dto/users.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'PLATFORM_SUPPORT', 'OPERATOR_ADMIN')
  @ApiOperation({ 
    summary: 'Create a new user',
    description: 'Create a new user account. Requires SUPER_ADMIN, PLATFORM_SUPPORT, or OPERATOR_ADMIN role. Users are automatically associated with the operator of the requesting user.'
  })
  @ApiBody({ type: CreateUserDto, description: 'User creation data' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or duplicate phone/email' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async create(@Body() createUserDto: CreateUserDto, @Request() req) {
    const user = req.user;
    return this.usersService.create(
      createUserDto,
      user.id,
      user.operatorId,
      user.roles?.[0]?.code
    );
  }

  @Get()
  @ApiOperation({ 
    summary: 'Get all users with pagination and filters',
    description: 'Retrieve a paginated list of users with optional filtering by status, operator, role, or search term. Results are automatically filtered by the requesting user\'s operator.'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)', example: 10 })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'], description: 'Filter by user status' })
  @ApiQuery({ name: 'operator_id', required: false, type: String, description: 'Filter by operator ID (UUID)' })
  @ApiQuery({ name: 'role_code', required: false, type: String, description: 'Filter by role code', example: 'CUSTOMER' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by name, email, or phone', example: 'john' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async findAll(@Query() query: QueryUsersDto, @Request() req) {
    const user = req.user;
    return this.usersService.findAll(query, user.id, user.operatorId, user.roles?.[0]?.code);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get user by ID',
    description: 'Retrieve detailed information about a specific user by their UUID. Access is restricted to users within the same operator.'
  })
  @ApiParam({ name: 'id', type: String, description: 'User UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async findOne(@Param('id') id: string, @Request() req) {
    const user = req.user;
    return this.usersService.findOne(id, user.id, user.operatorId, user.roles?.[0]?.code);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'PLATFORM_SUPPORT', 'OPERATOR_ADMIN')
  @ApiOperation({ 
    summary: 'Update user',
    description: 'Update user information. Only specified fields will be updated. Requires SUPER_ADMIN, PLATFORM_SUPPORT, or OPERATOR_ADMIN role.'
  })
  @ApiParam({ name: 'id', type: String, description: 'User UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiBody({ type: UpdateUserDto, description: 'User update data (all fields optional)' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'Validation error or duplicate phone/email' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Request() req) {
    const user = req.user;
    return this.usersService.update(id, updateUserDto, user.id, user.operatorId, user.roles?.[0]?.code);
  }

  @Patch(':id/roles')
  @Roles('SUPER_ADMIN', 'PLATFORM_SUPPORT', 'OPERATOR_ADMIN')
  @ApiOperation({ 
    summary: 'Assign roles to user',
    description: 'Assign one or more roles to a user. This replaces any existing roles. Requires SUPER_ADMIN, PLATFORM_SUPPORT, or OPERATOR_ADMIN role.'
  })
  @ApiParam({ name: 'id', type: String, description: 'User UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiBody({ type: AssignRolesDto, description: 'Role codes to assign' })
  @ApiResponse({ status: 200, description: 'Roles assigned successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'Invalid role codes or role does not exist' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async assignRoles(@Param('id') id: string, @Body() assignRolesDto: AssignRolesDto, @Request() req) {
    const user = req.user;
    return this.usersService.assignRoles(id, assignRolesDto, user.id, user.operatorId, user.roles?.[0]?.code);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'PLATFORM_SUPPORT', 'OPERATOR_ADMIN')
  @ApiOperation({ 
    summary: 'Delete user (soft delete)',
    description: 'Soft delete a user. The user will be marked as deleted but their data will be retained. Cannot delete users with active orders or other associated data. Requires SUPER_ADMIN, PLATFORM_SUPPORT, or OPERATOR_ADMIN role.'
  })
  @ApiParam({ name: 'id', type: String, description: 'User UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete user with associated orders, payments, or other data' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async remove(@Param('id') id: string, @Request() req) {
    const user = req.user;
    return this.usersService.remove(id, user.id, user.operatorId, user.roles?.[0]?.code);
  }
}

