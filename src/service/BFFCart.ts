// Gateway Service Cart Types
export interface CartItemDTO {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  subtotal: number;
  addedAt: string;
}

export interface EnrichedCartItemDTO {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  subtotal: number;
  addedAt: string;
  // Enriched product data
  productName: string;
  productImage: string;
  inStock: boolean;
  availableQuantity: number;
  productStatus: ProductStatus;
}

export interface ShoppingCartDTO {
  id: string;
  userId: string;
  items: CartItemDTO[];
  total: number;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

export interface EnrichedCartResponseDTO {
  id: string;
  userId: string;
  items: EnrichedCartItemDTO[];
  total: number;
  itemCount: number;
  totalQuantity: number;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

export interface CartServiceResponseDTO {
  success: boolean;
  message: string;
  data: ShoppingCartDTO | EnrichedCartResponseDTO;
}

export interface ProductBatchInfoDTO {
  id: string;
  name: string;
  price: number;
  imagePath: string;
  inStock: boolean;
  availableQuantity: number;
  status: ProductStatus;
}

export interface ProductBatchRequestDTO {
  productIds: string[];
}

export enum ProductStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  OUT_OF_STOCK = "OUT_OF_STOCK",
  DISCONTINUED = "DISCONTINUED"
}

// Gateway Controller Types
export interface CircuitBreakerInfo {
  name: string;
  state: string;
  successfulCalls: number;
  failedCalls: number;
  failureRate: number;
  bufferedCalls: number;
  failureRateThreshold: number;
  slidingWindowSize: number;
}

export interface CircuitBreakerStatusResponse {
  timestamp: string;
  totalCircuitBreakers: number;
  circuitBreakers: CircuitBreakerInfo[];
}

export interface GatewayHealthResponse {
  status: 'HEALTHY' | 'DEGRADED' | 'RECOVERING';
  timestamp: string;
  circuitBreakers: {
    total: number;
    open: number;
    halfOpen: number;
    closed: number;
  };
}

export interface ServiceInfo {
  name: string;
  description: string;
  path: string;
  uri: string;
}

export interface ServicesResponse {
  timestamp: string;
  totalServices: number;
  services: ServiceInfo[];
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
}