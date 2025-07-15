// src/components/SaveForLaterButton.tsx

"use client";

import { Heart, Loader2 } from "lucide-react";
import * as React from "react";

import { cn } from "~/lib/cn";
import { hybridSavedForLaterService } from "~/service/HybridSaveforlater";
import { type SavedProduct } from "~/service/Saved4Later";
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

  // Check if item is already saved on mount and when product changes
  React.useEffect(() => {
    setIsSaved(hybridSavedForLaterService.isItemSaved(product.id));
  }, [product.id]);

  const handleToggleSaved = async () => {
    try {
      setIsLoading(true);

      if (isSaved) {
        // Remove from saved
        await hybridSavedForLaterService.removeItem(product.id);
        setIsSaved(false);
        
        toast.success("Removed from saved", {
          description: `${product.name} has been removed from your saved items`,
        });
      } else {
        // Add to saved
        await hybridSavedForLaterService.addItem(product);
        setIsSaved(true);
        
        toast.success("Saved for later", {
          description: `${product.name} has been added to your saved items`,
          action: {
            label: "View Saved",
            onClick: () => window.location.href = '/saved-for-later'
          }
        });
      }

      // Dispatch custom event to update other components
      window.dispatchEvent(new CustomEvent('saved-items-changed'));

    } catch (error) {
      console.error('Error toggling saved status:', error);
      toast.error("Error", {
        description: "Failed to update saved status. Please try again.",
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

// Enhanced hook for managing saved items with hybrid service
export function useSavedItems() {
  const [savedCount, setSavedCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);

  const refreshCount = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const count = hybridSavedForLaterService.getItemCount();
      setSavedCount(count);
    } catch (error) {
      console.error('Error refreshing saved items count:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refreshCount();
    
    // Listen for storage changes to keep count updated
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'Saved4Later') {
        refreshCount();
      }
    };

    // Listen for custom events from SaveForLaterButton
    const handleSavedItemsChange = () => {
      refreshCount();
    };
    
    // Also refresh on visibility change (when user switches tabs)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshCount();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('saved-items-changed', handleSavedItemsChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('saved-items-changed', handleSavedItemsChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshCount]);

  // Function to clear all saved items
  const clearAllSavedItems = React.useCallback(async () => {
    try {
      setIsLoading(true);
      await hybridSavedForLaterService.clearSavedItems();
      await refreshCount();
      
      toast.success("Cleared all saved items", {
        description: "All saved items have been removed",
      });
    } catch (error) {
      console.error('Error clearing saved items:', error);
      toast.error("Error", {
        description: "Failed to clear saved items",
      });
    } finally {
      setIsLoading(false);
    }
  }, [refreshCount]);

  // Function to get all saved items
  const getSavedItems = React.useCallback(async () => {
    try {
      setIsLoading(true);
      return await hybridSavedForLaterService.getSavedItems();
    } catch (error) {
      console.error('Error getting saved items:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Function to sync saved items (useful for debugging or manual sync)
  const syncSavedItems = React.useCallback(async () => {
    try {
      setIsLoading(true);
      // This would only work if user is authenticated
      if (hybridSavedForLaterService.getCurrentMode() === 'authenticated') {
        console.log('Manual sync triggered for saved items');
        // The sync happens automatically, but we can refresh the count
        await refreshCount();
        
        toast.success("Synced", {
          description: "Saved items have been synced",
        });
      } else {
        toast.info("Sync not available", {
          description: "Please sign in to sync saved items",
        });
      }
    } catch (error) {
      console.error('Error syncing saved items:', error);
      toast.error("Sync failed", {
        description: "Failed to sync saved items",
      });
    } finally {
      setIsLoading(false);
    }
  }, [refreshCount]);

  return {
    savedCount,
    isLoading,
    refreshCount,
    clearAllSavedItems,
    getSavedItems,
    syncSavedItems,
    // Utility functions
    getCurrentMode: () => hybridSavedForLaterService.getCurrentMode(),
    isOnline: () => hybridSavedForLaterService.isOnline(),
    debugInfo: () => hybridSavedForLaterService.debugInfo(),
  };
}