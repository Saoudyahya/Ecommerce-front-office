// lib/services/loyalty.service.ts

import { getAuthHeaders } from '~/lib/apiEndPoints';

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

// Enums
export enum MembershipTier {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
  DIAMOND = 'DIAMOND'
}

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT'
}

export enum TransactionType {
  EARN = 'EARN',
  REDEEM = 'REDEEM',
  EXPIRE = 'EXPIRE',
  ADJUST = 'ADJUST'
}

export enum BenefitType {
  DISCOUNT = 'DISCOUNT',
  FREE_SHIPPING = 'FREE_SHIPPING',
  PRIORITY_SUPPORT = 'PRIORITY_SUPPORT',
  EXCLUSIVE_ACCESS = 'EXCLUSIVE_ACCESS',
  BIRTHDAY_BONUS = 'BIRTHDAY_BONUS',
  POINT_MULTIPLIER = 'POINT_MULTIPLIER'
}

// CRM Interfaces
export interface CRM {
  id: string;
  userId: string;
  totalPoints: number;
  membershipLevel: MembershipTier;
  joinDate: string;
  lastActivity: string;
  loyaltyScore?: number;
}

export interface LoyaltyScore {
  userId: string;
  loyaltyScore: number;
  explanation: string;
}

export interface TierProgress {
  currentTier: MembershipTier;
  currentPoints: number;
  pointsInCurrentTier: number;
  pointsNeededForNextTier: number;
  nextTier: MembershipTier;
  progressPercentage: number;
  tierStartPoints: number;
  nextTierPoints: number;
}

// Coupon Interfaces
export interface Coupon {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minPurchaseAmount: number;
  maxDiscountAmount?: number;
  expirationDate: string;
  userId: string;
  isUsed: boolean;
  usageLimit: number;
  stackable: boolean;
  priorityLevel: number;
  createdAt: string;
}

export interface CouponPackage {
  packageName: string;
  pointsCost: number;
  discountType: DiscountType;
  discountValue: number;
  minPurchaseAmount: number;
  maxDiscountAmount?: number;
  description: string;
}

export interface CouponValidation {
  isValid: boolean;
  couponCode: string;
  message: string;
  expectedDiscount: number;
}

export interface CouponApplication {
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  couponCode: string;
  message: string;
}

// Reward Interfaces
export interface LoyaltyReward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  isActive: boolean;
  expiryDays: number;
  canAfford?: boolean;
  userCurrentPoints?: number;
}

export interface RewardRedemption {
  transactionId: string;
  userId: string;
  reward: LoyaltyReward;
  pointsDeducted: number;
  remainingPoints: number;
  redeemedAt: string;
  message: string;
  instructions: string;
}

// Transaction Interfaces
export interface PointTransaction {
  id: string;
  userId: string;
  type: TransactionType;
  points: number;
  transactionDate: string;
  source: string;
  balance: number;
  relatedOrderId?: string;
  relatedCouponId?: string;
  expirationDate?: string;
  orderAmount?: number;
  idempotencyKey?: string;
}

export interface TransactionSummary {
  userId: string;
  totalPointsEarned: number;
  totalPointsRedeemed: number;
  currentBalance: number;
  totalTransactions: number;
  earningTransactions: number;
  redemptionTransactions: number;
  firstTransactionDate: string;
  lastTransactionDate: string;
  averagePointsPerEarning: number;
}

// Tier Benefit Interfaces
export interface TierBenefit {
  id: string;
  tier: MembershipTier;
  benefitType: BenefitType;
  benefitConfig: string;
  discountPercentage?: number;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// Request DTOs
export interface GenerateCouponRequest {
  userId: string;
  discountType: DiscountType;
  discountValue: number;
  minPurchaseAmount: number;
  maxDiscountAmount?: number;
  expirationDate: string;
  usageLimit: number;
}

export interface PurchaseCouponRequest {
  userId: string;
  discountType: DiscountType;
  discountValue: number;
  pointsCost: number;
  minPurchaseAmount: number;
  maxDiscountAmount?: number;
  expirationDate: string;
  usageLimit: number;
}

export interface ValidateCouponRequest {
  couponCode: string;
  purchaseAmount: number;
}

export interface ApplyCouponRequest {
  couponCode: string;
  purchaseAmount: number;
}

export interface RedeemRewardRequest {
  userId: string;
  rewardId: string;
}

export interface CreateTransactionRequest {
  userId: string;
  type: TransactionType;
  points: number;
  source: string;
  relatedOrderId?: string;
  relatedCouponId?: string;
  orderAmount?: number;
  idempotencyKey?: string;
}

/* -------------------------------------------------------------------------- */
/*                                  Service                                   */
/* -------------------------------------------------------------------------- */

class LoyaltyService {
  private readonly baseURL = 'http://localhost:8099/api/loyalty'; // Gateway URL

  /* ----------------------------------- CRM ---------------------------------- */

  /**
   * Get all CRM users
   */
  async getAllCRMUsers(): Promise<CRM[]> {
    try {
      const response = await fetch(`${this.baseURL}/crm`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching CRM users:', error);
      throw error;
    }
  }

  /**
   * Get CRM data by user ID
   */
  async getCRMByUserId(userId: string): Promise<CRM> {
    try {
      const response = await fetch(`${this.baseURL}/crm/${userId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching CRM data:', error);
      throw error;
    }
  }

  /**
   * Get user loyalty score
   */
  async getLoyaltyScore(userId: string): Promise<LoyaltyScore> {
    try {
      const response = await fetch(`${this.baseURL}/crm/${userId}/loyalty-score`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching loyalty score:', error);
      throw error;
    }
  }

  /* -------------------------------- Coupons --------------------------------- */

  /**
   * Get all coupons
   */
  async getAllCoupons(): Promise<Coupon[]> {
    try {
      const response = await fetch(`${this.baseURL}/coupons`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching coupons:', error);
      throw error;
    }
  }

  /**
   * Check coupon validity
   */
  async checkCouponValidity(couponCode: string): Promise<Coupon | null> {
    try {
      const response = await fetch(`${this.baseURL}/coupons/valid/${couponCode}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null; // Coupon not found or invalid
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking coupon validity:', error);
      throw error;
    }
  }

  /**
   * Purchase coupon with points
   */
  async purchaseCouponWithPoints(request: PurchaseCouponRequest): Promise<Coupon> {
    try {
      const response = await fetch(`${this.baseURL}/coupons/purchase`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error purchasing coupon with points:', error);
      throw error;
    }
  }

  /**
   * Purchase coupon package
   */
  async purchaseCouponPackage(userId: string, packageType: string): Promise<Coupon> {
    try {
      const response = await fetch(`${this.baseURL}/coupons/purchase-package?userId=${userId}&packageType=${packageType}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error purchasing coupon package:', error);
      throw error;
    }
  }

  /**
   * Get available coupon packages for user
   */
  async getAvailableCouponPackages(userId: string): Promise<CouponPackage[]> {
    try {
      const response = await fetch(`${this.baseURL}/coupons/packages/${userId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching available coupon packages:', error);
      throw error;
    }
  }

  /**
   * Get all coupon packages
   */
  async getAllCouponPackages(): Promise<CouponPackage[]> {
    try {
      const response = await fetch(`${this.baseURL}/coupons/packages`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching coupon packages:', error);
      throw error;
    }
  }

  /**
   * Generate promotional coupon
   */
  async generatePromotionalCoupon(request: GenerateCouponRequest): Promise<Coupon> {
    try {
      const response = await fetch(`${this.baseURL}/coupons/promotional`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating promotional coupon:', error);
      throw error;
    }
  }

  /**
   * Validate coupon
   */
  async validateCoupon(request: ValidateCouponRequest): Promise<CouponValidation> {
    try {
      const response = await fetch(`${this.baseURL}/coupons/validate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error validating coupon:', error);
      throw error;
    }
  }

  /**
   * Apply coupon
   */
  async applyCoupon(request: ApplyCouponRequest): Promise<CouponApplication> {
    try {
      const response = await fetch(`${this.baseURL}/coupons/apply`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error applying coupon:', error);
      throw error;
    }
  }

  /**
   * Get user's active coupons
   */
  async getUserCoupons(userId: string): Promise<Coupon[]> {
    try {
      const response = await fetch(`${this.baseURL}/coupons/${userId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user coupons:', error);
      throw error;
    }
  }

  /* -------------------------------- Rewards --------------------------------- */

  /**
   * Get active rewards
   */
  async getActiveRewards(userId?: string): Promise<LoyaltyReward[]> {
    try {
    //   const url = userId 
    //     ? `${this.baseURL}/rewards?userId=${userId}`
    //     : `${this.baseURL}/rewards`;

      const response = await fetch(`${this.baseURL}/rewards`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching active rewards:', error);
      throw error;
    }
  }

  /**
   * Redeem reward
   */
  async redeemReward(rewardId: string, request: RedeemRewardRequest): Promise<RewardRedemption> {
    try {
      const response = await fetch(`${this.baseURL}/rewards/${rewardId}/redeem`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error redeeming reward:', error);
      throw error;
    }
  }

  /* ------------------------------ Transactions ----------------------------- */

  /**
   * Create transaction
   */
  async createTransaction(request: CreateTransactionRequest): Promise<PointTransaction> {
    try {
      const response = await fetch(`${this.baseURL}/transactions`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(userId: string): Promise<PointTransaction[]> {
    try {
      const response = await fetch(`${this.baseURL}/transactions/${userId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      throw error;
    }
  }

  /**
   * Check transaction status
   */
  async checkTransactionStatus(userId: string, idempotencyKey: string): Promise<PointTransaction | null> {
    try {
      const response = await fetch(`${this.baseURL}/transactions/${userId}/check?idempotencyKey=${idempotencyKey}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null; // Transaction not found
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking transaction status:', error);
      throw error;
    }
  }

  /* ----------------------------- Tier Benefits ----------------------------- */

  /**
   * Get all tier benefits
   */
  async getAllTierBenefits(): Promise<TierBenefit[]> {
    try {
      const response = await fetch(`${this.baseURL}/tier-benefits`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching tier benefits:', error);
      throw error;
    }
  }

  /**
   * Get active tier benefits
   */
  async getActiveTierBenefits(): Promise<TierBenefit[]> {
    try {
      const response = await fetch(`${this.baseURL}/tier-benefits/active`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching active tier benefits:', error);
      throw error;
    }
  }

  /**
   * Get tier benefits by tier
   */
  async getTierBenefitsByTier(tier: MembershipTier): Promise<TierBenefit[]> {
    try {
      const response = await fetch(`${this.baseURL}/tier-benefits/tier/${tier}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching tier benefits by tier:', error);
      throw error;
    }
  }

  /* ----------------------------- Helper Methods ---------------------------- */

  /**
   * Format points as display string
   */
  formatPoints(points: number): string {
    return points.toLocaleString() + ' points';
  }

  /**
   * Get tier color for UI
   */
  getTierColor(tier: MembershipTier): string {
    switch (tier) {
      case MembershipTier.BRONZE:
        return '#CD7F32';
      case MembershipTier.SILVER:
        return '#C0C0C0';
      case MembershipTier.GOLD:
        return '#FFD700';
      case MembershipTier.PLATINUM:
        return '#E5E4E2';
      case MembershipTier.DIAMOND:
        return '#B9F2FF';
      default:
        return '#6B7280';
    }
  }

  /**
   * Get tier progress percentage
   */
  calculateTierProgress(currentPoints: number, currentTier: MembershipTier): number {
    const tierThresholds = {
      [MembershipTier.BRONZE]: { min: 0, max: 500 },
      [MembershipTier.SILVER]: { min: 500, max: 1000 },
      [MembershipTier.GOLD]: { min: 1000, max: 2500 },
      [MembershipTier.PLATINUM]: { min: 2500, max: 5000 },
      [MembershipTier.DIAMOND]: { min: 5000, max: 5000 },
    };

    const threshold = tierThresholds[currentTier];
    if (currentTier === MembershipTier.DIAMOND) {
      return 100;
    }

    const progress = ((currentPoints - threshold.min) / (threshold.max - threshold.min)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  }

  /**
   * Get next tier
   */
  getNextTier(currentTier: MembershipTier): MembershipTier | null {
    switch (currentTier) {
      case MembershipTier.BRONZE:
        return MembershipTier.SILVER;
      case MembershipTier.SILVER:
        return MembershipTier.GOLD;
      case MembershipTier.GOLD:
        return MembershipTier.PLATINUM;
      case MembershipTier.PLATINUM:
        return MembershipTier.DIAMOND;
      case MembershipTier.DIAMOND:
        return null; // Already at highest tier
      default:
        return null;
    }
  }

  /**
   * Format discount for display
   */
  formatDiscount(discountType: DiscountType, discountValue: number): string {
    if (discountType === DiscountType.PERCENTAGE) {
      return `${discountValue}% OFF`;
    } else {
      return `$${discountValue} OFF`;
    }
  }

  /**
   * Check if coupon is expired
   */
  isCouponExpired(expirationDate: string): boolean {
    return new Date(expirationDate) < new Date();
  }

  /**
   * Get days until coupon expires
   */
  getDaysUntilExpiration(expirationDate: string): number {
    const expiry = new Date(expirationDate);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(diffDays, 0);
  }

  /**
   * Filter user's valid coupons
   */
  filterValidCoupons(coupons: Coupon[]): Coupon[] {
    return coupons.filter(coupon => 
      !coupon.isUsed && !this.isCouponExpired(coupon.expirationDate)
    );
  }

  /**
   * Filter user's expired coupons
   */
  filterExpiredCoupons(coupons: Coupon[]): Coupon[] {
    return coupons.filter(coupon => 
      this.isCouponExpired(coupon.expirationDate)
    );
  }

  /**
   * Filter user's used coupons
   */
  filterUsedCoupons(coupons: Coupon[]): Coupon[] {
    return coupons.filter(coupon => coupon.isUsed);
  }

  /**
   * Get transaction type color for UI
   */
  getTransactionTypeColor(type: TransactionType): string {
    switch (type) {
      case TransactionType.EARN:
        return '#10B981'; // Green
      case TransactionType.REDEEM:
        return '#EF4444'; // Red
      case TransactionType.EXPIRE:
        return '#F59E0B'; // Yellow
      case TransactionType.ADJUST:
        return '#6366F1'; // Indigo
      default:
        return '#6B7280'; // Gray
    }
  }

  /**
   * Get user dashboard summary
   */
  async getUserDashboardSummary(userId: string): Promise<{
    crm: CRM;
    activeCoupons: Coupon[];
    recentTransactions: PointTransaction[];
    availableRewards: LoyaltyReward[];
    tierBenefits: TierBenefit[];
  }> {
    try {
      const [crm, coupons, transactions, rewards, tierBenefits] = await Promise.all([
        this.getCRMByUserId(userId),
        this.getUserCoupons(userId),
        this.getTransactionHistory(userId),
        this.getActiveRewards(userId),
        this.getTierBenefitsByTier(await this.getCRMByUserId(userId).then(c => c.membershipLevel))
      ]);

      return {
        crm,
        activeCoupons: this.filterValidCoupons(coupons),
        recentTransactions: transactions.slice(0, 10), // Last 10 transactions
        availableRewards: rewards.filter(r => r.canAfford),
        tierBenefits
      };
    } catch (error) {
      console.error('Error fetching user dashboard summary:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const loyaltyService = new LoyaltyService();
export default loyaltyService;