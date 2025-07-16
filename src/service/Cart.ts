// src/service/Cart.ts

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
  // Add image storage
  productImage?: string;
  productName?: string;
  category?: string;
}

interface EnrichedCartItem extends CartItem {
  // Enriched product data
  productName?: string;
  productImage?: string;
  inStock?: boolean;
  availableQuantity?: number;
  productStatus?: 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK' | 'DISCONTINUED';
}

interface EnrichedShoppingCart extends ShoppingCart {
  items: EnrichedCartItem[];
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

export interface LocalStorageCart {
  items: LocalStorageItem[];
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  sessionId: string;
}

export interface LocalStorageItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  addedAt: string;
  updatedAt: string;
  // Add product details for localStorage
  productImage?: string;
  productName?: string;
  category?: string;
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
  // Add optional product details
  productImage?: string;
  productName?: string;
  category?: string;
}

export interface UpdateQuantityRequest {
  quantity: number;
}

export interface CartSyncRequest {
  items: LocalStorageItem[];
  conflictStrategy: ConflictResolutionStrategy;
  lastUpdated: string;
  deviceId: string;
  sessionId: string;
}

export interface CartValidationResponse {
  items: CartValidationItem[];
  totalPriceChange: number;
  hasChanges: boolean;
  message: string;
}

export interface CartValidationItem {
  productId: string;
  productName: string;
  originalPrice: number;
  currentPrice: number;
  priceChanged: boolean;
  availabilityChanged: boolean;
  inStock: boolean;
  maxQuantity?: number;
  validationMessage: string;
}

export interface BulkUpdateRequest {
  items: BulkUpdateItem[];
  sessionId: string;
}

export interface BulkUpdateItem {
  productId: string;
  operation: 'ADD' | 'UPDATE' | 'REMOVE';
  quantity?: number;
  price?: number;
}

export interface QueuedOperation {
  id: string;
  operation: string;
  data: any;
  timestamp: string;
  retryCount: number;
  maxRetries: number;
}

export type ConflictResolutionStrategy = 'SUM_QUANTITIES' | 'KEEP_LATEST' | 'KEEP_SERVER' | 'KEEP_LOCAL' | 'ASK_USER';

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
/*                          Checkout Related Types                           */
/* -------------------------------------------------------------------------- */

export interface CreateOrderRequest {
  userId: string;
  cartId: string;
  billingAddressId: string;
  shippingAddressId: string;
  items?: CreateOrderItemRequest[];
}

export interface CreateOrderItemRequest {
  productId: string;
  quantity: number;
  priceAtPurchase: number;
  discount?: number;
}

export interface CheckoutResponse {
  orderId: string;
  userId: string;
  status: string;
  totalAmount: number;
  items: Array<{
    productId: string;
    quantity: number;
    priceAtPurchase: number;
    total: number;
  }>;
  createdAt: string;
}

/* -------------------------------------------------------------------------- */
/*                           LocalStorage Manager                             */
/* -------------------------------------------------------------------------- */

class LocalStorageCartManager {
  private readonly CART_KEY = 'shopping_cart_v2';
  private readonly EXPIRY_DAYS = 7;

  createEmptyCart(): LocalStorageCart {
    const now = new Date();
    return {
      items: [],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + (this.EXPIRY_DAYS * 24 * 60 * 60 * 1000)).toISOString(),
      sessionId: this.generateSessionId()
    };
  }

  getCart(): LocalStorageCart | null {
    try {
      const stored = localStorage.getItem(this.CART_KEY);
      if (!stored) return null;

      const cart: LocalStorageCart = JSON.parse(stored);
      
      // Check expiry
      if (new Date() > new Date(cart.expiresAt)) {
        this.clearCart();
        return null;
      }

      return cart;
    } catch (error) {
      console.error('Error reading localStorage cart:', error);
      this.clearCart();
      return null;
    }
  }

  saveCart(cart: LocalStorageCart): void {
    try {
      cart.updatedAt = new Date().toISOString();
      localStorage.setItem(this.CART_KEY, JSON.stringify(cart));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
      // Handle storage quota exceeded
      if (error instanceof DOMException && error.code === 22) {
        this.clearOldItems(cart);
        try {
          localStorage.setItem(this.CART_KEY, JSON.stringify(cart));
        } catch {
          console.error('Still unable to save cart after cleanup');
        }
      }
    }
  }

  addItem(
    productId: string, 
    quantity: number, 
    price: number,
    productDetails?: {
      productImage?: string;
      productName?: string;
      category?: string;
    }
  ): LocalStorageCart {
    let cart = this.getCart() || this.createEmptyCart();
    
    const existingItem = cart.items.find(item => item.productId === productId);
    const now = new Date().toISOString();

    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.updatedAt = now;
      // Update product details if provided
      if (productDetails?.productImage) existingItem.productImage = productDetails.productImage;
      if (productDetails?.productName) existingItem.productName = productDetails.productName;
      if (productDetails?.category) existingItem.category = productDetails.category;
    } else {
      cart.items.push({
        id: this.generateId(),
        productId,
        quantity,
        price,
        addedAt: now,
        updatedAt: now,
        // Store product details
        productImage: productDetails?.productImage,
        productName: productDetails?.productName,
        category: productDetails?.category
      });
    }

    this.saveCart(cart);
    return cart;
  }

  removeItem(productId: string): LocalStorageCart {
    let cart = this.getCart() || this.createEmptyCart();
    cart.items = cart.items.filter(item => item.productId !== productId);
    this.saveCart(cart);
    return cart;
  }

  updateQuantity(productId: string, quantity: number): LocalStorageCart {
    let cart = this.getCart() || this.createEmptyCart();
    const item = cart.items.find(item => item.productId === productId);
    
    if (item) {
      if (quantity <= 0) {
        return this.removeItem(productId);
      }
      item.quantity = quantity;
      item.updatedAt = new Date().toISOString();
      this.saveCart(cart);
    }
    
    return cart;
  }

  clearCart(): void {
    localStorage.removeItem(this.CART_KEY);
  }

  getItemCount(): number {
    const cart = this.getCart();
    return cart ? cart.items.reduce((total, item) => total + item.quantity, 0) : 0;
  }

  getTotal(): number {
    const cart = this.getCart();
    return cart ? cart.items.reduce((total, item) => total + (item.price * item.quantity), 0) : 0;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private generateSessionId(): string {
    return 'session_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2);
  }

  private clearOldItems(cart: LocalStorageCart): void {
    // Remove oldest items if storage is full
    cart.items.sort((a, b) => new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime());
    cart.items = cart.items.slice(-10); // Keep only 10 most recent items
  }
}

/* -------------------------------------------------------------------------- */
/*                           Operation Queue Manager                          */
/* -------------------------------------------------------------------------- */

class OperationQueueManager {
  private readonly QUEUE_KEY = 'cart_operation_queue';
  private readonly MAX_RETRIES = 3;

  addOperation(operation: string, data: any): void {
    const operations = this.getOperations();
    const queuedOp: QueuedOperation = {
      id: this.generateId(),
      operation,
      data,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      maxRetries: this.MAX_RETRIES
    };
    
    operations.push(queuedOp);
    this.saveOperations(operations);
  }

  getOperations(): QueuedOperation[] {
    try {
      const stored = localStorage.getItem(this.QUEUE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  removeOperation(id: string): void {
    const operations = this.getOperations().filter(op => op.id !== id);
    this.saveOperations(operations);
  }

  markRetry(id: string): void {
    const operations = this.getOperations();
    const operation = operations.find(op => op.id === id);
    if (operation) {
      operation.retryCount++;
      this.saveOperations(operations);
    }
  }

  clearOperations(): void {
    localStorage.removeItem(this.QUEUE_KEY);
  }

  private saveOperations(operations: QueuedOperation[]): void {
    try {
      localStorage.setItem(this.QUEUE_KEY, JSON.stringify(operations));
    } catch (error) {
      console.error('Error saving operation queue:', error);
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

/* -------------------------------------------------------------------------- */
/*                            Hybrid Cart Service                             */
/* -------------------------------------------------------------------------- */

class HybridCartService {
  private readonly baseURL = 'http://localhost:8099/api/carts';
  private readonly COOKIE_NAME = 'user-service';
  private readonly localCartManager = new LocalStorageCartManager();
  private readonly queueManager = new OperationQueueManager();
  
  private isAuthenticated = false;
  private userId: string | null = null;
  private syncInProgress = false;
  private operationMode: 'guest' | 'authenticated' = 'guest';

  /* -------------------------------------------------------------------------- */
  /*                             Initialization                                */
  /* -------------------------------------------------------------------------- */

  async initialize(userId?: string): Promise<void> {
    if (userId) {
      this.userId = userId;
      this.isAuthenticated = true;
      this.operationMode = 'authenticated';
      
      // Sync localStorage cart with server
      await this.syncWithServer();
      
      // Process queued operations
      await this.processQueuedOperations();
    } else {
      this.operationMode = 'guest';
      this.isAuthenticated = false;
    }

    // Set up online/offline event listeners
    this.setupNetworkListeners();
  }

  /* -------------------------------------------------------------------------- */
  /*                            Authentication                                  */
  /* -------------------------------------------------------------------------- */

  private getAuthToken(): string | null {
    try {
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === this.COOKIE_NAME) {
          return decodeURIComponent(value);
        }
      }
    } catch (error) {
      console.warn('Could not read user-service cookie:', error);
    }
    return null;
  }

  private createHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const token = this.getAuthToken();
    if (token && this.isAuthenticated) {
      headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    }

    return headers;
  }

  /* -------------------------------------------------------------------------- */
  /*                            Network Operations                              */
  /* -------------------------------------------------------------------------- */

  private async makeRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
    const defaultOptions: RequestInit = {
      credentials: 'include',
      headers: {
        ...this.createHeaders(),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, defaultOptions);

    if (response.status === 401) {
      const error: AuthError = {
        message: 'Authentication required. Please sign in.',
        code: 'UNAUTHORIZED'
      };
      throw error;
    }

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // Use default message if response is not JSON
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  }

  /* -------------------------------------------------------------------------- */
  /*                            Cart Operations                                 */
  /* -------------------------------------------------------------------------- */

  async addItem(
    productId: string, 
    quantity: number, 
    price: number,
    productDetails?: {
      productImage?: string;
      productName?: string;
      category?: string;
    }
  ): Promise<ShoppingCart | LocalStorageCart> {
    if (this.operationMode === 'authenticated' && navigator.onLine) {
      try {
        return await this.addItemToServer(productId, quantity, price);
      } catch (error) {
        // Fallback to localStorage and queue operation
        this.queueOperation('addItem', { productId, quantity, price, productDetails });
        return this.localCartManager.addItem(productId, quantity, price, productDetails);
      }
    } else {
      // Guest mode or offline - use localStorage
      if (this.operationMode === 'authenticated') {
        this.queueOperation('addItem', { productId, quantity, price, productDetails });
      }
      return this.localCartManager.addItem(productId, quantity, price, productDetails);
    }
  }

  async removeItem(productId: string): Promise<ShoppingCart | LocalStorageCart> {
    if (this.operationMode === 'authenticated' && navigator.onLine) {
      try {
        return await this.removeItemFromServer(productId);
      } catch (error) {
        this.queueOperation('removeItem', { productId });
        return this.localCartManager.removeItem(productId);
      }
    } else {
      if (this.operationMode === 'authenticated') {
        this.queueOperation('removeItem', { productId });
      }
      return this.localCartManager.removeItem(productId);
    }
  }

  async updateQuantity(productId: string, quantity: number): Promise<ShoppingCart | LocalStorageCart> {
    if (this.operationMode === 'authenticated' && navigator.onLine) {
      try {
        return await this.updateQuantityOnServer(productId, quantity);
      } catch (error) {
        this.queueOperation('updateQuantity', { productId, quantity });
        return this.localCartManager.updateQuantity(productId, quantity);
      }
    } else {
      if (this.operationMode === 'authenticated') {
        this.queueOperation('updateQuantity', { productId, quantity });
      }
      return this.localCartManager.updateQuantity(productId, quantity);
    }
  }

  private getUserIdFromToken(): string | null {
    if (typeof window === 'undefined') return null;
    
    try {
      // Get the JWT token from cookies 
      const cookies = document.cookie.split(';');
      let token = null;
      
      for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'user-service' || name === 'jwt' || name === 'authToken') {
          token = value;
          break;
        }
      }
      
      if (!token) {
        return null;
      }
      
      // Decode JWT token (simple base64 decode of payload)
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }
      
      const payload = JSON.parse(atob(parts[1]));
      return payload.id || null;
    } catch (error) {
      console.error('Failed to decode JWT token:', error);
      return null;
    }
  }

  async getCart(): Promise<ShoppingCart | LocalStorageCart | null> {
    if (this.operationMode === 'authenticated' && navigator.onLine) {
      try {
        // Try enriched endpoint first
        return await this.getEnrichedServerCart();
      } catch (enrichedError) {
        console.warn('Enriched cart failed, trying basic cart:', enrichedError);
        try {
          // Fallback to basic server cart
          return await this.getServerCart();
        } catch (basicError) {
          console.error('Basic cart also failed, using localStorage:', basicError);
          // Final fallback to localStorage
          return this.localCartManager.getCart();
        }
      }
    } else {
      return this.localCartManager.getCart();
    }
  }

  async getCartTotal(): Promise<number> {
    if (this.operationMode === 'authenticated' && navigator.onLine) {
      try {
        return await this.getServerCartTotal();
      } catch (error) {
        return this.localCartManager.getTotal();
      }
    } else {
      return this.localCartManager.getTotal();
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                            Server Operations                               */
  /* -------------------------------------------------------------------------- */

  private async addItemToServer(productId: string, quantity: number, price: number): Promise<ShoppingCart> {
    const apiResponse: ApiResponse<ShoppingCart> = await this.makeRequest(
      `${this.baseURL}/${this.userId}/items`,
      {
        method: 'POST',
        body: JSON.stringify({ productId, quantity, price }),
      }
    );
    return apiResponse.data;
  }

  private async removeItemFromServer(productId: string): Promise<ShoppingCart> {
    const apiResponse: ApiResponse<ShoppingCart> = await this.makeRequest(
      `${this.baseURL}/${this.userId}/items/${productId}`,
      { method: 'DELETE' }
    );
    return apiResponse.data;
  }

  private async updateQuantityOnServer(productId: string, quantity: number): Promise<ShoppingCart> {
    const apiResponse: ApiResponse<ShoppingCart> = await this.makeRequest(
      `${this.baseURL}/${this.userId}/items/${productId}`,
      {
        method: 'PUT',
        body: JSON.stringify({ quantity }),
      }
    );
    return apiResponse.data;
  }

  private async getServerCart(): Promise<ShoppingCart> {
    const apiResponse: ApiResponse<ShoppingCart> = await this.makeRequest(
      `${this.baseURL}/${this.userId}`
    );
    return apiResponse.data;
  }

  private async getEnrichedServerCart(): Promise<ShoppingCart> {
    const userIdFromToken = this.getUserIdFromToken();
    const userId = userIdFromToken || this.userId;
    
    if (!userId) {
      throw new Error('No user ID available for enriched cart request');
    }

    // The enriched endpoint returns cart data directly, not wrapped in ApiResponse
    const cartData: ShoppingCart = await this.makeRequest(
      `http://localhost:8099/api/cart/${userId}/enriched`
    );
    return cartData; // ✅ Return the cart data directly
  }

  private async getServerCartTotal(): Promise<number> {
    const apiResponse: ApiResponse<{total: number}> = await this.makeRequest(
      `${this.baseURL}/${this.userId}/total`
    );
    return apiResponse.data.total;
  }

  /* -------------------------------------------------------------------------- */
  /*                            Sync Operations                                 */
  /* -------------------------------------------------------------------------- */

  async syncWithServer(): Promise<ShoppingCart | null> {
    if (this.syncInProgress || !this.isAuthenticated || !navigator.onLine) {
      return null;
    }

    this.syncInProgress = true;
    try {
      const localCart = this.localCartManager.getCart();
      
      if (localCart && localCart.items.length > 0) {
        const syncRequest: CartSyncRequest = {
          items: localCart.items,
          conflictStrategy: 'SUM_QUANTITIES',
          lastUpdated: localCart.updatedAt,
          deviceId: this.getDeviceId(),
          sessionId: localCart.sessionId
        };

        const apiResponse: ApiResponse<ShoppingCart> = await this.makeRequest(
          `${this.baseURL}/${this.userId}/sync`,
          {
            method: 'POST',
            body: JSON.stringify(syncRequest),
          }
        );

        console.log('Sync response:', apiResponse.data);

        // Clear localStorage after successful sync
        this.localCartManager.clearCart();
        
        return apiResponse.data;
      }
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    } finally {
      this.syncInProgress = false;
    }

    return null;
  }

  async validateLocalCart(): Promise<CartValidationResponse | null> {
    const localCart = this.localCartManager.getCart();
    if (!localCart || localCart.items.length === 0) return null;

    try {
      const apiResponse: ApiResponse<CartValidationResponse> = await this.makeRequest(
        `${this.baseURL}/guest/validate`,
        {
          method: 'POST',
          body: JSON.stringify({
            items: localCart.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              addedAt: item.addedAt
            })),
            sessionId: localCart.sessionId
          }),
        }
      );
      
      return apiResponse.data;
    } catch (error) {
      console.error('Validation failed:', error);
      return null;
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                            Queue Operations                                */
  /* -------------------------------------------------------------------------- */

  private queueOperation(operation: string, data: any): void {
    this.queueManager.addOperation(operation, data);
  }

  private async processQueuedOperations(): Promise<void> {
    if (!this.isAuthenticated || !navigator.onLine) return;

    const operations = this.queueManager.getOperations();
    
    for (const operation of operations) {
      try {
        await this.executeQueuedOperation(operation);
        this.queueManager.removeOperation(operation.id);
      } catch (error) {
        this.queueManager.markRetry(operation.id);
        
        if (operation.retryCount >= operation.maxRetries) {
          console.error(`Operation ${operation.operation} failed after ${operation.maxRetries} retries`);
          this.queueManager.removeOperation(operation.id);
        }
      }
    }
  }

  private async executeQueuedOperation(operation: QueuedOperation): Promise<void> {
    const { operation: opType, data } = operation;
    
    switch (opType) {
      case 'addItem':
        await this.addItemToServer(data.productId, data.quantity, data.price);
        break;
      case 'removeItem':
        await this.removeItemFromServer(data.productId);
        break;
      case 'updateQuantity':
        await this.updateQuantityOnServer(data.productId, data.quantity);
        break;
      default:
        console.warn(`Unknown operation type: ${opType}`);
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                            Event Listeners                                */
  /* -------------------------------------------------------------------------- */

  private setupNetworkListeners(): void {
    window.addEventListener('online', async () => {
      console.log('Back online - processing queued operations');
      if (this.isAuthenticated) {
        await this.processQueuedOperations();
      }
    });

    window.addEventListener('offline', () => {
      console.log('Gone offline - operations will be queued');
    });
  }

  /* -------------------------------------------------------------------------- */
  /*                            Checkout Operations                             */
  /* -------------------------------------------------------------------------- */

  /**
   * Create an order from the current cart
   */
  async createOrderFromCart(
    billingAddressId: string,
    shippingAddressId: string
  ): Promise<CheckoutResponse> {
    if (!this.isAuthenticated || !this.userId) {
      throw new Error('Authentication required for checkout');
    }

    if (!navigator.onLine) {
      throw new Error('Internet connection required for checkout');
    }

    try {
      // Get current cart to create order items
      const currentCart = await this.getCart();
      
      if (!currentCart || !currentCart.items || currentCart.items.length === 0) {
        throw new Error('Cart is empty');
      }

      // Convert cart items to order items
      const orderItems: CreateOrderItemRequest[] = currentCart.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        priceAtPurchase: item.price,
        discount: 0 // You can calculate discount if needed
      }));

      const createOrderRequest: CreateOrderRequest = {
        userId: this.userId,
        cartId: currentCart.id || `cart_${Date.now()}`,
        billingAddressId,
        shippingAddressId,
        items: orderItems
      };

      console.log('Creating order from cart:', createOrderRequest);

      // Create order via order service
      const response = await this.makeRequest<CheckoutResponse>(
        'http://localhost:8099/api/orders/order',
        {
          method: 'POST',
          body: JSON.stringify(createOrderRequest),
        }
      );

      console.log('Order created successfully:', response);

      // Clear cart after successful order creation
      if (this.operationMode === 'authenticated') {
        await this.clearServerCart();
      }
      this.clearLocalCart();

      return response;

    } catch (error) {
      console.error('Checkout failed:', error);
      throw error;
    }
  }

  /**
   * Clear server cart after successful checkout
   */
  private async clearServerCart(): Promise<void> {
    try {
      await this.makeRequest(
        `${this.baseURL}/${this.userId}/clear`,
        { method: 'DELETE' }
      );
    } catch (error) {
      console.error('Failed to clear server cart:', error);
      // Don't throw error as order was already created
    }
  }

  /**
   * Quick checkout with default addresses (for demo purposes)
   */
  async quickCheckout(): Promise<CheckoutResponse> {
    // For demo - you should get these from user's saved addresses
    const defaultBillingAddress = "789e0123-e45b-67d8-a901-234567890123";
    const defaultShippingAddress = "789e0123-e45b-67d8-a901-234567890123";
    
    return this.createOrderFromCart(defaultBillingAddress, defaultShippingAddress);
  }

  /**
   * Validate cart before checkout
   */
  async validateCartForCheckout(): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!this.isAuthenticated) {
      errors.push('Authentication required for checkout');
    }

    if (!navigator.onLine) {
      errors.push('Internet connection required for checkout');
    }

    const cart = await this.getCart();
    if (!cart || cart.items.length === 0) {
      errors.push('Cart is empty');
    }

    // Validate cart items
    if (cart && cart.items.length > 0) {
      const validation = await this.validateLocalCart();
      if (validation && validation.hasChanges) {
        warnings.push('Some items in your cart have changed. Please review before checkout.');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /* -------------------------------------------------------------------------- */
  /*                            Utility Methods                                */
  /* -------------------------------------------------------------------------- */

  getItemCount(): number {
    if (this.operationMode === 'guest') {
      return this.localCartManager.getItemCount();
    }
    // For authenticated users, you might want to fetch from server or use cached value
    return this.localCartManager.getItemCount(); // Fallback
  }

  isCartEmpty(): boolean {
    return this.getItemCount() === 0;
  }

  getCurrentMode(): 'guest' | 'authenticated' {
    return this.operationMode;
  }

  isOnline(): boolean {
    return navigator.onLine;
  }

  clearLocalCart(): void {
    this.localCartManager.clearCart();
    this.queueManager.clearOperations();
  }

  private getDeviceId(): string {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = 'device_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2);
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  }

  /* -------------------------------------------------------------------------- */
  /*                            Debug Methods                                   */
  /* -------------------------------------------------------------------------- */

  debugInfo(): void {
    console.log('=== Hybrid Cart Service Debug ===');
    console.log('Operation Mode:', this.operationMode);
    console.log('Is Authenticated:', this.isAuthenticated);
    console.log('User ID:', this.userId);
    console.log('Is Online:', this.isOnline());
    console.log('Sync In Progress:', this.syncInProgress);
    console.log('Local Cart:', this.localCartManager.getCart());
    console.log('Queued Operations:', this.queueManager.getOperations());
    console.log('================================');
  }

  /* -------------------------------------------------------------------------- */
  /*                        Legacy Method Support                               */
  /* -------------------------------------------------------------------------- */

  // Maintain compatibility with your existing code
  async checkout(): Promise<void> {
    if (this.operationMode === 'authenticated' && this.userId) {
      await this.makeRequest(`${this.baseURL}/${this.userId}/checkout`, {
        method: 'POST',
      });
    } else {
      throw new Error('Checkout requires authentication');
    }
  }

  async getSavedItems(): Promise<SavedItem[]> {
    if (this.operationMode === 'authenticated' && this.userId) {
      const apiResponse: ApiResponse<SavedItem[]> = await this.makeRequest(
        `${this.baseURL}/${this.userId}/saved`
      );
      return apiResponse.data;
    }
    return [];
  }
}

/* -------------------------------------------------------------------------- */
/*                            Export Service                                  */
/* -------------------------------------------------------------------------- */

// Export singleton instance
export const hybridCartService = new HybridCartService();

// Export default for easier imports
export default hybridCartService;