import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { ReportQueryDto } from './dto/reports.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Generate report based on type and filters',
    description: 'Generate comprehensive reports for orders, revenue, performance metrics, or operator statistics. Reports include summaries, trends, and breakdowns based on the selected type and date range.'
  })
  @ApiQuery({ name: 'type', required: true, enum: ['ORDERS', 'REVENUE', 'PERFORMANCE', 'OPERATOR'], description: 'Report type', example: 'ORDERS' })
  @ApiQuery({ name: 'start_date', required: true, type: String, description: 'Start date (ISO format)', example: '2025-01-01' })
  @ApiQuery({ name: 'end_date', required: true, type: String, description: 'End date (ISO format)', example: '2025-01-31' })
  @ApiQuery({ name: 'operator_id', required: false, type: String, description: 'Filter by operator ID (UUID). Only SUPER_ADMIN can filter by operator.' })
  @ApiResponse({ status: 200, description: 'Report generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid report type, missing required parameters, or invalid date range' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions for requested report type' })
  async generateReport(@Query() query: ReportQueryDto, @Request() req) {
    const user = req.user;
    return this.reportsService.generateReport(
      query,
      user.id,
      user.operatorId,
      user.roles?.[0]?.code
    );
  }
}

