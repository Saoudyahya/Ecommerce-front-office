// lib/services/product.service.ts

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export interface Category {
  id: string;
  name: string;
  parentId?: string;
  description?: string;
  imageUrl?: string;
  level?: number;
  createdAt: string;
}

export interface Discount {
  id: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'BUY_ONE_GET_ONE';
  discountValue: number;
  startDate: string;
  endDate: string;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
}

export interface Review {
  id: string;
  userId: string;
  rating: number;
  comment?: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  sku: string;
  weight?: number;
  dimensions?: string;
  images: string[];
  categories: Category[];
  discounts: Discount[];
  reviews: Review[];
  status: 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK' | 'DISCONTINUED';
  createdAt: string;
  updatedAt: string;
}

export interface ProductSummary {
  id: string;
  name: string;
  price: number;
  images: string[];
  inStock: boolean;
  rating: number;
  originalPrice?: number;
  category: string;
}

/* -------------------------------------------------------------------------- */
/*                                  Service                                   */
/* -------------------------------------------------------------------------- */

class ProductService {
  private readonly baseURL = 'http://localhost:8099/api/products'; // Gateway URL
  
  /**
   * Get all products with full details (categories, discounts, reviews)
   */
  async getAllProducts(): Promise<Product[]> {
    try {
      const response = await fetch(`${this.baseURL}/products/all`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  /**
   * Get basic products list (without full details)
   */
  async getBasicProducts(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseURL}/products`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching basic products:', error);
      throw error;
    }
  }

  /**
   * Get product by ID
   */
  async getProductById(id: string): Promise<Product> {
    try {
      const response = await fetch(`${this.baseURL}/products/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
  }

  /**
   * Get products by status
   */
  async getProductsByStatus(status: Product['status']): Promise<Product[]> {
    try {
      const response = await fetch(`${this.baseURL}/products/status/${status}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching products by status:', error);
      throw error;
    }
  }

  /**
   * Get all categories
   */
  async getAllCategories(): Promise<Category[]> {
    try {
      const response = await fetch(`${this.baseURL}/categories`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(categoryId: string): Promise<ProductSummary[]> {
    try {
      const response = await fetch(`${this.baseURL}/categories/${categoryId}/products`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching products by category:', error);
      throw error;
    }
  }

  /**
   * Get reviews for a product
   */
  async getProductReviews(productId: string): Promise<Review[]> {
    try {
      const response = await fetch(`${this.baseURL}/reviews/product/${productId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching product reviews:', error);
      throw error;
    }
  }

  /**
   * Get average rating for a product
   */
  async getProductAverageRating(productId: string): Promise<{ averageRating: number }> {
    try {
      const response = await fetch(`${this.baseURL}/reviews/product/${productId}/average-rating`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching product rating:', error);
      throw error;
    }
  }

  /**
   * Get active discounts
   */
  async getActiveDiscounts(): Promise<Discount[]> {
    try {
      const response = await fetch(`${this.baseURL}/discounts/active`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching active discounts:', error);
      throw error;
    }
  }

  /**
   * Get discounts for a product
   */
  async getProductDiscounts(productId: string): Promise<Discount[]> {
    try {
      const response = await fetch(`${this.baseURL}/discounts/product/${productId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching product discounts:', error);
      throw error;
    }
  }

  /**
   * Get final pricing for a product (with discounts applied)
   */
  async getProductPricing(productId: string): Promise<{
    originalPrice: number;
    finalPrice: number;
    discountAmount: number;
    discountPercentage: number;
  }> {
    try {
      const response = await fetch(`${this.baseURL}/discounts/product/${productId}/pricing`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching product pricing:', error);
      throw error;
    }
  }

  /**
   * Transform backend Product to frontend ProductSummary
   */
  transformToProductSummary(product: Product): ProductSummary {
    // Calculate average rating from reviews
    const rating = product.reviews.length > 0
      ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
      : 0;

    // Get primary category name
    const primaryCategory = product.categories.length > 0 ? product.categories[0].name : 'Uncategorized';

    // Check if there are active discounts
    const activeDiscounts = product.discounts.filter(discount => {
      const now = new Date();
      const startDate = new Date(discount.startDate);
      const endDate = new Date(discount.endDate);
      return now >= startDate && now <= endDate;
    });

    const originalPrice = activeDiscounts.length > 0 ? product.price : undefined;

    return {
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice,
      images: product.images,
      inStock: product.status === 'ACTIVE' && product.stock > 0,
      rating: Math.round(rating * 10) / 10, // Round to 1 decimal place
      category: primaryCategory,
    };
  }

  /**
   * Get products formatted for frontend display
   */
  async getProductsForDisplay(): Promise<ProductSummary[]> {
    try {
      const products = await this.getAllProducts();
      return products.map(product => this.transformToProductSummary(product));
    } catch (error) {
      console.error('Error fetching products for display:', error);
      throw error;
    }
  }

  /**
   * Search products by name or description
   */
  async searchProducts(query: string): Promise<ProductSummary[]> {
    try {
      const products = await this.getProductsForDisplay();
      const lowercaseQuery = query.toLowerCase();
      
      return products.filter(product =>
        product.name.toLowerCase().includes(lowercaseQuery) ||
        (product.category && product.category.toLowerCase().includes(lowercaseQuery))
      );
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  }

  /**
   * Filter products by category
   */
  async filterProductsByCategory(categoryName: string): Promise<ProductSummary[]> {
    try {
      const products = await this.getProductsForDisplay();
      
      if (categoryName === 'All') {
        return products;
      }
      
      return products.filter(product => product.category === categoryName);
    } catch (error) {
      console.error('Error filtering products by category:', error);
      throw error;
    }
  }

  /**
   * Get unique categories from products
   */
  async getUniqueCategories(): Promise<string[]> {
    try {
      const categories = await this.getAllCategories();
      return categories.map(category => category.name).sort();
    } catch (error) {
      console.error('Error fetching unique categories:', error);
      // Fallback: get categories from products
      try {
        const products = await this.getProductsForDisplay();
        const uniqueCategories = [...new Set(products.map(p => p.category))].sort();
        return uniqueCategories;
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
        return [];
      }
    }
  }
}

// Export singleton instance
export const productService = new ProductService();
export default productService;