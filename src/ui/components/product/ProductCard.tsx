"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Heart, Loader2, Minus, Plus, ShoppingCart, Star, X } from "lucide-react";
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
import { useToast } from "~/ui/primitives/use-toast";

// Fallback cart service implementation if the main service fails
const fallbackCartService = {
  async getCart(userId: string): Promise<ShoppingCart> {
    // Try to get cart from localStorage first
    const stored = localStorage.getItem(`cart-${userId}`);
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Return empty cart
    return {
      id: `cart-${userId}`,
      userId: userId,
      items: [],
      total: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  async addItemToCart(userId: string, productId: string, quantity: number = 1): Promise<void> {
    const cart = await this.getCart(userId);
    const existingItem = cart.items.find(item => item.productId === productId);
    
    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.subtotal = existingItem.price * existingItem.quantity;
    } else {
      // For demo purposes, assume $10 price - in real app, fetch from product service
      const newItem: ServiceCartItem = {
        id: `item-${Date.now()}`,
        productId,
        quantity,
        price: 10.00,
        subtotal: 10.00 * quantity,
      };
      cart.items.push(newItem);
    }
    
    cart.total = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
    cart.updatedAt = new Date().toISOString();
    
    localStorage.setItem(`cart-${userId}`, JSON.stringify(cart));
  },

  async removeItemFromCart(userId: string, productId: string): Promise<void> {
    const cart = await this.getCart(userId);
    cart.items = cart.items.filter(item => item.productId !== productId);
    cart.total = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
    cart.updatedAt = new Date().toISOString();
    
    localStorage.setItem(`cart-${userId}`, JSON.stringify(cart));
  },

  async quickUpdateQuantity(userId: string, productId: string, quantity: number): Promise<void> {
    const cart = await this.getCart(userId);
    const item = cart.items.find(item => item.productId === productId);
    
    if (item) {
      item.quantity = quantity;
      item.subtotal = item.price * quantity;
      cart.total = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
      cart.updatedAt = new Date().toISOString();
      
      localStorage.setItem(`cart-${userId}`, JSON.stringify(cart));
    }
  },

  async checkout(userId: string): Promise<void> {
    // Clear the cart after checkout
    localStorage.removeItem(`cart-${userId}`);
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
  userId: string;
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
  userId: string;
}

export function CartProvider({ children, userId }: CartProviderProps) {
  const [cart, setCart] = React.useState<ShoppingCart | null>(null);
  const [cartItems, setCartItems] = React.useState<CartItemWithProduct[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const { toast } = useToast();

  // Fetch cart data
  const fetchCart = React.useCallback(async () => {
    if (!userId) {
      console.log('No userId provided, skipping cart fetch');
      setIsLoading(false);
      return;
    }
    
    try {
      console.log('Fetching cart for userId:', userId);
      setIsLoading(true);
      
      let cartData: ShoppingCart;
      
      try {
        // Try main cart service first
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Cart fetch timeout')), 5000)
        );
        
        cartData = await Promise.race([
          cartService.getCart(userId),
          timeoutPromise
        ]) as ShoppingCart;
        
        console.log('Cart data received from main service:', cartData);
      } catch (serviceError) {
        console.warn('Main cart service failed, using fallback:', serviceError);
        
        // Use fallback cart service
        cartData = await fallbackCartService.getCart(userId);
        console.log('Cart data received from fallback service:', cartData);
        
        toast({
          title: "Notice",
          description: "Using local cart storage (cart service unavailable)",
        });
      }
      
      setCart(cartData);
      
      // If no items, set empty array and finish
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
      
      // Create empty cart as final fallback
      const emptyCart: ShoppingCart = {
        id: `cart-${userId}`,
        userId: userId,
        items: [],
        total: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      setCart(emptyCart);
      setCartItems([]);
      
      toast({
        title: "Cart Error",
        description: "Initialized empty cart. Please try refreshing.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId, toast]);

  // Initialize cart on mount
  React.useEffect(() => {
    if (userId) {
      fetchCart();
    }
  }, [userId, fetchCart]);

  const totalItems = cart?.items.reduce((acc, item) => acc + item.quantity, 0) || 0;

  // Add item to cart
  const addToCart = React.useCallback(async (productId: string, quantity: number = 1) => {
    try {
      setIsUpdating(true);
      
      try {
        await cartService.addItemToCart(userId, productId, quantity);
      } catch (serviceError) {
        console.warn('Main cart service failed for addToCart, using fallback:', serviceError);
        await fallbackCartService.addItemToCart(userId, productId, quantity);
      }
      
      await fetchCart();
      toast({
        title: "Success",
        description: "Item added to cart successfully!",
      });
    } catch (error) {
      console.error('Failed to add to cart:', error);
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  }, [userId, fetchCart, toast]);

  // Remove item from cart
  const removeFromCart = React.useCallback(async (productId: string) => {
    try {
      setIsUpdating(true);
      
      try {
        await cartService.removeItemFromCart(userId, productId);
      } catch (serviceError) {
        console.warn('Main cart service failed for removeFromCart, using fallback:', serviceError);
        await fallbackCartService.removeItemFromCart(userId, productId);
      }
      
      await fetchCart();
      toast({
        title: "Success",
        description: "Item removed from cart",
      });
    } catch (error) {
      console.error('Failed to remove item:', error);
      toast({
        title: "Error",
        description: "Failed to remove item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  }, [userId, fetchCart, toast]);

  // Update quantity
  const updateQuantity = React.useCallback(async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    try {
      setIsUpdating(true);
      
      try {
        await cartService.quickUpdateQuantity(userId, productId, newQuantity);
      } catch (serviceError) {
        console.warn('Main cart service failed for updateQuantity, using fallback:', serviceError);
        await fallbackCartService.quickUpdateQuantity(userId, productId, newQuantity);
      }
      
      await fetchCart();
      toast({
        title: "Success",
        description: "Item quantity updated",
      });
    } catch (error) {
      console.error('Failed to update quantity:', error);
      toast({
        title: "Error",
        description: "Failed to update quantity. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  }, [userId, fetchCart, toast]);

  // Clear cart
  const clearCart = React.useCallback(async () => {
    if (!cart || cart.items.length === 0) return;
    
    try {
      setIsUpdating(true);
      
      try {
        await Promise.all(
          cart.items.map(item => cartService.removeItemFromCart(userId, item.productId))
        );
      } catch (serviceError) {
        console.warn('Main cart service failed for clearCart, using fallback:', serviceError);
        // Clear using fallback method
        for (const item of cart.items) {
          await fallbackCartService.removeItemFromCart(userId, item.productId);
        }
      }
      
      await fetchCart();
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
  }, [cart, userId, fetchCart, toast]);

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
  const { toast } = useToast();
  
  const {
    cart,
    cartItems,
    totalItems,
    isLoading,
    isUpdating,
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
      } catch (serviceError) {
        console.warn('Main cart service failed for checkout, using fallback:', serviceError);
        await fallbackCartService.checkout(cart.userId);
      }
      
      setIsOpen(false);
      toast({
        title: "Success",
        description: "Checkout completed successfully!",
      });
      await fetchCart();
    } catch (error) {
      console.error('Failed to checkout:', error);
      toast({
        title: "Error",
        description: "Checkout failed. Please try again.",
        variant: "destructive",
      });
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

  const CartContent = (
    <>
      <div className="flex flex-col">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <div className="text-xl font-semibold">Your Cart</div>
            <div className="text-sm text-muted-foreground">
              {isLoading ? (
                "Loading cart..."
              ) : totalItems === 0 ? (
                "Your cart is empty"
              ) : (
                `You have ${totalItems} item${totalItems !== 1 ? "s" : ""} in your cart`
              )}
            </div>
            {/* Debug info - remove in production */}
            <div className="text-xs text-gray-400 mt-1 flex items-center gap-2">
              Debug: Loading={isLoading ? 'true' : 'false'}, Items={cartItems.length}, Cart={cart ? 'exists' : 'null'}
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => {
                  console.log('Force refreshing cart...');
                  fetchCart();
                }}
                className="h-6 px-2 text-xs"
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Refresh'}
              </Button>
            </div>
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
            ) : cartItems.length === 0 ? (
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

        {cartItems.length > 0 && (
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
  userId: string;
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

// Enhanced ProductCard component with proper cart integration
interface ProductCardProps {
  product: {
    id: string;
    name: string;
    images: string[];
    price: number;
    originalPrice?: number;
    rating: number;
    category: string;
    inStock: boolean;
  };
  onAddToWishlist?: (productId: string) => void;
}

export function ProductCard({ product, onAddToWishlist }: ProductCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const [isHovered, setIsHovered] = React.useState(false);
  const { addToCart, isUpdating } = useCart();

  // Auto-rotate images when hovered
  React.useEffect(() => {
    if (!isHovered || product.images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        (prevIndex + 1) % product.images.length
      );
    }, 2000);

    return () => clearInterval(interval);
  }, [isHovered, product.images.length]);

  const goToNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prevIndex) => 
      (prevIndex + 1) % product.images.length
    );
  };

  const goToPreviousImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prevIndex) => 
      prevIndex === 0 ? product.images.length - 1 : prevIndex - 1
    );
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await addToCart(product.id);
  };

  const handleAddToWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToWishlist?.(product.id);
  };

  const currentImage = product.images[currentImageIndex] || '';
  const hasMultipleImages = product.images.length > 1;

  return (
    <div 
      className="product-card group relative overflow-hidden rounded-lg border bg-card text-card-foreground shadow transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {currentImage ? (
          <img
            src={currentImage}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-200 text-gray-500">
            No Image
          </div>
        )}

        {/* Image Navigation - Only show if multiple images */}
        {hasMultipleImages && (
          <>
            <div className={`absolute inset-0 flex items-center justify-between p-2 opacity-0 transition-opacity duration-300 ${isHovered ? 'opacity-100' : ''}`}>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 bg-white/80 backdrop-blur-sm hover:bg-white"
                onClick={goToPreviousImage}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 bg-white/80 backdrop-blur-sm hover:bg-white"
                onClick={goToNextImage}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Image Indicators */}
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 space-x-1">
              {product.images.map((_, index) => (
                <button
                  key={index}
                  className={`h-2 w-2 rounded-full transition-all duration-300 ${
                    index === currentImageIndex 
                      ? 'bg-white scale-125 shadow-md' 
                      : 'bg-white/60 hover:bg-white/80'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(index);
                  }}
                />
              ))}
            </div>

            <div className="absolute top-2 right-2 rounded-md bg-black/60 px-2 py-1 text-xs text-white">
              {currentImageIndex + 1} / {product.images.length}
            </div>
          </>
        )}

        {/* Stock Status Badge */}
        <div className="absolute top-2 left-2">
          <span className={`rounded-full px-2 py-1 text-xs font-medium ${
            product.inStock 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {product.inStock ? 'In Stock' : 'Out of Stock'}
          </span>
        </div>

        {/* Discount Badge */}
        {product.originalPrice && product.originalPrice > product.price && (
          <div className="absolute top-2 right-2">
            <span className="rounded-full bg-red-500 px-2 py-1 text-xs font-medium text-white">
              -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <p className="text-sm text-muted-foreground">{product.category}</p>
        
        <h3 className="mt-1 font-semibold line-clamp-2" title={product.name}>
          {product.name}
        </h3>

        {/* Rating */}
        <div className="mt-2 flex items-center space-x-1">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < Math.floor(product.rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : i < product.rating
                    ? 'fill-yellow-400/50 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-muted-foreground">
            ({product.rating.toFixed(1)})
          </span>
        </div>

        {/* Price */}
        <div className="mt-3 flex items-center space-x-2">
          <span className="text-lg font-bold">${product.price.toFixed(2)}</span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-sm text-muted-foreground line-through">
              ${product.originalPrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* Add to Cart Button */}
        <Button
          className="mt-4 w-full"
          onClick={handleAddToCart}
          disabled={!product.inStock || isUpdating}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          {isUpdating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : product.inStock ? (
            'Add to Cart'
          ) : (
            'Out of Stock'
          )}
        </Button>
      </div>
    </div>
  );
}