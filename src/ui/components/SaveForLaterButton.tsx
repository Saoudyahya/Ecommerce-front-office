// src/components/SaveForLaterButton.tsx

"use client";

import { Heart, Loader2 } from "lucide-react";
import * as React from "react";

import { cn } from "~/lib/cn";
import { savedForLaterService, type SavedProduct } from "~/service/Saved4Later";
import { Button } from "~/ui/primitives/button";
import { toast } from "sonner";

interface SaveForLaterButtonProps {
  product: SavedProduct;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  showText?: boolean;
}

export function SaveForLaterButton({ 
  product, 
  className,
  variant = "outline",
  size = "default",
  showText = true
}: SaveForLaterButtonProps) {
  const [isSaved, setIsSaved] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  // Check if item is already saved on mount
  React.useEffect(() => {
    setIsSaved(savedForLaterService.isItemSaved(product.id));
  }, [product.id]);

  const handleToggleSaved = async () => {
    try {
      setIsLoading(true);

      if (isSaved) {
        // Remove from saved
        savedForLaterService.removeItem(product.id);
        setIsSaved(false);
        
        toast.success("Removed from saved", {
          description: `${product.name} has been removed from your saved items`,
        });
      } else {
        // Add to saved
        savedForLaterService.addItem(product);
        setIsSaved(true);
        
        toast.success("Saved for later", {
          description: `${product.name} has been added to your saved items`,
        });
      }
    } catch (error) {
      console.error('Error toggling saved status:', error);
      toast.error("Error", {
        description: "Failed to update saved status",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={isSaved ? "default" : variant}
      size={size}
      onClick={handleToggleSaved}
      disabled={isLoading}
      className={cn(
        "transition-all duration-200",
        isSaved && "bg-red-500 hover:bg-red-600 text-white border-red-500",
        className
      )}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Heart 
          className={cn(
            "h-4 w-4",
            isSaved && "fill-current"
          )} 
        />
      )}
      {showText && (
        <span className="ml-2">
          {isSaved ? "Saved" : "Save"}
        </span>
      )}
    </Button>
  );
}

// Hook for managing saved items
export function useSavedItems() {
  const [savedCount, setSavedCount] = React.useState(0);

  const refreshCount = React.useCallback(() => {
    setSavedCount(savedForLaterService.getItemCount());
  }, []);

  React.useEffect(() => {
    refreshCount();
    
    // Listen for storage changes to keep count updated
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'Saved4Later') {
        refreshCount();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also refresh on visibility change (when user switches tabs)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshCount();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshCount]);

  return {
    savedCount,
    refreshCount
  };
}

// Example usage in ProductCard component update:
/*
// In your ProductCard component, add the SaveForLaterButton:

import { SaveForLaterButton } from "./SaveForLaterButton";

// Inside your ProductCard component:
<div className="flex gap-2">
  <Button 
    onClick={() => onAddToCart(product.id)} 
    className="flex-1"
  >
    Add to Cart
  </Button>
  
  <SaveForLaterButton
    product={{
      id: product.id,
      name: product.name,
      price: product.price,
      imagePath: product.images[0] || '/placeholder-product.jpg',
      category: product.category
    }}
    size="icon"
    showText={false}
  />
</div>
*/