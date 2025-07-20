// lib/types/loyalty.types.ts

import { 
  MembershipTier, 
  DiscountType, 
  TransactionType, 
  BenefitType 
} from '~/service/loyalty';


/* -------------------------------------------------------------------------- */
/*                            Extended Types                                  */
/* -------------------------------------------------------------------------- */

// Enhanced Dashboard Types
export interface LoyaltyDashboardData {
  user: LoyaltyUserProfile;
  summary: LoyaltySummary;
  recentActivity: RecentActivity[];
  recommendations: LoyaltyRecommendation[];
}

export interface LoyaltyUserProfile {
  userId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  memberSince: string;
  totalSpent?: number;
  averageOrderValue?: number;
  orderFrequency?: string;
}

export interface LoyaltySummary {
  currentPoints: number;
  currentTier: MembershipTier;
  tierProgress: TierProgressDetails;
  pointsThisMonth: number;
  pointsLastMonth: number;
  lifetimePointsEarned: number;
  lifetimePointsRedeemed: number;
  activeCouponsCount: number;
  expiredCouponsCount: number;
  usedCouponsCount: number;
  availableRewardsCount: number;
  nextTierBenefits: string[];
}

export interface TierProgressDetails {
  currentTier: MembershipTier;
  currentPoints: number;
  nextTier: MembershipTier | null;
  pointsNeeded: number;
  progressPercentage: number;
  tierStartPoints: number;
  nextTierThreshold: number;
}

export interface RecentActivity {
  id: string;
  type: 'POINTS_EARNED' | 'POINTS_REDEEMED' | 'COUPON_GENERATED' | 'REWARD_REDEEMED' | 'TIER_UPGRADE';
  description: string;
  points?: number;
  date: string;
  icon: string;
  color: string;
}

export interface LoyaltyRecommendation {
  id: string;
  type: 'COUPON_PACKAGE' | 'REWARD' | 'TIER_UPGRADE' | 'SPENDING_GOAL';
  title: string;
  description: string;
  actionText: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  pointsCost?: number;
  potentialSavings?: number;
}

// Coupon Management Types
export interface CouponFilter {
  status: 'ALL' | 'ACTIVE' | 'USED' | 'EXPIRED';
  discountType?: DiscountType;
  minValue?: number;
  maxValue?: number;
  sortBy: 'DATE_CREATED' | 'DATE_EXPIRES' | 'DISCOUNT_VALUE';
  sortOrder: 'ASC' | 'DESC';
}

export interface CouponStats {
  total: number;
  active: number;
  used: number;
  expired: number;
  totalSavings: number;
  averageDiscount: number;
}

// Reward Management Types
export interface RewardFilter {
  affordable: boolean;
  category?: string;
  maxPoints?: number;
  sortBy: 'POINTS_COST' | 'NAME' | 'POPULARITY';
  sortOrder: 'ASC' | 'DESC';
}

export interface RewardCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  count: number;
}

// Transaction Analysis Types
export interface TransactionFilter {
  type?: TransactionType;
  dateFrom?: string;
  dateTo?: string;
  minPoints?: number;
  maxPoints?: number;
  page: number;
  limit: number;
}

export interface TransactionAnalytics {
  totalEarned: number;
  totalRedeemed: number;
  netBalance: number;
  averageEarning: number;
  averageRedemption: number;
  monthlyTrend: MonthlyPointsTrend[];
  topSources: TransactionSource[];
}

export interface MonthlyPointsTrend {
  month: string;
  earned: number;
  redeemed: number;
  net: number;
}

export interface TransactionSource {
  source: string;
  count: number;
  totalPoints: number;
  percentage: number;
}

// Tier Management Types
export interface TierComparisonData {
  tier: MembershipTier;
  pointsRequired: number;
  benefits: TierBenefitSummary[];
  perks: string[];
  upgradeCost: number;
  estimatedSavings: number;
}

export interface TierBenefitSummary {
  type: BenefitType;
  description: string;
  value: string;
  active: boolean;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Form Types
export interface GenerateCouponForm {
  discountType: DiscountType;
  discountValue: number;
  minPurchaseAmount: number;
  maxDiscountAmount?: number;
  expirationDays: number;
  usageLimit: number;
  isStackable: boolean;
  priorityLevel: number;
}

export interface RedeemRewardForm {
  rewardId: string;
  confirmationRequired: boolean;
  termsAccepted: boolean;
}

// Notification Types
export interface LoyaltyNotification {
  id: string;
  type: 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionRequired?: boolean;
  actionText?: string;
  actionUrl?: string;
}

/* -------------------------------------------------------------------------- */
/*                           Utility Functions                               */
/* -------------------------------------------------------------------------- */

export class LoyaltyUtils {
  /**
   * Calculate tier progress percentage
   */
  static calculateTierProgress(
    currentPoints: number, 
    currentTier: MembershipTier
  ): TierProgressDetails {
    const tierThresholds = {
      [MembershipTier.BRONZE]: { min: 0, max: 500 },
      [MembershipTier.SILVER]: { min: 500, max: 1000 },
      [MembershipTier.GOLD]: { min: 1000, max: 2500 },
      [MembershipTier.PLATINUM]: { min: 2500, max: 5000 },
      [MembershipTier.DIAMOND]: { min: 5000, max: 5000 },
    };

    const current = tierThresholds[currentTier];
    const nextTier = this.getNextTier(currentTier);
    const nextThreshold = nextTier ? tierThresholds[nextTier].min : current.max;
    
    const pointsInCurrentTier = currentPoints - current.min;
    const pointsNeeded = nextThreshold - currentPoints;
    const progressPercentage = nextTier 
      ? (pointsInCurrentTier / (nextThreshold - current.min)) * 100 
      : 100;

    return {
      currentTier,
      currentPoints,
      nextTier,
      pointsNeeded: Math.max(pointsNeeded, 0),
      progressPercentage: Math.min(Math.max(progressPercentage, 0), 100),
      tierStartPoints: current.min,
      nextTierThreshold: nextThreshold
    };
  }

  /**
   * Get next tier
   */
  static getNextTier(currentTier: MembershipTier): MembershipTier | null {
    const tierOrder = [
      MembershipTier.BRONZE,
      MembershipTier.SILVER,
      MembershipTier.GOLD,
      MembershipTier.PLATINUM,
      MembershipTier.DIAMOND
    ];

    const currentIndex = tierOrder.indexOf(currentTier);
    return currentIndex < tierOrder.length - 1 ? tierOrder[currentIndex + 1] : null;
  }

  /**
   * Format currency
   */
  static formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }

  /**
   * Format points with commas
   */
  static formatPoints(points: number): string {
    return points.toLocaleString() + ' points';
  }

  /**
   * Get tier color scheme
   */
  static getTierColors(tier: MembershipTier) {
    const colorSchemes = {
      [MembershipTier.BRONZE]: {
        primary: '#CD7F32',
        light: '#E6B87A',
        dark: '#8B5A2B',
        bg: '#FDF6F0'
      },
      [MembershipTier.SILVER]: {
        primary: '#C0C0C0',
        light: '#E0E0E0',
        dark: '#808080',
        bg: '#F8F8F8'
      },
      [MembershipTier.GOLD]: {
        primary: '#FFD700',
        light: '#FFED4A',
        dark: '#B8860B',
        bg: '#FFFBEB'
      },
      [MembershipTier.PLATINUM]: {
        primary: '#E5E4E2',
        light: '#F5F5F5',
        dark: '#9CA3AF',
        bg: '#FAFAFA'
      },
      [MembershipTier.DIAMOND]: {
        primary: '#B9F2FF',
        light: '#E0F8FF',
        dark: '#0891B2',
        bg: '#F0FDFF'
      }
    };

    return colorSchemes[tier];
  }

  /**
   * Calculate days until expiration
   */
  static getDaysUntilExpiration(expirationDate: string): number {
    const expiry = new Date(expirationDate);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(diffDays, 0);
  }

  /**
   * Check if coupon is expiring soon (within 7 days)
   */
  static isCouponExpiringSoon(expirationDate: string): boolean {
    return this.getDaysUntilExpiration(expirationDate) <= 7;
  }

  /**
   * Format discount display
   */
  static formatDiscount(discountType: DiscountType, discountValue: number): string {
    if (discountType === DiscountType.PERCENTAGE) {
      return `${discountValue}% OFF`;
    } else {
      return `${this.formatCurrency(discountValue)} OFF`;
    }
  }

  /**
   * Get transaction type icon
   */
  static getTransactionIcon(type: TransactionType): string {
    const icons = {
      [TransactionType.EARN]: '💰',
      [TransactionType.REDEEM]: '🎁',
      [TransactionType.EXPIRE]: '⏰',
      [TransactionType.ADJUST]: '⚖️'
    };
    return icons[type] || '📝';
  }

  /**
   * Get benefit type icon
   */
  static getBenefitIcon(type: BenefitType): string {
    const icons = {
      [BenefitType.DISCOUNT]: '💸',
      [BenefitType.FREE_SHIPPING]: '🚚',
      [BenefitType.PRIORITY_SUPPORT]: '🎧',
      [BenefitType.EXCLUSIVE_ACCESS]: '🔐',
      [BenefitType.BIRTHDAY_BONUS]: '🎂',
      [BenefitType.POINT_MULTIPLIER]: '✨'
    };
    return icons[type] || '🎁';
  }

  /**
   * Generate loyalty recommendations
   */
  static generateRecommendations(
    userPoints: number,
    userTier: MembershipTier,
    availableRewards: any[],
    availablePackages: any[]
  ): LoyaltyRecommendation[] {
    const recommendations: LoyaltyRecommendation[] = [];

    // Tier upgrade recommendation
    const nextTier = this.getNextTier(userTier);
    if (nextTier) {
      const progress = this.calculateTierProgress(userPoints, userTier);
      if (progress.pointsNeeded <= userPoints * 0.5) { // If within 50% of next tier
        recommendations.push({
          id: 'tier-upgrade',
          type: 'TIER_UPGRADE',
          title: `Upgrade to ${nextTier}`,
          description: `You're only ${progress.pointsNeeded} points away from ${nextTier} tier!`,
          actionText: 'View Benefits',
          priority: 'HIGH'
        });
      }
    }

    // Affordable reward recommendations
    const affordableRewards = availableRewards.filter(r => r.pointsCost <= userPoints);
    if (affordableRewards.length > 0) {
      const bestReward = affordableRewards.sort((a, b) => b.pointsCost - a.pointsCost)[0];
      recommendations.push({
        id: 'best-reward',
        type: 'REWARD',
        title: `Redeem ${bestReward.name}`,
        description: `You can afford this ${bestReward.pointsCost}-point reward!`,
        actionText: 'Redeem Now',
        priority: 'MEDIUM',
        pointsCost: bestReward.pointsCost
      });
    }

    // Coupon package recommendations
    const affordablePackages = availablePackages.filter(p => p.pointsCost <= userPoints);
    if (affordablePackages.length > 0) {
      const bestPackage = affordablePackages[0];
      recommendations.push({
        id: 'coupon-package',
        type: 'COUPON_PACKAGE',
        title: `Get ${bestPackage.packageName}`,
        description: bestPackage.description,
        actionText: 'Purchase Coupon',
        priority: 'MEDIUM',
        pointsCost: bestPackage.pointsCost,
        potentialSavings: bestPackage.discountValue
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Validate coupon code format
   */
  static isValidCouponCode(code: string): boolean {
    // Basic validation: 6-12 alphanumeric characters
    const pattern = /^[A-Z0-9]{6,12}$/;
    return pattern.test(code);
  }

  /**
   * Calculate potential savings from discount
   */
  static calculatePotentialSavings(
    discountType: DiscountType,
    discountValue: number,
    purchaseAmount: number,
    maxDiscount?: number
  ): number {
    let savings = 0;

    if (discountType === DiscountType.PERCENTAGE) {
      savings = purchaseAmount * (discountValue / 100);
    } else {
      savings = discountValue;
    }

    if (maxDiscount && savings > maxDiscount) {
      savings = maxDiscount;
    }

    return Math.min(savings, purchaseAmount);
  }

  /**
   * Group transactions by month
   */
  static groupTransactionsByMonth(transactions: any[]): MonthlyPointsTrend[] {
    const grouped = transactions.reduce((acc, transaction) => {
      const month = new Date(transaction.transactionDate).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      });
      
      if (!acc[month]) {
        acc[month] = { month, earned: 0, redeemed: 0, net: 0 };
      }

      if (transaction.type === TransactionType.EARN) {
        acc[month].earned += transaction.points;
      } else if (transaction.type === TransactionType.REDEEM) {
        acc[month].redeemed += transaction.points;
      }

      acc[month].net = acc[month].earned - acc[month].redeemed;
      return acc;
    }, {});

    return Object.values(grouped);
  }
}

/* -------------------------------------------------------------------------- */
/*                              Constants                                     */
/* -------------------------------------------------------------------------- */

export const LOYALTY_CONSTANTS = {
  TIER_THRESHOLDS: {
    [MembershipTier.BRONZE]: 0,
    [MembershipTier.SILVER]: 500,
    [MembershipTier.GOLD]: 1000,
    [MembershipTier.PLATINUM]: 2500,
    [MembershipTier.DIAMOND]: 5000
  },
  
  POINTS_PER_DOLLAR: 10,
  DOLLARS_PER_POINT: 0.01,
  
  COUPON_EXPIRY_WARNING_DAYS: 7,
  
  PAGINATION_DEFAULTS: {
    PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100
  },
  
  CACHE_DURATION: {
    USER_DATA: 5 * 60 * 1000, // 5 minutes
    REWARDS: 10 * 60 * 1000, // 10 minutes
    TIER_BENEFITS: 30 * 60 * 1000 // 30 minutes
  }
};

export default LoyaltyUtils;