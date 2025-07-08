"use client";

import * as React from "react";
import { toast } from "sonner";


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
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  clearCart: () => void;
  itemCount: number;
  items: CartItem[];
  removeItem: (id: string) => void;
  subtotal: number;
  total: number;
  updateQuantity: (id: string, quantity: number) => void;
  isGuest: boolean;
  userId: string | null;
  isLoading: boolean;
  isUpdating: boolean;
}

/* -------------------------------------------------------------------------- */
/*                                Context                                     */
/* -------------------------------------------------------------------------- */

const CartContext = React.createContext<CartContextType | undefined>(undefined);

/* -------------------------------------------------------------------------- */
/*                         Local-storage helpers                              */
/* -------------------------------------------------------------------------- */

const STORAGE_KEY = "cart";
const GUEST_ID_KEY = 'guest_user_id';
const DEBOUNCE_MS = 300;

// Generate a guest user ID that persists across sessions
const getGuestUserId = (): string => {
  if (typeof window === "undefined") return `guest_${Date.now()}`;
  
  let guestId = localStorage.getItem(GUEST_ID_KEY);
  
  if (!guestId) {
    guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    try {
      localStorage.setItem(GUEST_ID_KEY, guestId);
    } catch (error) {
      console.warn('Failed to save guest ID to localStorage:', error);
    }
  }
  
  return guestId;
};

const getStorageKey = (userId: string): string => {
  return `${STORAGE_KEY}_${userId}`;
};

const loadCartFromStorage = (userId: string): CartItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const storageKey = getStorageKey(userId);
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return parsed as CartItem[];
    }
  } catch (err) {
    console.error("Failed to load cart:", err);
  }
  return [];
};

const saveCartToStorage = (userId: string, items: CartItem[]): void => {
  if (typeof window === "undefined") return;
  try {
    const storageKey = getStorageKey(userId);
    localStorage.setItem(storageKey, JSON.stringify(items));
  } catch (err) {
    console.error("Failed to save cart:", err);
  }
};

/* -------------------------------------------------------------------------- */
/*                               Provider                                     */
/* -------------------------------------------------------------------------- */

interface CartProviderProps {
  children: React.ReactNode;
  userId?: string | null; // Optional authenticated user ID
}

export function CartProvider({ children, userId: authUserId }: CartProviderProps) {
  // Determine the effective user ID (authenticated or guest)
  const userId = authUserId || getGuestUserId();
  const isGuest = !authUserId;
  
  const [items, setItems] = React.useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isUpdating, setIsUpdating] = React.useState(false);

  // Load cart data on mount or when userId changes
  React.useEffect(() => {
    const loadCart = async () => {
      setIsLoading(true);
      try {
        const cartItems = loadCartFromStorage(userId);
        setItems(cartItems);
      } catch (error) {
        console.error('Failed to load cart:', error);
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadCart();
  }, [userId]);

  /* -------------------- Persist to localStorage (debounced) ------------- */
  const saveTimeout = React.useRef<null | ReturnType<typeof setTimeout>>(null);

  React.useEffect(() => {
    if (isLoading) return; // Don't save during initial load
    
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      saveCartToStorage(userId, items);
    }, DEBOUNCE_MS);

    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [items, userId, isLoading]);

  /* ----------------------------- Actions -------------------------------- */
  const addItem = React.useCallback(
    async (newItem: Omit<CartItem, "quantity">, qty = 1) => {
      if (qty <= 0) return;
      
      setIsUpdating(true);
      try {
        setItems((prev) => {
          const existing = prev.find((i) => i.id === newItem.id);
          if (existing) {
            return prev.map((i) =>
              i.id === newItem.id ? { ...i, quantity: i.quantity + qty } : i,
            );
          }
          return [...prev, { ...newItem, quantity: qty }];
        });

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
    [isGuest],
  );

  const removeItem = React.useCallback(async (id: string) => {
    setIsUpdating(true);
    try {
      setItems((prev) => prev.filter((i) => i.id !== id));
      
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
  }, []);

  const updateQuantity = React.useCallback(async (id: string, qty: number) => {
    if (qty < 0) return;
    
    setIsUpdating(true);
    try {
      setItems((prev) =>
        prev.flatMap((i) => {
          if (i.id !== id) return i;
          if (qty <= 0) return []; // treat zero/negative as remove
          if (qty === i.quantity) return i;
          return { ...i, quantity: qty };
        }),
      );

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
  }, []);

  const clearCart = React.useCallback(async () => {
    if (items.length === 0) return;
    
    setIsUpdating(true);
    try {
      setItems([]);
      
      toast({
        title: "Success",
        description: "Cart cleared successfully",
      });
    } catch (error) {
      console.error('Failed to clear cart:', error);
      toast({
        title: "Error",
        description: "Failed to clear cart. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  }, [items.length, toast]);

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
      userId,
      isLoading,
      isUpdating,
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
      userId,
      isLoading,
      isUpdating,
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

// Helper function to merge guest cart with authenticated cart (for when user signs in)
export const mergeGuestCartWithUserCart = async (
  guestItems: CartItem[],
  userItems: CartItem[]
): Promise<CartItem[]> => {
  const mergedItems: CartItem[] = [...userItems];
  
  for (const guestItem of guestItems) {
    const existingItem = mergedItems.find(item => item.id === guestItem.id);
    if (existingItem) {
      // Merge quantities
      existingItem.quantity += guestItem.quantity;
    } else {
      // Add new item
      mergedItems.push(guestItem);
    }
  }
  
  return mergedItems;
};

// Helper function to clear guest cart (when user signs in)
export const clearGuestCart = (): void => {
  if (typeof window === "undefined") return;
  try {
    const guestId = localStorage.getItem(GUEST_ID_KEY);
    if (guestId) {
      const storageKey = getStorageKey(guestId);
      localStorage.removeItem(storageKey);
    }
  } catch (error) {
    console.warn('Failed to clear guest cart:', error);
  }
};

// Hook for cart migration when user signs in
export const useCartMigration = () => {
  const migrateGuestCart = React.useCallback(async (newUserId: string) => {
    if (typeof window === "undefined") return;
    
    try {
      const guestId = localStorage.getItem(GUEST_ID_KEY);
      if (!guestId) return;
      
      const guestItems = loadCartFromStorage(guestId);
      if (guestItems.length === 0) return;
      
      const userItems = loadCartFromStorage(newUserId);
      const mergedItems = await mergeGuestCartWithUserCart(guestItems, userItems);
      
      // Save merged cart to user's storage
      saveCartToStorage(newUserId, mergedItems);
      
      // Clear guest cart
      clearGuestCart();
      
      console.log(`Migrated ${guestItems.length} items from guest cart to user cart`);
    } catch (error) {
      console.error('Failed to migrate guest cart:', error);
    }
  }, []);

  return { migrateGuestCart };
};