"use client";

import * as React from "react";
import { toast } from "sonner";
import { hybridCartService  } from "~/service/Cart";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  category?: string;
}

export interface CartContextType {
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => Promise<void>;
  clearCart: () => Promise<void>;
  itemCount: number;
  items: CartItem[];
  removeItem: (id: string) => Promise<void>;
  subtotal: number;
  total: number;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  isGuest: boolean;
  userId: string | null;
  isLoading: boolean;
  isUpdating: boolean;
  isOnline: boolean;
  cartMode: 'guest' | 'authenticated';
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  refreshCart: () => Promise<void>;
}

/* -------------------------------------------------------------------------- */
/*                                Context                                     */
/* -------------------------------------------------------------------------- */

const CartContext = React.createContext<CartContextType | undefined>(undefined);

/* -------------------------------------------------------------------------- */
/*                               Provider                                     */
/* -------------------------------------------------------------------------- */

interface CartProviderProps {
  children: React.ReactNode;
  userId?: string | null; // Optional authenticated user ID
}

export function CartProvider({ children, userId: authUserId }: CartProviderProps) {
  const [items, setItems] = React.useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [isOnline, setIsOnline] = React.useState(true);
  const [syncStatus, setSyncStatus] = React.useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  
  const isGuest = !authUserId;
  const cartMode = hybridCartService.getCurrentMode();

  // Monitor online/offline status
  React.useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('Back online - cart will sync automatically');
    };
    const handleOffline = () => {
      setIsOnline(false);
      console.log('Gone offline - cart operations will use localStorage');
    };

    setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize hybrid cart service
  React.useEffect(() => {
    const initializeService = async () => {
      try {
        setIsLoading(true);
        setSyncStatus('syncing');
        
        await hybridCartService.initialize(authUserId || undefined);
        
        if (authUserId) {
          setSyncStatus('synced');
          console.log('Cart service initialized for authenticated user');
        } else {
          setSyncStatus('idle');
          console.log('Cart service initialized for guest user');
        }
      } catch (error) {
        console.error('Failed to initialize cart service:', error);
        setSyncStatus('error');
      } finally {
        setIsLoading(false);
      }
    };

    initializeService();
  }, [authUserId]);

  // Load cart data after service initialization
  React.useEffect(() => {
    if (syncStatus !== 'syncing') {
      loadCart();
    }
  }, [syncStatus]);

  const loadCart = React.useCallback(async () => {
    try {
      setIsLoading(true);
      
      const cartData = await hybridCartService.getCart();
      
      if (!cartData || !cartData.items || cartData.items.length === 0) {
        setItems([]);
        return;
      }
      
      // Convert hybrid cart items to CartItem format
      const cartItems: CartItem[] = cartData.items.map(item => ({
        id: item.productId, // Use productId as the ID for compatibility
        name: `Product ${item.productId}`, // We'll need to fetch this from product service
        price: item.price,
        quantity: item.quantity,
        image: undefined,
        category: undefined,
      }));
      
      setItems(cartItems);
    } catch (error) {
      console.error('Failed to load cart:', error);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /* ----------------------------- Actions -------------------------------- */
  const addItem = React.useCallback(
    async (newItem: Omit<CartItem, "quantity">, qty = 1) => {
      if (qty <= 0) return;
      
      setIsUpdating(true);
      try {
        await hybridCartService.addItem(newItem.id, qty, newItem.price);
        await loadCart();

        toast.success("Success", {
          description: `${newItem.name} added to ${isGuest ? 'local' : 'your'} cart!`,
        });
      } catch (error) {
        console.error('Failed to add item:', error);
        toast.error("Error", {
          description: "Failed to add item to cart. Please try again.",
        });
      } finally {
        setIsUpdating(false);
      }
    },
    [isGuest, loadCart],
  );

  const removeItem = React.useCallback(async (id: string) => {
    setIsUpdating(true);
    try {
      await hybridCartService.removeItem(id);
      await loadCart();
      
      toast.success("Success", {
        description: "Item removed from cart",
      });
    } catch (error) {
      console.error('Failed to remove item:', error);
      toast.error("Error", {
        description: "Failed to remove item. Please try again.",
      });
    } finally {
      setIsUpdating(false);
    }
  }, [loadCart]);

  const updateQuantity = React.useCallback(async (id: string, qty: number) => {
    if (qty < 0) return;
    
    setIsUpdating(true);
    try {
      if (qty === 0) {
        await hybridCartService.removeItem(id);
      } else {
        await hybridCartService.updateQuantity(id, qty);
      }
      await loadCart();

      if (qty > 0) {
        toast.success("Success", {
          description: "Item quantity updated",
        });
      }
    } catch (error) {
      console.error('Failed to update quantity:', error);
      toast.error("Error", {
        description: "Failed to update quantity. Please try again.",
      });
    } finally {
      setIsUpdating(false);
    }
  }, [loadCart]);

  const clearCart = React.useCallback(async () => {
    if (items.length === 0) return;
    
    setIsUpdating(true);
    try {
      // Remove all items
      await Promise.all(items.map(item => hybridCartService.removeItem(item.id)));
      await loadCart();
      
      toast.success("Success", {
        description: "Cart cleared successfully",
      });
    } catch (error) {
      console.error('Failed to clear cart:', error);
      toast.error("Error", {
        description: "Failed to clear cart. Please try again.",
      });
    } finally {
      setIsUpdating(false);
    }
  }, [items, loadCart]);

  /* --------------------------- Derived data ----------------------------- */
  const itemCount = React.useMemo(
    () => items.reduce((t, i) => t + i.quantity, 0),
    [items],
  );

  const subtotal = React.useMemo(
    () => items.reduce((t, i) => t + i.price * i.quantity, 0),
    [items],
  );

  // Calculate total (for now, same as subtotal, but could include tax/shipping)
  const total = React.useMemo(() => {
    const tax = subtotal * 0.08; // 8% tax
    const shipping = subtotal > 50 ? 0 : 5.99; // Free shipping over $50
    return subtotal + tax + shipping;
  }, [subtotal]);

  /* ----------------------------- Context value -------------------------- */
  const value = React.useMemo<CartContextType>(
    () => ({
      addItem,
      clearCart,
      itemCount,
      items,
      removeItem,
      subtotal,
      total,
      updateQuantity,
      isGuest,
      userId: authUserId,
      isLoading,
      isUpdating,
      isOnline,
      cartMode,
      syncStatus,
      refreshCart: loadCart,
    }),
    [
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      itemCount,
      subtotal,
      total,
      isGuest,
      authUserId,
      isLoading,
      isUpdating,
      isOnline,
      cartMode,
      syncStatus,
      loadCart,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/* -------------------------------------------------------------------------- */
/*                                 Hook                                      */
/* -------------------------------------------------------------------------- */

export function useCart(): CartContextType {
  const ctx = React.useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}

/* -------------------------------------------------------------------------- */
/*                            Helper Functions                                */
/* -------------------------------------------------------------------------- */

// Helper function to migrate cart when user signs in
export const useCartMigration = () => {
  const migrateGuestCart = React.useCallback(async (newUserId: string) => {
    try {
      // The hybrid service handles this automatically during initialization
      await hybridCartService.initialize(newUserId);
      console.log('Cart migration completed for user:', newUserId);
    } catch (error) {
      console.error('Failed to migrate guest cart:', error);
    }
  }, []);

  return { migrateGuestCart };
};