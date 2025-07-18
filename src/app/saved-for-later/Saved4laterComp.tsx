"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Heart, Loader2, Plus, ShoppingCart, Trash2, X, Wifi, WifiOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";

import { cn } from "~/lib/cn";
import { useCart } from "~/lib/hooks/use-cart";
import { useSave4Later } from "~/lib/hooks/use-saved4later";
import { Badge } from "~/ui/primitives/badge";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/ui/primitives/card";
import { Alert, AlertDescription } from "~/ui/primitives/alert";
import { Product_Service_URL } from "~/lib/apiEndPoints";
import { useAuth } from "~/lib/hooks/usrAuth";

const getImageUrl = (imagePath: string): string => {
  const serverBaseUrl = Product_Service_URL.replace('/api/products', '');
  
  if (imagePath.startsWith('/api/')) {
    return `${serverBaseUrl}${imagePath}`;
  }
  
  return imagePath;
};

function SavedForLaterPageComponent() {
  const { addItem: addToCart,
    //  isGuest
     } = useCart();
  const { isAuthenticated } = useAuth();
  
  // Use the new Save4Later hook - exactly like cart system
  const {
    savedItems,
    itemCount,
    removeItem,
    clearSavedItems,
    moveToCart,
    isLoading,
    isUpdating,
    isOnline,
    savedMode,
    // syncStatus,
    refreshSavedItems
  } = useSave4Later();

  const handleMoveToCart = async (productId: string) => {
    await moveToCart(productId, async (product) => {
      // Add to cart using the cart hook
      await addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.imagePath,
        category: product.category || "Unknown"
      }, 1);
    });
  };

  const moveAllToCart = async () => {
    if (savedItems.length === 0) return;

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const item of savedItems) {
        try {
          await handleMoveToCart(item.productId);
          successCount++;
        } catch (error) {
          console.error(`Failed to move item ${item.productId} to cart:`, error);
          errorCount++;
        }
      }

      // Note: Toast notifications are handled by the hooks
    } catch (error) {
      console.error('Error moving all items to cart:', error);
    }
  };

  // Debug function - only show in development
  const handleDebug = () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('=== Save4Later Debug Info ===');
      console.log('Saved Mode:', savedMode);
      console.log('Is Online:', isOnline);
      console.log('Item Count:', itemCount);
      console.log('Saved Items:', savedItems);
      console.log('============================');
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
                Loading your saved items...
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
                  Saved for Later
                </h1>
                <Heart className="h-8 w-8 text-red-500" />
              </div>
              
              <p className="text-muted-foreground">
                {itemCount === 0 
                  ? "You haven't saved any items yet" 
                  : `${itemCount} item${itemCount !== 1 ? 's' : ''} saved for later`
                }
              </p>

              {/* Status indicators */}
              <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  {isOnline ? (
                    <Wifi className="h-3 w-3 text-green-600" />
                  ) : (
                    <WifiOff className="h-3 w-3 text-amber-600" />
                  )}
                  {isOnline ? 'Online' : 'Offline'}
                </div>
                
                <div className="flex items-center gap-1">
                  <div className={cn(
                    "h-2 w-2 rounded-full",
                    savedMode === 'authenticated' ? "bg-green-500" : "bg-blue-500"
                  )} />
                  {savedMode === 'authenticated' ? 'Synced' : 'Local storage'}
                </div>

                {process.env.NODE_ENV === 'development' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDebug}
                    className="h-6 px-2 text-xs"
                  >
                    Debug Info
                  </Button>
                )}
              </div>
            </div>
            
            {itemCount > 0 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={refreshSavedItems}
                  disabled={isUpdating}
                  size="sm"
                >
                  {isUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    'Refresh'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={clearSavedItems}
                  disabled={isUpdating}
                  className="text-destructive hover:text-destructive"
                >
                  {isUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Clear All
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Status alerts */}
        {!isOnline && (
          <div className="mb-6">
            <Alert>
              <WifiOff className="h-4 w-4" />
              <AlertDescription>
                You're offline. Your saved items are stored locally and will sync when you're back online.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {savedMode === 'guest' && !isAuthenticated && (
          <div className="mb-6">
            <Alert>
              <Heart className="h-4 w-4" />
              <AlertDescription>
                You're browsing as a guest. <Link href="/auth/sign-in" className="underline hover:no-underline">Sign in</Link> to sync your saved items across devices.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {itemCount === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="mb-8 flex h-32 w-32 items-center justify-center rounded-full bg-muted mx-auto">
              <Heart className="h-16 w-16 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-semibold mb-4">No saved items yet</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Start browsing products and save the ones you like for later. 
              They'll be stored safely here for you to come back to.
            </p>
            <Link href="/products">
              <Button size="lg">
                Browse Products
              </Button>
            </Link>
          </motion.div>
        ) : (
          /* Saved Items Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {savedItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <Card className={cn(
                    "overflow-hidden transition-all hover:shadow-lg",
                    isUpdating && "opacity-50 pointer-events-none"
                  )}>
                    <div className="relative">
                      {/* Product Image */}
                      <div className="relative aspect-square overflow-hidden">
                        <Image
                          src={getImageUrl(item.image || '')}
                          alt={item.name}
                          fill
                          className="object-cover transition-transform hover:scale-105"
                        />
                        
                        {/* Remove button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/80 hover:bg-white"
                          onClick={() => removeItem(item.productId)}
                          disabled={isUpdating}
                        >
                          <X className="h-4 w-4" />
                        </Button>

                        {/* Saved badge */}
                        <Badge 
                          variant="secondary"
                          className="absolute top-2 left-2 bg-red-100 text-red-800 border-red-200"
                        >
                          <Heart className="h-3 w-3 mr-1 fill-current" />
                          Saved
                        </Badge>
                      </div>

                      {/* Product Info */}
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div>
                            <Link 
                              href={`/products/${item.productId}`}
                              className="font-medium hover:text-primary line-clamp-2 text-sm"
                            >
                              {item.name}
                            </Link>
                            {item.category && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {item.category}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-lg font-semibold">
                                ${item.price.toFixed(2)}
                              </span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              Saved {new Date(item.addedAt).toLocaleDateString()}
                            </Badge>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleMoveToCart(item.productId)}
                              disabled={isUpdating}
                              className="flex-1"
                              size="sm"
                            >
                              {isUpdating ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <Plus className="h-4 w-4 mr-2" />
                              )}
                              Add to Cart
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeItem(item.productId)}
                              disabled={isUpdating}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Quick Actions Bar - shown when items exist */}
        {itemCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-6 bg-muted/50 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium mb-1">Quick Actions</h3>
                <p className="text-sm text-muted-foreground">
                  Manage all your saved items at once
                </p>
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={moveAllToCart}
                  disabled={isUpdating}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add All to Cart
                </Button>
                
                <Link href="/products">
                  <Button variant="default">
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* Info Section */}
        <div className="mt-12 text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                About Saved Items
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>💾 Your saved items are stored {savedMode === 'authenticated' ? 'in your account and' : ''} locally on this device</p>
              <p>⏰ Items are automatically removed after 30 days</p>
              <p>🔄 Easily move saved items to your cart when you're ready to buy</p>
              {savedMode === 'guest' && (
                <p className="text-amber-600">
                  🔐 <Link href="/auth/sign-in" className="underline hover:no-underline">Sign in</Link> to sync saved items across all your devices
                </p>
              )}
              {!isOnline && (
                <p className="text-amber-600">
                  📶 You're offline - changes will sync when connection is restored
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function SavedForLaterPage() {
  return <SavedForLaterPageComponent />;
}