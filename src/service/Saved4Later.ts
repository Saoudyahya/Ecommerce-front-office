// src/service/Save4Later.ts

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export interface SavedProduct {
  id: string;
  name: string;
  price: number;
  imagePath: string;
  category?: string;
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

export interface LocalStorageWhiteList {
  items: LocalStorageItem[];
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  sessionId: string;
}

export interface ServerSavedItem {
  id: string;
  productId: string;
  savedAt: string;
  productName?: string;
  productImage?: string;
  price?: number;
  category?: string;
}

export interface SavedItemSyncRequest {
  items: LocalStorageItem[];
  deviceId: string;
  sessionId: string;
}

interface QueuedOperation {
  id: string;
  operation: 'add' | 'remove';
  data: any;
  timestamp: string;
  retryCount: number;
  maxRetries: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

/* -------------------------------------------------------------------------- */
/*                           LocalStorage Manager                             */
/* -------------------------------------------------------------------------- */

class LocalStorageWhiteListManager {
  private readonly SAVED4LATER_KEY = 'Saved4Later';
  private readonly EXPIRY_DAYS = 30;

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

      const parsedData = JSON.parse(stored);
      const whiteList = parsedData as LocalStorageWhiteList;
      
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
    const whiteList = this.getWhiteList() || this.createEmptyWhiteList();
    
    const existingItem = whiteList.items.find(item => item.productId === product.id);
    const now = new Date().toISOString();

    if (existingItem) {
      existingItem.updatedAt = now;
      console.log('Item already in saved list, updated timestamp');
    } else {
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
    const whiteList = this.getWhiteList() || this.createEmptyWhiteList();
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

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private generateSessionId(): string {
    return 'session_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2);
  }

  private clearOldItems(whiteList: LocalStorageWhiteList): void {
    whiteList.items.sort((a, b) => new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime());
    whiteList.items = whiteList.items.slice(-20);
  }
}

/* -------------------------------------------------------------------------- */
/*                           Operation Queue Manager                          */
/* -------------------------------------------------------------------------- */

class SavedItemsQueueManager {
  private readonly QUEUE_KEY = 'saved_items_operation_queue';
  private readonly MAX_RETRIES = 3;

  addOperation(operation: 'add' | 'remove', data: any): void {
    const operations = this.getOperations();
    const queuedOp: QueuedOperation = {
      id: this.generateId(),
      operation,
      data,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      maxRetries: this.MAX_RETRIES
    };
    
    operations.push(queuedOp);
    this.saveOperations(operations);
  }

  getOperations(): QueuedOperation[] {
    try {
      const stored = localStorage.getItem(this.QUEUE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  removeOperation(id: string): void {
    const operations = this.getOperations().filter(op => op.id !== id);
    this.saveOperations(operations);
  }

  markRetry(id: string): void {
    const operations = this.getOperations();
    const operation = operations.find(op => op.id === id);
    if (operation) {
      operation.retryCount++;
      this.saveOperations(operations);
    }
  }

  clearOperations(): void {
    localStorage.removeItem(this.QUEUE_KEY);
  }

  private saveOperations(operations: QueuedOperation[]): void {
    try {
      localStorage.setItem(this.QUEUE_KEY, JSON.stringify(operations));
    } catch (error) {
      console.error('Error saving saved items operation queue:', error);
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

/* -------------------------------------------------------------------------- */
/*                        Hybrid Saved For Later Service                     */
/* -------------------------------------------------------------------------- */

class Save4LaterService {
  private readonly baseURL = 'http://localhost:8099/api/carts';
  private readonly COOKIE_NAME = 'user-service';
  private readonly localStorageManager = new LocalStorageWhiteListManager();
  private readonly queueManager = new SavedItemsQueueManager();
  
  private isAuthenticated = false;
  private userId: string | null = null;
  private syncInProgress = false;
  private operationMode: 'guest' | 'authenticated' = 'guest';
  private syncCompleted = false; // Track if initial sync is done

  /* -------------------------------------------------------------------------- */
  /*                             Initialization                                */
  /* -------------------------------------------------------------------------- */

  async initialize(userId?: string): Promise<void> {
    console.log('Save4Later service initializing with userId:', userId);
    
    if (userId) {
      this.userId = userId;
      this.isAuthenticated = true;
      this.operationMode = 'authenticated';
      
      // Sync localStorage with server and clear localStorage
      await this.syncWithServerAndClear();
      
      // Process queued operations
      await this.processQueuedOperations();
      
      this.syncCompleted = true;
    } else {
      this.operationMode = 'guest';
      this.isAuthenticated = false;
      this.syncCompleted = false;
    }

    this.setupNetworkListeners();
    console.log('Save4Later service initialized. Mode:', this.operationMode);
  }

  /* -------------------------------------------------------------------------- */
  /*                            Authentication                                  */
  /* -------------------------------------------------------------------------- */

  private getAuthToken(): string | null {
    try {
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === this.COOKIE_NAME) {
          return decodeURIComponent(value);
        }
      }
    } catch (error) {
      console.warn('Could not read user-service cookie:', error);
    }
    return null;
  }

  private createHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const token = this.getAuthToken();
    if (token && this.isAuthenticated) {
      headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    }

    return headers;
  }

  /* -------------------------------------------------------------------------- */
  /*                            Network Operations                              */
  /* -------------------------------------------------------------------------- */

  private async makeRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
    const defaultOptions: RequestInit = {
      credentials: 'include',
      headers: {
        ...this.createHeaders(),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, defaultOptions);

    if (response.status === 401) {
      throw new Error('Authentication required. Please sign in.');
    }

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // Use default message if response is not JSON
      }
      throw new Error(errorMessage);
    }

    return (await response.json()) as T;
  }

  /* -------------------------------------------------------------------------- */
  /*                            Main CRUD Operations                            */
  /* -------------------------------------------------------------------------- */

  async addItem(product: SavedProduct): Promise<void> {
    console.log('Adding item:', product.id, 'Mode:', this.operationMode, 'Online:', navigator.onLine);
    
    if (this.operationMode === 'authenticated' && navigator.onLine && this.syncCompleted) {
      // For authenticated users, try server first
      try {
        await this.addItemToServer(product);
        console.log('Item added to server successfully');
        return;
      } catch (error) {
        console.warn('Failed to add item to server, queuing operation:', error);
        this.queueOperation('add', { product });
      }
    } else if (this.operationMode === 'authenticated' && !this.syncCompleted) {
      // If sync not completed yet, use localStorage and queue
      this.localStorageManager.addItem(product);
      return;
    } else if (this.operationMode === 'authenticated') {
      // Authenticated but offline, queue operation
      this.queueOperation('add', { product });
    }
    
    // Guest mode or fallback - use localStorage
    this.localStorageManager.addItem(product);
  }

  async removeItem(productId: string): Promise<void> {
    console.log('Removing item:', productId, 'Mode:', this.operationMode, 'Online:', navigator.onLine);
    
    if (this.operationMode === 'authenticated' && navigator.onLine && this.syncCompleted) {
      // For authenticated users, try server first
      try {
        await this.removeItemFromServer(productId);
        console.log('Item removed from server successfully');
        return;
      } catch (error) {
        console.warn('Failed to remove item from server, queuing operation:', error);
        this.queueOperation('remove', { productId });
      }
    } else if (this.operationMode === 'authenticated' && !this.syncCompleted) {
      // If sync not completed yet, use localStorage
      this.localStorageManager.removeItem(productId);
      return;
    } else if (this.operationMode === 'authenticated') {
      // Authenticated but offline, queue operation
      this.queueOperation('remove', { productId });
    }
    
    // Guest mode or fallback - use localStorage
    this.localStorageManager.removeItem(productId);
  }

  isItemSaved(productId: string): boolean {
    // For guest users or during sync, check localStorage
    if (this.operationMode === 'guest' || !this.syncCompleted) {
      return this.localStorageManager.isItemSaved(productId);
    }
    
    // For authenticated users after sync, this will be handled by the provider's state
    // This method is mainly used for initial checks
    return this.localStorageManager.isItemSaved(productId);
  }

  getItemCount(): number {
    // For guest users or during sync, use localStorage
    if (this.operationMode === 'guest' || !this.syncCompleted) {
      return this.localStorageManager.getItemCount();
    }
    
    // For authenticated users, this will be managed by the provider
    return 0; // Provider will manage the count
  }

  async getSavedItems(): Promise<LocalStorageItem[]> {
    console.log('Getting saved items. Mode:', this.operationMode, 'Sync completed:', this.syncCompleted);
    
    if (this.operationMode === 'authenticated' && navigator.onLine && this.syncCompleted) {
      // For authenticated users after sync, get from server
      try {
        const serverItems = await this.getServerSavedItems();
        
        // Convert server items to LocalStorageItem format
        const convertedItems: LocalStorageItem[] = serverItems.map(item => ({
          id: item.id,
          productId: item.productId,
          imagePath: item.productImage || '',
          productName: item.productName || `Product ${item.productId}`,
          price: item.price || 0,
          category: item.category,
          addedAt: item.savedAt,
          updatedAt: item.savedAt
        }));
        
        console.log('Retrieved', convertedItems.length, 'items from server');
        return convertedItems;
      } catch (error) {
        console.warn('Failed to get server saved items, using localStorage:', error);
        return this.localStorageManager.getWhiteList()?.items || [];
      }
    }
    
    // Guest mode or sync not completed - use localStorage
    const items = this.localStorageManager.getWhiteList()?.items || [];
    console.log('Retrieved', items.length, 'items from localStorage');
    return items;
  }

  async clearSavedItems(): Promise<void> {
    if (this.operationMode === 'authenticated' && navigator.onLine && this.syncCompleted) {
      try {
        // Clear server items
        const serverItems = await this.getServerSavedItems();
        await Promise.all(
          serverItems.map(item => this.removeItemFromServer(item.productId))
        );
        console.log('Cleared all items from server');
      } catch (error) {
        console.warn('Failed to clear server saved items:', error);
      }
    }
    
    // Always clear localStorage as well
    this.localStorageManager.clearWhiteList();
  }

  /* -------------------------------------------------------------------------- */
  /*                            Server Operations                               */
  /* -------------------------------------------------------------------------- */

  private async addItemToServer(product: SavedProduct): Promise<void> {
    const response = await this.makeRequest(
      `${this.baseURL}/${this.userId}/saved`,
      {
        method: 'POST',
        body: JSON.stringify({ 
          productId: product.id,
          productName: product.name,
          productImage: product.imagePath,
          price: product.price,
          category: product.category
        }),
      }
    );
    console.log('Added item to server saved list:', product.id);
  }

  private async removeItemFromServer(productId: string): Promise<void> {
    const response = await this.makeRequest(
      `${this.baseURL}/${this.userId}/saved/${productId}`,
      { method: 'DELETE' }
    );
    console.log('Removed item from server saved list:', productId);
  }

  private async getServerSavedItems(): Promise<ServerSavedItem[]> {
    const response: any = await this.makeRequest(
      `${this.baseURL}/${this.userId}/saved`
    );
    return response.data || [];
  }

  /* -------------------------------------------------------------------------- */
  /*                            Sync Operations                                 */
  /* -------------------------------------------------------------------------- */

  private async syncWithServerAndClear(): Promise<void> {
    if (this.syncInProgress || !this.isAuthenticated || !navigator.onLine) {
      return;
    }

    this.syncInProgress = true;
    try {
      const localItems = this.localStorageManager.getWhiteList();
      
      if (localItems && localItems.items.length > 0) {
        console.log(`Syncing ${localItems.items.length} saved items with server...`);
        
        // Add each local item to server
        for (const item of localItems.items) {
          try {
            const product: SavedProduct = {
              id: item.productId,
              name: item.productName,
              price: item.price,
              imagePath: item.imagePath,
              category: item.category
            };
            
            await this.addItemToServer(product);
            console.log(`Synced saved item: ${item.productId}`);
          } catch (error) {
            console.error(`Failed to sync saved item ${item.productId}:`, error);
          }
        }

        // Clear localStorage after successful sync
        this.localStorageManager.clearWhiteList();
        this.queueManager.clearOperations();
        console.log('Cleared localStorage saved items after sync');
      }
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                            Queue Operations                                */
  /* -------------------------------------------------------------------------- */

  private queueOperation(operation: 'add' | 'remove', data: any): void {
    this.queueManager.addOperation(operation, data);
  }

  private async processQueuedOperations(): Promise<void> {
    if (!this.isAuthenticated || !navigator.onLine) return;

    const operations = this.queueManager.getOperations();
    
    for (const operation of operations) {
      try {
        await this.executeQueuedOperation(operation);
        this.queueManager.removeOperation(operation.id);
      } catch (error) {
        this.queueManager.markRetry(operation.id);
        
        if (operation.retryCount >= operation.maxRetries) {
          console.error(`Saved items operation ${operation.operation} failed after ${operation.maxRetries} retries`);
          this.queueManager.removeOperation(operation.id);
        }
      }
    }
  }

  private async executeQueuedOperation(operation: QueuedOperation): Promise<void> {
    const { operation: opType, data } = operation;
    
    switch (opType) {
      case 'add':
        await this.addItemToServer(data.product);
        break;
      case 'remove':
        await this.removeItemFromServer(data.productId);
        break;
      default:
        console.warn(`Unknown saved items operation type: ${opType}`);
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                            Event Listeners                                */
  /* -------------------------------------------------------------------------- */

  private setupNetworkListeners(): void {
    window.addEventListener('online', async () => {
      console.log('Back online - processing queued saved items operations');
      if (this.isAuthenticated) {
        await this.processQueuedOperations();
      }
    });

    window.addEventListener('offline', () => {
      console.log('Gone offline - saved items operations will be queued');
    });
  }

  /* -------------------------------------------------------------------------- */
  /*                            Utility Methods                                */
  /* -------------------------------------------------------------------------- */

  getCurrentMode(): 'guest' | 'authenticated' {
    return this.operationMode;
  }

  isOnline(): boolean {
    return navigator.onLine;
  }

  isSyncCompleted(): boolean {
    return this.syncCompleted;
  }

  clearLocalStorage(): void {
    this.localStorageManager.clearWhiteList();
    this.queueManager.clearOperations();
  }

  /* -------------------------------------------------------------------------- */
  /*                            Debug Methods                                   */
  /* -------------------------------------------------------------------------- */

  debugInfo(): void {
    console.log('=== Save4Later Service Debug ===');
    console.log('Operation Mode:', this.operationMode);
    console.log('Is Authenticated:', this.isAuthenticated);
    console.log('User ID:', this.userId);
    console.log('Is Online:', this.isOnline());
    console.log('Sync In Progress:', this.syncInProgress);
    console.log('Sync Completed:', this.syncCompleted);
    console.log('Local Saved Items:', this.localStorageManager.getWhiteList());
    console.log('Queued Operations:', this.queueManager.getOperations());
    console.log('================================');
  }
}

/* -------------------------------------------------------------------------- */
/*                            Export Service                                  */
/* -------------------------------------------------------------------------- */

// Export singleton instance
export const save4LaterService = new Save4LaterService();

// Export default for easier imports
export default save4LaterService;