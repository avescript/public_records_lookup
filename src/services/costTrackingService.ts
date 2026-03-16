/**
 * Cost Tracking Service
 * Epic 9 Task 6: Agency Dashboard & Analytics
 *
 * Tier-based billing, usage tracking, and cost analytics system
 */

export interface CostTier {
  tier: 'basic' | 'premium' | 'enterprise';
  name: string;
  description: string;
  monthlyBase: number;
  limits: TierLimits;
  pricing: UsagePricing;
  features: string[];
}

export interface TierLimits {
  maxRequests: number;
  maxStorage: number; // MB
  maxDocuments: number;
  maxUsers: number;
  ocrIncluded: boolean;
  apiCallsIncluded: number;
}

export interface UsagePricing {
  perRequest: number; // after limit
  perMB: number; // after limit
  perDocument: number; // after limit
  perOCRPage: number;
  perAPICall: number;
}

export interface UsageRecord {
  agencyId: string;
  date: string;
  requests: number;
  documents: number;
  storageUsed: number; // MB
  ocrPages: number;
  apiCalls: number;
  processingTime: number; // minutes
  costs: UsageCosts;
}

export interface UsageCosts {
  baseCost: number;
  requestOverage: number;
  storageOverage: number;
  documentOverage: number;
  ocrCosts: number;
  apiCosts: number;
  total: number;
}

export interface BillingCycle {
  agencyId: string;
  startDate: string;
  endDate: string;
  tier: string;
  totalCost: number;
  usageRecords: UsageRecord[];
  breakdown: CostBreakdown;
  status: 'draft' | 'pending' | 'paid' | 'overdue';
  invoiceId?: string;
}

export interface CostBreakdown {
  baseCost: number;
  overageCharges: number;
  ocrCharges: number;
  apiCharges: number;
  taxes: number;
  discounts: number;
  total: number;
}

export interface CostAlert {
  id: string;
  agencyId: string;
  type:
    | 'budget_warning'
    | 'budget_exceeded'
    | 'usage_spike'
    | 'tier_upgrade_recommended';
  threshold: number;
  currentValue: number;
  message: string;
  timestamp: string;
  resolved: boolean;
}

export interface CostProjection {
  agencyId: string;
  currentPeriod: {
    daysElapsed: number;
    daysRemaining: number;
    currentCost: number;
    projectedCost: number;
  };
  trending: {
    dailyAverage: number;
    weeklyTrend: number;
    monthlyProjection: number;
  };
  recommendations: CostRecommendation[];
}

export interface CostRecommendation {
  type: 'tier_change' | 'usage_optimization' | 'budget_adjustment';
  title: string;
  description: string;
  impact: {
    monthlySavings?: number;
    efficiencyGain?: number;
    riskReduction?: number;
  };
  priority: 'low' | 'medium' | 'high';
}

/**
 * Cost Tracking Service Class
 */
export class CostTrackingService {
  private usageRecords: Map<string, UsageRecord[]> = new Map();
  private billingCycles: Map<string, BillingCycle[]> = new Map();
  private costAlerts: Map<string, CostAlert[]> = new Map();

  // Tier Definitions
  private readonly tiers: Record<string, CostTier> = {
    basic: {
      tier: 'basic',
      name: 'Basic Plan',
      description: 'Essential features for small agencies',
      monthlyBase: 299,
      limits: {
        maxRequests: 500,
        maxStorage: 5000, // 5GB
        maxDocuments: 2000,
        maxUsers: 5,
        ocrIncluded: false,
        apiCallsIncluded: 1000,
      },
      pricing: {
        perRequest: 0.5,
        perMB: 0.1,
        perDocument: 0.25,
        perOCRPage: 0.05,
        perAPICall: 0.01,
      },
      features: [
        'Basic request processing',
        'Standard redaction tools',
        'Email support',
        'Basic reporting',
      ],
    },
    premium: {
      tier: 'premium',
      name: 'Premium Plan',
      description: 'Advanced features for growing agencies',
      monthlyBase: 899,
      limits: {
        maxRequests: 2000,
        maxStorage: 20000, // 20GB
        maxDocuments: 10000,
        maxUsers: 25,
        ocrIncluded: true,
        apiCallsIncluded: 5000,
      },
      pricing: {
        perRequest: 0.35,
        perMB: 0.08,
        perDocument: 0.2,
        perOCRPage: 0.03,
        perAPICall: 0.008,
      },
      features: [
        'Advanced processing workflows',
        'OCR included (500 pages/month)',
        'Advanced redaction AI',
        'Priority support',
        'Advanced analytics',
        'API access',
      ],
    },
    enterprise: {
      tier: 'enterprise',
      name: 'Enterprise Plan',
      description: 'Full-scale solution for large agencies',
      monthlyBase: 2499,
      limits: {
        maxRequests: 10000,
        maxStorage: 100000, // 100GB
        maxDocuments: 50000,
        maxUsers: 100,
        ocrIncluded: true,
        apiCallsIncluded: 25000,
      },
      pricing: {
        perRequest: 0.25,
        perMB: 0.05,
        perDocument: 0.15,
        perOCRPage: 0.02,
        perAPICall: 0.005,
      },
      features: [
        'Unlimited processing workflows',
        'OCR included (2000 pages/month)',
        'AI-powered redaction',
        'Dedicated support manager',
        'Custom integrations',
        'Full API access',
        'Advanced security features',
        'Custom reporting',
      ],
    },
  };

  /**
   * Record usage for an agency
   */
  async recordUsage(
    agencyId: string,
    usage: {
      requests: number;
      documents: number;
      storageUsed: number;
      ocrPages: number;
      apiCalls: number;
      processingTime: number;
    }
  ): Promise<UsageRecord> {
    const date = new Date().toISOString().split('T')[0];
    const tier = await this.getAgencyTier(agencyId);
    const costs = this.calculateUsageCosts(tier, usage);

    const record: UsageRecord = {
      agencyId,
      date,
      ...usage,
      costs,
    };

    // Store record
    const records = this.usageRecords.get(agencyId) || [];
    records.push(record);
    this.usageRecords.set(agencyId, records);

    // Check for alerts
    await this.checkCostAlerts(agencyId, record);

    return record;
  }

  /**
   * Get current month usage for agency
   */
  async getCurrentUsage(agencyId: string): Promise<UsageRecord[]> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startDateStr = startOfMonth.toISOString().split('T')[0];

    const records = this.usageRecords.get(agencyId) || [];
    return records.filter(record => record.date >= startDateStr);
  }

  /**
   * Calculate total costs for current billing period
   */
  async getCurrentPeriodCost(agencyId: string): Promise<number> {
    const usage = await this.getCurrentUsage(agencyId);
    return usage.reduce((total, record) => total + record.costs.total, 0);
  }

  /**
   * Get cost projection for agency
   */
  async getCostProjection(agencyId: string): Promise<CostProjection> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const daysElapsed = Math.floor(
      (now.getTime() - startOfMonth.getTime()) / (24 * 60 * 60 * 1000)
    );
    const daysInMonth = endOfMonth.getDate();
    const daysRemaining = daysInMonth - daysElapsed;

    const currentUsage = await this.getCurrentUsage(agencyId);
    const currentCost = currentUsage.reduce(
      (sum, record) => sum + record.costs.total,
      0
    );

    // Calculate daily average
    const dailyAverage = daysElapsed > 0 ? currentCost / daysElapsed : 0;
    const projectedCost = dailyAverage * daysInMonth;

    // Calculate trends
    const weeklyTrend = this.calculateWeeklyTrend(currentUsage);
    const monthlyProjection = Math.max(
      projectedCost,
      currentCost + dailyAverage * daysRemaining
    );

    // Generate recommendations
    const recommendations = await this.generateCostRecommendations(agencyId, {
      currentCost,
      projectedCost: monthlyProjection,
      usage: currentUsage,
    });

    return {
      agencyId,
      currentPeriod: {
        daysElapsed,
        daysRemaining,
        currentCost,
        projectedCost: monthlyProjection,
      },
      trending: {
        dailyAverage,
        weeklyTrend,
        monthlyProjection,
      },
      recommendations,
    };
  }

  /**
   * Generate billing cycle
   */
  async generateBillingCycle(
    agencyId: string,
    startDate: string,
    endDate: string
  ): Promise<BillingCycle> {
    const tier = await this.getAgencyTier(agencyId);
    const usage = await this.getUsageForPeriod(agencyId, startDate, endDate);

    // Calculate total usage
    const totalUsage = usage.reduce(
      (acc, record) => ({
        requests: acc.requests + record.requests,
        documents: acc.documents + record.documents,
        storageUsed: Math.max(acc.storageUsed, record.storageUsed), // Max storage used
        ocrPages: acc.ocrPages + record.ocrPages,
        apiCalls: acc.apiCalls + record.apiCalls,
      }),
      {
        requests: 0,
        documents: 0,
        storageUsed: 0,
        ocrPages: 0,
        apiCalls: 0,
      }
    );

    // Calculate costs
    const tierConfig = this.tiers[tier];
    const baseCost = tierConfig.monthlyBase;

    // Calculate overages
    const requestOverage = Math.max(
      0,
      totalUsage.requests - tierConfig.limits.maxRequests
    );
    const storageOverage = Math.max(
      0,
      totalUsage.storageUsed - tierConfig.limits.maxStorage
    );
    const documentOverage = Math.max(
      0,
      totalUsage.documents - tierConfig.limits.maxDocuments
    );
    const apiOverage = Math.max(
      0,
      totalUsage.apiCalls - tierConfig.limits.apiCallsIncluded
    );

    // Calculate charges
    const overageCharges =
      requestOverage * tierConfig.pricing.perRequest +
      storageOverage * tierConfig.pricing.perMB +
      documentOverage * tierConfig.pricing.perDocument +
      apiOverage * tierConfig.pricing.perAPICall;

    const ocrCharges = tierConfig.limits.ocrIncluded
      ? 0
      : totalUsage.ocrPages * tierConfig.pricing.perOCRPage;

    const subtotal = baseCost + overageCharges + ocrCharges;
    const taxes = subtotal * 0.08; // 8% tax rate
    const total = subtotal + taxes;

    const breakdown: CostBreakdown = {
      baseCost,
      overageCharges,
      ocrCharges,
      apiCharges: apiOverage * tierConfig.pricing.perAPICall,
      taxes,
      discounts: 0,
      total,
    };

    const billingCycle: BillingCycle = {
      agencyId,
      startDate,
      endDate,
      tier,
      totalCost: total,
      usageRecords: usage,
      breakdown,
      status: 'draft',
      invoiceId: `INV-${agencyId}-${Date.now()}`,
    };

    // Store billing cycle
    const cycles = this.billingCycles.get(agencyId) || [];
    cycles.push(billingCycle);
    this.billingCycles.set(agencyId, cycles);

    return billingCycle;
  }

  /**
   * Get available tiers
   */
  getTiers(): CostTier[] {
    return Object.values(this.tiers);
  }

  /**
   * Get tier information
   */
  getTier(tier: string): CostTier | null {
    return this.tiers[tier] || null;
  }

  /**
   * Recommend tier for agency based on usage
   */
  async recommendTier(agencyId: string): Promise<{
    currentTier: string;
    recommendedTier: string;
    reasoning: string;
    potentialSavings?: number;
    potentialCosts?: number;
  }> {
    const currentTier = await this.getAgencyTier(agencyId);
    const usage = await this.getCurrentUsage(agencyId);

    if (usage.length === 0) {
      return {
        currentTier,
        recommendedTier: currentTier,
        reasoning: 'Insufficient usage data for recommendation',
      };
    }

    // Calculate average monthly usage
    const avgUsage = usage.reduce(
      (acc, record) => ({
        requests: acc.requests + record.requests,
        documents: acc.documents + record.documents,
        storageUsed: Math.max(acc.storageUsed, record.storageUsed),
        ocrPages: acc.ocrPages + record.ocrPages,
        apiCalls: acc.apiCalls + record.apiCalls,
      }),
      {
        requests: 0,
        documents: 0,
        storageUsed: 0,
        ocrPages: 0,
        apiCalls: 0,
      }
    );

    // Calculate costs for each tier
    const tierCosts = Object.entries(this.tiers).map(
      ([tierName, tierConfig]) => ({
        tier: tierName,
        cost: this.calculateUsageCosts(tierName, avgUsage).total,
      })
    );

    // Find most cost-effective tier
    const cheapestTier = tierCosts.reduce((prev, curr) =>
      curr.cost < prev.cost ? curr : prev
    );

    const currentCost = this.calculateUsageCosts(currentTier, avgUsage).total;
    const recommendedCost = cheapestTier.cost;

    let reasoning = '';
    let potentialSavings = undefined;
    let potentialCosts = undefined;

    if (cheapestTier.tier === currentTier) {
      reasoning = 'Current tier is optimal for your usage patterns';
    } else if (recommendedCost < currentCost) {
      reasoning = `Downgrading to ${cheapestTier.tier} could save money while meeting your needs`;
      potentialSavings = currentCost - recommendedCost;
    } else {
      reasoning = `Upgrading to ${cheapestTier.tier} provides better value for your usage level`;
      potentialCosts = recommendedCost - currentCost;
    }

    return {
      currentTier,
      recommendedTier: cheapestTier.tier,
      reasoning,
      potentialSavings,
      potentialCosts,
    };
  }

  /**
   * Get cost alerts for agency
   */
  async getCostAlerts(agencyId: string): Promise<CostAlert[]> {
    return this.costAlerts.get(agencyId) || [];
  }

  /**
   * Resolve cost alert
   */
  async resolveCostAlert(agencyId: string, alertId: string): Promise<void> {
    const alerts = this.costAlerts.get(agencyId) || [];
    const alert = alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
    }
  }

  // Private helper methods

  private async getAgencyTier(agencyId: string): Promise<string> {
    // Mock tier assignment - in production, this would come from database
    const tierMap: Record<string, string> = {
      police: 'enterprise',
      fire: 'enterprise',
      finance: 'premium',
      parks: 'basic',
      health: 'premium',
    };
    return tierMap[agencyId] || 'basic';
  }

  private calculateUsageCosts(
    tier: string,
    usage: {
      requests: number;
      documents: number;
      storageUsed: number;
      ocrPages: number;
      apiCalls: number;
    }
  ): UsageCosts {
    const tierConfig = this.tiers[tier];
    if (!tierConfig) {
      throw new Error(`Unknown tier: ${tier}`);
    }

    const baseCost = tierConfig.monthlyBase;

    // Calculate overages
    const requestOverage = Math.max(
      0,
      usage.requests - tierConfig.limits.maxRequests
    );
    const storageOverage = Math.max(
      0,
      usage.storageUsed - tierConfig.limits.maxStorage
    );
    const documentOverage = Math.max(
      0,
      usage.documents - tierConfig.limits.maxDocuments
    );
    const apiOverage = Math.max(
      0,
      usage.apiCalls - tierConfig.limits.apiCallsIncluded
    );

    // Calculate costs
    const requestOverageCost = requestOverage * tierConfig.pricing.perRequest;
    const storageOverageCost = storageOverage * tierConfig.pricing.perMB;
    const documentOverageCost =
      documentOverage * tierConfig.pricing.perDocument;
    const ocrCosts = tierConfig.limits.ocrIncluded
      ? 0
      : usage.ocrPages * tierConfig.pricing.perOCRPage;
    const apiCosts = apiOverage * tierConfig.pricing.perAPICall;

    const total =
      baseCost +
      requestOverageCost +
      storageOverageCost +
      documentOverageCost +
      ocrCosts +
      apiCosts;

    return {
      baseCost,
      requestOverage: requestOverageCost,
      storageOverage: storageOverageCost,
      documentOverage: documentOverageCost,
      ocrCosts,
      apiCosts,
      total: Math.round(total * 100) / 100, // Round to cents
    };
  }

  private async getUsageForPeriod(
    agencyId: string,
    startDate: string,
    endDate: string
  ): Promise<UsageRecord[]> {
    const records = this.usageRecords.get(agencyId) || [];
    return records.filter(
      record => record.date >= startDate && record.date <= endDate
    );
  }

  private async checkCostAlerts(
    agencyId: string,
    usage: UsageRecord
  ): Promise<void> {
    const currentUsage = await this.getCurrentUsage(agencyId);
    const totalCost = currentUsage.reduce(
      (sum, record) => sum + record.costs.total,
      0
    );

    const tier = await this.getAgencyTier(agencyId);
    const tierConfig = this.tiers[tier];
    const budgetThreshold = tierConfig.monthlyBase * 1.5; // 150% of base cost

    const alerts: CostAlert[] = [];

    // Budget warning (80% of threshold)
    if (totalCost > budgetThreshold * 0.8) {
      alerts.push({
        id: `budget_warning_${Date.now()}`,
        agencyId,
        type: 'budget_warning',
        threshold: budgetThreshold * 0.8,
        currentValue: totalCost,
        message: `Current costs (${totalCost.toFixed(2)}) are approaching budget threshold`,
        timestamp: new Date().toISOString(),
        resolved: false,
      });
    }

    // Budget exceeded
    if (totalCost > budgetThreshold) {
      alerts.push({
        id: `budget_exceeded_${Date.now()}`,
        agencyId,
        type: 'budget_exceeded',
        threshold: budgetThreshold,
        currentValue: totalCost,
        message: `Current costs (${totalCost.toFixed(2)}) exceed budget threshold`,
        timestamp: new Date().toISOString(),
        resolved: false,
      });
    }

    // Store alerts
    if (alerts.length > 0) {
      const existingAlerts = this.costAlerts.get(agencyId) || [];
      this.costAlerts.set(agencyId, [...existingAlerts, ...alerts]);
    }
  }

  private calculateWeeklyTrend(usage: UsageRecord[]): number {
    if (usage.length < 7) return 0;

    const recentWeek = usage.slice(-7);
    const previousWeek = usage.slice(-14, -7);

    if (previousWeek.length === 0) return 0;

    const recentCost = recentWeek.reduce(
      (sum, record) => sum + record.costs.total,
      0
    );
    const previousCost = previousWeek.reduce(
      (sum, record) => sum + record.costs.total,
      0
    );

    return previousCost > 0
      ? ((recentCost - previousCost) / previousCost) * 100
      : 0;
  }

  private async generateCostRecommendations(
    agencyId: string,
    data: {
      currentCost: number;
      projectedCost: number;
      usage: UsageRecord[];
    }
  ): Promise<CostRecommendation[]> {
    const recommendations: CostRecommendation[] = [];
    const tier = await this.getAgencyTier(agencyId);
    const tierConfig = this.tiers[tier];

    // High usage recommendation
    if (data.projectedCost > tierConfig.monthlyBase * 2) {
      recommendations.push({
        type: 'tier_change',
        title: 'Consider Tier Upgrade',
        description:
          'Your usage patterns suggest a higher tier might be more cost-effective',
        impact: {
          monthlySavings: data.projectedCost * 0.15,
        },
        priority: 'high',
      });
    }

    // Usage optimization
    if (
      data.usage.some(
        record => record.costs.ocrCosts > record.costs.baseCost * 0.3
      )
    ) {
      recommendations.push({
        type: 'usage_optimization',
        title: 'Optimize OCR Usage',
        description: 'Consider pre-processing documents to reduce OCR costs',
        impact: {
          monthlySavings: data.projectedCost * 0.1,
          efficiencyGain: 15,
        },
        priority: 'medium',
      });
    }

    return recommendations;
  }
}

// Export singleton instance
export const costTrackingService = new CostTrackingService();
export default costTrackingService;
