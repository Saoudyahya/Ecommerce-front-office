// lib/hooks/use-orders.ts

import { useState, useEffect, useCallback } from 'react';
import { orderService, type EnrichedOrderResponse, type OrderStatus, type BatchOrderResponse } from '~/service/Order';
import { toast } from 'sonner';

interface UseOrdersOptions {
  userId?: string;
  status?: string;
  includeProducts?: boolean;
  limit?: number;
  autoLoad?: boolean;
}

interface UseOrdersReturn {
  orders: EnrichedOrderResponse[];
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
  totalRequested: number;
  successful: number;
  failed: number;
  processingTimeMs: number;
  hasProductEnrichment: boolean;
  loadOrders: () => Promise<void>;
  refreshOrders: () => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;
  continueOrder: (orderId: string) => Promise<void>;
  canCancelOrder: (order: EnrichedOrderResponse) => boolean;
  canContinueOrder: (order: EnrichedOrderResponse) => boolean;
  getOrderById: (orderId: string) => EnrichedOrderResponse | undefined;
  filterOrdersByStatus: (status: OrderStatus) => EnrichedOrderResponse[];
  getOrdersByDateRange: (startDate: Date, endDate: Date) => EnrichedOrderResponse[];
  calculateTotalValue: () => number;
}

export function useOrders(options: UseOrdersOptions = {}): UseOrdersReturn {
  const {
    userId,
    status,
    includeProducts = true,
    limit = 50,
    autoLoad = true
  } = options;

  const [orders, setOrders] = useState<EnrichedOrderResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [batchMetadata, setBatchMetadata] = useState({
    totalRequested: 0,
    successful: 0,
    failed: 0,
    processingTimeMs: 0,
    hasProductEnrichment: false
  });

  // Get user ID from JWT token if not provided
  const getUserIdFromToken = useCallback((): string | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const cookies = document.cookie.split(';');
      let token = null;
      
      for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'user-service' || name === 'jwt' || name === 'authToken') {
          token = value;
          break;
        }
      }
      
      if (!token) return null;
      
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const payload = JSON.parse(atob(parts[1]));
      return payload.id || null;
    } catch (error) {
      console.error('Failed to decode JWT token:', error);
      return null;
    }
  }, []);

  const currentUserId = userId || getUserIdFromToken();

  // Load orders from API
  const loadOrders = useCallback(async () => {
    if (!currentUserId) {
      setError('User authentication required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Loading orders for user:', currentUserId);
      
      const response: BatchOrderResponse = await orderService.getUserOrdersBatch({
        userId: currentUserId,
        status: status,
        includeProducts,
        limit
      });

      console.log('Orders loaded:', response);
      
      setOrders(response.orders || []);
      setBatchMetadata({
        totalRequested: response.totalRequested,
        successful: response.successful,
        failed: response.failed,
        processingTimeMs: response.processingTimeMs,
        hasProductEnrichment: response.includeProducts && response.orders.some(order => 
          order.items.some(item => item.productName && item.productName !== 'Loading...')
        )
      });
      
      if (response.failed > 0) {
        toast.warning("Some orders failed to load", {
          description: `${response.failed} out of ${response.totalRequested} orders could not be loaded`,
        });
      }
      
    } catch (error) {
      console.error('Failed to load orders:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load orders';
      setError(errorMessage);
      toast.error("Failed to load orders", {
        description: errorMessage,
      });
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, status, includeProducts, limit]);

  // Refresh orders (alias for loadOrders)
  const refreshOrders = useCallback(async () => {
    await loadOrders();
  }, [loadOrders]);

  // Update order status
  const updateOrderStatus = useCallback(async (orderId: string, newStatus: OrderStatus) => {
    if (!orderId) {
      toast.error("Invalid order ID");
      return;
    }

    setIsUpdating(true);
    
    try {
      await orderService.updateOrderStatus(orderId, { status: newStatus });
      
      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus, updatedAt: new Date().toISOString() }
          : order
      ));
      
      toast.success("Order updated", {
        description: `Order status changed to ${newStatus.toLowerCase()}`,
      });
      
    } catch (error) {
      console.error('Failed to update order status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update order';
      toast.error("Failed to update order", {
        description: errorMessage,
      });
    } finally {
      setIsUpdating(false);
    }
  }, []);

  // Cancel order
  const cancelOrder = useCallback(async (orderId: string) => {
    await updateOrderStatus(orderId, 'CANCELLED');
  }, [updateOrderStatus]);

  // Continue with order (confirm it)
  const continueOrder = useCallback(async (orderId: string) => {
    await updateOrderStatus(orderId, 'CONFIRMED');
  }, [updateOrderStatus]);

  // Check if order can be cancelled
  const canCancelOrder = useCallback((order: EnrichedOrderResponse): boolean => {
    return ['PENDING', 'CONFIRMED'].includes(order.status);
  }, []);

  // Check if order can be continued
  const canContinueOrder = useCallback((order: EnrichedOrderResponse): boolean => {
    return order.status === 'PENDING';
  }, []);

  // Get order by ID
  const getOrderById = useCallback((orderId: string): EnrichedOrderResponse | undefined => {
    return orders.find(order => order.id === orderId);
  }, [orders]);

  // Filter orders by status
  const filterOrdersByStatus = useCallback((status: OrderStatus): EnrichedOrderResponse[] => {
    return orders.filter(order => order.status === status);
  }, [orders]);

  // Filter orders by date range
  const getOrdersByDateRange = useCallback((startDate: Date, endDate: Date): EnrichedOrderResponse[] => {
    return orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= startDate && orderDate <= endDate;
    });
  }, [orders]);

  // Calculate total value of all orders
  const calculateTotalValue = useCallback((): number => {
    return orders.reduce((total, order) => total + order.totalAmount, 0);
  }, [orders]);

  // Load orders on mount if autoLoad is enabled
  useEffect(() => {
    if (autoLoad && currentUserId) {
      loadOrders();
    }
  }, [autoLoad, currentUserId, loadOrders]);

  return {
    orders,
    isLoading,
    isUpdating,
    error,
    totalRequested: batchMetadata.totalRequested,
    successful: batchMetadata.successful,
    failed: batchMetadata.failed,
    processingTimeMs: batchMetadata.processingTimeMs,
    hasProductEnrichment: batchMetadata.hasProductEnrichment,
    loadOrders,
    refreshOrders,
    updateOrderStatus,
    cancelOrder,
    continueOrder,
    canCancelOrder,
    canContinueOrder,
    getOrderById,
    filterOrdersByStatus,
    getOrdersByDateRange,
    calculateTotalValue
  };
}

// Hook for single order
export function useOrder(orderId: string) {
  const [order, setOrder] = useState<EnrichedOrderResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrder = useCallback(async () => {
    if (!orderId) {
      setError('Order ID is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await orderService.getEnrichedOrder(orderId, true);
      setOrder(response);
    } catch (error) {
      console.error('Failed to load order:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load order';
      setError(errorMessage);
      setOrder(null);
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (orderId) {
      loadOrder();
    }
  }, [orderId, loadOrder]);

  return {
    order,
    isLoading,
    error,
    loadOrder,
    refreshOrder: loadOrder
  };
}