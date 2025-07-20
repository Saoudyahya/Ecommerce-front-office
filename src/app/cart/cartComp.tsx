// Example of integrating Save for Later into your cart component with Coupon System

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Heart, Loader2, Minus, Plus, ShoppingCart, Trash2, X, Tag, Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";

import { cn } from "~/lib/cn";
import { useCart } from "~/lib/hooks/use-cart";
import { save4LaterService, type SavedProduct } from "~/service/Saved4Later";
import { hybridCartService} from "~/service/Cart";

import { Badge } from "~/ui/primitives/badge";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/ui/primitives/card";
import { Separator } from "~/ui/primitives/separator";
import { Input } from "~/ui/primitives/input";
import { toast } from "sonner";
import { getRequestOptions, Loyalty_Service_URL, Product_Service_URL } from "~/lib/apiEndPoints";
import { useAuth } from "~/lib/hooks/usrAuth";

const getImageUrl = (imagePath: string): string => {
  const serverBaseUrl = Product_Service_URL.replace('/api/products', '');
  
  if (imagePath.startsWith('/api/')) {
    return `${serverBaseUrl}${imagePath}`;
  }
  
  return imagePath;
};

// Real coupon validation service
const validateCoupon = async (code: string, subtotal: number) => {
  try {
    const response = await fetch(
      `${Loyalty_Service_URL}/coupons/valid/${code.toUpperCase()}`,
      getRequestOptions('GET')
    );
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Coupon not found or invalid');
      }
      throw new Error('Failed to validate coupon');
    }

    const couponData = await response.json();
    
    // Validate coupon conditions
    if (couponData.used) {
      throw new Error('Coupon has already been used');
    }

    // Check expiration date
    const expirationDate = new Date(couponData.expirationDate);
    const now = new Date();
    if (now > expirationDate) {
      throw new Error('Coupon has expired');
    }

    // Check minimum purchase amount
    if (subtotal < couponData.minPurchaseAmount) {
      throw new Error(`Minimum purchase amount of ${couponData.minPurchaseAmount.toFixed(2)} required`);
    }

    // Check user-specific coupon
    // if (couponData.userId && couponData.userId !== userId) {
    //   throw new Error('This coupon is not valid for your account');
    // }

    // Calculate discount
    let discountAmount = 0;
    let description = '';

    if (couponData.discountType === 'PERCENTAGE') {
      discountAmount = subtotal * (couponData.discountValue / 100);
      // Apply max discount limit if specified
      if (couponData.maxDiscountAmount && discountAmount > couponData.maxDiscountAmount) {
        discountAmount = couponData.maxDiscountAmount;
      }
      description = `${couponData.discountValue}% off your order`;
    } else if (couponData.discountType === 'FIXED_AMOUNT') {
      discountAmount = couponData.discountValue;
      description = `${couponData.discountValue.toFixed(2)} off your order`;
    } else if (couponData.discountType === 'FREE_SHIPPING') {
      discountAmount = 0; // This will be handled separately in shipping calculation
      description = 'Free shipping on your order';
    }

    return {
      valid: true,
      id: couponData.id,
      code: couponData.code,
      discountType: couponData.discountType,
      discountAmount: discountAmount,
      description: description,
      stackable: couponData.stackable,
      priorityLevel: couponData.priorityLevel,
      maxDiscountAmount: couponData.maxDiscountAmount,
      minPurchaseAmount: couponData.minPurchaseAmount,
      rawData: couponData
    };

  } catch (error) {
    console.error('Coupon validation error:', error);
    throw error;
  }
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


  const { isAuthenticated , user } = useAuth();

  // Add local state for checkout loading
  const [isCheckingOut, setIsCheckingOut] = React.useState(false);
  const [savedCount, setSavedCount] = React.useState(0);
  
  // Coupon state management
  const [couponInput, setCouponInput] = React.useState('');
  const [appliedCoupons, setAppliedCoupons] = React.useState([]);
  const [isApplyingCoupon, setIsApplyingCoupon] = React.useState(false);
  const [showAdditionalCouponInput, setShowAdditionalCouponInput] = React.useState(false);

  // Update saved count when component mounts or saved items change
  React.useEffect(() => {
    const updateSavedCount = () => {
      setSavedCount(save4LaterService.getItemCount());
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

  // Calculate coupon discounts with proper stacking logic
  const calculateCouponDiscounts = () => {
    let totalDiscount = 0;
    let freeShipping = false;
    
    // Sort coupons by priority level (higher priority first)
    const sortedCoupons = [...appliedCoupons].sort((a, b) => (b.priorityLevel || 0) - (a.priorityLevel || 0));
    
    let currentSubtotal = subtotal;
    
    sortedCoupons.forEach(coupon => {
      if (coupon.discountType === 'PERCENTAGE') {
        const discount = Math.min(
          currentSubtotal * (coupon.rawData.discountValue / 100),
          coupon.maxDiscountAmount || Infinity
        );
        totalDiscount += discount;
        // If not stackable, only apply the highest priority discount
        if (!coupon.stackable) {
          currentSubtotal -= discount;
        }
      } else if (coupon.discountType === 'FIXED_AMOUNT') {
        const discount = Math.min(coupon.discountAmount, currentSubtotal);
        totalDiscount += discount;
        if (!coupon.stackable) {
          currentSubtotal -= discount;
        }
      } else if (coupon.discountType === 'FREE_SHIPPING') {
        freeShipping = true;
      }
    });
    
    // Ensure total discount doesn't exceed subtotal
    totalDiscount = Math.min(totalDiscount, subtotal);
    
    return { totalDiscount, freeShipping };
  };

  const { totalDiscount, freeShipping } = calculateCouponDiscounts();
  const shipping = freeShipping ? 0 : 0; // Currently free shipping, but this shows the logic
  const tax = (subtotal - totalDiscount) * 0.08;
  const finalTotal = subtotal - totalDiscount + shipping + tax;

  // Handle coupon application
  const handleApplyCoupon = async (couponCode = couponInput) => {
    if (!couponCode.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }
    
    // Check if coupon is already applied
    if (appliedCoupons.some(coupon => coupon.code === couponCode.toUpperCase())) {
      toast.error("Coupon already applied");
      return;
    }
    
    // Check stackable limitations
    const nonStackableCoupons = appliedCoupons.filter(c => !c.stackable);
    if (nonStackableCoupons.length > 0) {
      toast.error("Cannot stack with existing coupon", {
        description: `Remove ${nonStackableCoupons[0].code} first to apply a new coupon`
      });
      return;
    }
    
    setIsApplyingCoupon(true);
    
    try {
      // Adjust based on your user object structure
      const couponData = await validateCoupon(couponCode, subtotal);
      
      // Check if new coupon is stackable with existing ones
      if (!couponData.stackable && appliedCoupons.length > 0) {
        toast.error("This coupon cannot be combined with other offers");
        return;
      }
      
      setAppliedCoupons(prev => [...prev, couponData]);
      setCouponInput('');
      setShowAdditionalCouponInput(true);
      
      toast.success("Coupon applied!", {
        description: couponData.description,
      });
      
    } catch (error) {
      toast.error("Coupon validation failed", {
        description: error.message,
      });
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  // Remove coupon
  const handleRemoveCoupon = (couponCode) => {
    setAppliedCoupons(prev => prev.filter(coupon => coupon.code !== couponCode));
    toast.success("Coupon removed");
    
    // Hide additional input if no coupons applied
    if (appliedCoupons.length <= 1) {
      setShowAdditionalCouponInput(false);
    }
  };

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
      save4LaterService.addItem(savedProduct);
      
      // Remove from cart
      await removeItem(item.productId || item.id);
      
      // Update saved count
      setSavedCount(save4LaterService.getItemCount());
      
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
    
    if (!isAuthenticated) {
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

    setIsCheckingOut(true);
      const currentCart = await hybridCartService.getCart();

    
    try {
      // Import orderService
      const { orderService } = await import("~/service/Order");
      
      // Validate cart before checkout
      const validation = await orderService.validateCartForCheckoutWithDiscounts(
        { items: cartItems, id: `cart_${Date.now()}` },
        appliedCoupons.map(c => c.code)
      );
      
      if (!validation.isValid) {
        toast.error("Checkout validation failed", {
          description: validation.errors.join(', '),
        });
        return;
      }

      // Show warnings if any
      if (validation.warnings.length > 0) {
        toast.warning("Please review your cart", {
          description: validation.warnings.join(', '),
        });
      }
      console.log(" eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"  ,currentCart.id);

      // Create order from cart with coupons
      const orderResponse = await orderService.quickCheckoutWithDiscounts(
        appliedCoupons.map(c => c.code),
        { 
          items: cartItems.map(item => ({
            productId: item.productId || item.id,
            quantity: item.quantity || 1,
            price: item.price || 0,
            discount: item.discount || 0
          })),
          id: currentCart.id
        },
        user?.id || user?.userId
      );
      
      toast.success("Order created successfully!", {
        description: `Order ${orderResponse.id.slice(0, 8)}... has been placed${totalDiscount > 0 ? ` with ${totalDiscount.toFixed(2)} in savings!` : ''}`,
        action: {
          label: "View Order",
          onClick: () => window.location.href = `/Order/${orderResponse.id}`
        }
      });

      // Clear applied coupons after successful checkout
      setAppliedCoupons([]);
      setShowAdditionalCouponInput(false);

      // Redirect to orders page
      setTimeout(() => {
        window.location.href = '/Order';
      }, 2000);

    } catch (error) {
      console.error('Checkout failed:', error);
      
      if (error instanceof Error) {
        // Parse specific error messages for better user feedback
        let errorMessage = error.message;
        
        if (error.message.includes('UUID')) {
          errorMessage = 'Cart ID format error. Please try again.';
        } else if (error.message.includes('400')) {
          errorMessage = 'Invalid request data. Please check your cart and try again.';
        } else if (error.message.includes('401')) {
          errorMessage = 'Authentication required. Please sign in and try again.';
        } else if (error.message.includes('404')) {
          errorMessage = 'Order service not available. Please try again later.';
        }
        
        toast.error("Checkout failed", {
          description: errorMessage,
        });
      } else {
        toast.error("Checkout failed", {
          description: "Please try again later",
        });
      }
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Combine loading states
  const isProcessing = isUpdating || isCheckingOut;

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
                disabled={isProcessing}
                className="text-destructive hover:text-destructive"
              >
                {isProcessing ? (
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
                              isProcessing && "opacity-50 pointer-events-none"
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
                                    disabled={isProcessing}
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
                                      disabled={(item.quantity || 0) <= 1 || isProcessing}
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
                                      disabled={isProcessing}
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
                                      disabled={isProcessing}
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
                  {/* Coupon Input Section */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Coupon Code</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter coupon code"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleApplyCoupon()}
                        disabled={isApplyingCoupon}
                        className="flex-1"
                      />
                      <Button 
                        onClick={() => handleApplyCoupon()}
                        disabled={isApplyingCoupon || !couponInput.trim()}
                        size="sm"
                      >
                        {isApplyingCoupon ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Apply'
                        )}
                      </Button>
                    </div>

                    {/* Applied Coupons */}
                    {appliedCoupons.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-sm font-medium text-green-600">Applied Coupons:</span>
                        {appliedCoupons.map((coupon) => (
                          <div key={coupon.code} className="flex items-center justify-between p-2 bg-green-50 rounded-md border border-green-200">
                            <div className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-green-600" />
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-green-700">{coupon.code}</span>
                                <span className="text-xs text-green-600">{coupon.description}</span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveCoupon(coupon.code)}
                              className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Additional Coupon Input */}
                    {showAdditionalCouponInput && (
                      <div className="space-y-2 pt-2 border-t">
                        <span className="text-sm text-muted-foreground">Add another coupon:</span>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter another coupon"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && e.target.value.trim()) {
                                handleApplyCoupon(e.target.value);
                                e.target.value = '';
                              }
                            }}
                            disabled={isApplyingCoupon}
                            className="flex-1"
                          />
                          <Button 
                            onClick={(e) => {
                              const input = e.target.parentElement.querySelector('input');
                              if (input.value.trim()) {
                                handleApplyCoupon(input.value);
                                input.value = '';
                              }
                            }}
                            disabled={isApplyingCoupon}
                            size="sm"
                          >
                            Apply
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Price Breakdown */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal ({totalItems} items)</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    
                    {/* Coupon Discounts */}
                    {totalDiscount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Coupon Savings</span>
                        <span>-${totalDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="text-green-600">
                        {shipping === 0 ? 'Free' : `${shipping.toFixed(2)}`}
                        {freeShipping && (
                          <span className="text-xs text-green-600 ml-1">(Coupon Applied)</span>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <div className="text-right">
                        <span>${finalTotal.toFixed(2)}</span>
                        {totalDiscount > 0 && (
                          <div className="text-xs text-green-600">
                            You saved ${totalDiscount.toFixed(2)}!
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleCheckout}
                    disabled={isProcessing || !isOnline}
                  >
                    {isCheckingOut ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing Checkout...
                      </>
                    ) : isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : !isOnline ? (
                      'No Internet Connection'
                    ) : !isAuthenticated ? (
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