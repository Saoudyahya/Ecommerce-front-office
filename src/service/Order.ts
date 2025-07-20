// lib/services/order.service.ts

import { Order_Service_URL } from "~/lib/apiEndPoints";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELED = 'CANCELED',
  RETURNED = 'RETURNED',
  REFUNDED = 'REFUNDED'
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  priceAtPurchase: number;
  discount: number;
  total: number;
}

export interface Order {
  id: string;
  userId: string;
  cartId: string;
  status: OrderStatus;
  totalAmount: number;
  tax: number;
  shippingCost: number;
  discount: number;
  createdAt: string;
  updatedAt: string;
  billingAddressId: string;
  shippingAddressId: string;
  items?: OrderItem[];
}

export interface OrderTotal {
  total: number;
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount: number;
}

export interface Invoice {
  orderId: string;
  invoiceData: string;
  downloadUrl: string;
}

/* -------------------------------------------------------------------------- */
/*                            Request DTOs                                   */
/* -------------------------------------------------------------------------- */

export interface CreateOrderItemRequest {
  productId: string;
  quantity: number;
  priceAtPurchase: number;
  discount?: number;
}

export interface CreateOrderRequest {
  userId: string;
  cartId: string;
  billingAddressId: string;
  shippingAddressId: string;
  items?: CreateOrderItemRequest[];
}

// 🆕 New request type for orders with discounts/coupons
export interface CreateOrderWithDiscountsRequest {
  userId: string;
  cartId: string;
  billingAddressId: string;
  shippingAddressId: string;
  items?: CreateOrderItemRequest[];
  couponCodes?: string[];
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
}

export interface UpdateOrderItemQuantityRequest {
  quantity: number;
}

/* -------------------------------------------------------------------------- */
/*                           Response DTOs                                   */
/* -------------------------------------------------------------------------- */

export interface CheckoutResponse {
  orderId: string;
  userId: string;
  status: string;
  totalAmount: number;
  items: {
    productId: string;
    quantity: number;

    priceAtPurchase: number;
    total: number;
  }[];
  createdAt: string;
}

// 🆕 Enhanced checkout response with discount information
export interface CheckoutWithDiscountsResponse {
  id: string;
  userId: string;
  cartId: string;
  status: string;
  totalAmount: number;
  tax: number;
  shippingCost: number;
  discount: number;
  createdAt: number[] | string; // Can be array format [2025, 7, 20, ...] or ISO string
  updatedAt: number[] | string;
  billingAddressId: string;
  shippingAddressId: string;
  items: {
    id: string;
    productId: string;
    quantity: number;
    priceAtPurchase: number;
    discount: number;
    total: number;
  }[];
}

/* -------------------------------------------------------------------------- */
/*                          BFF Enriched Types                              */
/* -------------------------------------------------------------------------- */

export enum ProductStatus {
  AVAILABLE = 'AVAILABLE',
  UNAVAILABLE = 'UNAVAILABLE',
  DISCONTINUED = 'DISCONTINUED'
}

export interface ProductBatchInfo {
  id: string;
  name: string;
  imagePath: string;
  inStock: boolean;
  availableQuantity: number;
  status: string;
  price: number;
  productStatus: ProductStatus;
  discountValue?: number;
  discountType?: string;
}

export interface EnrichedOrderItem extends OrderItem {
  product?: ProductBatchInfo;
  productName?: string;
  productImage?: string;
}

export interface EnrichedOrderResponse {
  id: string;
  userId: string;
  cartId?: string;
  status: OrderStatus | string;
  totalAmount: number;
  tax: number;
  shippingCost: number;
  discount: number;
  createdAt: string;
  updatedAt: string;
  billingAddressId: string;
  shippingAddressId: string;
  items: EnrichedOrderItem[];
  enrichmentMetadata?: {
    productsEnriched: boolean;
    enrichmentTimestamp: string;
    failedProductIds: string[];
  };
}

export interface BatchOrderRequest {
  orderIds: string[];
  includeProducts: boolean;
}

export interface BatchOrderResponse {
  orders: EnrichedOrderResponse[];
  failures: Record<string, string>;
  totalRequested: number;
  successful: number;
  failed: number;
  includeProducts: boolean;
  processingTimeMs: number;
}

/* -------------------------------------------------------------------------- */
/*                          User Orders Request Types                        */
/* -------------------------------------------------------------------------- */

export interface UserOrdersParams {
  userId: string;
  status?: string;
  includeProducts?: boolean;
  limit?: number;
}

/* -------------------------------------------------------------------------- */
/*                                  Service                                   */
/* -------------------------------------------------------------------------- */

class OrderService {
  private readonly baseURL = 'http://localhost:8099/api'; // Gateway URL
  private readonly orderURL = `${this.baseURL}/orders`;
  private readonly bffURL = `${this.baseURL}/order`; // Updated to match Java controller

  /* -------------------------------------------------------------------------- */
  /*                           Authentication Helpers                         */
  /* -------------------------------------------------------------------------- */

  /**
   * Get authentication token from cookies
   */
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const cookies = document.cookie.split(';');
      let token = null;
      
      // Look for common token cookie names
      for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'user-service' || name === 'jwt' || name === 'authToken') {
          token = value;
          break;
        }
      }
      
      return token;
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return null;
    }
  }

  /**
   * Get authenticated headers for requests
   */
  private getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const token = this.getAuthToken();
    if (token) {
      // Add Authorization header with Bearer token
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Get request options with authentication
   */
  private getRequestOptions(method: string, body?: any): RequestInit {
    const options: RequestInit = {
      method,
      headers: this.getAuthHeaders(),
      credentials: 'include', // Include cookies in the request
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    return options;
  }

  /**
   * Generic request method with error handling
   */
  private async makeRequest<T>(url: string, options: RequestInit): Promise<T> {
    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Request failed for ${url}:`, error);
      throw error;
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                            Basic Order Operations                         */
  /* -------------------------------------------------------------------------- */

  /**
   * Get all orders
   */
  async getAllOrders(): Promise<Order[]> {
    return this.makeRequest<Order[]>(this.orderURL, this.getRequestOptions('GET'));
  }

  /**
   * Create a new order (legacy method)
   */
  async createOrder(orderRequest: CreateOrderRequest): Promise<Order> {
    return this.makeRequest<Order>(this.orderURL, this.getRequestOptions('POST', orderRequest));
  }

  /**
   * 🆕 Create a new order with discount/coupon support
   */
  async createOrderWithDiscounts(orderRequest: CreateOrderWithDiscountsRequest): Promise<CheckoutWithDiscountsResponse> {
    console.log('Creating order with discounts:', orderRequest);
    
    return this.makeRequest<CheckoutWithDiscountsResponse>(
      `${Order_Service_URL}/order/with-discounts`, 
      this.getRequestOptions('POST', orderRequest)
    );
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: string): Promise<Order> {
    return this.makeRequest<Order>(`${this.orderURL}/${orderId}`, this.getRequestOptions('GET'));
  }

  /**
   * Get orders by user ID
   */
  async getOrdersByUserId(userId: string): Promise<Order[]> {
    return this.makeRequest<Order[]>(`${this.orderURL}/user/${userId}`, this.getRequestOptions('GET'));
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: string, statusUpdate: UpdateOrderStatusRequest): Promise<Order> {
    return this.makeRequest<Order>(`${this.orderURL}/order/${orderId}/status`, this.getRequestOptions('PATCH', statusUpdate));
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string): Promise<Order> {
    return this.makeRequest<Order>(`${this.orderURL}/${orderId}/cancel`, this.getRequestOptions('POST'));
  }

  /**
   * Generate invoice for an order
   */
  async generateInvoice(orderId: string): Promise<Invoice> {
    return this.makeRequest<Invoice>(`${this.orderURL}/${orderId}/invoice`, this.getRequestOptions('GET'));
  }

  /**
   * Get order items for an order
   */
  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return this.makeRequest<OrderItem[]>(`${this.orderURL}/${orderId}/items`, this.getRequestOptions('GET'));
  }

  /**
   * Add item to an order
   */
  async addOrderItem(orderId: string, orderItemRequest: CreateOrderItemRequest): Promise<OrderItem> {
    return this.makeRequest<OrderItem>(`${this.orderURL}/${orderId}/items`, this.getRequestOptions('POST', orderItemRequest));
  }

  /**
   * Update item quantity
   */
  async updateItemQuantity(
    orderId: string,
    itemId: string,
    quantityUpdate: UpdateOrderItemQuantityRequest
  ): Promise<OrderItem> {
    return this.makeRequest<OrderItem>(`${this.orderURL}/${orderId}/items/${itemId}`, this.getRequestOptions('PATCH', quantityUpdate));
  }

  /**
   * Calculate order total
   */
  async calculateOrderTotal(orderId: string): Promise<OrderTotal> {
    return this.makeRequest<OrderTotal>(`${this.orderURL}/${orderId}/total`, this.getRequestOptions('GET'));
  }

  /**
   * Remove an order item
   */
  async removeOrderItem(orderId: string, itemId: string): Promise<void> {
    await fetch(`${this.orderURL}/${orderId}/items/${itemId}`, this.getRequestOptions('DELETE'));
  }

  /**
   * Get order summary (without items details)
   */
  async getOrderSummary(orderId: string): Promise<Order> {
    return this.makeRequest<Order>(`${this.orderURL}/${orderId}/summary`, this.getRequestOptions('GET'));
  }

  /* -------------------------------------------------------------------------- */
  /*                         BFF Enriched Operations                          */
  /* -------------------------------------------------------------------------- */

  /**
   * Get enriched order with product details
   */
  async getEnrichedOrder(orderId: string, includeProducts: boolean = true): Promise<EnrichedOrderResponse> {
    return this.makeRequest<EnrichedOrderResponse>(`${this.bffURL}/${orderId}/enriched?includeProducts=${includeProducts}`, this.getRequestOptions('GET'));
  }

  /**
   * Get enriched orders by user ID (single order response - legacy endpoint)
   */
  async getEnrichedOrdersByUserId(userId: string, status?: string): Promise<EnrichedOrderResponse> {
    const queryParams = status ? `?status=${status}` : '';
    return this.makeRequest<EnrichedOrderResponse>(`${this.bffURL}/user/${userId}${queryParams}`, this.getRequestOptions('GET'));
  }

  /**
   * 🆕 Get all enriched orders for a user (batch response with optimized processing)
   */
  async getUserOrdersBatch(params: UserOrdersParams): Promise<BatchOrderResponse> {
    const {
      userId,
      status,
      includeProducts = true,
      limit = 20
    } = params;

    // Build query parameters
    const queryParams = new URLSearchParams();
    if (status) queryParams.append('status', status);
    queryParams.append('includeProducts', includeProducts.toString());
    queryParams.append('limit', limit.toString());

    const queryString = queryParams.toString();
    const url = `${this.bffURL}/user/${userId}/all${queryString ? `?${queryString}` : ''}`;

    console.log(`📞 Calling user orders batch endpoint: ${url}`);
    console.log(`🔑 Auth token present: ${!!this.getAuthToken()}`);

    const result = await this.makeRequest<BatchOrderResponse>(url, this.getRequestOptions('GET'));
    
    console.log(`✅ User orders batch response:`, {
      totalRequested: result.totalRequested,
      successful: result.successful,
      failed: result.failed,
      includeProducts: result.includeProducts,
      processingTimeMs: result.processingTimeMs
    });

    return result;
  }

  /**
   * Get multiple enriched orders in batch (for specific order IDs)
   */
  async getEnrichedOrdersBatch(batchRequest: BatchOrderRequest): Promise<BatchOrderResponse> {
    return this.makeRequest<BatchOrderResponse>(`${this.bffURL}/batch`, this.getRequestOptions('POST', batchRequest));
  }

  /**
   * Health check for BFF service
   */
  async healthCheck(): Promise<string> {
    const response = await fetch(`${this.bffURL}/health`, this.getRequestOptions('GET'));
    return await response.text();
  }

  /* -------------------------------------------------------------------------- */
  /*                        🆕 Enhanced Checkout Methods                      */
  /* -------------------------------------------------------------------------- */

  /**
   * Create order from cart (legacy method - no coupons)
   */
  async createOrderFromCart(
    billingAddressId: string,
    shippingAddressId: string,
    cartData?: any
  ): Promise<CheckoutResponse> {
    // This method is kept for backward compatibility
    const result = await this.createOrderFromCartWithDiscounts(
      billingAddressId,
      shippingAddressId,
      [], // No coupons
      cartData
    );

    // Convert to legacy response format
    return {
      orderId: result.id,
      userId: result.userId,
      status: result.status,
      totalAmount: result.totalAmount,
      items: result.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        priceAtPurchase: item.priceAtPurchase,
        total: item.total
      })),
      createdAt: Array.isArray(result.createdAt) ? 
        new Date(result.createdAt[0], result.createdAt[1] - 1, result.createdAt[2]).toISOString() : 
        result.createdAt
    };
  }

  /**
   * 🆕 Create order from cart with coupon support
   */
  async createOrderFromCartWithDiscounts(
    billingAddressId: string,
    shippingAddressId: string,
    couponCodes: string[] = [],
    cartData?: any,
    userId?: string
  ): Promise<CheckoutWithDiscountsResponse> {
    
    // Validate prerequisites
    if (!userId && typeof window !== 'undefined') {
      // Try to get userId from auth context or local storage
      userId = localStorage.getItem('userId') || undefined;
    }
    
    if (!userId) {
      throw new Error('Authentication required for checkout');
    }

    if (typeof window !== 'undefined' && !navigator.onLine) {
      throw new Error('Internet connection required for checkout');
    }

    try {
      let currentCart = cartData;
      
      // If cart data not provided, we need to get it from cart service
      if (!currentCart) {
        // This assumes you have a cart service available
        // You might need to import your cart service here
        console.warn('Cart data not provided - checkout may fail without cart items');
        currentCart = { items: [] };
      }
      
      if (!currentCart.items || currentCart.items.length === 0) {
        throw new Error('Cart is empty');
      }

      // Convert cart items to order items
      const orderItems: CreateOrderItemRequest[] = currentCart.items.map((item: any) => ({
        productId: item.productId || item.id,
        quantity: item.quantity || 1,
        priceAtPurchase: item.price || 0,
        discount: item.discount || 0
      }));

      const createOrderRequest: CreateOrderWithDiscountsRequest = {
        userId,
        cartId: currentCart.id || `cart_${Date.now()}`,
        billingAddressId,
        shippingAddressId,
        items: orderItems,
        couponCodes: couponCodes.length > 0 ? couponCodes : undefined
      };

      console.log('Creating order with discounts:', createOrderRequest);

      const response = await this.createOrderWithDiscounts(createOrderRequest);
      
      console.log('Order created successfully with discounts:', response);

      return response;

    } catch (error) {
      console.error('Checkout with discounts failed:', error);
      throw error;
    }
  }

  /**
   * 🆕 Quick checkout with coupon support
   */
  async quickCheckoutWithDiscounts(
    couponCodes: string[] = [],
    cartData?: any,
    userId?: string
  ): Promise<CheckoutWithDiscountsResponse> {
    // For demo - you should get these from user's saved addresses
    const defaultBillingAddress = "789e0123-e45b-67d8-a901-234567890123";
    const defaultShippingAddress = "789e0123-e45b-67d8-a901-234567890123";
    
    return this.createOrderFromCartWithDiscounts(
      defaultBillingAddress, 
      defaultShippingAddress, 
      couponCodes,
      cartData,
      userId
    );
  }

  /**
   * Quick checkout (legacy method)
   */
  async quickCheckout(cartData?: any): Promise<CheckoutResponse> {
    return this.createOrderFromCart(
      "789e0123-e45b-67d8-a901-234567890123", // default billing
      "789e0123-e45b-67d8-a901-234567890123", // default shipping
      cartData
    );
  }

  /**
   * 🆕 Validate cart before checkout with coupon support
   */
  async validateCartForCheckoutWithDiscounts(
    cartData?: any,
    couponCodes: string[] = []
  ): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    estimatedTotal?: number;
    estimatedDiscount?: number;
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let estimatedTotal: number | undefined;
    let estimatedDiscount: number | undefined;

    // Check authentication
    if (!this.getAuthToken()) {
      errors.push('Authentication required for checkout');
    }

    // Check internet connection
    if (typeof window !== 'undefined' && !navigator.onLine) {
      errors.push('Internet connection required for checkout');
    }

    // Validate cart
    if (!cartData || !cartData.items || cartData.items.length === 0) {
      errors.push('Cart is empty');
    } else {
      // Calculate estimated totals if coupons are provided
      if (couponCodes.length > 0) {
        try {
          const subtotal = cartData.items.reduce((total: number, item: any) => 
            total + ((item.price || 0) * (item.quantity || 1)), 0
          );
          
          estimatedTotal = subtotal;
          estimatedDiscount = 0;
          
          // You could add coupon validation here to get estimated discount
          warnings.push(`${couponCodes.length} coupon(s) will be applied during checkout`);
        } catch (error) {
          warnings.push('Could not calculate estimated total with coupons');
        }
      }

      // Additional cart validations could go here
      // For example, checking item availability, prices, etc.
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      estimatedTotal,
      estimatedDiscount
    };
  }

  /**
   * Validate cart before checkout (legacy method)
   */
  async validateCartForCheckout(cartData?: any): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const result = await this.validateCartForCheckoutWithDiscounts(cartData, []);
    return {
      isValid: result.isValid,
      errors: result.errors,
      warnings: result.warnings
    };
  }

  /* -------------------------------------------------------------------------- */
  /*                            Utility Methods                               */
  /* -------------------------------------------------------------------------- */

  /**
   * 🆕 Format order creation date from array format to ISO string
   */
  formatOrderDate(dateArray: number[] | string): string {
    if (typeof dateArray === 'string') {
      return dateArray;
    }
    
    if (Array.isArray(dateArray) && dateArray.length >= 6) {
      // Format: [year, month, day, hour, minute, second, nanosecond]
      const [year, month, day, hour = 0, minute = 0, second = 0] = dateArray;
      return new Date(year, month - 1, day, hour, minute, second).toISOString();
    }
    
    return new Date().toISOString();
  }

  /**
   * 🆕 Calculate savings from discount
   */
  calculateSavings(totalAmount: number, discount: number): {
    originalTotal: number;
    finalTotal: number;
    savings: number;
    savingsPercentage: number;
  } {
    const originalTotal = totalAmount + discount;
    return {
      originalTotal,
      finalTotal: totalAmount,
      savings: discount,
      savingsPercentage: originalTotal > 0 ? (discount / originalTotal) * 100 : 0
    };
  }

  /**
   * Check if order can be cancelled
   */
  canCancelOrder(order: Order): boolean {
    const cancellableStatuses = [OrderStatus.PENDING, OrderStatus.CONFIRMED];
    return cancellableStatuses.includes(order.status);
  }

  /**
   * Check if order can be returned
   */
  canReturnOrder(order: Order): boolean {
    return order.status === OrderStatus.DELIVERED;
  }

  /**
   * Calculate days since order creation
   */
  daysSinceCreated(order: Order): number {
    const createdDate = new Date(order.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Format order status for display
   */
  formatOrderStatus(status: OrderStatus): string {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase().replace('_', ' ');
  }

  /**
   * Calculate subtotal from items
   */
  calculateSubtotalFromItems(items: OrderItem[]): number {
    return items.reduce((total, item) => total + item.total, 0);
  }

  /**
   * Get order status color for UI
   */
  getOrderStatusColor(status: OrderStatus): string {
    const statusColors: Record<OrderStatus, string> = {
      [OrderStatus.PENDING]: '#FFA500',     // Orange
      [OrderStatus.CONFIRMED]: '#007BFF',   // Blue
      [OrderStatus.PROCESSING]: '#6F42C1',  // Purple
      [OrderStatus.SHIPPED]: '#20C997',     // Teal
      [OrderStatus.DELIVERED]: '#28A745',   // Green
      [OrderStatus.CANCELED]: '#DC3545',   // Red
      [OrderStatus.RETURNED]: '#FFC107',    // Yellow
      [OrderStatus.REFUNDED]: '#6C757D'     // Gray
    };
    return statusColors[status] || '#6C757D';
  }

  /**
   * Filter orders by date range
   */
  filterOrdersByDateRange(orders: Order[], startDate: Date, endDate: Date): Order[] {
    return orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= startDate && orderDate <= endDate;
    });
  }

  /**
   * Group orders by status
   */
  groupOrdersByStatus(orders: Order[]): Record<string, Order[]> {
    return orders.reduce((grouped, order) => {
      const status = order.status;
      if (!grouped[status]) {
        grouped[status] = [];
      }
      grouped[status].push(order);
      return grouped;
    }, {} as Record<string, Order[]>);
  }

  /**
   * Calculate total order value for multiple orders
   */
  calculateTotalValue(orders: Order[]): number {
    return orders.reduce((total, order) => total + order.totalAmount, 0);
  }

  /**
   * Search orders by product name (requires enriched orders)
   */
  searchOrdersByProduct(orders: EnrichedOrderResponse[], productName: string): EnrichedOrderResponse[] {
    const searchTerm = productName.toLowerCase();
    return orders.filter(order =>
      order.items.some(item =>
        item.product?.name.toLowerCase().includes(searchTerm)
      )
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                           Batch Analysis Utilities                       */
  /* -------------------------------------------------------------------------- */

  /**
   * Analyze batch response performance
   */
  analyzeBatchPerformance(batchResponse: BatchOrderResponse): {
    successRate: number;
    averageProcessingTime: number;
    recommendedBatchSize: number;
  } {
    const successRate = (batchResponse.successful / batchResponse.totalRequested) * 100;
    const averageProcessingTime = batchResponse.processingTimeMs / batchResponse.totalRequested;
    
    // Simple heuristic for recommended batch size based on performance
    let recommendedBatchSize = 20;
    if (averageProcessingTime < 50) {
      recommendedBatchSize = 50;
    } else if (averageProcessingTime > 200) {
      recommendedBatchSize = 10;
    }

    return {
      successRate,
      averageProcessingTime,
      recommendedBatchSize
    };
  }

  /**
   * Get failed order IDs from batch response
   */
  getFailedOrderIds(batchResponse: BatchOrderResponse): string[] {
    return Object.keys(batchResponse.failures);
  }

  /**
   * Check if batch response has product enrichment
   */
  hasProductEnrichment(batchResponse: BatchOrderResponse): boolean {
    return batchResponse.includeProducts && 
           batchResponse.orders.some(order => 
             order.items.some(item => item.product !== undefined)
           );
  }

  /* -------------------------------------------------------------------------- */
  /*                           Debug Methods                                   */
  /* -------------------------------------------------------------------------- */

  /**
   * Debug authentication status
   */
  debugAuth(): void {
    console.log('🔍 Order Service Auth Debug:');
    console.log('- Token:', this.getAuthToken() ? 'Present' : 'Missing');
    console.log('- Headers:', this.getAuthHeaders());
    console.log('- Cookies:', document.cookie);
  }
}

// Export singleton instance
export const orderService = new OrderService();
export default orderService;