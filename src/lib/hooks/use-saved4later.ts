import * as React from "react";
import { toast } from "sonner";
import { save4LaterService, type SavedProduct, type LocalStorageItem } from "~/service/Saved4Later";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export interface SavedItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  image?: string;
  category?: string;
  addedAt: string;
  updatedAt: string;
}

export interface Save4LaterContextType {
  addItem: (product: SavedProduct) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  isItemSaved: (productId: string) => boolean;
  savedItems: SavedItem[];
  itemCount: number;
  clearSavedItems: () => Promise<void>;
  moveToCart: (productId: string, onMoveToCart: (product: SavedProduct) => Promise<void>) => Promise<void>;
  isGuest: boolean;
  userId: string | null;
  isLoading: boolean;
  isUpdating: boolean;
  isOnline: boolean;
  savedMode: 'guest' | 'authenticated';
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  refreshSavedItems: () => Promise<void>;
}

/* -------------------------------------------------------------------------- */
/*                                Context                                     */
/* -------------------------------------------------------------------------- */

const Save4LaterContext = React.createContext<Save4LaterContextType | undefined>(undefined);

/* -------------------------------------------------------------------------- */
/*                               Provider                                     */
/* -------------------------------------------------------------------------- */

interface Save4LaterProviderProps {
  children: React.ReactNode;
  userId?: string | null;
}

export function Save4LaterProvider({ children, userId: authUserId }: Save4LaterProviderProps) {
  const [savedItems, setSavedItems] = React.useState<SavedItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [isOnline, setIsOnline] = React.useState(true);
  const [syncStatus, setSyncStatus] = React.useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  
  const isGuest = !authUserId;
  const savedMode = save4LaterService.getCurrentMode();

  // Monitor online/offline status
  React.useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('Back online - saved items will sync automatically');
    };
    const handleOffline = () => {
      setIsOnline(false);
      console.log('Gone offline - saved items operations will use localStorage');
    };

    setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize save4later service
  React.useEffect(() => {
    const initializeService = async () => {
      try {
        setIsLoading(true);
        setSyncStatus('syncing');
        
        console.log('Initializing Save4Later service with userId:', authUserId);
        
        if (authUserId) {
          // Get local count before sync for user feedback
          const localCount = save4LaterService.getItemCount();
          
          if (localCount > 0) {
            toast.info("Syncing saved items", {
              description: `Syncing ${localCount} saved items to your account...`,
            });
          }
          
          // Initialize service (this will sync and clear localStorage)
          await save4LaterService.initialize(authUserId);
          
          if (localCount > 0) {
            toast.success("Saved items synced", {
              description: `${localCount} items synced to your account`,
            });
          }
          
          setSyncStatus('synced');
          console.log('Save4Later service initialized for authenticated user');
        } else {
          // Guest mode
          await save4LaterService.initialize();
          setSyncStatus('idle');
          console.log('Save4Later service initialized for guest user');
        }
        
        // Load saved items after initialization
        await loadSavedItems();
        
      } catch (error) {
        console.error('Failed to initialize save4later service:', error);
        setSyncStatus('error');
        toast.error("Sync error", {
          description: "Failed to sync saved items. They're still available locally.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializeService();
  }, [authUserId]);

  // Load saved items
  const loadSavedItems = React.useCallback(async () => {
    try {
      console.log('Loading saved items...');
      const savedData = await save4LaterService.getSavedItems();
      
      if (!savedData) {
        console.log('No saved items found');
        setSavedItems([]);
        return;
      }

      // Convert LocalStorageItem[] to SavedItem[]
      const convertedItems: SavedItem[] = savedData.map((item: LocalStorageItem) => ({
        id: item.id,
        productId: item.productId,
        name: item.productName,
        price: item.price,
        image: item.imagePath,
        category: item.category,
        addedAt: item.addedAt,
        updatedAt: item.updatedAt
      }));
      
      console.log('Loaded', convertedItems.length, 'saved items');
      setSavedItems(convertedItems);
    } catch (error) {
      console.error('Failed to load saved items:', error);
      setSavedItems([]);
    }
  }, []);

  // Listen for localStorage changes (for guest mode)
  React.useEffect(() => {
    if (isGuest) {
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'Saved4Later') {
          console.log('localStorage changed, reloading saved items');
          loadSavedItems();
        }
      };
      
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, [isGuest, loadSavedItems]);

  /* ----------------------------- Actions -------------------------------- */
  const addItem = React.useCallback(
    async (product: SavedProduct) => {
      setIsUpdating(true);
      try {
        console.log('Adding item to saved list:', product.id);

        await save4LaterService.addItem(product);
        
        // Reload items to get updated state
        await loadSavedItems();

        toast.success("Success", {
          description: `${product.name} saved for later!`,
        });
      } catch (error) {
        console.error('Failed to add item to saved list:', error);
        toast.error("Error", {
          description: "Failed to save item for later. Please try again.",
        });
      } finally {
        setIsUpdating(false);
      }
    },
    [loadSavedItems],
  );

  const removeItem = React.useCallback(async (productId: string) => {
    setIsUpdating(true);
    try {
      console.log('Removing item from saved list:', productId);
      
      await save4LaterService.removeItem(productId);
      
      // Reload items to get updated state
      await loadSavedItems();
      
      toast.success("Success", {
        description: "Item removed from saved list",
      });
    } catch (error) {
      console.error('Failed to remove item from saved list:', error);
      toast.error("Error", {
        description: "Failed to remove item. Please try again.",
      });
    } finally {
      setIsUpdating(false);
    }
  }, [loadSavedItems]);

  const clearSavedItems = React.useCallback(async () => {
    if (savedItems.length === 0) return;
    
    setIsUpdating(true);
    try {
      await save4LaterService.clearSavedItems();
      
      // Reload items to get updated state
      await loadSavedItems();
      
      toast.success("Success", {
        description: "Saved list cleared successfully",
      });
    } catch (error) {
      console.error('Failed to clear saved list:', error);
      toast.error("Error", {
        description: "Failed to clear saved list. Please try again.",
      });
    } finally {
      setIsUpdating(false);
    }
  }, [savedItems.length, loadSavedItems]);

  const moveToCart = React.useCallback(
    async (productId: string, onMoveToCart: (product: SavedProduct) => Promise<void>) => {
      setIsUpdating(true);
      try {
        // Find the item to move
        const itemToMove = savedItems.find(item => item.productId === productId);
        if (!itemToMove) {
          throw new Error('Item not found in saved list');
        }

        const product: SavedProduct = {
          id: itemToMove.productId,
          name: itemToMove.name,
          price: itemToMove.price,
          imagePath: itemToMove.image || '',
          category: itemToMove.category
        };

        // Call the provided callback to add to cart
        await onMoveToCart(product);
        
        // Remove from saved items
        await save4LaterService.removeItem(productId);
        
        // Reload items to get updated state
        await loadSavedItems();
        
        toast.success("Success", {
          description: "Item moved to cart",
        });
      } catch (error) {
        console.error('Failed to move item to cart:', error);
        toast.error("Error", {
          description: "Failed to move item to cart. Please try again.",
        });
      } finally {
        setIsUpdating(false);
      }
    },
    [savedItems, loadSavedItems]
  );

  const isItemSaved = React.useCallback((productId: string): boolean => {
    // Check current state first (most accurate for UI)
    const isInState = savedItems.some(item => item.productId === productId);
    
    // For guest mode or when not synced yet, also check service
    if (isGuest || !save4LaterService.isSyncCompleted()) {
      return isInState || save4LaterService.isItemSaved(productId);
    }
    
    return isInState;
  }, [savedItems, isGuest]);

  /* ----------------------------- Derived data --------------------------- */
  const itemCount = React.useMemo(() => savedItems.length, [savedItems]);

  /* ----------------------------- Context value -------------------------- */
  const value = React.useMemo<Save4LaterContextType>(
    () => ({
      addItem,
      removeItem,
      isItemSaved,
      savedItems,
      itemCount,
      clearSavedItems,
      moveToCart,
      isGuest,
      userId: authUserId ?? null,
      isLoading,
      isUpdating,
      isOnline,
      savedMode,
      syncStatus,
      refreshSavedItems: loadSavedItems,
    }),
    [
      addItem,
      removeItem,
      isItemSaved,
      savedItems,
      itemCount,
      clearSavedItems,
      moveToCart,
      isGuest,
      authUserId,
      isLoading,
      isUpdating,
      isOnline,
      savedMode,
      syncStatus,
      loadSavedItems,
    ],
  );

  return React.createElement(Save4LaterContext.Provider, { value }, children);
}

/* -------------------------------------------------------------------------- */
/*                                 Hook                                      */
/* -------------------------------------------------------------------------- */

export function useSave4Later(): Save4LaterContextType {
  const ctx = React.useContext(Save4LaterContext);
  if (!ctx) throw new Error("useSave4Later must be used within a Save4LaterProvider");
  return ctx;
}

/* -------------------------------------------------------------------------- */
/*                            Helper Functions                                */
/* -------------------------------------------------------------------------- */

// Helper function to migrate saved items when user signs in
export const useSave4LaterMigration = () => {
  const migrateSavedItems = React.useCallback(async (newUserId: string) => {
    try {
      // The service handles this automatically during initialization
      await save4LaterService.initialize(newUserId);
      console.log('Saved items migration completed for user:', newUserId);
    } catch (error) {
      console.error('Failed to migrate saved items:', error);
    }
  }, []);

  return { migrateSavedItems };
};