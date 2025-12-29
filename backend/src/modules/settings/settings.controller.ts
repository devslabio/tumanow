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
  @ApiOperation({ summary: 'Create a new system setting' })
  @ApiResponse({ status: 201, description: 'Setting created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 409, description: 'Setting key already exists' })
  async create(@Body() createSettingDto: CreateSettingDto, @Request() req) {
    return this.settingsService.create(createSettingDto, req.user.id);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'PLATFORM_SUPPORT', 'OPERATOR_ADMIN')
  @ApiOperation({ summary: 'Get all system settings' })
  @ApiResponse({ status: 200, description: 'Settings retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@Query() query: QuerySettingsDto) {
    return this.settingsService.findAll(query);
  }

  @Get('category/:category')
  @Roles('SUPER_ADMIN', 'PLATFORM_SUPPORT', 'OPERATOR_ADMIN')
  @ApiOperation({ summary: 'Get settings by category' })
  @ApiResponse({ status: 200, description: 'Settings retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getByCategory(@Param('category') category: string) {
    return this.settingsService.getByCategory(category);
  }

  @Get(':key')
  @Roles('SUPER_ADMIN', 'PLATFORM_SUPPORT', 'OPERATOR_ADMIN')
  @ApiOperation({ summary: 'Get setting by key' })
  @ApiResponse({ status: 200, description: 'Setting retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Setting not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(@Param('key') key: string) {
    return this.settingsService.findOne(key);
  }

  @Patch(':key')
  @Roles('SUPER_ADMIN', 'PLATFORM_SUPPORT')
  @ApiOperation({ summary: 'Update system setting' })
  @ApiResponse({ status: 200, description: 'Setting updated successfully' })
  @ApiResponse({ status: 404, description: 'Setting not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async update(@Param('key') key: string, @Body() updateSettingDto: UpdateSettingDto, @Request() req) {
    return this.settingsService.update(key, updateSettingDto, req.user.id);
  }

  @Delete(':key')
  @Roles('SUPER_ADMIN', 'PLATFORM_SUPPORT')
  @ApiOperation({ summary: 'Delete system setting' })
  @ApiResponse({ status: 200, description: 'Setting deleted successfully' })
  @ApiResponse({ status: 404, description: 'Setting not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async remove(@Param('key') key: string) {
    return this.settingsService.remove(key);
  }
}

