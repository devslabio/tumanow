import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AuditLogsService } from './audit-logs.service';
import { QueryAuditLogsDto } from './dto/audit-logs.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Audit Logs')
@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'PLATFORM_SUPPORT', 'OPERATOR_ADMIN')
  @ApiOperation({ summary: 'Get all audit logs with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Audit logs retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'operator_id', required: false, type: String, description: 'Filter by Operator ID' })
  @ApiQuery({ name: 'user_id', required: false, type: String, description: 'Filter by User ID' })
  @ApiQuery({ name: 'action', required: false, type: String, description: 'Filter by Action' })
  @ApiQuery({ name: 'entity_type', required: false, type: String, description: 'Filter by Entity Type' })
  @ApiQuery({ name: 'entity_id', required: false, type: String, description: 'Filter by Entity ID' })
  @ApiQuery({ name: 'start_date', required: false, type: String, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'end_date', required: false, type: String, description: 'End date (ISO format)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search in action, entity_type, or entity_id' })
  async findAll(@Query() query: QueryAuditLogsDto, @Request() req) {
    const user = req.user;
    return this.auditLogsService.findAll(query, user.id, user.operatorId, user.roles?.[0]?.code);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'PLATFORM_SUPPORT', 'OPERATOR_ADMIN')
  @ApiOperation({ summary: 'Get audit log by ID' })
  @ApiResponse({ status: 200, description: 'Audit log retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Audit log not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(@Param('id') id: string, @Request() req) {
    const user = req.user;
    return this.auditLogsService.findOne(id, user.id, user.operatorId, user.roles?.[0]?.code);
  }

  @Get('entity/:entityType/:entityId')
  @Roles('SUPER_ADMIN', 'PLATFORM_SUPPORT', 'OPERATOR_ADMIN')
  @ApiOperation({ summary: 'Get audit logs for a specific entity' })
  @ApiResponse({ status: 200, description: 'Audit logs retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Request() req
  ) {
    const user = req.user;
    return this.auditLogsService.findByEntity(entityType, entityId, user.id, user.operatorId, user.roles?.[0]?.code);
  }
}

