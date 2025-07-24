// service/tracking.service.ts
import { ShippingStatus } from "./shipping";

export enum TrackingStatus {
  ORDER_RECEIVED = 'ORDER_RECEIVED',
  PROCESSING = 'PROCESSING', 
  SHIPPED = 'SHIPPED',
  IN_TRANSIT = 'IN_TRANSIT',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  DELIVERY_FAILED = 'DELIVERY_FAILED',
  RETURNED = 'RETURNED',
  EXCEPTION = 'EXCEPTION'
}

export interface ShipmentTracking {
  id: string;
  shippingId: string;
  status: string;
  location: string;
  timestamp: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
  deviceId?: string;
  driverId?: string;
}

export interface TrackingEvent {
  status: TrackingStatus;
  location: string;
  timestamp: string;
  notes?: string;
  isActive: boolean;
  isComplete: boolean;
  duration: number; // in minutes
}

export interface TrackingTimeline {
  shippingId: string;
  timeline: TrackingEvent[];
  totalTransitTime: number;
  estimatedDelivery?: string;
  lastUpdate: string;
}

export interface TrackingSubscription {
  shippingId: string;
  callback: (tracking: ShipmentTracking) => void;
}

class TrackingService {
  private readonly baseURL = 'http://localhost:8099/api';
  private subscriptions = new Map<string, TrackingSubscription>();
  private mockIntervals = new Map<string, NodeJS.Timeout>();

  /**
   * Get authentication token from cookies
   */
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const cookies = document.cookie.split(';');
      let token = null;
      
      for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'user-service' || name === 'jwt' || name === 'authToken') {
          token = value;
          break;
        }
      }
      
      return token;
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return null;
    }
  }

  /**
   * Get authenticated headers for requests
   */
  private getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Generic request method with error handling
   */
  private async makeRequest<T>(url: string, options: RequestInit): Promise<T> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: this.getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      const result = await response.json();
      
      // Handle APIResponse wrapper
      if (result.success !== undefined) {
        if (!result.success) {
          throw new Error(result.error || 'Request failed');
        }
        return result.data || result;
      }

      return result;
    } catch (error) {
      console.error(`Request failed for ${url}:`, error);
      throw error;
    }
  }

  /**
   * Get tracking history for a shipping ID
   */
  async getTrackingHistory(shippingId: string): Promise<ShipmentTracking[]> {
    try {
      return await this.makeRequest<ShipmentTracking[]>(
        `${this.baseURL}/shipping/tracking/shipping/${shippingId}`,
        { method: 'GET' }
      );
    } catch (error) {
      console.error('Failed to get tracking history:', error);
      // Return mock data if API fails
      return this.generateMockTrackingHistory(shippingId);
    }
  }

  /**
   * Get tracking timeline with enhanced details
   */
  async getTrackingTimeline(shippingId: string): Promise<TrackingTimeline> {
    try {
      const trackingHistory = await this.getTrackingHistory(shippingId);
      return this.buildTrackingTimeline(shippingId, trackingHistory);
    } catch (error) {
      console.error('Failed to get tracking timeline:', error);
      // Return mock timeline if API fails
      return this.generateMockTimeline(shippingId);
    }
  }

  /**
   * Subscribe to real-time tracking updates
   */
  subscribeToTracking(subscription: TrackingSubscription): () => void {
    this.subscriptions.set(subscription.shippingId, subscription);
    
    // Start mock real-time updates (in a real implementation, this would be WebSocket or EventSource)
    const interval = setInterval(() => {
      this.simulateTrackingUpdate(subscription.shippingId);
    }, 30000); // Update every 30 seconds

    this.mockIntervals.set(subscription.shippingId, interval);

    // Return unsubscribe function
    return () => {
      this.subscriptions.delete(subscription.shippingId);
      const interval = this.mockIntervals.get(subscription.shippingId);
      if (interval) {
        clearInterval(interval);
        this.mockIntervals.delete(subscription.shippingId);
      }
    };
  }

  /**
   * Format tracking status for display
   */
  formatTrackingStatus(status: TrackingStatus): string {
    const statusMap: Record<TrackingStatus, string> = {
      [TrackingStatus.ORDER_RECEIVED]: 'Order Received',
      [TrackingStatus.PROCESSING]: 'Processing',
      [TrackingStatus.SHIPPED]: 'Shipped',
      [TrackingStatus.IN_TRANSIT]: 'In Transit',
      [TrackingStatus.OUT_FOR_DELIVERY]: 'Out for Delivery',
      [TrackingStatus.DELIVERED]: 'Delivered',
      [TrackingStatus.DELIVERY_FAILED]: 'Delivery Failed',
      [TrackingStatus.RETURNED]: 'Returned',
      [TrackingStatus.EXCEPTION]: 'Exception'
    };

    return statusMap[status] || status;
  }

  /**
   * Convert shipping status to tracking status
   */
  private shippingToTrackingStatus(shippingStatus: string): TrackingStatus {
    const statusMap: Record<string, TrackingStatus> = {
      'PENDING': TrackingStatus.ORDER_RECEIVED,
      'CONFIRMED': TrackingStatus.PROCESSING,
      'PICKED_UP': TrackingStatus.SHIPPED,
      'IN_TRANSIT': TrackingStatus.IN_TRANSIT,
      'OUT_FOR_DELIVERY': TrackingStatus.OUT_FOR_DELIVERY,
      'DELIVERED': TrackingStatus.DELIVERED,
      'FAILED_DELIVERY': TrackingStatus.DELIVERY_FAILED,
      'RETURNED': TrackingStatus.RETURNED,
      'CANCELED': TrackingStatus.EXCEPTION
    };

    return statusMap[shippingStatus] || TrackingStatus.PROCESSING;
  }

  /**
   * Build tracking timeline from tracking history
   */
  private buildTrackingTimeline(shippingId: string, trackingHistory: ShipmentTracking[]): TrackingTimeline {
    const sortedHistory = trackingHistory.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const timeline: TrackingEvent[] = [];
    let totalTransitTime = 0;

    for (let i = 0; i < sortedHistory.length; i++) {
      const tracking = sortedHistory[i];
      const trackingStatus = this.shippingToTrackingStatus(tracking.status);
      const timestamp = new Date(tracking.timestamp);
      
      let duration = 0;
      if (i > 0) {
        const prevTimestamp = new Date(sortedHistory[i - 1].timestamp);
        duration = Math.floor((timestamp.getTime() - prevTimestamp.getTime()) / (1000 * 60));
        totalTransitTime += duration;
      }

      const isComplete = i < sortedHistory.length - 1;
      const isActive = i === sortedHistory.length - 1 && 
                      trackingStatus !== TrackingStatus.DELIVERED &&
                      trackingStatus !== TrackingStatus.DELIVERY_FAILED &&
                      trackingStatus !== TrackingStatus.RETURNED;

      timeline.push({
        status: trackingStatus,
        location: tracking.location,
        timestamp: tracking.timestamp,
        notes: tracking.notes,
        isActive,
        isComplete,
        duration
      });
    }

    const lastUpdate = sortedHistory.length > 0 ? 
      sortedHistory[sortedHistory.length - 1].timestamp : 
      new Date().toISOString();

    return {
      shippingId,
      timeline,
      totalTransitTime,
      lastUpdate
    };
  }

  /**
   * Generate mock tracking history for testing
   */
  private generateMockTrackingHistory(shippingId: string): ShipmentTracking[] {
    const now = new Date();
    const mockHistory: ShipmentTracking[] = [
      {
        id: `${shippingId}-1`,
        shippingId,
        status: 'ORDER_RECEIVED',
        location: 'Distribution Center, CA',
        timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        notes: 'Order received and processing'
      },
      {
        id: `${shippingId}-2`,
        shippingId,
        status: 'SHIPPED',
        location: 'Distribution Center, CA',
        timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        notes: 'Package shipped'
      },
      {
        id: `${shippingId}-3`,
        shippingId,
        status: 'IN_TRANSIT',
        location: 'Transit Hub, NV',
        timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        notes: 'In transit to destination'
      },
      {
        id: `${shippingId}-4`,
        shippingId,
        status: 'OUT_FOR_DELIVERY',
        location: 'Local Facility, Your City',
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        notes: 'Out for delivery'
      }
    ];

    return mockHistory;
  }

  /**
   * Generate mock timeline for testing
   */
  private generateMockTimeline(shippingId: string): TrackingTimeline {
    const mockHistory = this.generateMockTrackingHistory(shippingId);
    return this.buildTrackingTimeline(shippingId, mockHistory);
  }

  /**
   * Simulate tracking update for testing
   */
  private simulateTrackingUpdate(shippingId: string): void {
    const subscription = this.subscriptions.get(shippingId);
    if (!subscription) return;

    // Simulate a random tracking update
    const locations = [
      'Transit Hub, Phoenix AZ',
      'Local Facility, Your City',
      'Out for Delivery Vehicle',
      'Customer Address'
    ];

    const statuses = ['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'];
    
    const mockUpdate: ShipmentTracking = {
      id: `${shippingId}-${Date.now()}`,
      shippingId,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      location: locations[Math.floor(Math.random() * locations.length)],
      timestamp: new Date().toISOString(),
      notes: 'Simulated real-time update'
    };

    // Only trigger callback if we're still subscribed
    if (this.subscriptions.has(shippingId)) {
      subscription.callback(mockUpdate);
    }
  }

  /**
   * Get delivery progress percentage
   */
  getDeliveryProgress(status: string): number {
    const progressMap: Record<string, number> = {
      'PENDING': 0,
      'CONFIRMED': 20,
      'PICKED_UP': 40,
      'IN_TRANSIT': 60,
      'OUT_FOR_DELIVERY': 80,
      'DELIVERED': 100,
      'FAILED_DELIVERY': 75,
      'RETURNED': 50,
      'CANCELED': 0
    };

    return progressMap[status] || 0;
  }

  /**
   * Estimate delivery time remaining
   */
  estimateDeliveryTime(timeline: TrackingTimeline): { hours: number; confidence: number } {
    const lastEvent = timeline.timeline[timeline.timeline.length - 1];
    if (!lastEvent) return { hours: 0, confidence: 0 };

    const statusTimeMap: Record<TrackingStatus, number> = {
      [TrackingStatus.ORDER_RECEIVED]: 72,
      [TrackingStatus.PROCESSING]: 48,
      [TrackingStatus.SHIPPED]: 36,
      [TrackingStatus.IN_TRANSIT]: 12,
      [TrackingStatus.OUT_FOR_DELIVERY]: 4,
      [TrackingStatus.DELIVERED]: 0,
      [TrackingStatus.DELIVERY_FAILED]: 24,
      [TrackingStatus.RETURNED]: 48,
      [TrackingStatus.EXCEPTION]: 24
    };

    const estimatedHours = statusTimeMap[lastEvent.status] || 24;
    const confidence = lastEvent.status === TrackingStatus.OUT_FOR_DELIVERY ? 0.9 : 
                      lastEvent.status === TrackingStatus.IN_TRANSIT ? 0.7 : 0.5;

    return { hours: estimatedHours, confidence };
  }

  /**
   * Cleanup all subscriptions
   */
  cleanup(): void {
    this.subscriptions.clear();
    this.mockIntervals.forEach(interval => clearInterval(interval));
    this.mockIntervals.clear();
  }
}

// Export singleton instance
export const trackingService = new TrackingService();
export default trackingService;