// src/service/Saved4Later.ts

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export interface LocalStorageWhiteList {
  items: LocalStorageItem[];
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  sessionId: string;
}

export interface LocalStorageItem {
  id: string;
  productId: string;
  imagePath: string;
  productName: string;
  price: number;
  category?: string;
  addedAt: string;
  updatedAt: string;
}

export interface SavedProduct {
  id: string;
  name: string;
  price: number;
  imagePath: string;
  category?: string;
}

/* -------------------------------------------------------------------------- */
/*                           LocalStorage Manager                             */
/* -------------------------------------------------------------------------- */

export class LocalStorageWhiteListManager {
  private readonly SAVED4LATER_KEY = 'Saved4Later';
  private readonly EXPIRY_DAYS = 30; // Saved items last longer than cart

  createEmptyWhiteList(): LocalStorageWhiteList {
    const now = new Date();
    return {
      items: [],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + (this.EXPIRY_DAYS * 24 * 60 * 60 * 1000)).toISOString(),
      sessionId: this.generateSessionId()
    };
  }

  getWhiteList(): LocalStorageWhiteList | null {
    try {
      const stored = localStorage.getItem(this.SAVED4LATER_KEY);
      if (!stored) return null;

      const whiteList: LocalStorageWhiteList = JSON.parse(stored);
      
      // Check expiry
      if (new Date() > new Date(whiteList.expiresAt)) {
        this.clearWhiteList();
        return null;
      }

      return whiteList;
    } catch (error) {
      console.error('Error reading localStorage saved items:', error);
      this.clearWhiteList();
      return null;
    }
  }

  saveWhiteList(whiteList: LocalStorageWhiteList): void {
    try {
      whiteList.updatedAt = new Date().toISOString();
      localStorage.setItem(this.SAVED4LATER_KEY, JSON.stringify(whiteList));
    } catch (error) {
      console.error('Error saving saved items to localStorage:', error);
      // Handle storage quota exceeded
      if (error instanceof DOMException && error.code === 22) {
        this.clearOldItems(whiteList);
        try {
          localStorage.setItem(this.SAVED4LATER_KEY, JSON.stringify(whiteList));
        } catch {
          console.error('Still unable to save saved items after cleanup');
        }
      }
    }
  }

  addItem(product: SavedProduct): LocalStorageWhiteList {
    let whiteList = this.getWhiteList() || this.createEmptyWhiteList();
    
    const existingItem = whiteList.items.find(item => item.productId === product.id);
    const now = new Date().toISOString();

    if (existingItem) {
      // Item already exists, just update the timestamp
      existingItem.updatedAt = now;
      console.log('Item already in saved list, updated timestamp');
    } else {
      // Add new item
      whiteList.items.push({
        id: this.generateId(),
        productId: product.id,
        imagePath: product.imagePath,
        productName: product.name,
        price: product.price,
        category: product.category,
        addedAt: now,
        updatedAt: now
      });
      console.log('Item added to saved list');
    }

    this.saveWhiteList(whiteList);
    return whiteList;
  }

  removeItem(productId: string): LocalStorageWhiteList {
    let whiteList = this.getWhiteList() || this.createEmptyWhiteList();
    const itemCount = whiteList.items.length;
    whiteList.items = whiteList.items.filter(item => item.productId !== productId);
    
    if (whiteList.items.length < itemCount) {
      console.log('Item removed from saved list');
    }
    
    this.saveWhiteList(whiteList);
    return whiteList;
  }

  isItemSaved(productId: string): boolean {
    const whiteList = this.getWhiteList();
    if (!whiteList) return false;
    return whiteList.items.some(item => item.productId === productId);
  }

  getItemCount(): number {
    const whiteList = this.getWhiteList();
    return whiteList ? whiteList.items.length : 0;
  }

  clearWhiteList(): void {
    localStorage.removeItem(this.SAVED4LATER_KEY);
    console.log('Saved list cleared');
  }

  // Move item from saved list to cart
  moveToCart(productId: string, onMoveToCart: (product: SavedProduct) => Promise<void>): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const whiteList = this.getWhiteList();
        if (!whiteList) {
          reject(new Error('No saved items found'));
          return;
        }

        const item = whiteList.items.find(item => item.productId === productId);
        if (!item) {
          reject(new Error('Item not found in saved list'));
          return;
        }

        // Convert to SavedProduct format for the callback
        const product: SavedProduct = {
          id: item.productId,
          name: item.productName,
          price: item.price,
          imagePath: item.imagePath,
          category: item.category
        };

        // Call the move to cart function
        await onMoveToCart(product);

        // Remove from saved list after successful move
        this.removeItem(productId);
        
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private generateSessionId(): string {
    return 'session_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2);
  }

  private clearOldItems(whiteList: LocalStorageWhiteList): void {
    // Remove oldest items if storage is full
    whiteList.items.sort((a, b) => new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime());
    whiteList.items = whiteList.items.slice(-20); // Keep only 20 most recent items
  }
}

/* -------------------------------------------------------------------------- */
/*                              Service Instance                              */
/* -------------------------------------------------------------------------- */

// Export singleton instance
export const savedForLaterService = new LocalStorageWhiteListManager();

// Export default for easier imports
export default savedForLaterService;