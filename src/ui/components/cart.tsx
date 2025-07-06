"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Heart, Loader2, Minus, Plus, ShoppingCart, Star, X, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";

import { cn } from "~/lib/cn";
import { useMediaQuery } from "~/lib/hooks/use-media-query";
import { cartService, type ShoppingCart, type CartItem as ServiceCartItem } from "~/service/Cart";
import { productService, type Product } from "~/service/product";
import { Badge } from "~/ui/primitives/badge";
import { Button } from "~/ui/primitives/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTrigger,
} from "~/ui/primitives/drawer";
import { Separator } from "~/ui/primitives/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/ui/primitives/sheet";

// Fallback cart service implementation if the main service fails
const fallbackCartService = {
  async getCart(userId: string): Promise<ShoppingCart> {
    try {
      const stored = localStorage.getItem(`cart-${userId}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
    }
    
    return {
      id: `cart-${userId}`,
      userId: userId,
      items: [],
      total: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    };
  },

  async addItemToCart(userId: string, productId: string, quantity: number = 1): Promise<void> {
    const cart = await this.getCart(userId);
    const existingItem = cart.items.find(item => item.productId === productId);
    
    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.subtotal = existingItem.price * existingItem.quantity;
    } else {
      const newItem: ServiceCartItem = {
        id: `item-${Date.now()}`,
        productId,
        quantity,
        price: 10.00,
        subtotal: 10.00 * quantity,
        addedAt: new Date().toISOString(),
      };
      cart.items.push(newItem);
    }
    
    cart.total = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
    cart.updatedAt = new Date().toISOString();
    
    try {
      localStorage.setItem(`cart-${userId}`, JSON.stringify(cart));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  },

  async removeItemFromCart(userId: string, productId: string): Promise<void> {
    const cart = await this.getCart(userId);
    cart.items = cart.items.filter(item => item.productId !== productId);
    cart.total = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
    cart.updatedAt = new Date().toISOString();
    
    try {
      localStorage.setItem(`cart-${userId}`, JSON.stringify(cart));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  },

  async quickUpdateQuantity(userId: string, productId: string, quantity: number): Promise<void> {
    const cart = await this.getCart(userId);
    const item = cart.items.find(item => item.productId === productId);
    
    if (item) {
      item.quantity = quantity;
      item.subtotal = item.price * quantity;
      cart.total = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
      cart.updatedAt = new Date().toISOString();
      
      try {
        localStorage.setItem(`cart-${userId}`, JSON.stringify(cart));
      } catch (error) {
        console.warn('Failed to save to localStorage:', error);
      }
    }
  },

  async checkout(userId: string): Promise<void> {
    try {
      localStorage.removeItem(`cart-${userId}`);
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }
};

// Extended cart item interface that includes product details for display
export interface CartItemWithProduct extends ServiceCartItem {
  product?: {
    name: string;
    image: string;
    category: string;
  };
}

interface CartClientProps {
  className?: string;
  userId?: string; // Optional now - user might not be signed in
}

// Create a context for cart operations
interface CartContextType {
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  cart: ShoppingCart | null;
  cartItems: CartItemWithProduct[];
  totalItems: number;
  isLoading: boolean;
  isUpdating: boolean;
  isAuthenticated: boolean;
  refreshCart: () => Promise<void>;
}

const CartContext = React.createContext<CartContextType | null>(null);

// Hook to use cart context
export function useCart() {
  const context = React.useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

// Cart Provider Component
interface CartProviderProps {
  children: React.ReactNode;
  userId?: string; // Optional - user might not be signed in
}

export function CartProvider({ children, userId }: CartProviderProps) {
  const [cart, setCart] = React.useState<ShoppingCart | null>(null);
  const [cartItems, setCartItems] = React.useState<CartItemWithProduct[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);

  const isAuthenticated = Boolean(userId);

  // Fetch cart data
  const fetchCart = React.useCallback(async () => {
    if (!userId) {
      console.log('No userId provided, user not authenticated');
      setCart(null);
      setCartItems([]);
      setIsLoading(false);
      return;
    }
    
    try {
      console.log('Fetching cart for userId:', userId);
      setIsLoading(true);
      
      let cartData: ShoppingCart;
      
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Cart fetch timeout')), 5000)
        );
        
        cartData = await Promise.race([
          cartService.getCart(userId),
          timeoutPromise
        ]) as ShoppingCart;
        
        console.log('Cart data received from main service:', cartData);
      } catch (serviceError: any) {
        console.warn('Main cart service failed, using fallback:', serviceError);
        
        // Check if it's an authentication error
        if (cartService.isAuthError(serviceError)) {
          console.error("Authentication failed when fetching cart:", serviceError.message);
          setCart(null);
          setCartItems([]);
          setIsLoading(false);
          return;
        }
        
        cartData = await fallbackCartService.getCart(userId);
        console.log('Cart data received from fallback service:', cartData);
      }
      
      setCart(cartData);
      
      if (!cartData.items || cartData.items.length === 0) {
        setCartItems([]);
        setIsLoading(false);
        return;
      }
      
      // Fetch product details for each cart item
      const itemsWithProducts = await Promise.all(
        cartData.items.map(async (item) => {
          try {
            const product = await productService.getProductById(item.productId);
            return {
              ...item,
              product: {
                name: product.name,
                image: product.images[0] || '/placeholder-product.jpg',
                category: product.categories[0]?.name || 'Uncategorized',
              },
            };
          } catch (error) {
            console.error(`Failed to fetch product ${item.productId}:`, error);
            return {
              ...item,
              product: {
                name: `Product ${item.productId}`,
                image: '/placeholder-product.jpg',
                category: 'Unknown',
              },
            };
          }
        })
      );
      
      setCartItems(itemsWithProducts);
    } catch (error) {
      console.error('Failed to fetch cart completely:', error);
      
      if (userId) {
        const emptyCart: ShoppingCart = {
          id: `cart-${userId}`,
          userId: userId,
          items: [],
          total: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        };
        
        setCart(emptyCart);
        setCartItems([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Initialize cart on mount or when userId changes
  React.useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const totalItems = cart?.items.reduce((acc, item) => acc + item.quantity, 0) || 0;

  // Add item to cart
  const addToCart = React.useCallback(async (productId: string, quantity: number = 1) => {
    if (!userId) {
      console.error("Authentication required to add items to cart");
      return;
    }

    try {
      setIsUpdating(true);
      
      try {
        // Use the new authenticated cart service with proper request format
        await cartService.quickAddItem(userId, productId, 10.00, quantity); // TODO: Get real price from product service
      } catch (serviceError: any) {
        console.warn('Main cart service failed for addToCart, using fallback:', serviceError);
        
        // Check if it's an authentication error
        if (cartService.isAuthError(serviceError)) {
          console.error("Authentication failed:", serviceError.message);
          return;
        }
        
        await fallbackCartService.addItemToCart(userId, productId, quantity);
      }
      
      await fetchCart();
      console.log("Item added to cart successfully");
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setIsUpdating(false);
    }
  }, [userId, fetchCart]);

  // Remove item from cart
  const removeFromCart = React.useCallback(async (productId: string) => {
    if (!userId) return;

    try {
      setIsUpdating(true);
      
      try {
        await cartService.removeItemFromCart(userId, productId);
      } catch (serviceError: any) {
        console.warn('Main cart service failed for removeFromCart, using fallback:', serviceError);
        
        // Check if it's an authentication error
        if (cartService.isAuthError(serviceError)) {
          console.error("Authentication failed:", serviceError.message);
          return;
        }
        
        await fallbackCartService.removeItemFromCart(userId, productId);
      }
      
      await fetchCart();
      console.log("Item removed from cart");
    } catch (error) {
      console.error('Failed to remove item:', error);
    } finally {
      setIsUpdating(false);
    }
  }, [userId, fetchCart]);

  // Update quantity
  const updateQuantity = React.useCallback(async (productId: string, newQuantity: number) => {
    if (newQuantity < 1 || !userId) return;
    
    try {
      setIsUpdating(true);
      
      try {
        await cartService.quickUpdateQuantity(userId, productId, newQuantity);
      } catch (serviceError: any) {
        console.warn('Main cart service failed for updateQuantity, using fallback:', serviceError);
        
        // Check if it's an authentication error
        if (cartService.isAuthError(serviceError)) {
          console.error("Authentication failed:", serviceError.message);
          return;
        }
        
        await fallbackCartService.quickUpdateQuantity(userId, productId, newQuantity);
      }
      
      await fetchCart();
      console.log("Item quantity updated");
    } catch (error) {
      console.error('Failed to update quantity:', error);
    } finally {
      setIsUpdating(false);
    }
  }, [userId, fetchCart]);

  // Clear cart
  const clearCart = React.useCallback(async () => {
    if (!cart || cart.items.length === 0 || !userId) return;
    
    try {
      setIsUpdating(true);
      
      try {
        await Promise.all(
          cart.items.map(item => cartService.removeItemFromCart(userId, item.productId))
        );
      } catch (serviceError: any) {
        console.warn('Main cart service failed for clearCart, using fallback:', serviceError);
        
        // Check if it's an authentication error
        if (cartService.isAuthError(serviceError)) {
          console.error("Authentication failed:", serviceError.message);
          return;
        }
        
        for (const item of cart.items) {
          await fallbackCartService.removeItemFromCart(userId, item.productId);
        }
      }
      
      await fetchCart();
      console.log("Cart cleared successfully");
    } catch (error) {
      console.error('Failed to clear cart:', error);
    } finally {
      setIsUpdating(false);
    }
  }, [cart, userId, fetchCart]);

  const contextValue: CartContextType = {
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cart,
    cartItems,
    totalItems,
    isLoading,
    isUpdating,
    isAuthenticated,
    refreshCart: fetchCart,
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}

// Updated CartClient component
export function CartClient({ className }: Omit<CartClientProps, 'userId'>) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  
  const {
    cart,
    cartItems,
    totalItems,
    isLoading,
    isUpdating,
    isAuthenticated,
    updateQuantity,
    removeFromCart,
    clearCart,
    refreshCart: fetchCart,
  } = useCart();

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const subtotal = cart?.total || 0;

  const handleCheckout = async () => {
    if (!cart || cart.items.length === 0) return;
    
    try {
      setIsUpdating(true);
      
      try {
        await cartService.checkout(cart.userId);
      } catch (serviceError: any) {
        console.warn('Main cart service failed for checkout, using fallback:', serviceError);
        
        // Check if it's an authentication error
        if (cartService.isAuthError(serviceError)) {
          console.error("Authentication failed during checkout:", serviceError.message);
          return;
        }
        
        await fallbackCartService.checkout(cart.userId);
      }
      
      setIsOpen(false);
      console.log("Checkout completed successfully!");
      await fetchCart();
    } catch (error) {
      console.error('Failed to checkout:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const CartTrigger = (
    <Button
      aria-label="Open cart"
      className="relative h-9 w-9 rounded-full"
      size="icon"
      variant="outline"
    >
      <ShoppingCart className="h-4 w-4" />
      {totalItems > 0 && (
        <Badge
          className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-[10px]"
          variant="default"
        >
          {totalItems}
        </Badge>
      )}
    </Button>
  );

  const renderEmptyState = () => {
    if (!isAuthenticated) {
      return (
        <motion.div
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-12"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
        >
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <User className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-medium">Sign in to view your cart</h3>
          <p className="mb-6 text-center text-sm text-muted-foreground">
            Please sign in to add items to your cart and start shopping.
          </p>
          {isDesktop ? (
            <SheetClose asChild>
              <Link href="/sign-in">
                <Button>Sign In</Button>
              </Link>
            </SheetClose>
          ) : (
            <DrawerClose asChild>
              <Link href="/sign-in">
                <Button>Sign In</Button>
              </Link>
            </DrawerClose>
          )}
        </motion.div>
      );
    }

    return (
      <motion.div
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-12"
        exit={{ opacity: 0 }}
        initial={{ opacity: 0 }}
      >
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <ShoppingCart className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-lg font-medium">Your cart is empty</h3>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          Looks like you haven't added anything to your cart yet.
        </p>
        {isDesktop ? (
          <SheetClose asChild>
            <Link href="/products">
              <Button>Browse Products</Button>
            </Link>
          </SheetClose>
        ) : (
          <DrawerClose asChild>
            <Link href="/products">
              <Button>Browse Products</Button>
            </Link>
          </DrawerClose>
        )}
      </motion.div>
    );
  };

  const getCartStatusText = () => {
    if (isLoading) return "Loading cart...";
    if (!isAuthenticated) return "Sign in to view your cart";
    if (totalItems === 0) return "Your cart is empty";
    return `You have ${totalItems} item${totalItems !== 1 ? "s" : ""} in your cart`;
  };

  const CartContent = (
    <>
      <div className="flex flex-col">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <div className="text-xl font-semibold">Your Cart</div>
            <div className="text-sm text-muted-foreground">
              {getCartStatusText()}
            </div>
            {/* Debug info - remove in production */}
            {isAuthenticated && (
              <div className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                Debug: Loading={isLoading ? 'true' : 'false'}, Items={cartItems.length}, 
                Auth={isAuthenticated ? 'true' : 'false'}, Cookie={cartService.canAccessCookie() ? 'accessible' : 'httponly'}, Cart={cart ? 'exists' : 'null'}
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    console.log('=== Cart Debug Info ===');
                    console.log('Force refreshing cart...');
                    cartService.debugAuth();
                    authService.debugAuthStatus();
                    fetchCart();
                  }}
                  className="h-6 px-2 text-xs"
                  disabled={isLoading}
                >
                  {isLoading ? 'Loading...' : 'Debug & Refresh'}
                </Button>
              </div>
            )}
          </div>
          {isDesktop && (
            <SheetClose asChild>
              <Button size="icon" variant="ghost">
                <X className="h-5 w-5" />
              </Button>
            </SheetClose>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6">
          <AnimatePresence>
            {isLoading ? (
              <motion.div
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12"
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
              >
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Loading your cart...</p>
              </motion.div>
            ) : (!isAuthenticated || cartItems.length === 0) ? (
              renderEmptyState()
            ) : (
              <div className="space-y-4 py-4">
                {cartItems.map((item) => (
                  <motion.div
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "group relative flex rounded-lg border bg-card p-2",
                      "shadow-sm transition-colors hover:bg-accent/50",
                      isUpdating && "opacity-50 pointer-events-none"
                    )}
                    exit={{ opacity: 0, y: -10 }}
                    initial={{ opacity: 0, y: 10 }}
                    key={item.id}
                    layout
                    transition={{ duration: 0.15 }}
                  >
                    <div className="relative h-20 w-20 overflow-hidden rounded">
                      <Image
                        alt={item.product?.name || 'Product image'}
                        className="object-cover"
                        fill
                        src={item.product?.image || '/placeholder-product.jpg'}
                      />
                    </div>
                    <div className="ml-4 flex flex-1 flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between">
                          <Link
                            className="line-clamp-2 text-sm font-medium group-hover:text-primary"
                            href={`/products/${item.productId}`}
                            onClick={() => setIsOpen(false)}
                          >
                            {item.product?.name || 'Unknown Product'}
                          </Link>
                          <button
                            className="ml-2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                            onClick={() => removeFromCart(item.productId)}
                            type="button"
                            disabled={isUpdating}
                          >
                            {isUpdating ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                            <span className="sr-only">Remove item</span>
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {item.product?.category || 'Unknown Category'}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center rounded-md border">
                          <button
                            className="flex h-7 w-7 items-center justify-center rounded-l-md border-r text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={item.quantity <= 1 || isUpdating}
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            type="button"
                          >
                            <Minus className="h-3 w-3" />
                            <span className="sr-only">Decrease quantity</span>
                          </button>
                          <span className="flex h-7 w-7 items-center justify-center text-xs font-medium">
                            {item.quantity}
                          </span>
                          <button
                            className="flex h-7 w-7 items-center justify-center rounded-r-md border-l text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            type="button"
                            disabled={isUpdating}
                          >
                            <Plus className="h-3 w-3" />
                            <span className="sr-only">Increase quantity</span>
                          </button>
                        </div>
                        <div className="text-sm font-medium">
                          ${item.subtotal.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>

        {isAuthenticated && cartItems.length > 0 && (
          <div className="border-t px-6 py-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-medium">Calculated at checkout</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold">Total</span>
                <span className="text-base font-semibold">
                  ${subtotal.toFixed(2)}
                </span>
              </div>
              <Button 
                className="w-full" 
                size="lg"
                onClick={handleCheckout}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Checkout'
                )}
              </Button>
              <div className="flex items-center justify-between">
                {isDesktop ? (
                  <SheetClose asChild>
                    <Button variant="outline">Continue Shopping</Button>
                  </SheetClose>
                ) : (
                  <DrawerClose asChild>
                    <Button variant="outline">Continue Shopping</Button>
                  </DrawerClose>
                )}
                <Button
                  className="ml-2"
                  onClick={clearCart}
                  variant="outline"
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Clear Cart'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );

  if (!isMounted) {
    return (
      <div className={cn("relative", className)}>
        <Button
          aria-label="Open cart"
          className="relative h-9 w-9 rounded-full"
          size="icon"
          variant="outline"
        >
          <ShoppingCart className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {isDesktop ? (
        <Sheet onOpenChange={setIsOpen} open={isOpen}>
          <SheetTrigger asChild>{CartTrigger}</SheetTrigger>
          <SheetContent className="flex w-[400px] flex-col p-0">
            <SheetHeader>
              <SheetTitle>Shopping Cart</SheetTitle>
            </SheetHeader>
            {CartContent}
          </SheetContent>
        </Sheet>
      ) : (
        <Drawer onOpenChange={setIsOpen} open={isOpen}>
          <DrawerTrigger asChild>{CartTrigger}</DrawerTrigger>
          <DrawerContent>{CartContent}</DrawerContent>
        </Drawer>
      )}
    </div>
  );
}

// Updated Cart wrapper component
interface CartProps {
  className?: string;
  userId?: string; // Optional now - user might not be signed in
}

export function Cart({ className, userId }: CartProps) {
  return (
    <CartProvider userId={userId}>
      <div className={cn("relative", className)}>
        <CartClient className={cn("", className)} />
      </div>
    </CartProvider>
  );
}