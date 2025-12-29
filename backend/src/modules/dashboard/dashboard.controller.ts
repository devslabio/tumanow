import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { DashboardQueryDto } from './dto/dashboard.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({
    summary: 'Get dashboard statistics',
    description: 'Returns role-based dashboard statistics and trends. The response varies based on the user\'s role: SUPER_ADMIN sees platform-wide stats, OPERATOR_ADMIN sees operator-specific stats, DISPATCHER sees dispatch-related stats, and CUSTOMER sees their own order stats.',
  })
  @ApiQuery({ name: 'start_date', required: false, type: String, description: 'Start date for statistics (ISO format)', example: '2025-01-01' })
  @ApiQuery({ name: 'end_date', required: false, type: String, description: 'End date for statistics (ISO format)', example: '2025-01-31' })
  @ApiQuery({ name: 'operator_id', required: false, type: String, description: 'Filter by operator ID (UUID). Only SUPER_ADMIN can filter by operator.' })
  @ApiResponse({ status: 200, description: 'Dashboard statistics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async getDashboard(@Request() req, @Query() query: DashboardQueryDto) {
    const user = req.user;
    
    // Get user with roles from database
    const userWithRoles = await this.dashboardService.getUserWithRoles(user.id);
    const userRole = (userWithRoles as any)?.user_roles?.[0]?.role?.code || (userWithRoles as any)?.user_roles?.[0]?.role?.name || 'CUSTOMER';
    const operatorId = (userWithRoles as any)?.operator_id || null;
    
    return this.dashboardService.getDashboardStats(
      user.id,
      userRole,
      operatorId,
      query,
    );
  }
}

