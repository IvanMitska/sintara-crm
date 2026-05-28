import {
  Controller,
  Get,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentOrg } from '../auth/decorators/current-org.decorator';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Получить статистику для дашборда' })
  getDashboardStats(@CurrentUser() user: any, @CurrentOrg() organizationId: string) {
    return this.analyticsService.getDashboardStats(user.id, organizationId);
  }

  @Get('today-tasks')
  @ApiOperation({ summary: 'Получить задачи на сегодня' })
  getTodayTasks(@CurrentUser() user: any) {
    return this.analyticsService.getTodayTasks(user.id);
  }

  @Get('sales')
  @ApiOperation({ summary: 'Получить аналитику продаж' })
  getSalesAnalytics(
    @CurrentOrg() organizationId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.analyticsService.getSalesAnalytics(
      new Date(startDate),
      new Date(endDate),
      organizationId,
    );
  }

  @Get('activity')
  @ApiOperation({ summary: 'Получить аналитику активности' })
  getActivityAnalytics(
    @CurrentOrg() organizationId: string,
    @Query('days') days?: string,
  ) {
    return this.analyticsService.getActivityAnalytics(
      organizationId,
      days ? parseInt(days) : 30,
    );
  }

  @Get('funnel')
  @ApiOperation({ summary: 'Получить воронку конверсии' })
  getConversionFunnel(@CurrentOrg() organizationId: string) {
    return this.analyticsService.getConversionFunnel(organizationId);
  }

  @Get('lead-sources')
  @ApiOperation({ summary: 'Получить распределение лидов по источникам' })
  getLeadSources(@CurrentOrg() organizationId: string) {
    return this.analyticsService.getLeadSources(organizationId);
  }

  @Get('managers')
  @ApiOperation({ summary: 'Получить статистику по менеджерам' })
  getManagerStats(@CurrentOrg() organizationId: string) {
    return this.analyticsService.getManagerStats(organizationId);
  }
}
