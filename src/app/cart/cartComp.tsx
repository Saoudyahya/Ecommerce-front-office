"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Loader2, Minus, Plus, ShoppingCart, Trash2, X, WifiOff, Wifi, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";

import { cn } from "~/lib/cn";
import { useCart } from "~/lib/hooks/use-cart"; // Use the updated hybrid cart hook
import { Badge } from "~/ui/primitives/badge";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/ui/primitives/card";
import { Separator } from "~/ui/primitives/separator";
import { Alert, AlertDescription } from "~/ui/primitives/alert";
import { toast } from "sonner";
import { Product_Service_URL } from "~/lib/apiEndPoints";
import { ProductStatus } from "~/service/BFFCart";

const getImageUrl = (imagePath: string): string => {
  // Get server base URL: "http://localhost:8099"
  const serverBaseUrl = Product_Service_URL.replace('/api/products', '');
  
  if (imagePath.startsWith('/api/')) {
    // For "/api/products/images/file.png"
    // Result: "http://localhost:8099" + "/api/products/images/file.png"
    // = "http://localhost:8099/api/products/images/file.png" ✅
    return `${serverBaseUrl}${imagePath}`;
  }
  
  return imagePath; // Return as-is if not an API path
};

// Product status indicator component
function ProductStatusBadge({ status, inStock }: { status?: ProductStatus; inStock?: boolean }) {
  if (!inStock || status === ProductStatus.OUT_OF_STOCK) {
    return (
      <Badge variant="destructive" className="text-xs">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Out of Stock
      </Badge>
    );
  }

  if (status === ProductStatus.DISCONTINUED) {
    return (
      <Badge variant="secondary" className="text-xs">
        <Clock className="h-3 w-3 mr-1" />
        Discontinued
      </Badge>
    );
  }

  if (status === ProductStatus.INACTIVE) {
    return (
      <Badge variant="outline" className="text-xs">
        <Clock className="h-3 w-3 mr-1" />
        Inactive
      </Badge>
    );
  }

  return (
    <Badge variant="default" className="text-xs bg-green-100 text-green-800 border-green-200">
      <CheckCircle className="h-3 w-3 mr-1" />
      In Stock
    </Badge>
  );
}

// Stock warning component
function StockWarning({ availableQuantity, currentQuantity }: { availableQuantity?: number; currentQuantity: number }) {
  if (!availableQuantity) return null;
  
  if (availableQuantity === 0) {
    return (
      <div className="text-xs text-destructive bg-destructive/10 px-2 py-1 rounded">
        ⚠️ Out of stock
      </div>
    );
  }

  if (availableQuantity < currentQuantity) {
    return (
      <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
        ⚠️ Only {availableQuantity} available
      </div>
    );
  }

  if (availableQuantity <= 5) {
    return (
      <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
        ⚠️ Low stock ({availableQuantity} left)
      </div>
    );
  }

  return null;
}

// Status indicator component
function CartStatusIndicator() {
  const { isOnline, cartMode, syncStatus } = useCart();

  if (!isOnline) {
    return (
      <Alert>
        <WifiOff className="h-4 w-4" />
        <AlertDescription>
          You're offline. Your changes are being saved locally and will sync when you're back online.
        </AlertDescription>
      </Alert>
    );
  }

  if (cartMode === 'guest') {
    return (
      <Alert>
        <AlertDescription>
          You're shopping as a guest. <Link href="/auth/sign-in" className="underline hover:no-underline">Sign in</Link> to sync your cart across devices and complete checkout.
        </AlertDescription>
      </Alert>
    );
  }

  if (syncStatus === 'syncing') {
    return (
      <Alert>
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertDescription>
          Syncing your cart...
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}

function CartPageComponent() {
  const {
    items: cartItems,
    itemCount: totalItems,
    isLoading,
    isUpdating,
    isGuest,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    total,
    isOnline,
    cartMode,
    syncStatus,
  } = useCart();

  const shipping = 0; // Free shipping for now
  const tax = subtotal * 0.08; // 8% tax

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    
    // Check for out of stock items (only if we have enriched data)
    const outOfStockItems = cartItems.filter(item => 
      (item.inStock !== undefined && !item.inStock) || 
      (item.productStatus !== undefined && item.productStatus === ProductStatus.OUT_OF_STOCK)
    );
    if (outOfStockItems.length > 0) {
      toast.error("Cannot checkout", {
        description: "Please remove out of stock items from your cart",
      });
      return;
    }

    // Check for quantity issues (only if we have enriched data)
    const quantityIssues = cartItems.filter(item => 
      item.availableQuantity !== undefined && item.quantity > item.availableQuantity
    );
    if (quantityIssues.length > 0) {
      toast.error("Quantity exceeded", {
        description: "Some items exceed available stock. Please adjust quantities.",
      });
      return;
    }
    
    if (isGuest) {
      toast.error("Sign in required", {
        description: "Please sign in to complete your purchase",
        action: {
          label: "Sign In",
          onClick: () => window.location.href = '/auth/sign-in'
        }
      });
      return;
    }

    if (!isOnline) {
      toast.error("No internet connection", {
        description: "Please check your connection and try again",
      });
      return;
    }

    try {
      // For now, just show success - you'd integrate with actual checkout
      toast.success("Success", {
        description: "Redirecting to checkout...",
      });
      
      // Here you would typically redirect to a checkout page
      // window.location.href = '/checkout';
    } catch (error) {
      toast.error("Checkout failed", {
        description: "Please try again later",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-7xl px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
              <p className="mt-4 text-lg text-muted-foreground">
                Loading your cart...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/products">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Continue Shopping
              </Button>
            </Link>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold tracking-tight">
                  Shopping Cart
                </h1>
                {/* Status indicator */}
                <div className="flex items-center gap-1 text-sm">
                  {!isOnline ? (
                    <><WifiOff className="h-4 w-4 text-amber-500" /> <span className="text-amber-600">Offline</span></>
                  ) : cartMode === 'guest' ? (
                    <><span className="text-blue-600">Guest</span></>
                  ) : syncStatus === 'syncing' ? (
                    <><Loader2 className="h-3 w-3 animate-spin text-blue-600" /> <span className="text-blue-600">Syncing</span></>
                  ) : (
                    <><Wifi className="h-4 w-4 text-green-500" /> <span className="text-green-600">Synced</span></>
                  )}
                </div>
              </div>
              
              <p className="text-muted-foreground">
                {totalItems === 0 
                  ? "Your cart is empty" 
                  : `${totalItems} item${totalItems !== 1 ? 's' : ''} in your cart`
                }
              </p>
            </div>
            
            {cartItems.length > 0 && (
              <Button
                variant="outline"
                onClick={clearCart}
                disabled={isUpdating}
                className="text-destructive hover:text-destructive"
              >
                {isUpdating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Clear Cart
              </Button>
            )}
          </div>
        </div>

        {/* Status alerts */}
        <div className="mb-6">
          <CartStatusIndicator />
        </div>

        {cartItems.length === 0 ? (
          /* Empty Cart State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="mb-8 flex h-32 w-32 items-center justify-center rounded-full bg-muted mx-auto">
              <ShoppingCart className="h-16 w-16 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-semibold mb-4">Your cart is empty</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Looks like you haven't added anything to your cart yet. 
              Start shopping to fill it up!
            </p>
            <Link href="/products">
              <Button size="lg">
                Browse Products
              </Button>
            </Link>
          </motion.div>
        ) : (
          /* Cart with Items */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Items in your cart</span>
                    <Badge variant="secondary">{totalItems} items</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <AnimatePresence>
                    <div className="divide-y">
                      {cartItems.map((item, index) => {
                        // Defensive checks to prevent undefined errors
                        if (!item || (!item.id && !item.productId)) {
                          console.warn('Invalid cart item:', item);
                          return null;
                        }

                        const itemId = item.productId || item.id || `item-${index}`;
                        const itemName = item.productName || item.name || `Product ${itemId}`;
                        const itemImage = item.productImage || item.image || '/placeholder-product.jpg';

                        return (
                        <motion.div
                          key={itemId}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                          className={cn(
                            "p-6 transition-colors hover:bg-muted/50",
                            isUpdating && "opacity-50 pointer-events-none",
                            // Show warning styling only if we have enriched data and item is out of stock
                            (item.inStock !== undefined && (!item.inStock || item.productStatus === ProductStatus.OUT_OF_STOCK)) && "bg-red-50/50 border-l-4 border-l-red-200"
                          )}
                        >
                          <div className="flex gap-4">
                            {/* Product Image */}
                            <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg border">
                              <Image
                                src={getImageUrl(itemImage)}
                                alt={itemName}
                                fill
                                className={cn(
                                  "object-cover transition-opacity",
                                  // Apply grayscale only if we have enriched data and item is out of stock
                                  (item.inStock !== undefined && (!item.inStock || item.productStatus === ProductStatus.OUT_OF_STOCK)) && "opacity-50 grayscale"
                                )}
                              />
                              {/* Show out of stock overlay only if we have enriched data */}
                              {item.inStock !== undefined && (!item.inStock || item.productStatus === ProductStatus.OUT_OF_STOCK) && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                  <span className="text-white text-xs font-medium bg-red-600 px-2 py-1 rounded">
                                    Out of Stock
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Product Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                  <Link 
                                    href={`/products/${itemId}`}
                                    className={cn(
                                      "font-medium hover:text-primary line-clamp-2 text-foreground",
                                      // Apply muted styling only if we have enriched data and item is out of stock
                                      (item.inStock !== undefined && (!item.inStock || item.productStatus === ProductStatus.OUT_OF_STOCK)) && "text-muted-foreground"
                                    )}
                                  >
                                    {itemName}
                                  </Link>
                                  
                                  <div className="flex items-center gap-2 mt-1">
                                    {/* Show status badge only if we have enriched data */}
                                    {item.productStatus !== undefined && (
                                      <ProductStatusBadge status={item.productStatus} inStock={item.inStock} />
                                    )}
                                    <span className="text-sm text-muted-foreground">
                                      {item.category && `${item.category} • `}
                                      ID: {itemId.slice(0, 8)}...
                                    </span>
                                  </div>

                                  {/* Stock Warning - only show if we have enriched data */}
                                  {item.availableQuantity !== undefined && (
                                    <div className="mt-2">
                                      <StockWarning 
                                        availableQuantity={item.availableQuantity} 
                                        currentQuantity={item.quantity || 0} 
                                      />
                                    </div>
                                  )}
                                </div>
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeItem(itemId)}
                                  disabled={isUpdating}
                                  className="text-muted-foreground hover:text-destructive"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>

                              <div className="flex items-center justify-between">
                                {/* Quantity Controls */}
                                <div className="flex items-center border rounded-md">
                                    <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 rounded-l-md border-r"
                                    disabled={(item.quantity || 0) <= 1 || isUpdating || (item.inStock !== undefined && !item.inStock)}
                                    onClick={() => updateQuantity(itemId, (item.quantity || 0) - 1)}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="flex h-8 w-12 items-center justify-center text-sm font-medium">
                                    {item.quantity || 0}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 rounded-r-md border-l"
                                    disabled={
                                      isUpdating || 
                                      (item.inStock !== undefined && !item.inStock) || 
                                      (item.availableQuantity !== undefined && (item.quantity || 0) >= item.availableQuantity) ||
                                      (item.productStatus !== undefined && item.productStatus === ProductStatus.OUT_OF_STOCK)
                                    }
                                    onClick={() => updateQuantity(itemId, (item.quantity || 0) + 1)}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>

                                {/* Price */}
                                <div className="text-right">
                                  <div className={cn(
                                    "font-semibold",
                                    // Apply muted styling only if we have enriched data and item is out of stock
                                    (item.inStock !== undefined && (!item.inStock || item.productStatus === ProductStatus.OUT_OF_STOCK)) && "text-muted-foreground"
                                  )}>
                                    ${((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    ${(item.price || 0).toFixed(2)} each
                                  </div>
                                  {/* Show availability info only if we have enriched data */}
                                  {item.availableQuantity !== undefined && item.availableQuantity < 10 && (item.inStock !== undefined && item.inStock) && (
                                    <div className="text-xs text-amber-600">
                                      {item.availableQuantity} available
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                        );
                      }).filter(Boolean)}
                    </div>
                  </AnimatePresence>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Stock Issues Alert - only show if we have enriched data */}
                  {cartItems.some(item => 
                    (item.inStock !== undefined && !item.inStock) || 
                    (item.availableQuantity !== undefined && item.quantity > item.availableQuantity)
                  ) && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Some items have stock issues. Please review your cart before checkout.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal ({totalItems} items)</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="text-green-600">
                        {shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>

                  {isGuest ? (
                    <div className="space-y-2">
                      <Link href="/auth/sign-in" className="w-full">
                        <Button className="w-full" size="lg">
                          Sign In to Checkout
                        </Button>
                      </Link>
                      <p className="text-xs text-center text-muted-foreground">
                        Your cart will be saved when you sign in
                      </p>
                      <Link href="/auth/sign-up" className="w-full">
                        <Button variant="outline" className="w-full">
                          Create Account
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={handleCheckout}
                      disabled={
                        isUpdating || 
                        !isOnline || 
                        // Only check stock issues if we have enriched data
                        cartItems.some(item => 
                          (item.inStock !== undefined && !item.inStock) || 
                          (item.availableQuantity !== undefined && item.quantity > item.availableQuantity)
                        )
                      }
                    >
                      {isUpdating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : !isOnline ? (
                        'No Internet Connection'
                      ) : cartItems.some(item => 
                          (item.inStock !== undefined && !item.inStock) || 
                          (item.availableQuantity !== undefined && item.quantity > item.availableQuantity)
                        ) ? (
                        'Fix Stock Issues First'
                      ) : (
                        'Proceed to Checkout'
                      )}
                    </Button>
                  )}

                  <div className="text-center">
                    <Link href="/products">
                      <Button variant="ghost" size="sm">
                        Continue Shopping
                      </Button>
                    </Link>
                  </div>

                  {/* Security Badges or Trust Indicators */}
                  <div className="pt-4 border-t">
                    <div className="text-xs text-muted-foreground text-center space-y-1">
                      <p>🔒 Secure Checkout</p>
                      <p>📦 Free shipping on orders over $50</p>
                      <p>↩️ 30-day return policy</p>
                      {cartMode === 'guest' && (
                        <p className="text-amber-600">💾 Cart saved locally</p>
                      )}
                      {!isOnline && (
                        <p className="text-amber-600">📡 Offline mode active</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Cart() {
  // No need for CartProvider here since it's already in the layout
  return <CartPageComponent />;
}