import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats(userId?: string, organizationId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const orgFilter = organizationId ? { organizationId } : {};

    const [
      totalContacts,
      totalDeals,
      totalTasks,
      totalCompanies,
      activeDeals,
      activeDealsData,
      pendingTasks,
      todayTasks,
      highPriorityTasks,
      recentContacts,
      recentActivities,
      funnel,
      wonDealsData,
      lostDealsCount,
      newClients,
    ] = await Promise.all([
      this.prisma.contact.count(userId ? { where: { ownerId: userId } } : undefined),
      this.prisma.deal.count(userId ? { where: { ownerId: userId } } : undefined),
      this.prisma.task.count(userId ? { where: { assigneeId: userId } } : undefined),
      this.prisma.company.count(userId ? { where: { ownerId: userId } } : undefined),
      this.prisma.deal.count({
        where: {
          ...(userId ? { ownerId: userId } : {}),
          closedAt: null,
        },
      }),
      this.prisma.deal.findMany({
        where: {
          ...(userId ? { ownerId: userId } : {}),
          closedAt: null,
        },
        select: { amount: true },
      }),
      this.prisma.task.count({
        where: {
          ...(userId ? { assigneeId: userId } : {}),
          status: 'PENDING',
        },
      }),
      this.prisma.task.count({
        where: {
          ...(userId ? { assigneeId: userId } : {}),
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          dueDate: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
      this.prisma.task.count({
        where: {
          ...(userId ? { assigneeId: userId } : {}),
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          priority: { in: ['HIGH', 'URGENT'] },
        },
      }),
      this.prisma.contact.count({
        where: {
          ...(userId ? { ownerId: userId } : {}),
          createdAt: { gte: weekAgo },
        },
      }),
      this.prisma.activity.findMany({
        where: userId ? { userId } : undefined,
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          user: { select: { firstName: true, lastName: true } },
        },
      }),
      this.getConversionFunnel(organizationId),
      // Won deals (organization-wide) for revenue / average / conversion KPIs
      this.prisma.deal.findMany({
        where: { ...orgFilter, status: 'SUCCESS' },
        select: { amount: true },
      }),
      this.prisma.deal.count({ where: { ...orgFilter, status: 'LOST' } }),
      this.prisma.contact.count({ where: { ...orgFilter, createdAt: { gte: weekAgo } } }),
    ]);

    const totalDealsAmount = activeDealsData.reduce((sum, deal) => sum + Number(deal.amount), 0);

    const wonCount = wonDealsData.length;
    const totalRevenue = wonDealsData.reduce((sum, deal) => sum + Number(deal.amount), 0);
    const avgDealSize = wonCount > 0 ? Math.round(totalRevenue / wonCount) : 0;
    const closedCount = wonCount + lostDealsCount;
    const conversionRate = closedCount > 0 ? Math.round((wonCount / closedCount) * 1000) / 10 : 0;

    // Calculate deals added today
    const dealsAddedToday = await this.prisma.deal.count({
      where: {
        ...(userId ? { ownerId: userId } : {}),
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    return {
      totalContacts,
      totalDeals,
      totalTasks,
      totalCompanies,
      activeDeals,
      totalDealsAmount,
      pendingTasks,
      todayTasks,
      highPriorityTasks,
      recentContacts,
      dealsAddedToday,
      recentActivities,
      funnel,
      // KPIs consumed by the analytics page
      totalRevenue,
      conversionRate,
      avgDealSize,
      newClients,
      wonDeals: wonCount,
      lostDeals: lostDealsCount,
    };
  }

  async getTodayTasks(userId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.prisma.task.findMany({
      where: {
        ...(userId ? { assigneeId: userId } : {}),
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        dueDate: {
          gte: today,
          lt: tomorrow,
        },
      },
      orderBy: { dueDate: 'asc' },
      take: 10,
      include: {
        contact: { select: { firstName: true, lastName: true } },
        deal: { select: { title: true } },
      },
    });
  }

  // Returns a day-by-day time series for the sales-dynamics chart.
  async getSalesAnalytics(startDate: Date, endDate: Date, organizationId?: string) {
    const deals = await this.prisma.deal.findMany({
      where: {
        ...(organizationId ? { organizationId } : {}),
        createdAt: { gte: startDate, lte: endDate },
      },
      select: { amount: true, createdAt: true },
    });

    const byDay = new Map<string, { revenue: number; deals: number }>();
    for (const deal of deals) {
      const key = deal.createdAt.toISOString().split('T')[0];
      const bucket = byDay.get(key) || { revenue: 0, deals: 0 };
      bucket.revenue += Number(deal.amount);
      bucket.deals += 1;
      byDay.set(key, bucket);
    }

    const dayMs = 24 * 60 * 60 * 1000;
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    const totalDays = Math.min(
      Math.max(Math.ceil((end.getTime() - start.getTime()) / dayMs) + 1, 1),
      31,
    );

    const series: { period: string; revenue: number; deals: number }[] = [];
    for (let i = 0; i < totalDays; i++) {
      const dt = new Date(start.getTime() + i * dayMs);
      const key = dt.toISOString().split('T')[0];
      const bucket = byDay.get(key) || { revenue: 0, deals: 0 };
      series.push({
        period: dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: bucket.revenue,
        deals: bucket.deals,
      });
    }
    return series;
  }

  // Returns a day-by-day activity series (calls / meetings / emails) for the bar chart.
  async getActivityAnalytics(organizationId?: string, days: number = 30) {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - (days - 1));

    const activities = await this.prisma.activity.findMany({
      where: {
        ...(organizationId ? { organizationId } : {}),
        createdAt: { gte: startDate },
      },
      select: { type: true, createdAt: true },
    });

    const classify = (type: string): 'calls' | 'meetings' | 'emails' => {
      const t = (type || '').toLowerCase();
      if (t.includes('task') || t.includes('meeting') || t.includes('booking')) return 'meetings';
      if (t.includes('contact') || t.includes('message') || t.includes('email') || t.includes('lead'))
        return 'emails';
      return 'calls';
    };

    const byDay = new Map<string, { calls: number; meetings: number; emails: number }>();
    for (const a of activities) {
      const key = a.createdAt.toISOString().split('T')[0];
      const bucket = byDay.get(key) || { calls: 0, meetings: 0, emails: 0 };
      bucket[classify(a.type)] += 1;
      byDay.set(key, bucket);
    }

    const dayMs = 24 * 60 * 60 * 1000;
    const cappedDays = Math.min(days, 14);
    const series: { day: string; calls: number; meetings: number; emails: number }[] = [];
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    for (let i = cappedDays - 1; i >= 0; i--) {
      const dt = new Date(base.getTime() - i * dayMs);
      const key = dt.toISOString().split('T')[0];
      const bucket = byDay.get(key) || { calls: 0, meetings: 0, emails: 0 };
      series.push({
        day: dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        ...bucket,
      });
    }
    return series;
  }

  async getConversionFunnel(organizationId?: string) {
    const stages = await this.prisma.stage.findMany({
      where: organizationId ? { pipeline: { organizationId } } : {},
      include: {
        deals: true,
      },
      orderBy: {
        order: 'asc',
      },
    });

    return stages.map(stage => ({
      id: stage.id,
      name: stage.name,
      color: stage.color,
      dealsCount: stage.deals.length,
      totalAmount: stage.deals.reduce((sum, deal) => sum + Number(deal.amount), 0),
    }));
  }

  // Lead distribution by source for the pie chart.
  async getLeadSources(organizationId?: string) {
    const leads = await this.prisma.lead.findMany({
      where: organizationId ? { organizationId } : {},
      select: { source: true },
    });

    const counts = new Map<string, number>();
    for (const lead of leads) {
      const source = lead.source || 'OTHER';
      counts.set(source, (counts.get(source) || 0) + 1);
    }

    return Array.from(counts.entries()).map(([source, count]) => ({ source, count }));
  }

  // Per-owner deal statistics for the "top managers" widget.
  async getManagerStats(organizationId?: string) {
    const deals = await this.prisma.deal.findMany({
      where: organizationId ? { organizationId } : {},
      select: {
        amount: true,
        status: true,
        ownerId: true,
        owner: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      },
    });

    const byOwner = new Map<
      string,
      { id: string; firstName: string; lastName: string; avatar: string | null; deals: number; won: number; revenue: number }
    >();

    for (const deal of deals) {
      if (!deal.owner) continue;
      const entry =
        byOwner.get(deal.ownerId) || {
          id: deal.owner.id,
          firstName: deal.owner.firstName,
          lastName: deal.owner.lastName,
          avatar: deal.owner.avatar,
          deals: 0,
          won: 0,
          revenue: 0,
        };
      entry.deals += 1;
      if (deal.status === 'SUCCESS') {
        entry.won += 1;
        entry.revenue += Number(deal.amount);
      }
      byOwner.set(deal.ownerId, entry);
    }

    return Array.from(byOwner.values())
      .map(m => ({
        ...m,
        name: `${m.firstName} ${m.lastName}`.trim(),
        conversion: m.deals > 0 ? Math.round((m.won / m.deals) * 100) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }
}
