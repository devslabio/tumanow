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
import { SettingsService } from './settings.service';
import { CreateSettingDto, UpdateSettingDto, QuerySettingsDto } from './dto/settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Settings')
@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'PLATFORM_SUPPORT')
  @ApiOperation({ 
    summary: 'Create a new system setting',
    description: 'Create a new system-wide setting. Settings are key-value pairs organized by category (e.g., email, sms, payment). Sensitive values can be encrypted. Only SUPER_ADMIN and PLATFORM_SUPPORT can create settings.'
  })
  @ApiBody({ type: CreateSettingDto, description: 'Setting creation data' })
  @ApiResponse({ status: 201, description: 'Setting created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires SUPER_ADMIN or PLATFORM_SUPPORT role' })
  @ApiResponse({ status: 409, description: 'Setting key already exists' })
  async create(@Body() createSettingDto: CreateSettingDto, @Request() req) {
    return this.settingsService.create(createSettingDto, req.user.id);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'PLATFORM_SUPPORT', 'OPERATOR_ADMIN')
  @ApiOperation({ 
    summary: 'Get all system settings',
    description: 'Retrieve all system settings with optional filtering by category or search term. Encrypted values are automatically decrypted for authorized users.'
  })
  @ApiQuery({ name: 'category', required: false, type: String, description: 'Filter by category', example: 'email' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search in key or description', example: 'smtp' })
  @ApiResponse({ status: 200, description: 'Settings retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async findAll(@Query() query: QuerySettingsDto) {
    return this.settingsService.findAll(query);
  }

  @Get('category/:category')
  @Roles('SUPER_ADMIN', 'PLATFORM_SUPPORT', 'OPERATOR_ADMIN')
  @ApiOperation({ 
    summary: 'Get settings by category',
    description: 'Retrieve all settings for a specific category (e.g., email, sms, payment, general).'
  })
  @ApiParam({ name: 'category', type: String, description: 'Setting category', example: 'email' })
  @ApiResponse({ status: 200, description: 'Settings retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async getByCategory(@Param('category') category: string) {
    return this.settingsService.getByCategory(category);
  }

  @Get(':key')
  @Roles('SUPER_ADMIN', 'PLATFORM_SUPPORT', 'OPERATOR_ADMIN')
  @ApiOperation({ 
    summary: 'Get setting by key',
    description: 'Retrieve a specific setting by its key (e.g., email.smtp.host, payment.gateway.url). Encrypted values are automatically decrypted.'
  })
  @ApiParam({ name: 'key', type: String, description: 'Setting key', example: 'email.smtp.host' })
  @ApiResponse({ status: 200, description: 'Setting retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Setting not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async findOne(@Param('key') key: string) {
    return this.settingsService.findOne(key);
  }

  @Patch(':key')
  @Roles('SUPER_ADMIN', 'PLATFORM_SUPPORT')
  @ApiOperation({ 
    summary: 'Update system setting',
    description: 'Update a system setting. Only specified fields will be updated. If is_encrypted is true, the value will be encrypted before storage. Only SUPER_ADMIN and PLATFORM_SUPPORT can update settings.'
  })
  @ApiParam({ name: 'key', type: String, description: 'Setting key', example: 'email.smtp.host' })
  @ApiBody({ type: UpdateSettingDto, description: 'Setting update data (all fields optional)' })
  @ApiResponse({ status: 200, description: 'Setting updated successfully' })
  @ApiResponse({ status: 404, description: 'Setting not found' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires SUPER_ADMIN or PLATFORM_SUPPORT role' })
  async update(@Param('key') key: string, @Body() updateSettingDto: UpdateSettingDto, @Request() req) {
    return this.settingsService.update(key, updateSettingDto, req.user.id);
  }

  @Delete(':key')
  @Roles('SUPER_ADMIN', 'PLATFORM_SUPPORT')
  @ApiOperation({ 
    summary: 'Delete system setting',
    description: 'Delete a system setting permanently. Only SUPER_ADMIN and PLATFORM_SUPPORT can delete settings.'
  })
  @ApiParam({ name: 'key', type: String, description: 'Setting key', example: 'email.smtp.host' })
  @ApiResponse({ status: 200, description: 'Setting deleted successfully' })
  @ApiResponse({ status: 404, description: 'Setting not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires SUPER_ADMIN or PLATFORM_SUPPORT role' })
  async remove(@Param('key') key: string) {
    return this.settingsService.remove(key);
  }
}

