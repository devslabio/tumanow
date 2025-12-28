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
    description: 'Returns role-based dashboard statistics and trends',
  })
  @ApiQuery({ name: 'start_date', required: false, type: String })
  @ApiQuery({ name: 'end_date', required: false, type: String })
  @ApiQuery({ name: 'operator_id', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Dashboard statistics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getDashboard(@Request() req, @Query() query: DashboardQueryDto) {
    const user = req.user;
    
    // Get user with roles from database
    const userWithRoles = await this.dashboardService.getUserWithRoles(user.id);
    const userRole = userWithRoles?.user_roles?.[0]?.role?.code || userWithRoles?.user_roles?.[0]?.role?.name || 'CUSTOMER';
    const operatorId = userWithRoles?.operator_id || null;
    
    return this.dashboardService.getDashboardStats(
      user.id,
      userRole,
      operatorId,
      query,
    );
  }
}

