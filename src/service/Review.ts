// lib/services/review.service.ts

import { getAuthHeaders } from '~/lib/apiEndPoints';

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

// Enums
export enum ReviewSortBy {
  NEWEST = 'NEWEST',
  OLDEST = 'OLDEST',
  HIGHEST_RATING = 'HIGHEST_RATING',
  LOWEST_RATING = 'LOWEST_RATING',
  MOST_HELPFUL = 'MOST_HELPFUL'
}

// Core Interfaces - Updated to match backend DTOs
export interface Review {
  id: string;
  userId: string;
  productId: string;
  productName?: string;
  productSku?: string;
  rating: number; // 1-5 stars
  comment: string;
  verified: boolean; // Changed from isVerified to match backend
  createdAt: string;
  updatedAt: string;
}

export interface ReviewSummary {
  id: string;
  userId: string;
  productId: string;
  productName?: string;
  rating: number;
  verified: boolean;
  commentPreview: string; // First 100 characters from backend
  createdAt: string;
}

export interface ReviewStats {
  productId: string;
  productName?: string;
  totalReviews: number;
  averageRating: number;
  verifiedReviews: number;
  unverifiedReviews: number;
  ratingDistribution: {
    [key: string]: number; // e.g., "1 star": 5, "2 stars": 3, etc.
  };
  lastReviewDate?: string;
  calculatedAt: string;
}

export interface OverallStats {
  totalReviews: number;
  averageRating: number;
  verifiedReviews: number;
  productsWithReviews: number;
  calculatedAt: string;
}

// Request DTOs - Updated to match backend
export interface CreateReviewRequest {
  userId: string;
  productId: string;
  rating: number;
  comment: string;
  verified?: boolean; // Optional, defaults to false
}

export interface UpdateReviewRequest {
  rating?: number;
  comment?: string;
  verified?: boolean;
}

export interface ReviewFilterRequest {
  userId?: string;
  productId?: string;
  minRating?: number;
  maxRating?: number;
  verified?: boolean;
  sortBy?: ReviewSortBy;
  page?: number;
  limit?: number;
}

// Response DTOs
export interface ReviewResponse {
  review: Review;
  message: string;
  success: boolean;
}

export interface ReviewListResponse {
  reviews: ReviewSummary[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface AverageRatingResponse {
  averageRating: number;
  productId?: string;
  totalReviews?: number;
}

/* -------------------------------------------------------------------------- */
/*                                  Service                                   */
/* -------------------------------------------------------------------------- */

class ReviewService {
  private readonly baseURL = 'http://localhost:8099/api/products/reviews'; // Gateway URL

  /* -------------------------------- Reviews --------------------------------- */

  /**
   * Get all reviews (returns summary DTOs)
   */
  async getAllReviews(): Promise<ReviewSummary[]> {
    try {
      const response = await fetch(this.baseURL, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching reviews:', error);
      throw error;
    }
  }

  /**
   * Get review by ID (returns full review DTO)
   */
  async getReviewById(reviewId: string): Promise<Review> {
    try {
      const response = await fetch(`${this.baseURL}/${reviewId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Review not found');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching review by ID:', error);
      throw error;
    }
  }

  /**
   * Get reviews by product ID (returns summary DTOs)
   */
  async getReviewsByProductId(productId: string): Promise<ReviewSummary[]> {
    try {
      const response = await fetch(`${this.baseURL}/product/${productId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching reviews by product ID:', error);
      throw error;
    }
  }

  /**
   * Get reviews by user ID (returns summary DTOs)
   */
  async getReviewsByUserId(userId: string): Promise<ReviewSummary[]> {
    try {
      const response = await fetch(`${this.baseURL}/user/${userId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching reviews by user ID:', error);
      throw error;
    }
  }

  /**
   * Get reviews by minimum rating (returns summary DTOs)
   */
  async getReviewsByMinimumRating(minimumRating: number): Promise<ReviewSummary[]> {
    try {
      if (minimumRating < 1 || minimumRating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      const response = await fetch(`${this.baseURL}/rating/${minimumRating}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching reviews by minimum rating:', error);
      throw error;
    }
  }

  /**
   * Get verified reviews only (returns summary DTOs)
   */
  async getVerifiedReviews(): Promise<ReviewSummary[]> {
    try {
      const response = await fetch(`${this.baseURL}/verified`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching verified reviews:', error);
      throw error;
    }
  }

  /**
   * Get recent reviews with limit
   */
  async getRecentReviews(limit: number = 10): Promise<ReviewSummary[]> {
    try {
      if (limit > 100) {
        throw new Error('Limit cannot exceed 100');
      }

      const response = await fetch(`${this.baseURL}/recent?limit=${limit}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching recent reviews:', error);
      throw error;
    }
  }

  /**
   * Search reviews with filters
   */
  async searchReviews(filters: ReviewFilterRequest): Promise<ReviewSummary[]> {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const url = `${this.baseURL}/search?${queryParams}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error searching reviews:', error);
      throw error;
    }
  }

  /**
   * Get user's reviews for specific product
   */
  async getUserReviewsForProduct(userId: string, productId: string): Promise<Review[]> {
    try {
      const response = await fetch(`${this.baseURL}/user/${userId}/product/${productId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user reviews for product:', error);
      throw error;
    }
  }

  /**
   * Create new review
   */
  async createReview(request: CreateReviewRequest): Promise<Review> {
    try {
      // Validate rating
      if (request.rating < 1 || request.rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating review:', error);
      throw error;
    }
  }

  /**
   * Update review (full update)
   */
  async updateReview(reviewId: string, request: CreateReviewRequest): Promise<Review> {
    try {
      // Validate rating if provided
      if (request.rating && (request.rating < 1 || request.rating > 5)) {
        throw new Error('Rating must be between 1 and 5');
      }

      const response = await fetch(`${this.baseURL}/${reviewId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Review not found');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating review:', error);
      throw error;
    }
  }

  /**
   * Partial update review (PATCH)
   */
  async partialUpdateReview(reviewId: string, request: UpdateReviewRequest): Promise<Review> {
    try {
      // Validate rating if provided
      if (request.rating && (request.rating < 1 || request.rating > 5)) {
        throw new Error('Rating must be between 1 and 5');
      }

      const response = await fetch(`${this.baseURL}/${reviewId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Review not found');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error partially updating review:', error);
      throw error;
    }
  }

  /**
   * Verify review
   */
  async verifyReview(reviewId: string): Promise<Review> {
    try {
      const response = await fetch(`${this.baseURL}/${reviewId}/verify`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Review not found');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error verifying review:', error);
      throw error;
    }
  }

  /**
   * Bulk verify reviews
   */
  async bulkVerifyReviews(reviewIds: string[]): Promise<Review[]> {
    try {
      if (!reviewIds || reviewIds.length === 0) {
        throw new Error('Review IDs list cannot be empty');
      }

      const response = await fetch(`${this.baseURL}/bulk-verify`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(reviewIds),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error bulk verifying reviews:', error);
      throw error;
    }
  }

  /**
   * Delete review
   */
  async deleteReview(reviewId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/${reviewId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Review not found');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      throw error;
    }
  }

  /**
   * Get average rating for product
   */
  async getAverageRatingForProduct(productId: string): Promise<AverageRatingResponse> {
    try {
      const response = await fetch(`${this.baseURL}/product/${productId}/average-rating`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        averageRating: data.averageRating || 0,
        productId,
        totalReviews: data.totalReviews || 0,
      };
    } catch (error) {
      console.error('Error fetching average rating:', error);
      throw error;
    }
  }

  /**
   * Get product review statistics (new endpoint)
   */
  async getProductReviewStatistics(productId: string): Promise<ReviewStats> {
    try {
      const response = await fetch(`${this.baseURL}/product/${productId}/statistics`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching product review statistics:', error);
      throw error;
    }
  }

  /**
   * Get overall review statistics (new endpoint)
   */
  async getOverallReviewStatistics(): Promise<OverallStats> {
    try {
      const response = await fetch(`${this.baseURL}/statistics`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching overall review statistics:', error);
      throw error;
    }
  }

  /* ----------------------------- Helper Methods ---------------------------- */

  /**
   * Calculate review summary from reviews array (fallback method)
   */
  calculateReviewSummaryFromArray(productId: string, reviews: ReviewSummary[]): {
    productId: string;
    totalReviews: number;
    averageRating: number;
    ratingDistribution: { [key: string]: number };
    verifiedReviewsCount: number;
    recentReviewsCount: number;
  } {
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
      : 0;

    const ratingDistribution: { [key: string]: number } = {
      '1 star': reviews.filter(r => r.rating === 1).length,
      '2 stars': reviews.filter(r => r.rating === 2).length,
      '3 stars': reviews.filter(r => r.rating === 3).length,
      '4 stars': reviews.filter(r => r.rating === 4).length,
      '5 stars': reviews.filter(r => r.rating === 5).length,
    };

    const verifiedReviewsCount = reviews.filter(r => r.verified).length;
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentReviewsCount = reviews.filter(r => 
      new Date(r.createdAt) >= thirtyDaysAgo
    ).length;

    return {
      productId,
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingDistribution,
      verifiedReviewsCount,
      recentReviewsCount,
    };
  }

  /**
   * Format rating as stars
   */
  formatRatingAsStars(rating: number): string {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return '★'.repeat(fullStars) + 
           (hasHalfStar ? '☆' : '') + 
           '☆'.repeat(emptyStars);
  }

  /**
   * Get rating color for UI
   */
  getRatingColor(rating: number): string {
    if (rating >= 4) return '#10B981'; // Green
    if (rating >= 3) return '#F59E0B'; // Yellow
    if (rating >= 2) return '#F97316'; // Orange
    return '#EF4444'; // Red
  }

  /**
   * Check if review can be edited
   */
  canEditReview(review: Review | ReviewSummary, currentUserId: string): boolean {
    return review.userId === currentUserId;
  }

  /**
   * Check if review can be deleted
   */
  canDeleteReview(review: Review | ReviewSummary, currentUserId: string, isAdmin: boolean = false): boolean {
    return review.userId === currentUserId || isAdmin;
  }

  /**
   * Format review date for display
   */
  formatReviewDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
    return date.toLocaleDateString();
  }

  /**
   * Truncate review comment for preview
   */
  truncateComment(comment: string, maxLength: number = 150): string {
    if (comment.length <= maxLength) return comment;
    return comment.substring(0, maxLength).trim() + '...';
  }

  /**
   * Filter reviews by rating range
   */
  filterReviewsByRatingRange(reviews: ReviewSummary[], minRating: number, maxRating: number): ReviewSummary[] {
    return reviews.filter(review => 
      review.rating >= minRating && review.rating <= maxRating
    );
  }

  /**
   * Sort reviews by specified criteria
   */
  sortReviews(reviews: ReviewSummary[], sortBy: ReviewSortBy): ReviewSummary[] {
    const sorted = [...reviews];
    
    switch (sortBy) {
      case ReviewSortBy.NEWEST:
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case ReviewSortBy.OLDEST:
        return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case ReviewSortBy.HIGHEST_RATING:
        return sorted.sort((a, b) => b.rating - a.rating);
      case ReviewSortBy.LOWEST_RATING:
        return sorted.sort((a, b) => a.rating - b.rating);
      case ReviewSortBy.MOST_HELPFUL:
        // Since we don't have helpfulCount, sort by verified status as proxy
        return sorted.sort((a, b) => Number(b.verified) - Number(a.verified));
      default:
        return sorted;
    }
  }

  /**
   * Get user's review metrics from frontend data
   */
  async getUserReviewMetrics(userId: string): Promise<{
    userId: string;
    totalReviews: number;
    averageRatingGiven: number;
    verifiedReviewsCount: number;
    firstReviewDate: string;
    lastReviewDate: string;
  }> {
    try {
      const reviews = await this.getReviewsByUserId(userId);

      if (reviews.length === 0) {
        return {
          userId,
          totalReviews: 0,
          averageRatingGiven: 0,
          verifiedReviewsCount: 0,
          firstReviewDate: '',
          lastReviewDate: '',
        };
      }

      const totalReviews = reviews.length;
      const averageRatingGiven = reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;
      const verifiedReviewsCount = reviews.filter(r => r.verified).length;
      
      const sortedByDate = reviews.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      
      return {
        userId,
        totalReviews,
        averageRatingGiven: Math.round(averageRatingGiven * 10) / 10,
        verifiedReviewsCount,
        firstReviewDate: sortedByDate[0].createdAt,
        lastReviewDate: sortedByDate[sortedByDate.length - 1].createdAt,
      };
    } catch (error) {
      console.error('Error calculating user review metrics:', error);
      throw error;
    }
  }

  /**
   * Check if user has already reviewed a product
   */
  async hasUserReviewedProduct(userId: string, productId: string): Promise<boolean> {
    try {
      const reviews = await this.getUserReviewsForProduct(userId, productId);
      return reviews.length > 0;
    } catch (error) {
      console.error('Error checking if user reviewed product:', error);
      return false;
    }
  }

  /**
   * Get reviews statistics for display
   */
  async getDisplayStatistics(productId: string): Promise<{
    totalReviews: number;
    averageRating: number;
    ratingPercentages: { [key: number]: number };
    verificationRate: number;
  }> {
    try {
      const stats = await this.getProductReviewStatistics(productId);
      
      // Calculate rating percentages
      const total = stats.totalReviews || 1; // Avoid division by zero
      const ratingPercentages: { [key: number]: number } = {};
      
      for (let i = 1; i <= 5; i++) {
        const starKey = `${i} star${i !== 1 ? 's' : ''}`;
        const count = stats.ratingDistribution[starKey] || 0;
        ratingPercentages[i] = Math.round((count / total) * 100);
      }

      const verificationRate = stats.totalReviews > 0 
        ? Math.round((stats.verifiedReviews / stats.totalReviews) * 100)
        : 0;

      return {
        totalReviews: stats.totalReviews,
        averageRating: stats.averageRating,
        ratingPercentages,
        verificationRate,
      };
    } catch (error) {
      console.error('Error getting display statistics:', error);
      return {
        totalReviews: 0,
        averageRating: 0,
        ratingPercentages: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        verificationRate: 0,
      };
    }
  }
}

// Export singleton instance
export const reviewService = new ReviewService();
export default reviewService;