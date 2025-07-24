// lib/services/shipping.service.ts - Updated with User Support

import { Shipping_Service_URL } from "~/lib/apiEndPoints";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export enum ShippingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  FAILED_DELIVERY = 'FAILED_DELIVERY',
  RETURNED = 'RETURNED',
  CANCELED = 'CANCELED'
}

export interface Address {
  id: string;
  first_name: string;
  last_name: string;
  company?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
  updated_at: string;
}

export interface LocationUpdate {
  id: string;
  shippingId: string;
  deviceId: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
  timestamp: string;
  createdAt: string;
}

export interface ShipmentTracking {
  id: string;
  shippingId: string;
  status: ShippingStatus;
  location?: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
  deviceId?: string;
  driverId?: string;
  timestamp: string;
  createdAt: string;
}

export interface Shipping {
  id: string;
  orderId: string;
  userId: string; // Added userId field
  carrier: string;
  trackingNumber?: string;
  status: ShippingStatus;
  shippingAddressId: string;
  originAddressId?: string;
  weight?: number;
  dimensions?: string;
  shippingCost?: number;
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
  currentLatitude?: number;
  currentLongitude?: number;
  lastLocationUpdate?: string;
  createdAt: string;
  updatedAt: string;
  shippingAddress?: Address;
  originAddress?: Address;
}

export interface ShippingCost {
  shippingId: string;
  cost: number;
  currency: string;
  breakdown?: {
    baseCost: number;
    weightCost: number;
    distanceCost: number;
    surcharges: number;
  };
}

export interface UserShippingStats {
  total: number;
  inTransit: number;
  delivered: number;
  delayed: number;
  byStatus: Record<string, number>;
}

/* -------------------------------------------------------------------------- */
/*                            Request DTOs                                   */
/* -------------------------------------------------------------------------- */

export interface CreateShippingRequest {
  order_id: string;
  user_id?: string;
  carrier: string;
  shipping_address_id?: string;
  weight?: number;
  dimensions?: string;
}

export interface CreateAddressRequest {
  first_name: string;
  last_name: string;
  company?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
}

export interface CreateShippingWithAddressRequest {
  order_id: string;
  user_id: string;
  carrier: string;
  shipping_address: CreateAddressRequest;
  weight?: number;
  dimensions?: string;
}

export interface UpdateStatusRequest {
  status: ShippingStatus;
  location?: string;
  notes?: string;
}

export interface UpdateStatusWithGPSRequest {
  status: ShippingStatus;
  location?: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
  deviceId?: string;
  driverId?: string;
}

export interface UpdateLocationRequest {
  latitude: number;
  longitude: number;
  deviceId?: string;
}

export interface AddLocationUpdateRequest {
  deviceId: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
}

export interface SearchAddressesRequest {
  first_name?: string;
  last_name?: string;
  city?: string;
  state?: string;
}

/* -------------------------------------------------------------------------- */
/*                           Response DTOs                                   */
/* -------------------------------------------------------------------------- */

export interface TrackingResponse {
  shipping: Shipping;
  trackingHistory: ShipmentTracking[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    limit: number;
    offset: number;
    count: number;
    total?: number;
  };
}

export interface UserShippingsResponse {
  shippings: Shipping[];
  pagination: {
    limit: number;
    offset: number;
    count: number;
  };
  user_id: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface HealthCheckResponse {
  status: string;
  service: string;
  checks: {
    database: string;
    kafka: string;
  };
}

export interface ServiceInfoResponse {
  service: string;
  version: string;
  description: string;
}

/* -------------------------------------------------------------------------- */
/*                             Enriched Types                               */
/* -------------------------------------------------------------------------- */

export interface EnrichedShipping extends Shipping {
  trackingHistory?: ShipmentTracking[];
  locationUpdates?: LocationUpdate[];
  estimatedDeliveryWindow?: {
    earliest: string;
    latest: string;
  };
  deliveryProgress?: {
    percentage: number;
    currentPhase: string;
    nextMilestone: string;
  };
}

export interface BatchShippingRequest {
  shippingIds: string[];
  includeTracking?: boolean;
  includeLocationHistory?: boolean;
}

export interface BatchShippingResponse {
  shippings: EnrichedShipping[];
  failures: Record<string, string>;
  totalRequested: number;
  successful: number;
  failed: number;
  processingTimeMs: number;
}

/* -------------------------------------------------------------------------- */
/*                                  Service                                   */
/* -------------------------------------------------------------------------- */

class ShippingService {
  private readonly baseURL = 'http://localhost:8099/api'; // Gateway URL
  private readonly shippingURL = `${this.baseURL}/shipping`;
  private readonly addressURL = `${this.baseURL}/addresses`;

  /* -------------------------------------------------------------------------- */
  /*                           Authentication Helpers                         */
  /* -------------------------------------------------------------------------- */

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
   * Get request options with authentication
   */
  private getRequestOptions(method: string, body?: any): RequestInit {
    const options: RequestInit = {
      method,
      headers: this.getAuthHeaders(),
      credentials: 'include',
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    return options;
  }

  /**
   * Generic request method with error handling
   */
  private async makeRequest<T>(url: string, options: RequestInit): Promise<T> {
    try {
      const response = await fetch(url, options);

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

  /* -------------------------------------------------------------------------- */
  /*                            User-Specific Operations                       */
  /* -------------------------------------------------------------------------- */

  /**
   * Get all shippings for a specific user
   */
  async getShippingsByUser(userId: string, limit: number = 10, offset: number = 0): Promise<UserShippingsResponse> {
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });

    return this.makeRequest<UserShippingsResponse>(
      `${this.shippingURL}/user/${userId}?${queryParams}`, 
      this.getRequestOptions('GET')
    );
  }

  /**
   * Get shipping statistics for a user
   */
  async getUserShippingStats(userId: string): Promise<UserShippingStats> {
    return this.makeRequest<UserShippingStats>(
      `${this.shippingURL}/user/${userId}/stats`, 
      this.getRequestOptions('GET')
    );
  }

  /**
   * Get user's in-transit shippings
   */
  async getUserShippingsInTransit(userId: string): Promise<Shipping[]> {
    return this.makeRequest<Shipping[]>(
      `${this.shippingURL}/user/${userId}/in-transit`, 
      this.getRequestOptions('GET')
    );
  }

  /**
   * Get user's shippings by status
   */
  async getShippingsByUserAndStatus(
    userId: string, 
    status: ShippingStatus, 
    limit: number = 10, 
    offset: number = 0
  ): Promise<UserShippingsResponse> {
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });

    return this.makeRequest<UserShippingsResponse>(
      `${this.shippingURL}/user/${userId}/status/${status}?${queryParams}`, 
      this.getRequestOptions('GET')
    );
  }

  /**
   * Create shipping for a specific user
   */
  async createShippingForUser(shippingRequest: CreateShippingRequest): Promise<Shipping> {
    console.log('Creating shipping for user:', shippingRequest);
    return this.makeRequest<Shipping>(this.shippingURL, this.getRequestOptions('POST', shippingRequest));
  }

  /**
   * Create shipping with address for a user
   */
  async createShippingWithAddressForUser(shippingRequest: CreateShippingWithAddressRequest): Promise<Shipping> {
    console.log('Creating shipping with address for user:', shippingRequest);
    return this.makeRequest<Shipping>(`${this.shippingURL}/with-address`, this.getRequestOptions('POST', shippingRequest));
  }

  /* -------------------------------------------------------------------------- */
  /*                            Shipping Operations                            */
  /* -------------------------------------------------------------------------- */

  /**
   * Create a new shipping
   */
  async createShipping(shippingRequest: CreateShippingRequest): Promise<Shipping> {
    console.log('Creating shipping:', shippingRequest);
    return this.makeRequest<Shipping>(this.shippingURL, this.getRequestOptions('POST', shippingRequest));
  }

  /**
   * Create shipping with complete address
   */
  async createShippingWithAddress(shippingRequest: CreateShippingWithAddressRequest): Promise<Shipping> {
    console.log('Creating shipping with address:', shippingRequest);
    return this.makeRequest<Shipping>(`${this.shippingURL}/with-address`, this.getRequestOptions('POST', shippingRequest));
  }

  /**
   * Get shipping by ID
   */
  async getShipping(shippingId: string): Promise<Shipping> {
    return this.makeRequest<Shipping>(`${this.shippingURL}/${shippingId}`, this.getRequestOptions('GET'));
  }

  /**
   * Get shipping by order ID
   */
  async getShippingByOrder(orderId: string): Promise<Shipping> {
    return this.makeRequest<Shipping>(`${this.shippingURL}/order/${orderId}`, this.getRequestOptions('GET'));
  }

  /**
   * Get all shippings with pagination
   */
  async getAllShippings(limit: number = 10, offset: number = 0): Promise<PaginatedResponse<Shipping>> {
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });

    return this.makeRequest<PaginatedResponse<Shipping>>(
      `${this.shippingURL}?${queryParams}`, 
      this.getRequestOptions('GET')
    );
  }

  /**
   * Get shippings by status
   */
  async getShippingsByStatus(status: ShippingStatus, limit: number = 10, offset: number = 0): Promise<Shipping[]> {
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });

    return this.makeRequest<Shipping[]>(
      `${this.shippingURL}/status/${status}?${queryParams}`, 
      this.getRequestOptions('GET')
    );
  }

  /**
   * Get in-transit shippings
   */
  async getShippingsInTransit(): Promise<Shipping[]> {
    return this.makeRequest<Shipping[]>(`${this.shippingURL}/in-transit`, this.getRequestOptions('GET'));
  }

  /**
   * Update shipping details
   */
  async updateShipping(shippingId: string, shipping: Partial<Shipping>): Promise<Shipping> {
    return this.makeRequest<Shipping>(`${this.shippingURL}/${shippingId}`, this.getRequestOptions('PUT', shipping));
  }

  /**
   * Update shipping status
   */
  async updateStatus(shippingId: string, statusUpdate: UpdateStatusRequest): Promise<void> {
    await this.makeRequest(`${this.shippingURL}/${shippingId}/status`, this.getRequestOptions('PATCH', statusUpdate));
  }

  /**
   * Update shipping status with GPS coordinates
   */
  async updateStatusWithGPS(shippingId: string, statusUpdate: UpdateStatusWithGPSRequest): Promise<void> {
    await this.makeRequest(`${this.shippingURL}/${shippingId}/status/gps`, this.getRequestOptions('PATCH', statusUpdate));
  }

  /**
   * Update current location
   */
  async updateCurrentLocation(shippingId: string, locationUpdate: UpdateLocationRequest): Promise<void> {
    await this.makeRequest(`${this.shippingURL}/${shippingId}/location`, this.getRequestOptions('PATCH', locationUpdate));
  }

  /**
   * Add location update
   */
  async addLocationUpdate(shippingId: string, locationUpdate: AddLocationUpdateRequest): Promise<void> {
    await this.makeRequest(`${this.shippingURL}/${shippingId}/location-update`, this.getRequestOptions('POST', locationUpdate));
  }

  /**
   * Get location history
   */
  async getLocationHistory(shippingId: string, limit: number = 50): Promise<LocationUpdate[]> {
    const queryParams = new URLSearchParams({
      limit: limit.toString()
    });

    return this.makeRequest<LocationUpdate[]>(
      `${this.shippingURL}/${shippingId}/location-history?${queryParams}`, 
      this.getRequestOptions('GET')
    );
  }

  /**
   * Track order shipment
   */
  async trackOrder(shippingId: string): Promise<TrackingResponse> {
    return this.makeRequest<TrackingResponse>(`${this.shippingURL}/${shippingId}/track`, this.getRequestOptions('GET'));
  }

  /**
   * Get shipping cost
   */
  async getShippingCost(shippingId: string): Promise<ShippingCost> {
    return this.makeRequest<ShippingCost>(`${this.shippingURL}/${shippingId}/cost`, this.getRequestOptions('GET'));
  }

  /* -------------------------------------------------------------------------- */
  /*                            Address Operations                             */
  /* -------------------------------------------------------------------------- */

  /**
   * Create a new address
   */
  async createAddress(addressRequest: CreateAddressRequest): Promise<Address> {
    console.log('Creating address:', addressRequest);
    return this.makeRequest<Address>(this.addressURL, this.getRequestOptions('POST', addressRequest));
  }

  /**
   * Get address by ID
   */
  async getAddress(addressId: string): Promise<Address> {
    return this.makeRequest<Address>(`${this.addressURL}/${addressId}`, this.getRequestOptions('GET'));
  }

  /**
   * Get all addresses with pagination
   */
  async getAllAddresses(limit: number = 10, offset: number = 0): Promise<Address[]> {
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });

    return this.makeRequest<Address[]>(`${this.addressURL}?${queryParams}`, this.getRequestOptions('GET'));
  }

  /**
   * Update address
   */
  async updateAddress(addressId: string, address: Partial<Address>): Promise<Address> {
    return this.makeRequest<Address>(`${this.addressURL}/${addressId}`, this.getRequestOptions('PUT', address));
  }

  /**
   * Delete address
   */
  async deleteAddress(addressId: string): Promise<void> {
    await fetch(`${this.addressURL}/${addressId}`, this.getRequestOptions('DELETE'));
  }

  /**
   * Search addresses
   */
  async searchAddresses(searchParams: SearchAddressesRequest): Promise<Address[]> {
    const queryParams = new URLSearchParams();
    
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value) {
        queryParams.append(key, value);
      }
    });

    return this.makeRequest<Address[]>(`${this.addressURL}/search?${queryParams}`, this.getRequestOptions('GET'));
  }

  /**
   * Get default origin address
   */
  async getDefaultOriginAddress(): Promise<Address> {
    return this.makeRequest<Address>(`${this.addressURL}/default-origin`, this.getRequestOptions('GET'));
  }

  /* -------------------------------------------------------------------------- */
  /*                         Enhanced Operations                               */
  /* -------------------------------------------------------------------------- */

  /**
   * Get enriched shipping with full tracking details
   */
  async getEnrichedShipping(shippingId: string, includeHistory: boolean = true): Promise<EnrichedShipping> {
    const shipping = await this.getShipping(shippingId);
    
    let enrichedShipping: EnrichedShipping = { ...shipping };

    if (includeHistory) {
      try {
        const trackingData = await this.trackOrder(shippingId);
        enrichedShipping.trackingHistory = trackingData.trackingHistory;
        
        const locationUpdates = await this.getLocationHistory(shippingId);
        enrichedShipping.locationUpdates = locationUpdates;

        // Calculate delivery progress
        enrichedShipping.deliveryProgress = this.calculateDeliveryProgress(shipping.status);
        
        // Estimate delivery window
        if (shipping.estimatedDeliveryDate) {
          enrichedShipping.estimatedDeliveryWindow = this.calculateDeliveryWindow(shipping.estimatedDeliveryDate);
        }
      } catch (error) {
        console.warn('Failed to enrich shipping data:', error);
      }
    }

    return enrichedShipping;
  }

  /**
   * Get multiple enriched shippings in batch
   */
  async getEnrichedShippingsBatch(batchRequest: BatchShippingRequest): Promise<BatchShippingResponse> {
    const startTime = Date.now();
    const results: EnrichedShipping[] = [];
    const failures: Record<string, string> = {};

    for (const shippingId of batchRequest.shippingIds) {
      try {
        const enrichedShipping = await this.getEnrichedShipping(
          shippingId, 
          batchRequest.includeTracking || false
        );
        results.push(enrichedShipping);
      } catch (error) {
        failures[shippingId] = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    const processingTimeMs = Date.now() - startTime;

    return {
      shippings: results,
      failures,
      totalRequested: batchRequest.shippingIds.length,
      successful: results.length,
      failed: Object.keys(failures).length,
      processingTimeMs
    };
  }

  /**
   * Get enriched shippings for a user
   */
  async getEnrichedShippingsByUser(userId: string, limit: number = 10, offset: number = 0): Promise<EnrichedShipping[]> {
    const response = await this.getShippingsByUser(userId, limit, offset);
    const enrichedShippings: EnrichedShipping[] = [];

    for (const shipping of response.shippings) {
      try {
        const enriched = await this.getEnrichedShipping(shipping.id, true);
        enrichedShippings.push(enriched);
      } catch (error) {
        console.warn(`Failed to enrich shipping ${shipping.id}:`, error);
        enrichedShippings.push(shipping as EnrichedShipping);
      }
    }

    return enrichedShippings;
  }

  /**
   * Create shipping from order with auto-address resolution
   */
  async createShippingFromOrder(
    orderId: string, 
    userId: string,
    carrier: string, 
    shippingAddressId?: string
  ): Promise<Shipping> {
    try {
      // If no shipping address provided, try to get default
      if (!shippingAddressId) {
        try {
          const defaultAddress = await this.getDefaultOriginAddress();
          shippingAddressId = defaultAddress.id;
        } catch (error) {
          console.warn('No default address found, creating shipping without address');
        }
      }

      const createRequest: CreateShippingRequest = {
        order_id: orderId,
        user_id: userId,
        carrier,
        shipping_address_id: shippingAddressId
      };

      return await this.createShipping(createRequest);
    } catch (error) {
      console.error('Failed to create shipping from order:', error);
      throw error;
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                            Health & Monitoring                           */
  /* -------------------------------------------------------------------------- */

  /**
   * Health check
   */
  async healthCheck(): Promise<HealthCheckResponse> {
    return this.makeRequest<HealthCheckResponse>(`${this.baseURL}/health`, this.getRequestOptions('GET'));
  }

  /**
   * Liveness check
   */
  async livenessCheck(): Promise<{ status: string; check: string }> {
    return this.makeRequest(`${this.baseURL}/health/live`, this.getRequestOptions('GET'));
  }

  /**
   * Readiness check
   */
  async readinessCheck(): Promise<{ status: string; check: string }> {
    return this.makeRequest(`${this.baseURL}/health/ready`, this.getRequestOptions('GET'));
  }

  /**
   * Service info
   */
  async serviceInfo(): Promise<ServiceInfoResponse> {
    return this.makeRequest<ServiceInfoResponse>(`${this.baseURL}/info`, this.getRequestOptions('GET'));
  }

  /* -------------------------------------------------------------------------- */
  /*                            Utility Methods                               */
  /* -------------------------------------------------------------------------- */

  /**
   * Check if shipping can be canceled
   */
  canCancelShipping(shipping: Shipping): boolean {
    const cancellableStatuses = [ShippingStatus.PENDING, ShippingStatus.CONFIRMED];
    return cancellableStatuses.includes(shipping.status);
  }

  /**
   * Check if shipping is trackable
   */
  isTrackable(shipping: Shipping): boolean {
    const trackableStatuses = [
      ShippingStatus.PICKED_UP,
      ShippingStatus.IN_TRANSIT,
      ShippingStatus.OUT_FOR_DELIVERY
    ];
    return trackableStatuses.includes(shipping.status as ShippingStatus) && !!shipping.trackingNumber;
  }

  /**
   * Format shipping status for display
   */
  formatShippingStatus(status: ShippingStatus): string {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase().replace('_', ' ');
  }

  /**
   * Get shipping status color for UI
   */
  getShippingStatusColor(status: ShippingStatus): string {
    const statusColors: Record<ShippingStatus, string> = {
      [ShippingStatus.PENDING]: '#FFA500',
      [ShippingStatus.CONFIRMED]: '#007BFF',
      [ShippingStatus.PICKED_UP]: '#6F42C1',
      [ShippingStatus.IN_TRANSIT]: '#17A2B8',
      [ShippingStatus.OUT_FOR_DELIVERY]: '#20C997',
      [ShippingStatus.DELIVERED]: '#28A745',
      [ShippingStatus.FAILED_DELIVERY]: '#DC3545',
      [ShippingStatus.RETURNED]: '#FFC107',
      [ShippingStatus.CANCELED]: '#6C757D'
    };
    return statusColors[status] || '#6C757D';
  }

  /**
   * Calculate delivery progress percentage
   */
  calculateDeliveryProgress(status: ShippingStatus): {
    percentage: number;
    currentPhase: string;
    nextMilestone: string;
  } {
    const progressMap: Record<ShippingStatus, { percentage: number; phase: string; next: string }> = {
      [ShippingStatus.PENDING]: { percentage: 0, phase: 'Order Processing', next: 'Confirmation' },
      [ShippingStatus.CONFIRMED]: { percentage: 20, phase: 'Confirmed', next: 'Pickup' },
      [ShippingStatus.PICKED_UP]: { percentage: 40, phase: 'Picked Up', next: 'In Transit' },
      [ShippingStatus.IN_TRANSIT]: { percentage: 60, phase: 'In Transit', next: 'Out for Delivery' },
      [ShippingStatus.OUT_FOR_DELIVERY]: { percentage: 80, phase: 'Out for Delivery', next: 'Delivery' },
      [ShippingStatus.DELIVERED]: { percentage: 100, phase: 'Delivered', next: 'Complete' },
      [ShippingStatus.FAILED_DELIVERY]: { percentage: 75, phase: 'Delivery Failed', next: 'Retry' },
      [ShippingStatus.RETURNED]: { percentage: 50, phase: 'Returned', next: 'Processing' },
      [ShippingStatus.CANCELED]: { percentage: 0, phase: 'Canceled', next: 'None' }
    };

    const progress = progressMap[status] || { percentage: 0, phase: 'Unknown', next: 'Unknown' };
    
    return {
      percentage: progress.percentage,
      currentPhase: progress.phase,
      nextMilestone: progress.next
    };
  }

  /**
   * Calculate delivery window from estimated date
   */
  calculateDeliveryWindow(estimatedDate: string): {
    earliest: string;
    latest: string;
  } {
    const estimated = new Date(estimatedDate);
    const earliest = new Date(estimated.getTime() - 24 * 60 * 60 * 1000); // 1 day earlier
    const latest = new Date(estimated.getTime() + 24 * 60 * 60 * 1000); // 1 day later

    return {
      earliest: earliest.toISOString(),
      latest: latest.toISOString()
    };
  }

  /**
   * Calculate distance between two points (in km)
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Estimate delivery time based on distance and shipping method
   */
  estimateDeliveryTime(distance: number, carrier: string): {
    estimatedDays: number;
    deliveryDate: string;
  } {
    // Simple estimation logic - you can make this more sophisticated
    let estimatedDays = 3; // default

    if (carrier.toLowerCase().includes('express')) {
      estimatedDays = Math.max(1, Math.ceil(distance / 500));
    } else if (carrier.toLowerCase().includes('standard')) {
      estimatedDays = Math.max(2, Math.ceil(distance / 300));
    } else if (carrier.toLowerCase().includes('economy')) {
      estimatedDays = Math.max(5, Math.ceil(distance / 200));
    }

    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + estimatedDays);

    return {
      estimatedDays,
      deliveryDate: deliveryDate.toISOString()
    };
  }

  /**
   * Group shippings by status
   */
  groupShippingsByStatus(shippings: Shipping[]): Record<string, Shipping[]> {
    return shippings.reduce((grouped, shipping) => {
      const status = shipping.status;
      if (!grouped[status]) {
        grouped[status] = [];
      }
      grouped[status].push(shipping);
      return grouped;
    }, {} as Record<string, Shipping[]>);
  }

  /**
   * Filter shippings by date range
   */
  filterShippingsByDateRange(shippings: Shipping[], startDate: Date, endDate: Date): Shipping[] {
    return shippings.filter(shipping => {
      const shippingDate = new Date(shipping.createdAt);
      return shippingDate >= startDate && shippingDate <= endDate;
    });
  }

  /**
   * Get overdue shipments
   */
  getOverdueShipments(shippings: Shipping[]): Shipping[] {
    const now = new Date();
    return shippings.filter(shipping => {
      if (!shipping.estimatedDeliveryDate) return false;
      const estimatedDate = new Date(shipping.estimatedDeliveryDate);
      return estimatedDate < now && shipping.status !== ShippingStatus.DELIVERED;
    });
  }

  /**
   * Debug authentication status
   */
  debugAuth(): void {
    console.log('🔍 Shipping Service Auth Debug:');
    console.log('- Token:', this.getAuthToken() ? 'Present' : 'Missing');
    console.log('- Headers:', this.getAuthHeaders());
    console.log('- Cookies:', document.cookie);
  }
}

// Export singleton instance
export const shippingService = new ShippingService();
export default shippingService;