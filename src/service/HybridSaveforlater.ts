// src/service/HybridSavedForLater.ts

import { savedForLaterService, type SavedProduct, type LocalStorageItem } from './Saved4Later';

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export interface ServerSavedItem {
  id: string;
  productId: string;
  savedAt: string;
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

class HybridSavedForLaterService {
  private readonly baseURL = 'http://localhost:8099/api/carts'; // Use same cart service URL
  private readonly COOKIE_NAME = 'user-service';
  private readonly queueManager = new SavedItemsQueueManager();
  
  private isAuthenticated = false;
  private userId: string | null = null;
  private syncInProgress = false;
  private operationMode: 'guest' | 'authenticated' = 'guest';

  /* -------------------------------------------------------------------------- */
  /*                             Initialization                                */
  /* -------------------------------------------------------------------------- */

  async initialize(userId?: string): Promise<void> {
    if (userId) {
      this.userId = userId;
      this.isAuthenticated = true;
      this.operationMode = 'authenticated';
      
      // Sync localStorage saved items with server
      await this.syncWithServer();
      
      // Process queued operations
      await this.processQueuedOperations();
    } else {
      this.operationMode = 'guest';
      this.isAuthenticated = false;
    }

    // Set up online/offline event listeners
    this.setupNetworkListeners();
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

    const token = this.getAuthToken() ;
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

    return await response.json();
  }

  /* -------------------------------------------------------------------------- */
  /*                            Saved Items Operations                         */
  /* -------------------------------------------------------------------------- */

  async addItem(product: SavedProduct): Promise<void> {
    if (this.operationMode === 'authenticated' && navigator.onLine) {
      try {
        await this.addItemToServer(product.id);
        return;
      } catch (error) {
        console.warn('Failed to add item to server, using localStorage:', error);
        // Fallback to localStorage and queue operation
        this.queueOperation('add', { productId: product.id });
      }
    } else {
      // Guest mode or offline - use localStorage
      if (this.operationMode === 'authenticated') {
        this.queueOperation('add', { productId: product.id });
      }
    }
    
    // Always update localStorage as well (for offline access)
    savedForLaterService.addItem(product);
  }

  async removeItem(productId: string): Promise<void> {
    if (this.operationMode === 'authenticated' && navigator.onLine) {
      try {
        await this.removeItemFromServer(productId);
      } catch (error) {
        console.warn('Failed to remove item from server, using localStorage:', error);
        this.queueOperation('remove', { productId });
      }
    } else {
      if (this.operationMode === 'authenticated') {
        this.queueOperation('remove', { productId });
      }
    }
    
    // Always update localStorage
    savedForLaterService.removeItem(productId);
  }

  isItemSaved(productId: string): boolean {
    // For now, always check localStorage (could be enhanced to check server cache)
    return savedForLaterService.isItemSaved(productId);
  }

  getItemCount(): number {
    // For guest users or when offline, use localStorage count
    return savedForLaterService.getItemCount();
  }

  async getSavedItems(): Promise<LocalStorageItem[]> {
    if (this.operationMode === 'authenticated' && navigator.onLine) {
      try {
        // Try to get from server and merge with localStorage
        const serverItems = await this.getServerSavedItems();
        
        // For now, return localStorage items (could merge server data here)
        return savedForLaterService.getWhiteList()?.items || [];
      } catch (error) {
        console.warn('Failed to get server saved items, using localStorage:', error);
      }
    }
    
    return savedForLaterService.getWhiteList()?.items || [];
  }

  async clearSavedItems(): Promise<void> {
    if (this.operationMode === 'authenticated' && navigator.onLine) {
      try {
        // Clear server items
        const serverItems = await this.getServerSavedItems();
        await Promise.all(
          serverItems.map(item => this.removeItemFromServer(item.productId))
        );
      } catch (error) {
        console.warn('Failed to clear server saved items:', error);
      }
    }
    
    // Clear localStorage
    savedForLaterService.clearWhiteList();
  }

  /* -------------------------------------------------------------------------- */
  /*                            Server Operations                               */
  /* -------------------------------------------------------------------------- */

  private async addItemToServer(productId: string): Promise<void> {
        console.log('addItemToServer', productId);
        console.log('userId', this.userId);


    const response = await this.makeRequest(
      `${this.baseURL}/${this.userId}/saved`,
      {
        method: 'POST',
        body: JSON.stringify({ productId }),
      }
    );
    console.log('Added item to server saved list:', productId);
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

  async syncWithServer(): Promise<void> {
    if (this.syncInProgress || !this.isAuthenticated || !navigator.onLine) {
      return;
    }

    this.syncInProgress = true;
    try {
      const localItems = savedForLaterService.getWhiteList();
      
      if (localItems && localItems.items.length > 0) {
        console.log(`Syncing ${localItems.items.length} saved items with server...`);
        
        // Add each local item to server
        for (const item of localItems.items) {
          try {
            await this.addItemToServer(item.productId);
            console.log(`Synced saved item: ${item.productId}`);
          } catch (error) {
            console.error(`Failed to sync saved item ${item.productId}:`, error);
          }
        }

        // Clear localStorage after successful sync
        savedForLaterService.clearWhiteList();
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
        await this.addItemToServer(data.productId);
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

  clearLocalStorage(): void {
    savedForLaterService.clearWhiteList();
    this.queueManager.clearOperations();
  }

  /* -------------------------------------------------------------------------- */
  /*                            Debug Methods                                   */
  /* -------------------------------------------------------------------------- */

  debugInfo(): void {
    console.log('=== Hybrid Saved For Later Service Debug ===');
    console.log('Operation Mode:', this.operationMode);
    console.log('Is Authenticated:', this.isAuthenticated);
    console.log('User ID:', this.userId);
    console.log('Is Online:', this.isOnline());
    console.log('Sync In Progress:', this.syncInProgress);
    console.log('Local Saved Items:', savedForLaterService.getWhiteList());
    console.log('Queued Operations:', this.queueManager.getOperations());
    console.log('============================================');
  }
}

/* -------------------------------------------------------------------------- */
/*                            Export Service                                  */
/* -------------------------------------------------------------------------- */

// Export singleton instance
export const hybridSavedForLaterService = new HybridSavedForLaterService();

// Export default for easier imports
export default hybridSavedForLaterService;