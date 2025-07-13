import * as React from "react";
import { toast } from "sonner";
import { hybridCartService } from "~/service/Cart";
import { 
  EnrichedCartItemDTO, 
  EnrichedCartResponseDTO, 
  ProductStatus 
} from "~/service/BFFCart";

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
  // Enriched product data from Gateway
  productId?: string;
  productName?: string;
  productImage?: string;
  inStock?: boolean;
  availableQuantity?: number;
  productStatus?: ProductStatus;
}

export interface CartContextType {
  addItem: (item: Omit<CartItem, "quantity" | "subtotal" | "addedAt">, quantity?: number) => Promise<void>;
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
      
      console.log('Loading cart data...');
      const cartData = await hybridCartService.getCart();
      console.log('Raw cart data:', cartData);
      
      if (!cartData || !cartData.items) {
        console.log('No cart data found, setting empty cart');
        setItems([]);
        return;
      }

      // Convert cart items to CartItem format
      const cartItems: CartItem[] = cartData.items
        .filter(item => item && (item.id || item.productId)) // Filter out invalid items
        .map(item => {
          const mappedItem: CartItem = {
            id: item.id || item.productId || `item-${Date.now()}-${Math.random()}`,
            name: item.productName || item.name || `Product ${item.productId || item.id}`,
            price: typeof item.price === 'number' ? item.price : 0,
            quantity: typeof item.quantity === 'number' ? item.quantity : 1,
            image: item.productImage || item.image || undefined,
            category: item.category || undefined,
            // Enriched product data
            productId: item.productId || item.id,
            productName: item.productName || item.name,
            productImage: item.productImage || item.image,
            inStock: item.inStock,
            availableQuantity: item.availableQuantity,
            productStatus: item.productStatus,
          };
          console.log('Mapped cart item:', mappedItem);
          return mappedItem;
        });
      
      console.log('Final cart items:', cartItems);
      setItems(cartItems);
    } catch (error) {
      console.error('Failed to load cart:', error);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Safety check to ensure items are always valid
  React.useEffect(() => {
    if (items && items.length > 0) {
      const validItems = items.filter(item => 
        item && 
        (item.id || item.productId) && 
        typeof item.price === 'number' && 
        typeof item.quantity === 'number'
      );
      
      if (validItems.length !== items.length) {
        console.warn('Found invalid cart items, filtering them out');
        setItems(validItems);
      }
    }
  }, [items]);

  /* ----------------------------- Actions -------------------------------- */
  const addItem = React.useCallback(
    async (newItem: Omit<CartItem, "quantity">, qty = 1) => {
      if (qty <= 0) return;
      
      setIsUpdating(true);
      try {
        // 🔥 FIX: Pass product details to hybridCartService
        const productDetails = {
          productImage: newItem.image || newItem.productImage,
          productName: newItem.name || newItem.productName,
          category: newItem.category
        };

        console.log('Adding item with details:', {
          productId: newItem.productId || newItem.id,
          quantity: qty,
          price: newItem.price,
          productDetails
        });

        await hybridCartService.addItem(
          newItem.productId || newItem.id, 
          qty, 
          newItem.price,
          productDetails // ✅ Pass product details
        );
        
        await loadCart();

        toast.success("Success", {
          description: `${newItem.productName || newItem.name} added to ${isGuest ? 'local' : 'your'} cart!`,
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
      // Find the item to get productId if available
      const item = items.find(item => item.id === id || item.productId === id);
      const itemId = item?.productId || id;
      
      await hybridCartService.removeItem(itemId);
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
  }, [loadCart, items]);

  const updateQuantity = React.useCallback(async (id: string, qty: number) => {
    if (qty < 0) return;
    
    setIsUpdating(true);
    try {
      // Find the item to get productId if available
      const item = items.find(item => item.id === id || item.productId === id);
      const itemId = item?.productId || id;
      
      if (qty === 0) {
        await hybridCartService.removeItem(itemId);
      } else {
        await hybridCartService.updateQuantity(itemId, qty);
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
  }, [loadCart, items]);

  const clearCart = React.useCallback(async () => {
    if (items.length === 0) return;
    
    setIsUpdating(true);
    try {
      // Remove all items using productId if available
      await Promise.all(items.map(item => 
        hybridCartService.removeItem(item.productId || item.id)
      ));
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