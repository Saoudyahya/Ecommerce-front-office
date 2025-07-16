// lib/services/order.service.ts

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
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

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
}

export interface UpdateOrderItemQuantityRequest {
  quantity: number;
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
  private readonly orderURL = `${this.baseURL}/order`;
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

  /* -------------------------------------------------------------------------- */
  /*                            Basic Order Operations                         */
  /* -------------------------------------------------------------------------- */

  /**
   * Get all orders
   */
  async getAllOrders(): Promise<Order[]> {
    try {
      const response = await fetch(this.orderURL, this.getRequestOptions('GET'));

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  }

  /**
   * Create a new order
   */
  async createOrder(orderRequest: CreateOrderRequest): Promise<Order> {
    try {
      const response = await fetch(this.orderURL, this.getRequestOptions('POST', orderRequest));

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: string): Promise<Order> {
    try {
      const response = await fetch(`${this.orderURL}/${orderId}`, this.getRequestOptions('GET'));

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching order:', error);
      throw error;
    }
  }

  /**
   * Get orders by user ID
   */
  async getOrdersByUserId(userId: string): Promise<Order[]> {
    try {
      const response = await fetch(`${this.orderURL}/user/${userId}`, this.getRequestOptions('GET'));

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching orders by user:', error);
      throw error;
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: string, statusUpdate: UpdateOrderStatusRequest): Promise<Order> {
    try {
      const response = await fetch(`${this.orderURL}/${orderId}/status`, this.getRequestOptions('PATCH', statusUpdate));

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string): Promise<Order> {
    try {
      const response = await fetch(`${this.orderURL}/${orderId}/cancel`, this.getRequestOptions('POST'));

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error canceling order:', error);
      throw error;
    }
  }

  /**
   * Generate invoice for an order
   */
  async generateInvoice(orderId: string): Promise<Invoice> {
    try {
      const response = await fetch(`${this.orderURL}/${orderId}/invoice`, this.getRequestOptions('GET'));

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating invoice:', error);
      throw error;
    }
  }

  /**
   * Get order items for an order
   */
  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    try {
      const response = await fetch(`${this.orderURL}/${orderId}/items`, this.getRequestOptions('GET'));

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching order items:', error);
      throw error;
    }
  }

  /**
   * Add item to an order
   */
  async addOrderItem(orderId: string, orderItemRequest: CreateOrderItemRequest): Promise<OrderItem> {
    try {
      const response = await fetch(`${this.orderURL}/${orderId}/items`, this.getRequestOptions('POST', orderItemRequest));

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding order item:', error);
      throw error;
    }
  }

  /**
   * Update item quantity
   */
  async updateItemQuantity(
    orderId: string,
    itemId: string,
    quantityUpdate: UpdateOrderItemQuantityRequest
  ): Promise<OrderItem> {
    try {
      const response = await fetch(`${this.orderURL}/${orderId}/items/${itemId}`, this.getRequestOptions('PATCH', quantityUpdate));

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating item quantity:', error);
      throw error;
    }
  }

  /**
   * Calculate order total
   */
  async calculateOrderTotal(orderId: string): Promise<OrderTotal> {
    try {
      const response = await fetch(`${this.orderURL}/${orderId}/total`, this.getRequestOptions('GET'));

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error calculating order total:', error);
      throw error;
    }
  }

  /**
   * Remove an order item
   */
  async removeOrderItem(orderId: string, itemId: string): Promise<void> {
    try {
      const response = await fetch(`${this.orderURL}/${orderId}/items/${itemId}`, this.getRequestOptions('DELETE'));

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error removing order item:', error);
      throw error;
    }
  }

  /**
   * Get order summary (without items details)
   */
  async getOrderSummary(orderId: string): Promise<Order> {
    try {
      const response = await fetch(`${this.orderURL}/${orderId}/summary`, this.getRequestOptions('GET'));

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching order summary:', error);
      throw error;
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                         BFF Enriched Operations                          */
  /* -------------------------------------------------------------------------- */

  /**
   * Get enriched order with product details
   */
  async getEnrichedOrder(orderId: string, includeProducts: boolean = true): Promise<EnrichedOrderResponse> {
    try {
      const response = await fetch(`${this.bffURL}/${orderId}/enriched?includeProducts=${includeProducts}`, this.getRequestOptions('GET'));

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching enriched order:', error);
      throw error;
    }
  }

  /**
   * Get enriched orders by user ID (single order response - legacy endpoint)
   */
  async getEnrichedOrdersByUserId(userId: string, status?: string): Promise<EnrichedOrderResponse> {
    try {
      const queryParams = status ? `?status=${status}` : '';
      const response = await fetch(`${this.bffURL}/user/${userId}${queryParams}`, this.getRequestOptions('GET'));

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching enriched orders by user:', error);
      throw error;
    }
  }

  /**
   * 🆕 Get all enriched orders for a user (batch response with optimized processing)
   * This is the new optimized endpoint that:
   * - Gets order IDs first
   * - Fetches orders in parallel
   * - Enriches with products in a single batch request
   * - Returns complete batch response with processing metrics
   */
  async getUserOrdersBatch(params: UserOrdersParams): Promise<BatchOrderResponse> {
    try {
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

      const response = await fetch(url, this.getRequestOptions('GET'));

      if (!response.ok) {
        console.error(`❌ Request failed with status: ${response.status}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      console.log(`✅ User orders batch response:`, {
        totalRequested: result.totalRequested,
        successful: result.successful,
        failed: result.failed,
        includeProducts: result.includeProducts,
        processingTimeMs: result.processingTimeMs
      });

      return result;
    } catch (error) {
      console.error('Error fetching user orders batch:', error);
      throw error;
    }
  }

  /**
   * Get multiple enriched orders in batch (for specific order IDs)
   */
  async getEnrichedOrdersBatch(batchRequest: BatchOrderRequest): Promise<BatchOrderResponse> {
    try {
      const response = await fetch(`${this.bffURL}/batch`, this.getRequestOptions('POST', batchRequest));

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching batch enriched orders:', error);
      throw error;
    }
  }

  /**
   * Health check for BFF service
   */
  async healthCheck(): Promise<string> {
    try {
      const response = await fetch(`${this.bffURL}/health`, this.getRequestOptions('GET'));

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.text();
    } catch (error) {
      console.error('Error checking health:', error);
      throw error;
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                            Utility Methods                               */
  /* -------------------------------------------------------------------------- */

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
      [OrderStatus.CANCELLED]: '#DC3545',   // Red
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