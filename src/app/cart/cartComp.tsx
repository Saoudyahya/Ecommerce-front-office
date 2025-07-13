// Example of integrating Save for Later into your cart component

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Heart, Loader2, Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";

import { cn } from "~/lib/cn";
import { useCart } from "~/lib/hooks/use-cart";
import { savedForLaterService, type SavedProduct } from "~/service/Saved4Later";
import { Badge } from "~/ui/primitives/badge";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/ui/primitives/card";
import { Separator } from "~/ui/primitives/separator";
import { toast } from "sonner";
import { Product_Service_URL } from "~/lib/apiEndPoints";

const getImageUrl = (imagePath: string): string => {
  const serverBaseUrl = Product_Service_URL.replace('/api/products', '');
  
  if (imagePath.startsWith('/api/')) {
    return `${serverBaseUrl}${imagePath}`;
  }
  
  return imagePath;
};

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
  } = useCart();

  const [savedCount, setSavedCount] = React.useState(0);

  // Update saved count when component mounts or saved items change
  React.useEffect(() => {
    const updateSavedCount = () => {
      setSavedCount(savedForLaterService.getItemCount());
    };
    
    updateSavedCount();
    
    // Listen for localStorage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'Saved4Later') {
        updateSavedCount();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const shipping = 0;
  const tax = subtotal * 0.08;

  // Save item for later and remove from cart
  const handleSaveForLater = async (item: any) => {
    try {
      const savedProduct: SavedProduct = {
        id: item.productId || item.id,
        name: item.productName || item.name || `Product ${item.productId}`,
        price: item.price || 0,
        imagePath: item.productImage || item.image || '/placeholder-product.jpg',
        category: item.category || 'Unknown'
      };

      // Add to saved items
      savedForLaterService.addItem(savedProduct);
      
      // Remove from cart
      await removeItem(item.productId || item.id);
      
      // Update saved count
      setSavedCount(savedForLaterService.getItemCount());
      
      toast.success("Saved for later", {
        description: `${savedProduct.name} has been moved to your saved items`,
        action: {
          label: "View Saved",
          onClick: () => window.location.href = '/saved-for-later'
        }
      });
    } catch (error) {
      console.error('Error saving item for later:', error);
      toast.error("Error", {
        description: "Failed to save item for later",
      });
    }
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    
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
      toast.success("Success", {
        description: "Redirecting to checkout...",
      });
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
            
            {/* Link to Saved Items */}
            {savedCount > 0 && (
              <Link href="/saved-for-later">
                <Button variant="outline" size="sm">
                  <Heart className="h-4 w-4 mr-2 fill-current text-red-500" />
                  Saved Items ({savedCount})
                </Button>
              </Link>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Shopping Cart
              </h1>
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
            <div className="flex justify-center gap-4">
              <Link href="/products">
                <Button size="lg">
                  Browse Products
                </Button>
              </Link>
              {savedCount > 0 && (
                <Link href="/saved-for-later">
                  <Button variant="outline" size="lg">
                    <Heart className="h-4 w-4 mr-2 fill-current text-red-500" />
                    View Saved Items ({savedCount})
                  </Button>
                </Link>
              )}
            </div>
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
                        if (!item || (!item.id && !item.productId)) {
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
                              isUpdating && "opacity-50 pointer-events-none"
                            )}
                          >
                            <div className="flex gap-4">
                              {/* Product Image */}
                              <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg border">
                                <Image
                                  src={getImageUrl(itemImage)}
                                  alt={itemName}
                                  fill
                                  className="object-cover"
                                />
                              </div>

                              {/* Product Details */}
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex-1">
                                    <Link 
                                      href={`/products/${itemId}`}
                                      className="font-medium hover:text-primary line-clamp-2 text-foreground"
                                    >
                                      {itemName}
                                    </Link>
                                    
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-sm text-muted-foreground">
                                        {item.category && `${item.category} • `}
                                        ID: {itemId.slice(0, 8)}...
                                      </span>
                                    </div>
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
                                      disabled={(item.quantity || 0) <= 1 || isUpdating}
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
                                      disabled={isUpdating}
                                      onClick={() => updateQuantity(itemId, (item.quantity || 0) + 1)}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>

                                  {/* Save for Later Button */}
                                  <div>
                                    <Button 
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleSaveForLater(item)}
                                      disabled={isUpdating}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Heart className="w-4 h-4 mr-1" />
                                      Save for Later
                                    </Button>
                                  </div>
                               
                                  {/* Price */}
                                  <div className="text-right">
                                    <div className="font-semibold">
                                      ${((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      ${(item.price || 0).toFixed(2)} each
                                    </div>
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

                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleCheckout}
                    disabled={isUpdating || !isOnline}
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : !isOnline ? (
                      'No Internet Connection'
                    ) : isGuest ? (
                      'Sign In to Checkout'
                    ) : (
                      'Proceed to Checkout'
                    )}
                  </Button>

                  <div className="text-center">
                    <Link href="/products">
                      <Button variant="ghost" size="sm">
                        Continue Shopping
                      </Button>
                    </Link>
                  </div>

                  {/* Saved Items Quick Link */}
                  {savedCount > 0 && (
                    <div className="pt-4 border-t">
                      <Link href="/saved-for-later">
                        <Button variant="outline" className="w-full">
                          <Heart className="h-4 w-4 mr-2 fill-current text-red-500" />
                          View Saved Items ({savedCount})
                        </Button>
                      </Link>
                    </div>
                  )}

                  {/* Security Badges or Trust Indicators */}
                  <div className="pt-4 border-t">
                    <div className="text-xs text-muted-foreground text-center space-y-1">
                      <p>🔒 Secure Checkout</p>
                      <p>📦 Free shipping on orders over $50</p>
                      <p>↩️ 30-day return policy</p>
                      <p>💾 Items saved locally for {cartMode === 'guest' ? 'guests' : 'you'}</p>
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
  return <CartPageComponent />;
}