// lib/services/userProfile.service.ts

import {  getAuthHeaders } from '~/lib/apiEndPoints';

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export interface UserProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  profileImage?: string;
  
  // Preferences
  timezone: string;
  language: string;
  currency: string;
  
  // Communication preferences
  emailOptIn: boolean;
  smsOptIn: boolean;
  pushNotificationsOptIn: boolean;
  
  // Privacy settings
  profileVisibility: 'PUBLIC' | 'PRIVATE' | 'FRIENDS_ONLY';
  dataProcessingConsent: boolean;
  marketingConsent: boolean;
  
  // Account metadata
  accountStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  emailVerified: boolean;
  phoneVerified: boolean;
  twoFactorEnabled: boolean;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  profileImage?: string;
}

export interface UpdatePreferencesRequest {
  timezone?: string;
  language?: string;
  currency?: string;
}

export interface UpdateCommunicationPreferencesRequest {
  emailOptIn?: boolean;
  smsOptIn?: boolean;
  pushNotificationsOptIn?: boolean;
}

export interface UpdatePrivacySettingsRequest {
  profileVisibility?: 'PUBLIC' | 'PRIVATE' | 'FRIENDS_ONLY';
  dataProcessingConsent?: boolean;
  marketingConsent?: boolean;
}

export interface NotificationPreferences {
  id: string;
  userId: string;
  
  // Order notifications
  orderConfirmation: boolean;
  orderShipped: boolean;
  orderDelivered: boolean;
  orderCancelled: boolean;
  
  // Loyalty notifications
  pointsEarned: boolean;
  tierUpgrade: boolean;
  couponExpiry: boolean;
  rewardAvailable: boolean;
  
  // Marketing notifications
  promotionalEmails: boolean;
  newArrivals: boolean;
  saleAlerts: boolean;
  personalizedOffers: boolean;
  
  // Security notifications
  loginAlerts: boolean;
  passwordChanges: boolean;
  accountChanges: boolean;
  
  // Communication channels
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  
  // Frequency settings
  emailFrequency: 'IMMEDIATE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
  
  createdAt: string;
  updatedAt: string;
}

export interface UpdateNotificationPreferencesRequest {
  orderConfirmation?: boolean;
  orderShipped?: boolean;
  orderDelivered?: boolean;
  orderCancelled?: boolean;
  pointsEarned?: boolean;
  tierUpgrade?: boolean;
  couponExpiry?: boolean;
  rewardAvailable?: boolean;
  promotionalEmails?: boolean;
  newArrivals?: boolean;
  saleAlerts?: boolean;
  personalizedOffers?: boolean;
  loginAlerts?: boolean;
  passwordChanges?: boolean;
  accountChanges?: boolean;
  emailEnabled?: boolean;
  smsEnabled?: boolean;
  pushEnabled?: boolean;
  emailFrequency?: 'IMMEDIATE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
}

export interface AccountSummary {
  userId: string;
  memberSince: string;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  loyaltyTier: string;
  loyaltyPoints: number;
  activeCoupons: number;
  completedReturns: number;
  accountHealth: 'EXCELLENT' | 'GOOD' | 'NEEDS_ATTENTION';
  profileCompleteness: number; // Percentage
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface EmailChangeRequest {
  newEmail: string;
  password: string;
}

export interface PhoneChangeRequest {
  newPhone: string;
  verificationCode?: string;
}

/* -------------------------------------------------------------------------- */
/*                                  Service                                   */
/* -------------------------------------------------------------------------- */

class UserProfileService {
  private readonly baseURL = 'http://localhost:8099/api/users'; // Gateway URL
  
  /* --------------------------- Profile Management -------------------------- */

  /**
   * Get user profile
   */
  async getUserProfile(): Promise<UserProfile> {
    try {
      const response = await fetch(`${this.baseURL}/profile`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(profileData: UpdateProfileRequest): Promise<UserProfile> {
    try {
      const response = await fetch(`${this.baseURL}/profile`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Upload profile image
   */
  async uploadProfileImage(imageFile: File): Promise<{ imageUrl: string }> {
    try {
      const formData = new FormData();
      formData.append('profileImage', imageFile);

      const response = await fetch(`${this.baseURL}/profile/image`, {
        method: 'POST',
        headers: {
          // Don't set Content-Type for FormData - browser will set it with boundary
          'Authorization': getAuthHeaders()['Authorization'] || '',
        },
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error uploading profile image:', error);
      throw error;
    }
  }

  /**
   * Update user preferences
   */
  async updatePreferences(preferences: UpdatePreferencesRequest): Promise<UserProfile> {
    try {
      const response = await fetch(`${this.baseURL}/profile/preferences`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  }

  /**
   * Update communication preferences
   */
  async updateCommunicationPreferences(preferences: UpdateCommunicationPreferencesRequest): Promise<UserProfile> {
    try {
      const response = await fetch(`${this.baseURL}/profile/communication`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating communication preferences:', error);
      throw error;
    }
  }

  /**
   * Update privacy settings
   */
  async updatePrivacySettings(settings: UpdatePrivacySettingsRequest): Promise<UserProfile> {
    try {
      const response = await fetch(`${this.baseURL}/profile/privacy`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      throw error;
    }
  }

  /* ------------------------ Notification Preferences ---------------------- */

  /**
   * Get notification preferences
   */
  async getNotificationPreferences(): Promise<NotificationPreferences> {
    try {
      const response = await fetch(`${this.baseURL}/profile/notifications`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      throw error;
    }
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(preferences: UpdateNotificationPreferencesRequest): Promise<NotificationPreferences> {
    try {
      const response = await fetch(`${this.baseURL}/profile/notifications`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  /* --------------------------- Account Summary --------------------------- */

  /**
   * Get account summary
   */
  async getAccountSummary(): Promise<AccountSummary> {
    try {
      const response = await fetch(`${this.baseURL}/profile/summary`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching account summary:', error);
      throw error;
    }
  }

  /* ---------------------------- Security Settings --------------------------- */

  /**
   * Change password
   */
  async changePassword(passwordData: PasswordChangeRequest): Promise<{ message: string }> {
    try {
      const response = await fetch(`${this.baseURL}/profile/password`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(passwordData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }

  /**
   * Change email address
   */
  async changeEmail(emailData: EmailChangeRequest): Promise<{ message: string }> {
    try {
      const response = await fetch(`${this.baseURL}/profile/email`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(emailData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error changing email:', error);
      throw error;
    }
  }

  /**
   * Change phone number
   */
  async changePhone(phoneData: PhoneChangeRequest): Promise<{ message: string; verificationRequired?: boolean }> {
    try {
      const response = await fetch(`${this.baseURL}/profile/phone`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(phoneData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error changing phone:', error);
      throw error;
    }
  }

  /**
   * Request phone verification code
   */
  async requestPhoneVerification(phone: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`${this.baseURL}/profile/phone/verify`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ phone }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error requesting phone verification:', error);
      throw error;
    }
  }

  /**
   * Enable/disable two-factor authentication
   */
  async toggleTwoFactorAuth(enable: boolean, password: string): Promise<{ qrCode?: string; secret?: string; message: string }> {
    try {
      const response = await fetch(`${this.baseURL}/profile/2fa`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ enable, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error toggling 2FA:', error);
      throw error;
    }
  }

  /* ----------------------------- Helper Methods ---------------------------- */

  /**
   * Calculate profile completeness percentage
   */
  calculateProfileCompleteness(profile: UserProfile): number {
    const fields = [
      'firstName',
      'lastName',
      'email',
      'phone',
      'dateOfBirth',
      'profileImage'
    ];
    
    const completedFields = fields.filter(field => 
      profile[field as keyof UserProfile] && 
      String(profile[field as keyof UserProfile]).trim() !== ''
    );
    
    return Math.round((completedFields.length / fields.length) * 100);
  }

  /**
   * Format user display name
   */
  formatDisplayName(profile: UserProfile): string {
    if (profile.firstName && profile.lastName) {
      return `${profile.firstName} ${profile.lastName}`;
    } else if (profile.firstName) {
      return profile.firstName;
    } else if (profile.lastName) {
      return profile.lastName;
    } else {
      return profile.email.split('@')[0]; // Use email username as fallback
    }
  }

  /**
   * Get account health status
   */
  getAccountHealthStatus(profile: UserProfile): 'EXCELLENT' | 'GOOD' | 'NEEDS_ATTENTION' {
    let score = 0;
    
    // Check email verification
    if (profile.emailVerified) score += 25;
    
    // Check phone verification
    if (profile.phoneVerified) score += 20;
    
    // Check 2FA enabled
    if (profile.twoFactorEnabled) score += 25;
    
    // Check profile completeness
    const completeness = this.calculateProfileCompleteness(profile);
    score += (completeness / 100) * 30;
    
    if (score >= 80) return 'EXCELLENT';
    if (score >= 60) return 'GOOD';
    return 'NEEDS_ATTENTION';
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): { code: string; name: string }[] {
    return [
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Spanish' },
      { code: 'fr', name: 'French' },
      { code: 'de', name: 'German' },
      { code: 'it', name: 'Italian' },
      { code: 'pt', name: 'Portuguese' },
      { code: 'zh', name: 'Chinese' },
      { code: 'ja', name: 'Japanese' },
      { code: 'ko', name: 'Korean' },
    ];
  }

  /**
   * Get supported currencies
   */
  getSupportedCurrencies(): { code: string; name: string; symbol: string }[] {
    return [
      { code: 'USD', name: 'US Dollar', symbol: '$' },
      { code: 'EUR', name: 'Euro', symbol: '€' },
      { code: 'GBP', name: 'British Pound', symbol: '£' },
      { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
      { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
      { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
      { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
    ];
  }

  /**
   * Get timezone list
   */
  getSupportedTimezones(): { value: string; label: string }[] {
    return [
      { value: 'UTC', label: 'UTC' },
      { value: 'America/New_York', label: 'Eastern Time (ET)' },
      { value: 'America/Chicago', label: 'Central Time (CT)' },
      { value: 'America/Denver', label: 'Mountain Time (MT)' },
      { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
      { value: 'Europe/London', label: 'London (GMT)' },
      { value: 'Europe/Paris', label: 'Paris (CET)' },
      { value: 'Europe/Berlin', label: 'Berlin (CET)' },
      { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
      { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
      { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
    ];
  }

  /**
   * Validate password strength
   */
  validatePasswordStrength(password: string): { 
    isValid: boolean; 
    score: number; 
    suggestions: string[] 
  } {
    let score = 0;
    const suggestions: string[] = [];
    
    // Length check
    if (password.length >= 8) score += 25;
    else suggestions.push('Use at least 8 characters');
    
    // Uppercase check
    if (/[A-Z]/.test(password)) score += 25;
    else suggestions.push('Include uppercase letters');
    
    // Lowercase check
    if (/[a-z]/.test(password)) score += 25;
    else suggestions.push('Include lowercase letters');
    
    // Number check
    if (/\d/.test(password)) score += 15;
    else suggestions.push('Include numbers');
    
    // Special character check
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 10;
    else suggestions.push('Include special characters');
    
    return {
      isValid: score >= 75,
      score,
      suggestions
    };
  }
}

// Export singleton instance
export const userProfileService = new UserProfileService();
export default userProfileService;