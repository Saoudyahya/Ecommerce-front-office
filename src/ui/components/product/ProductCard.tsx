"use client";

import { AnimatePresence, motion } from "framer-motion";
import {

  Loader2,
  Minus,
  Plus,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";

import { cn } from "~/lib/cn";
import { useMediaQuery } from "~/lib/hooks/use-media-query";
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

import {
  cartService,
  type CartItem as ServiceCartItem,
  type ShoppingCart,
} from "../../../service/Cart";
import {  Product, productService } from "../../../service/product";

// Generate a guest user ID that persists across sessions
const getGuestUserId = (): string => {
  const GUEST_ID_KEY = "guest_user_id";
  let guestId = localStorage.getItem(GUEST_ID_KEY);

  if (!guestId) {
    guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(GUEST_ID_KEY, guestId);
  }

  return guestId;
};

// Enhanced fallback cart service for hybrid approach
const hybridCartService = {
  async addItemToCart(
    userId: string,
    productId: string,
    quantity = 1
  ): Promise<void> {
    try {
      // Try main service first for authenticated users
      if (userId && !userId.startsWith("guest_")) {
        try {
          // Get product details for pricing
          const product = await productService.getProductById(productId);
          await cartService.quickAddItem(
            userId,
            productId,
            product.price,
            quantity
          );
          return;
        } catch (error) {
          console.warn(
            "Main cart service failed for addToCart, using localStorage:",
            error
          );
        }
      }

      // Fallback to localStorage
      const cart = await this.getCart(userId);
      const existingItem = cart.items.find(
        (item) => item.productId === productId
      );

      if (existingItem) {
        existingItem.quantity += quantity;
        existingItem.subtotal = existingItem.price * existingItem.quantity;
      } else {
        // Fetch product details to get accurate price and info
        let productPrice = 10.0; // Default fallback price
        try {
          const product = await productService.getProductById(productId);
          productPrice = product.price;
        } catch (error) {
          console.warn("Could not fetch product price, using fallback:", error);
        }

        const newItem: ServiceCartItem = {
          id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          price: productPrice,
          productId,
          quantity,
          subtotal: productPrice * quantity,
        };
        cart.items.push(newItem);
      }

      cart.total = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
      cart.updatedAt = new Date().toISOString();

      localStorage.setItem(`cart-${userId}`, JSON.stringify(cart));
    } catch (error) {
      console.error("Error adding item to cart:", error);
      throw error;
    }
  },

  async checkout(userId: string): Promise<void> {
    try {
      // Try main service first for authenticated users
      if (userId && !userId.startsWith("guest_")) {
        try {
          await cartService.checkout(userId);
          return;
        } catch (error) {
          console.warn(
            "Main cart service failed for checkout, clearing localStorage:",
            error
          );
        }
      }

      // Clear the cart after checkout
      localStorage.removeItem(`cart-${userId}`);
    } catch (error) {
      console.error("Error during checkout:", error);
      throw error;
    }
  },

  async clearCart(userId: string): Promise<void> {
    try {
      // Try main service first for authenticated users
      if (userId && !userId.startsWith("guest_")) {
        try {
          const cart = await cartService.getCart(userId);
          await Promise.all(
            cart.items.map((item) =>
              cartService.removeItemFromCart(userId, item.productId)
            )
          );
          return;
        } catch (error) {
          console.warn(
            "Main cart service failed for clearCart, using localStorage:",
            error
          );
        }
      }

      // Clear localStorage
      localStorage.removeItem(`cart-${userId}`);
    } catch (error) {
      console.error("Error clearing cart:", error);
      throw error;
    }
  },

  async getCart(userId: string): Promise<ShoppingCart> {
    const cartKey = `cart-${userId}`;

    try {
      // Try main service first for authenticated users
      if (userId && !userId.startsWith("guest_")) {
        try {
          return await cartService.getCart(userId);
        } catch (error) {
          console.warn(
            "Main cart service failed, falling back to localStorage:",
            error
          );
        }
      }

      // Fallback to localStorage (for guests or when service fails)
      const stored = localStorage.getItem(cartKey);
      if (stored) {
        const cart = JSON.parse(stored);
        // Ensure cart has required structure
        return {
          createdAt: cart.createdAt || new Date().toISOString(),
          id: cart.id || cartKey,
          items: cart.items || [],
          total: cart.total || 0,
          updatedAt: cart.updatedAt || new Date().toISOString(),
          userId: userId,
        };
      }

      // Return empty cart
      return {
        createdAt: new Date().toISOString(),
        id: cartKey,
        items: [],
        total: 0,
        updatedAt: new Date().toISOString(),
        userId: userId,
      };
    } catch (error) {
      console.error("Error getting cart:", error);
      throw error;
    }
  },

  async quickUpdateQuantity(
    userId: string,
    productId: string,
    quantity: number
  ): Promise<void> {
    try {
      // Try main service first for authenticated users
      if (userId && !userId.startsWith("guest_")) {
        try {
          await cartService.quickUpdateQuantity(userId, productId, quantity);
          return;
        } catch (error) {
          console.warn(
            "Main cart service failed for updateQuantity, using localStorage:",
            error
          );
        }
      }

      // Fallback to localStorage
      const cart = await this.getCart(userId);
      const item = cart.items.find((item) => item.productId === productId);

      if (item) {
        item.quantity = quantity;
        item.subtotal = item.price * quantity;
        cart.total = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
        cart.updatedAt = new Date().toISOString();

        localStorage.setItem(`cart-${userId}`, JSON.stringify(cart));
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      throw error;
    }
  },

  async removeItemFromCart(userId: string, productId: string): Promise<void> {
    try {
      // Try main service first for authenticated users
      if (userId && !userId.startsWith("guest_")) {
        try {
          await cartService.removeItemFromCart(userId, productId);
          return;
        } catch (error) {
          console.warn(
            "Main cart service failed for removeFromCart, using localStorage:",
            error
          );
        }
      }

      // Fallback to localStorage
      const cart = await this.getCart(userId);
      cart.items = cart.items.filter((item) => item.productId !== productId);
      cart.total = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
      cart.updatedAt = new Date().toISOString();

      localStorage.setItem(`cart-${userId}`, JSON.stringify(cart));
    } catch (error) {
      console.error("Error removing item from cart:", error);
      throw error;
    }
  },
};

// Extended cart item interface that includes product details for display
export interface CartItemWithProduct extends ServiceCartItem {
  product?: {
    category: string;
    image: string;
    inStock: boolean;
    name: string;
  };
}

interface CartClientProps {
  className?: string;
  userId?: string; // Now optional to support guest users
}

// Create a context for cart operations
interface CartContextType {
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  cart: null | ShoppingCart;
  cartItems: CartItemWithProduct[];
  clearCart: () => Promise<void>;
  isGuest: boolean;
  isLoading: boolean;
  isUpdating: boolean;
  refreshCart: () => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  totalItems: number;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  userId: string;
}

const CartContext = React.createContext<CartContextType | null>(null);

// Updated Cart wrapper component
interface CartProps {
  className?: string;
  userId?: string; // Now optional
}

// Cart Provider Component
interface CartProviderProps {
  children: React.ReactNode;
  userId?: string; // Optional - will use guest ID if not provided
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

// Updated CartClient component
export function CartClient({ className }: Omit<CartClientProps, "userId">) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { toast } = useToast();

  const {
    cart,
    cartItems,
    clearCart,
    isGuest,
    isLoading,
    isUpdating,
    refreshCart: fetchCart,
    removeFromCart,
    totalItems,
    updateQuantity,
  } = useCart();

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const subtotal = cart?.total || 0;

  const handleCheckout = async () => {
    if (!cart || cart.items.length === 0) return;

    if (isGuest) {
      // Redirect guests to sign up/login
      toast({
        action: (
          <Link href="/auth/sign-in">
            <Button size="sm">Sign In</Button>
          </Link>
        ),
        description: "Please sign in to complete your purchase",
        title: "Sign in required",
      });
      return;
    }

    try {
      setIsUpdating(true);

      await hybridCartService.checkout(cart.userId);
      setIsOpen(false);

      toast({
        description: "Checkout completed successfully!",
        title: "Success",
      });

      await fetchCart();
    } catch (error) {
      console.error("Failed to checkout:", error);
      toast({
        description: "Checkout failed. Please try again.",
        title: "Error",
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
          className={`
            absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-[10px]
          `}
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
            <div className="text-xl font-semibold">
              {isGuest ? "Your Cart (Guest)" : "Your Cart"}
            </div>
            <div className="text-sm text-muted-foreground">
              {isLoading
                ? "Loading cart..."
                : totalItems === 0
                ? "Your cart is empty"
                : `You have ${totalItems} item${
                    totalItems !== 1 ? "s" : ""
                  } in your cart`}
            </div>
            {isGuest && totalItems > 0 && (
              <div className="mt-1 text-xs text-orange-600">
                Sign in to save your cart and checkout
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
                <Loader2
                  className={`
                  mb-2 h-8 w-8 animate-spin text-muted-foreground
                `}
                />
                <p className="text-sm text-muted-foreground">
                  Loading your cart...
                </p>
              </motion.div>
            ) : cartItems.length === 0 ? (
              <motion.div
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12"
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
              >
                <div
                  className={`
                  mb-4 flex h-20 w-20 items-center justify-center rounded-full
                  bg-muted
                `}
                >
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
                      `
                        shadow-sm transition-colors
                        hover:bg-accent/50
                      `,
                      isUpdating && "pointer-events-none opacity-50"
                    )}
                    exit={{ opacity: 0, y: -10 }}
                    initial={{ opacity: 0, y: 10 }}
                    key={item.id}
                    layout
                    transition={{ duration: 0.15 }}
                  >
                    <div className="relative h-20 w-20 overflow-hidden rounded">
                      <Image
                        alt={item.product?.name || "Product image"}
                        className="object-cover"
                        fill
                        src={item.product?.image || "/placeholder-product.jpg"}
                      />
                      {item.product && !item.product.inStock && (
                        <div
                          className={`
                          absolute inset-0 flex items-center justify-center
                          bg-red-500/20
                        `}
                        >
                          <span
                            className={`
                            rounded bg-red-500 px-1 py-0.5 text-xs text-white
                          `}
                          >
                            Out of Stock
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="ml-4 flex flex-1 flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between">
                          <Link
                            className={`
                              line-clamp-2 text-sm font-medium
                              group-hover:text-primary
                            `}
                            href={`/products/${item.productId}`}
                            onClick={() => setIsOpen(false)}
                          >
                            {item.product?.name || "Unknown Product"}
                          </Link>
                          <button
                            className={`
                              ml-2 rounded-full p-1 text-muted-foreground
                              transition-colors
                              hover:bg-muted hover:text-destructive
                            `}
                            disabled={isUpdating}
                            onClick={() => removeFromCart(item.productId)}
                            type="button"
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
                          {item.product?.category || "Unknown Category"}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center rounded-md border">
                          <button
                            className={`
                              flex h-7 w-7 items-center justify-center
                              rounded-l-md border-r text-muted-foreground
                              transition-colors
                              hover:bg-muted hover:text-foreground
                              disabled:cursor-not-allowed disabled:opacity-50
                            `}
                            disabled={item.quantity <= 1 || isUpdating}
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity - 1)
                            }
                            type="button"
                          >
                            <Minus className="h-3 w-3" />
                            <span className="sr-only">Decrease quantity</span>
                          </button>
                          <span
                            className={`
                            flex h-7 w-7 items-center justify-center text-xs
                            font-medium
                          `}
                          >
                            {item.quantity}
                          </span>
                          <button
                            className={`
                              flex h-7 w-7 items-center justify-center
                              rounded-r-md border-l text-muted-foreground
                              transition-colors
                              hover:bg-muted hover:text-foreground
                              disabled:cursor-not-allowed disabled:opacity-50
                            `}
                            disabled={isUpdating}
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity + 1)
                            }
                            type="button"
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

              {isGuest ? (
                <div className="space-y-2">
                  <Link className="w-full" href="/auth/sign-in">
                    <Button className="w-full" size="lg">
                      Sign In to Checkout
                    </Button>
                  </Link>
                  <p className="text-center text-xs text-muted-foreground">
                    Your cart will be saved when you sign in
                  </p>
                </div>
              ) : (
                <Button
                  className="w-full"
                  disabled={isUpdating}
                  onClick={handleCheckout}
                  size="lg"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Checkout"
                  )}
                </Button>
              )}

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

                <div className="flex gap-2">
                  <Link href="/cart">
                    <Button size="sm" variant="outline">
                      View Full Cart
                    </Button>
                  </Link>
                  <Button
                    disabled={isUpdating}
                    onClick={clearCart}
                    size="sm"
                    variant="outline"
                  >
                    {isUpdating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Clear"
                    )}
                  </Button>
                </div>
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

export function CartProvider({
  children,
  userId: providedUserId,
}: CartProviderProps) {
  const userId = providedUserId || getGuestUserId();
  const isGuest = !providedUserId || providedUserId.startsWith("guest_");

  const [cart, setCart] = React.useState<null | ShoppingCart>(null);
  const [cartItems, setCartItems] = React.useState<CartItemWithProduct[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const { toast } = useToast();

  // Fetch cart data
  const fetchCart = React.useCallback(async () => {
    try {
      console.log("Fetching cart for userId:", userId, "isGuest:", isGuest);
      setIsLoading(true);

      const cartData = await hybridCartService.getCart(userId);
      console.log("Cart data received:", cartData);

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
                category: product.categories[0]?.name || "Uncategorized",
                image: product.images[0] || "/placeholder-product.jpg",
                inStock: product.status === "ACTIVE" && product.stock > 0,
                name: product.name,
              },
            };
          } catch (error) {
            console.error(`Failed to fetch product ${item.productId}:`, error);
            return {
              ...item,
              product: {
                category: "Unknown",
                image: "/placeholder-product.jpg",
                inStock: false,
                name: `Product ${item.productId}`,
              },
            };
          }
        })
      );

      setCartItems(itemsWithProducts);
    } catch (error) {
      console.error("Failed to fetch cart:", error);

      // Create empty cart as fallback
      const emptyCart: ShoppingCart1 = {
        createdAt: new Date().toISOString(),
        id: `cart-${userId}`,
        items: [],
        total: 0,
        updatedAt: new Date().toISOString(),
        userId: userId,
      };

      setCart(emptyCart);
      setCartItems([]);

      toast({
        description: "Initialized empty cart. Please try refreshing.",
        title: "Cart Error",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId, isGuest, toast]);

  // Initialize cart on mount and when userId changes
  React.useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const totalItems =
    cart?.items.reduce((acc, item) => acc + item.quantity, 0) || 0;

  // Add item to cart
  const addToCart = React.useCallback(
    async (productId: string, quantity = 1) => {
      try {
        setIsUpdating(true);

        await hybridCartService.addItemToCart(userId, productId, quantity);
        await fetchCart();

        toast({
          description: `Item added to ${isGuest ? "local" : "your"} cart!`,
          title: "Success",
        });
      } catch (error) {
        console.error("Failed to add to cart:", error);
        toast({
          description: "Failed to add item to cart. Please try again.",
          title: "Error",
          variant: "destructive",
        });
      } finally {
        setIsUpdating(false);
      }
    },
    [userId, isGuest, fetchCart, toast]
  );

  // Remove item from cart
  const removeFromCart = React.useCallback(
    async (productId: string) => {
      try {
        setIsUpdating(true);

        await hybridCartService.removeItemFromCart(userId, productId);
        await fetchCart();

        toast({
          description: "Item removed from cart",
          title: "Success",
        });
      } catch (error) {
        console.error("Failed to remove item:", error);
        toast({
          description: "Failed to remove item. Please try again.",
          title: "Error",
          variant: "destructive",
        });
      } finally {
        setIsUpdating(false);
      }
    },
    [userId, fetchCart, toast]
  );

  // Update quantity
  const updateQuantity = React.useCallback(
    async (productId: string, newQuantity: number) => {
      if (newQuantity < 1) return;

      try {
        setIsUpdating(true);

        await hybridCartService.quickUpdateQuantity(
          userId,
          productId,
          newQuantity
        );
        await fetchCart();

        toast({
          description: "Item quantity updated",
          title: "Success",
        });
      } catch (error) {
        console.error("Failed to update quantity:", error);
        toast({
          description: "Failed to update quantity. Please try again.",
          title: "Error",
          variant: "destructive",
        });
      } finally {
        setIsUpdating(false);
      }
    },
    [userId, fetchCart, toast]
  );

  // Clear cart
  const clearCart = React.useCallback(async () => {
    if (!cart || cart.items.length === 0) return;

    try {
      setIsUpdating(true);

      await hybridCartService.clearCart(userId);
      await fetchCart();

      toast({
        description: "Cart cleared successfully",
        title: "Success",
      });
    } catch (error) {
      console.error("Failed to clear cart:", error);
      toast({
        description: "Failed to clear cart. Please try again.",
        title: "Error",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  }, [cart, userId, fetchCart, toast]);

  const contextValue: CartContextType = {
    addToCart,
    cart,
    cartItems,
    clearCart,
    isGuest,
    isLoading,
    isUpdating,
    refreshCart: fetchCart,
    removeFromCart,
    totalItems,
    updateQuantity,
    userId,
  };

  return <CartContext value={contextValue}>{children}</CartContext>;
}

// Hook to use cart context
export function useCart() {
  const context = React.use(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
