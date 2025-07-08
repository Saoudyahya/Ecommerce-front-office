"use client";

import { AnimatePresence, motion } from "framer-motion";
import {  Loader2, Minus, Plus, ShoppingCart, X, User, Wifi, WifiOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";

import { cn } from "~/lib/cn";
import { useMediaQuery } from "~/lib/hooks/use-media-query";
import { hybridCartService, type ShoppingCart as ShoppingCart11, type CartItem as ServiceCartItem, type LocalStorageCart } from "~/service/Cart";
import { productService,  } from "~/service/product";
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
import { Alert, AlertDescription } from "~/ui/primitives/alert";

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
}

// Create a context for cart operations
interface CartContextType {
  addToCart: (productId: string, price: number, quantity?: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  validateCart: () => Promise<void>;
  cart: ShoppingCart11 | LocalStorageCart | null;
  cartItems: CartItemWithProduct[];
  totalItems: number;
  totalAmount: number;
  isLoading: boolean;
  isUpdating: boolean;
  isAuthenticated: boolean;
  isOnline: boolean;
  cartMode: 'guest' | 'authenticated';
  refreshCart: () => Promise<void>;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  hasValidationErrors: boolean;
  validationErrors: string[];
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
  const [cart, setCart] = React.useState<ShoppingCart11 | LocalStorageCart | null>(null);
  const [cartItems, setCartItems] = React.useState<CartItemWithProduct[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [isOnline, setIsOnline] = React.useState(true);
  const [syncStatus, setSyncStatus] = React.useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [validationErrors, setValidationErrors] = React.useState<string[]>([]);
  
  const isAuthenticated = Boolean(userId);
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
        
        await hybridCartService.initialize(userId);
        
        if (userId) {
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
  }, [userId]);

  // Fetch cart data
  const fetchCart = React.useCallback(async () => {
    try {
      setIsLoading(true);
      
      const cartData = await hybridCartService.getCart();
      console.log('Cart data received:', cartData);
      
      setCart(cartData);
      
      if (!cartData || !cartData.items || cartData.items.length === 0) {
        setCartItems([]);
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
      console.error('Failed to fetch cart:', error);
      setCart(null);
      setCartItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load cart after service initialization
  React.useEffect(() => {
    if (syncStatus !== 'syncing') {
      fetchCart();
    }
  }, [syncStatus, fetchCart]);

  // Calculate totals
  const totalItems = React.useMemo(() => {
    if (!cart?.items) return 0;
    return cart.items.reduce((acc, item) => acc + item.quantity, 0);
  }, [cart]);

  const totalAmount = React.useMemo(() => {
    if (!cart?.items) return 0;
    if ('total' in cart) return cart.total;
    return cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [cart]);

  // Add item to cart
  const addToCart = React.useCallback(async (productId: string, price: number, quantity: number = 1) => {
    try {
      setIsUpdating(true);
      
      const updatedCart = await hybridCartService.addItem(productId, quantity, price);
      console.log("Item added to cart successfully");
      
      await fetchCart();
    } catch (error) {
      console.error('Failed to add to cart:', error);
      setValidationErrors(prev => [...prev, 'Failed to add item to cart']);
    } finally {
      setIsUpdating(false);
    }
  }, [fetchCart]);

  // Remove item from cart
  const removeFromCart = React.useCallback(async (productId: string) => {
    try {
      setIsUpdating(true);
      
      await hybridCartService.removeItem(productId);
      console.log("Item removed from cart");
      
      await fetchCart();
    } catch (error) {
      console.error('Failed to remove item:', error);
      setValidationErrors(prev => [...prev, 'Failed to remove item from cart']);
    } finally {
      setIsUpdating(false);
    }
  }, [fetchCart]);

  // Update quantity
  const updateQuantity = React.useCallback(async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      await removeFromCart(productId);
      return;
    }
    
    try {
      setIsUpdating(true);
      
      await hybridCartService.updateQuantity(productId, newQuantity);
      console.log("Item quantity updated");
      
      await fetchCart();
    } catch (error) {
      console.error('Failed to update quantity:', error);
      setValidationErrors(prev => [...prev, 'Failed to update item quantity']);
    } finally {
      setIsUpdating(false);
    }
  }, [fetchCart, removeFromCart]);

  // Clear cart
  const clearCart = React.useCallback(async () => {
    if (!cart || !cart.items || cart.items.length === 0) return;
    
    try {
      setIsUpdating(true);
      
      // Remove all items
      await Promise.all(
        cart.items.map(item => hybridCartService.removeItem(item.productId))
      );
      
      console.log("Cart cleared successfully");
      await fetchCart();
    } catch (error) {
      console.error('Failed to clear cart:', error);
      setValidationErrors(prev => [...prev, 'Failed to clear cart']);
    } finally {
      setIsUpdating(false);
    }
  }, [cart, fetchCart]);

  // Validate cart (for guest users)
  const validateCart = React.useCallback(async () => {
    if (cartMode !== 'guest') return;
    
    try {
      const validation = await hybridCartService.validateLocalCart();
      
      if (validation?.hasChanges) {
        const errors = validation.items
          .filter(item => item.hasChanges())
          .map(item => `${item.productName}: ${item.validationMessage}`);
        
        setValidationErrors(errors);
      } else {
        setValidationErrors([]);
      }
    } catch (error) {
      console.error('Failed to validate cart:', error);
    }
  }, [cartMode]);

  const contextValue: CartContextType = {
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    validateCart,
    cart,
    cartItems,
    totalItems,
    totalAmount,
    isLoading,
    isUpdating,
    isAuthenticated,
    isOnline,
    cartMode,
    refreshCart: fetchCart,
    syncStatus,
    hasValidationErrors: validationErrors.length > 0,
    validationErrors,
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}

// Status indicator component
function CartStatusIndicator() {
  const { isOnline, cartMode, syncStatus, hasValidationErrors } = useCart();

  if (!isOnline) {
    return (
      <div className="flex items-center gap-1 text-xs text-amber-600">
        <WifiOff className="h-3 w-3" />
        Offline
      </div>
    );
  }

  if (cartMode === 'guest') {
    return (
      <div className="flex items-center gap-1 text-xs text-blue-600">
        <User className="h-3 w-3" />
        Guest
      </div>
    );
  }

  if (syncStatus === 'syncing') {
    return (
      <div className="flex items-center gap-1 text-xs text-blue-600">
        <Loader2 className="h-3 w-3 animate-spin" />
        Syncing
      </div>
    );
  }

  if (hasValidationErrors) {
    return (
      <div className="flex items-center gap-1 text-xs text-red-600">
        <X className="h-3 w-3" />
        Validation errors
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 text-xs text-green-600">
      <Wifi className="h-3 w-3" />
      Synced
    </div>
  );
}

// Updated CartClient component
export function CartClient({ className }: CartClientProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  
  const {
    cart,
    cartItems,
    totalItems,
    totalAmount,
    isLoading,
    isUpdating,
    isAuthenticated,
    isOnline,
    cartMode,
    syncStatus,
    hasValidationErrors,
    validationErrors,
    updateQuantity,
    removeFromCart,
    clearCart,
    validateCart,
    refreshCart: fetchCart,
  } = useCart();

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Validate cart periodically for guest users
  React.useEffect(() => {
    if (cartMode === 'guest' && isOpen) {
      validateCart();
    }
  }, [cartMode, isOpen, validateCart]);

  const handleCheckout = async () => {
    if (!cart || !cart.items || cart.items.length === 0) return;
    
    if (!isAuthenticated) {
      // Redirect to sign in for guest users
      setIsOpen(false);
      window.location.href = '/sign-in?redirect=/checkout';
      return;
    }
    
    try {
      setIsUpdating(true);
      
      await hybridCartService.checkout();
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
          <h3 className="mb-2 text-lg font-medium">Shopping as Guest</h3>
          <p className="mb-6 text-center text-sm text-muted-foreground">
            Your cart is stored locally. Sign in to sync across devices and checkout.
          </p>
          <div className="flex gap-2">
            {isDesktop ? (
              <>
                <SheetClose asChild>
                  <Link href="/sign-in">
                    <Button>Sign In</Button>
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link href="/products">
                    <Button variant="outline">Browse Products</Button>
                  </Link>
                </SheetClose>
              </>
            ) : (
              <>
                <DrawerClose asChild>
                  <Link href="/sign-in">
                    <Button>Sign In</Button>
                  </Link>
                </DrawerClose>
                <DrawerClose asChild>
                  <Link href="/products">
                    <Button variant="outline">Browse Products</Button>
                  </Link>
                </DrawerClose>
              </>
            )}
          </div>
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
    if (totalItems === 0) return cartMode === 'guest' ? "Your local cart is empty" : "Your cart is empty";
    const itemText = totalItems === 1 ? "item" : "items";
    const modeText = cartMode === 'guest' ? " (stored locally)" : "";
    return `You have ${totalItems} ${itemText} in your cart${modeText}`;
  };

  const CartContent = (
    <>
      <div className="flex flex-col">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="text-xl font-semibold">Your Cart</div>
              <CartStatusIndicator />
            </div>
            <div className="text-sm text-muted-foreground">
              {getCartStatusText()}
            </div>
            
            {/* Offline notification */}
            {!isOnline && (
              <div className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                <WifiOff className="h-3 w-3" />
                You're offline. Changes will sync when connection is restored.
              </div>
            )}
            
            {/* Debug info - remove in production */}
            {process.env.NODE_ENV === 'development' && (
              <div className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                Mode: {cartMode}, Online: {isOnline ? 'yes' : 'no'}, Items: {cartItems.length}
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    console.log('=== Hybrid Cart Debug Info ===');
                    hybridCartService.debugInfo();
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

        {/* Validation errors */}
        {hasValidationErrors && (
          <div className="px-6 py-2">
            <Alert>
              <AlertDescription>
                <div className="text-sm font-medium mb-1">Price or availability changes detected:</div>
                <ul className="text-xs space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        )}

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
            ) : (cartItems.length === 0) ? (
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
                          ${(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>

        {cartItems.length > 0 && (
          <div className="border-t px-6 py-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">${totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-medium">Calculated at checkout</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold">Total</span>
                <span className="text-base font-semibold">
                  ${totalAmount.toFixed(2)}
                </span>
              </div>
              
              {!isAuthenticated && (
                <Alert>
                  <AlertDescription>
                    <div className="text-sm">
                      Sign in to checkout and sync your cart across devices.
                    </div>
                  </AlertDescription>
                </Alert>
              )}
              
              <Button 
                className="w-full" 
                size="lg"
                onClick={handleCheckout}
                disabled={isUpdating || (!isAuthenticated && cartMode === 'guest')}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : !isAuthenticated ? (
                  'Sign In to Checkout'
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