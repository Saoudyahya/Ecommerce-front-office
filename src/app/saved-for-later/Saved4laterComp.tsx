"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Heart, Loader2, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";

import { cn } from "~/lib/cn";
import { useCart } from "~/lib/hooks/use-cart";
import { savedForLaterService, type LocalStorageItem, type SavedProduct } from "~/service/Saved4Later";
import { Badge } from "~/ui/primitives/badge";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/ui/primitives/card";
import { Alert, AlertDescription } from "~/ui/primitives/alert";
import { toast } from "sonner";
import { Product_Service_URL } from "~/lib/apiEndPoints";

const getImageUrl = (imagePath: string): string => {
  const serverBaseUrl = Product_Service_URL.replace('/api/products', '');
  
  if (imagePath.startsWith('/api/')) {
    return `${serverBaseUrl}${imagePath}`;
  }
  
  return imagePath;
};

function SavedForLaterPageComponent() {
  const { addItem, isGuest, isOnline } = useCart();
  
  // State for saved items
  const [savedItems, setSavedItems] = React.useState<LocalStorageItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isUpdating, setIsUpdating] = React.useState(false);

  // Load saved items on mount
  React.useEffect(() => {
    loadSavedItems();
  }, []);

  const loadSavedItems = () => {
    try {
      setIsLoading(true);
      const whiteList = savedForLaterService.getWhiteList();
      setSavedItems(whiteList?.items || []);
    } catch (error) {
      console.error('Error loading saved items:', error);
      setSavedItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromSaved = async (productId: string) => {
    try {
      setIsUpdating(true);
      savedForLaterService.removeItem(productId);
      loadSavedItems(); // Refresh the list
      
      toast.success("Item removed", {
        description: "Item removed from your saved list",
      });
    } catch (error) {
      console.error('Error removing item from saved list:', error);
      toast.error("Error", {
        description: "Failed to remove item from saved list",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const moveToCart = async (item: LocalStorageItem) => {
    try {
      setIsUpdating(true);
      
      // Add to cart using the cart hook
      await addItem({
        id: item.productId,
        name: item.productName,
        price: item.price,
        image: item.imagePath,
        category: item.category || "Unknown"
      }, 1);

      // Remove from saved list
      savedForLaterService.removeItem(item.productId);
      loadSavedItems(); // Refresh the list
      
      toast.success("Moved to cart", {
        description: `${item.productName} has been added to your cart`,
      });
    } catch (error) {
      console.error('Error moving item to cart:', error);
      toast.error("Error", {
        description: "Failed to move item to cart",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const clearAllSaved = async () => {
    try {
      setIsUpdating(true);
      savedForLaterService.clearWhiteList();
      loadSavedItems(); // Refresh the list
      
      toast.success("Cleared", {
        description: "All saved items have been removed",
      });
    } catch (error) {
      console.error('Error clearing saved items:', error);
      toast.error("Error", {
        description: "Failed to clear saved items",
      });
    } finally {
      setIsUpdating(false);
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
                {savedItems.length === 0 
                  ? "You haven't saved any items yet" 
                  : `${savedItems.length} item${savedItems.length !== 1 ? 's' : ''} saved for later`
                }
              </p>
            </div>
            
            {savedItems.length > 0 && (
              <Button
                variant="outline"
                onClick={clearAllSaved}
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
            )}
          </div>
        </div>

        {/* Status alerts */}
        {!isOnline && (
          <div className="mb-6">
            <Alert>
              <AlertDescription>
                You're offline. Your saved items are stored locally and will be available when you're back online.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {savedItems.length === 0 ? (
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
                          src={getImageUrl(item.imagePath)}
                          alt={item.productName}
                          fill
                          className="object-cover transition-transform hover:scale-105"
                        />
                        
                        {/* Remove button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/80 hover:bg-white"
                          onClick={() => removeFromSaved(item.productId)}
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
                              {item.productName}
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
                              onClick={() => moveToCart(item)}
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
                              onClick={() => removeFromSaved(item.productId)}
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
        {savedItems.length > 0 && (
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
                  onClick={() => {
                    // Move all to cart
                    savedItems.forEach(item => moveToCart(item));
                  }}
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
              <p>💾 Your saved items are stored locally on this device</p>
              <p>⏰ Items are automatically removed after 30 days</p>
              <p>🔄 Easily move saved items to your cart when you're ready to buy</p>
              {isGuest && (
                <p className="text-amber-600">
                  🔐 Sign in to sync saved items across all your devices
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