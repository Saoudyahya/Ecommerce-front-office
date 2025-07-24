// lib/services/payment.service.ts

import { getAuthHeaders } from '~/lib/apiEndPoints';

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

// Payment Request DTOs
export interface PaymentMethodRequestDto {
  paymentMethod: string;
  currency?: string;
}

export interface RefundRequest {
  amount: number;
  reason?: string;
}

// Payment Response DTOs
export interface PaymentResponseDto {
  paymentId: string;
  orderId: string;
  transactionId: string;
  status: string;
  success: boolean;
  paymentMethod: string;
  amount: number;
  message: string;
  createdAt?: string;
}

export interface PaymentStatusResponse {
  orderId: string;
  orderStatus: string;
  orderTotal: number;
  paymentStatus: PaymentResponseDto;
}

export interface RefundResponse {
  orderId: string;
  refund: PaymentResponseDto;
  message: string;
}

export interface PaymentProcessResponse {
  orderId: string;
  orderStatus: string;
  payment: PaymentResponseDto;
  success: boolean;
  message: string;
  timestamp: number;
}

/* -------------------------------------------------------------------------- */
/*                                  Service                                   */
/* -------------------------------------------------------------------------- */

class PaymentService {
  private readonly baseURL = 'http://localhost:8099/api/orders/order'; // Gateway URL

  /**
   * Process payment for an order
   */
  async processOrderPayment(orderId: string, paymentRequest: PaymentMethodRequestDto): Promise<PaymentProcessResponse> {
    try {
      const response = await fetch(`${this.baseURL}/${orderId}/pay`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(paymentRequest),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  }

  /**
   * Get payment status for an order
   */
  async getOrderPaymentStatus(orderId: string): Promise<PaymentStatusResponse> {
    try {
      const response = await fetch(`${this.baseURL}/${orderId}/payment/status`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching payment status:', error);
      throw error;
    }
  }

  /**
   * Refund payment for an order
   */
  async refundOrderPayment(orderId: string, refundRequest: RefundRequest): Promise<RefundResponse> {
    try {
      const response = await fetch(`${this.baseURL}/${orderId}/refund`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(refundRequest),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error processing refund:', error);
      throw error;
    }
  }

  /* ----------------------------- Helper Methods ---------------------------- */

  /**
   * Format payment amount for display
   */
  formatPaymentAmount(amount: number): string {
    return `$${amount.toFixed(2)}`;
  }

  /**
   * Get payment status color for UI
   */
  getPaymentStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
      case 'paid':
        return '#10B981'; // Green
      case 'pending':
      case 'processing':
        return '#F59E0B'; // Yellow
      case 'failed':
      case 'error':
        return '#EF4444'; // Red
      case 'refunded':
        return '#6366F1'; // Indigo
      default:
        return '#6B7280'; // Gray
    }
  }

  /**
   * Check if payment is successful
   */
  isPaymentSuccessful(status: string): boolean {
    return ['completed', 'success', 'paid'].includes(status.toLowerCase());
  }

  /**
   * Check if payment is pending
   */
  isPaymentPending(status: string): boolean {
    return ['pending', 'processing'].includes(status.toLowerCase());
  }

  /**
   * Check if payment failed
   */
  isPaymentFailed(status: string): boolean {
    return ['failed', 'error', 'declined'].includes(status.toLowerCase());
  }

  /**
   * Get payment method display name
   */
  getPaymentMethodDisplayName(method: string): string {
    switch (method.toLowerCase()) {
      case 'credit_card':
        return 'Credit Card';
      case 'debit_card':
        return 'Debit Card';
      case 'paypal':
        return 'PayPal';
      case 'stripe':
        return 'Stripe';
      case 'bank_transfer':
        return 'Bank Transfer';
      default:
        return method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  }
}

// Export singleton instance
export const paymentService = new PaymentService();
export default paymentService;