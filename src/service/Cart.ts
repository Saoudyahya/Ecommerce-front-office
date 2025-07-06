// lib/services/cart.service.ts

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  subtotal: number;
  addedAt: string;
}

export interface ShoppingCart {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

export interface SavedItem {
  id: string;
  productId: string;
  savedAt: string;
}

export interface AddItemRequest {
  productId: string;
  quantity: number;
  price: number;
}

export interface UpdateQuantityRequest {
  quantity: number;
}

export interface SaveForLaterRequest {
  productId: string;
}

export interface MoveToCartRequest {
  price: number;
}

export interface CartTotalResponse {
  total: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface AuthError {
  message: string;
  code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'TOKEN_EXPIRED';
}

/* -------------------------------------------------------------------------- */
/*                                  Service                                   */
/* -------------------------------------------------------------------------- */

class CartService {
  private readonly baseURL = 'http://localhost:8099/api/carts'; // Gateway URL
  private readonly COOKIE_NAME = 'user-service';
  
  /**
   * Get authentication token from the user-service cookie or localStorage
   */
  private getAuthToken(): string | null {
    // First, try to read from the user-service cookie
    try {
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === this.COOKIE_NAME) {
          return decodeURIComponent(value);
        }
      }
    } catch (error) {
      console.warn('Could not read user-service cookie (likely HttpOnly):', error);
    }

    // Fallback to localStorage (for when auth service stores token there)
    return localStorage.getItem('authToken') || localStorage.getItem('jwt_token');
  }

  /**
   * Check if token is expired
   */
  private isTokenExpired(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return true;

      const payload = JSON.parse(atob(parts[1]));
      const exp = payload.exp;
      
      if (!exp) return false; // No expiration claim
      
      // Check if token is expired (exp is in seconds, Date.now() is in milliseconds)
      return Date.now() >= exp * 1000;
    } catch (error) {
      console.error('Failed to check token expiration:', error);
      return true; // Assume expired if we can't parse
    }
  }

  /**
   * Create headers with authentication
   */
  private createHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const token = this.getAuthToken();
    if (token && !this.isTokenExpired(token)) {
      // Add Authorization header with Bearer token
      headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Make authenticated request
   */
  private async makeRequest<T>(
    url: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const defaultOptions: RequestInit = {
      credentials: 'include', // Important for cookie-based auth - automatically sends user-service cookie
      headers: {
        ...this.createHeaders(),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, defaultOptions);

      // Handle authentication errors
      if (response.status === 401) {
        const error: AuthError = {
          message: 'Authentication required. Please sign in.',
          code: 'UNAUTHORIZED'
        };
        throw error;
      }

      if (response.status === 403) {
        const error: AuthError = {
          message: 'Access forbidden. Insufficient permissions.',
          code: 'FORBIDDEN'
        };
        throw error;
      }

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If response is not JSON, use default message
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error(`Cart service request failed for ${url}:`, error);
      throw error;
    }
  }

  /**
   * Get cart by user ID
   */
  async getCart(userId: string): Promise<ShoppingCart> {
    try {
      const apiResponse: ApiResponse<ShoppingCart> = await this.makeRequest(
        `${this.baseURL}/${userId}`
      );
      return apiResponse.data;
    } catch (error) {
      console.error('Error fetching cart:', error);
      throw error;
    }
  }

  /**
   * Add item to cart
   */
  async addItemToCart(userId: string, request: AddItemRequest): Promise<ShoppingCart> {
    try {
      const apiResponse: ApiResponse<ShoppingCart> = await this.makeRequest(
        `${this.baseURL}/${userId}/items`,
        {
          method: 'POST',
          body: JSON.stringify(request),
        }
      );
      return apiResponse.data;
    } catch (error) {
      console.error('Error adding item to cart:', error);
      throw error;
    }
  }

  /**
   * Remove item from cart
   */
  async removeItemFromCart(userId: string, productId: string): Promise<ShoppingCart> {
    try {
      const apiResponse: ApiResponse<ShoppingCart> = await this.makeRequest(
        `${this.baseURL}/${userId}/items/${productId}`,
        {
          method: 'DELETE',
        }
      );
      return apiResponse.data;
    } catch (error) {
      console.error('Error removing item from cart:', error);
      throw error;
    }
  }

  /**
   * Update item quantity
   */
  async updateItemQuantity(
    userId: string, 
    productId: string, 
    request: UpdateQuantityRequest
  ): Promise<ShoppingCart> {
    try {
      const apiResponse: ApiResponse<ShoppingCart> = await this.makeRequest(
        `${this.baseURL}/${userId}/items/${productId}`,
        {
          method: 'PUT',
          body: JSON.stringify(request),
        }
      );
      return apiResponse.data;
    } catch (error) {
      console.error('Error updating item quantity:', error);
      throw error;
    }
  }

  /**
   * Get cart total
   */
  async getCartTotal(userId: string): Promise<number> {
    try {
      const apiResponse: ApiResponse<CartTotalResponse> = await this.makeRequest(
        `${this.baseURL}/${userId}/total`
      );
      return apiResponse.data.total;
    } catch (error) {
      console.error('Error fetching cart total:', error);
      throw error;
    }
  }

  /**
   * Checkout cart
   */
  async checkout(userId: string): Promise<void> {
    try {
      await this.makeRequest(
        `${this.baseURL}/${userId}/checkout`,
        {
          method: 'POST',
        }
      );
      // No return data for checkout
    } catch (error) {
      console.error('Error during checkout:', error);
      throw error;
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                            Saved for Later                                */
  /* -------------------------------------------------------------------------- */

  /**
   * Get saved items
   */
  async getSavedItems(userId: string): Promise<SavedItem[]> {
    try {
      const apiResponse: ApiResponse<SavedItem[]> = await this.makeRequest(
        `${this.baseURL}/${userId}/saved`
      );
      return apiResponse.data;
    } catch (error) {
      console.error('Error fetching saved items:', error);
      throw error;
    }
  }

  /**
   * Save item for later
   */
  async saveForLater(userId: string, request: SaveForLaterRequest): Promise<SavedItem> {
    try {
      const apiResponse: ApiResponse<SavedItem> = await this.makeRequest(
        `${this.baseURL}/${userId}/saved`,
        {
          method: 'POST',
          body: JSON.stringify(request),
        }
      );
      return apiResponse.data;
    } catch (error) {
      console.error('Error saving item for later:', error);
      throw error;
    }
  }

  /**
   * Move saved item to cart
   */
  async moveToCart(
    userId: string, 
    productId: string, 
    request: MoveToCartRequest
  ): Promise<ShoppingCart> {
    try {
      const apiResponse: ApiResponse<ShoppingCart> = await this.makeRequest(
        `${this.baseURL}/${userId}/saved/${productId}/move-to-cart`,
        {
          method: 'POST',
          body: JSON.stringify(request),
        }
      );
      return apiResponse.data;
    } catch (error) {
      console.error('Error moving item to cart:', error);
      throw error;
    }
  }

  /**
   * Remove saved item
   */
  async removeFromSaved(userId: string, productId: string): Promise<void> {
    try {
      await this.makeRequest(
        `${this.baseURL}/${userId}/saved/${productId}`,
        {
          method: 'DELETE',
        }
      );
      // No return data for removal
    } catch (error) {
      console.error('Error removing saved item:', error);
      throw error;
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                            Helper Methods                                  */
  /* -------------------------------------------------------------------------- */

  /**
   * Calculate total items in cart
   */
  calculateTotalItems(cart: ShoppingCart): number {
    return cart.items.reduce((total, item) => total + item.quantity, 0);
  }

  /**
   * Check if cart is empty
   */
  isCartEmpty(cart: ShoppingCart): boolean {
    return cart.items.length === 0;
  }

  /**
   * Find item in cart by product ID
   */
  findCartItem(cart: ShoppingCart, productId: string): CartItem | undefined {
    return cart.items.find(item => item.productId === productId);
  }

  /**
   * Check if product exists in cart
   */
  isProductInCart(cart: ShoppingCart, productId: string): boolean {
    return this.findCartItem(cart, productId) !== undefined;
  }

  /**
   * Get cart summary
   */
  getCartSummary(cart: ShoppingCart): {
    totalItems: number;
    totalAmount: number;
    itemCount: number;
  } {
    return {
      totalItems: this.calculateTotalItems(cart),
      totalAmount: cart.total,
      itemCount: cart.items.length,
    };
  }

  /**
   * Validate cart before checkout
   */
  validateCartForCheckout(cart: ShoppingCart): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (this.isCartEmpty(cart)) {
      errors.push('Cart is empty');
    }

    if (cart.total <= 0) {
      errors.push('Cart total must be greater than 0');
    }

    // Check for items with zero or negative quantities
    const invalidItems = cart.items.filter(item => item.quantity <= 0);
    if (invalidItems.length > 0) {
      errors.push('Cart contains items with invalid quantities');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  }

  /**
   * Quick add item (simplified version)
   */
  async quickAddItem(userId: string, productId: string, price: number, quantity: number = 1): Promise<ShoppingCart> {
    const request: AddItemRequest = {
      productId,
      quantity,
      price,
    };
    return this.addItemToCart(userId, request);
  }

  /**
   * Quick update quantity (simplified version)
   */
  async quickUpdateQuantity(userId: string, productId: string, quantity: number): Promise<ShoppingCart> {
    const request: UpdateQuantityRequest = { quantity };
    return this.updateItemQuantity(userId, productId, request);
  }

  /**
   * Quick save for later (simplified version)
   */
  async quickSaveForLater(userId: string, productId: string): Promise<SavedItem> {
    const request: SaveForLaterRequest = { productId };
    return this.saveForLater(userId, request);
  }

  /**
   * Quick move to cart (simplified version)
   */
  async quickMoveToCart(userId: string, productId: string, price: number): Promise<ShoppingCart> {
    const request: MoveToCartRequest = { price };
    return this.moveToCart(userId, productId, request);
  }

  /**
   * Handle authentication errors
   */
  isAuthError(error: any): error is AuthError {
    return error && typeof error === 'object' && 'code' in error && 
           ['UNAUTHORIZED', 'FORBIDDEN', 'TOKEN_EXPIRED'].includes(error.code);
  }

  /**
   * Check if user is authenticated (has valid token)
   */
  isAuthenticated(): boolean {
    const token = this.getAuthToken();
    return token !== null && !this.isTokenExpired(token);
  }

  /**
   * Clear authentication (useful for logout)
   */
  clearAuth(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('jwt_token');
    // Note: Can't clear HTTP-only cookies from JavaScript
  }

  /**
   * Set authentication token (useful for login)
   */
  setAuthToken(token: string): void {
    localStorage.setItem('authToken', token);
    localStorage.setItem('jwt_token', token);
  }

  /**
   * Get current auth token for debugging
   */
  getToken(): string | null {
    return this.getAuthToken();
  }

  /**
   * Check if we can access the user-service cookie
   */
  canAccessCookie(): boolean {
    try {
      const cookies = document.cookie;
      return cookies.includes(this.COOKIE_NAME);
    } catch {
      return false;
    }
  }

  /**
   * Debug authentication status
   */
  debugAuth(): void {
    console.log('=== Cart Service Auth Debug ===');
    console.log('Cookie name:', this.COOKIE_NAME);
    console.log('Can access cookie:', this.canAccessCookie());
    console.log('Has token in localStorage:', !!localStorage.getItem('authToken'));
    
    const token = this.getAuthToken();
    console.log('Has token:', !!token);
    if (token) {
      console.log('Token preview:', token.substring(0, 50) + '...');
      console.log('Token expired:', this.isTokenExpired(token));
    }
    console.log('Is authenticated:', this.isAuthenticated());
    console.log('================================');
  }

  /**
   * Retry request with authentication
   */
  private async retryWithAuth<T>(
    requestFn: () => Promise<T>,
    maxRetries: number = 1
  ): Promise<T> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        if (this.isAuthError(error) && attempt < maxRetries) {
          // Could trigger re-authentication here
          console.warn('Authentication failed, retrying...');
          continue;
        }
        throw error;
      }
    }
    throw new Error('Max retries exceeded');
  }
}

// Export singleton instance
export const cartService = new CartService();
export default cartService;