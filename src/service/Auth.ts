// types/auth.ts
export interface LoginRequest {
  username: string;
  password: string;
}

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
  roles?: string[]; // Optional roles array
}

export interface JwtResponse {
  token: string;
  id: string;
  username: string;
  email: string;
  roles: string[];
}

export interface MessageResponse {
  message: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  roles: string[];
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

import { Auth_URL } from '../lib/apiEndPoints';

// services/authService.ts
class AuthService {
  private baseURL: string;
  private currentUser: User | null = null;
  private readonly COOKIE_NAMES = ['user-service', 'token']; // Support both cookie names
  private readonly PRIMARY_COOKIE = 'user-service'; // Primary cookie name for new tokens

  constructor(baseURL: string = Auth_URL) {
    this.baseURL = baseURL;
    // Try to initialize user from existing token on startup
    this.initializeFromToken();
  }

  /**
   * Get authentication token from either user-service or token cookie
   */
  private getAuthToken(): string | null {
    try {
      const cookies = document.cookie.split(';');
      
      // Check all supported cookie names
      for (const cookieName of this.COOKIE_NAMES) {
        for (const cookie of cookies) {
          const [name, value] = cookie.trim().split('=');
          if (name === cookieName && value) {
            const token = decodeURIComponent(value);
            console.log(`🍪 Found token in ${cookieName} cookie`);
            return token;
          }
        }
      }
      
      console.log('🍪 No authentication token found in any supported cookies');
    } catch (error) {
      console.warn('Could not read cookies from document.cookie:', error);
    }
    return null;
  }

  /**
   * Set authentication token in both cookies for backward compatibility
   */
  private setAuthToken(token: string, maxAge: number = 24 * 60 * 60): void {
    try {
      const cookieOptions = `path=/; max-age=${maxAge}; SameSite=Strict; Secure=${window.location.protocol === 'https:'}`;
      
      // Set both cookies for compatibility
      for (const cookieName of this.COOKIE_NAMES) {
        document.cookie = `${cookieName}=${encodeURIComponent(token)}; ${cookieOptions}`;
        console.log(`🍪 Set token in ${cookieName} cookie`);
      }
      
      console.log('✅ Auth token set in all supported cookies');
    } catch (error) {
      console.warn('Failed to set auth token in cookies:', error);
    }
  }

  /**
   * Clear authentication token from all supported cookies
   */
  private clearAuthToken(): void {
    try {
      const expiredDate = 'Thu, 01 Jan 1970 00:00:00 UTC';
      const paths = ['/', ''];
      const domains = ['', `.${window.location.hostname}`, window.location.hostname];
      const sameSiteOptions = ['Strict', 'Lax', 'None'];
      
      // Clear all combinations to ensure complete cleanup
      for (const cookieName of this.COOKIE_NAMES) {
        for (const path of paths) {
          for (const domain of domains) {
            for (const sameSite of sameSiteOptions) {
              const pathStr = path ? `path=${path};` : '';
              const domainStr = domain ? `domain=${domain};` : '';
              const sameSiteStr = `SameSite=${sameSite};`;
              
              document.cookie = `${cookieName}=; expires=${expiredDate}; ${pathStr} ${domainStr} ${sameSiteStr}`;
            }
          }
        }
        
        // Simple clear attempt
        document.cookie = `${cookieName}=; expires=${expiredDate}; path=/;`;
      }
      
      console.log('🧹 Auth tokens cleared from all supported cookies');
    } catch (error) {
      console.warn('Failed to clear auth tokens from cookies:', error);
    }
  }

  /**
   * Parse JWT token to extract user information with improved ID handling
   */
  private parseJwtToken(token: string): User | null {
    try {
      // Split the JWT token and decode the payload
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('Invalid JWT token format');
        return null;
      }

      const payload = JSON.parse(atob(parts[1]));
      console.log('🔍 JWT Payload:', payload);
      
      // Enhanced user ID extraction logic
      let userId: string | undefined;
      let username: string | undefined;
      
      // Try to get user ID (prioritize actual ID fields over username fields)
      const idFields = ['id', 'userId', 'uid', 'user_id', '_id', 'objectId'];
      const usernameFields = ['username', 'login', 'user', 'name'];
      const subjectField = 'sub'; // JWT subject claim
      
      // First, try dedicated ID fields
      for (const field of idFields) {
        if (payload[field] && typeof payload[field] === 'string') {
          userId = payload[field];
          console.log(`✅ Found user ID in field "${field}":`, userId);
          break;
        }
      }
      
      // If no ID found, check if 'sub' looks like an ID (not a username)
      if (!userId && payload[subjectField]) {
        const subValue = payload[subjectField];
        // Check if sub looks like an ID (UUID, ObjectId, or numeric) rather than a username
        const isLikelyId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(subValue) || // UUID
                          /^[0-9a-fA-F]{24}$/.test(subValue) || // MongoDB ObjectId
                          /^\d+$/.test(subValue); // Numeric ID
        
        if (isLikelyId) {
          userId = subValue;
          console.log(`✅ Found user ID in 'sub' field:`, userId);
        } else {
          console.log(`⚠️ 'sub' field contains username-like value, not using as ID:`, subValue);
        }
      }
      
      // Get username
      for (const field of usernameFields) {
        if (payload[field] && typeof payload[field] === 'string') {
          username = payload[field];
          console.log(`✅ Found username in field "${field}":`, username);
          break;
        }
      }
      
      // Fallback to 'sub' for username if no dedicated username field found
      if (!username && payload[subjectField]) {
        username = payload[subjectField];
        console.log(`✅ Using 'sub' as username:`, username);
      }
      
      // If we still don't have a user ID, this is a problem
      if (!userId) {
        console.error('❌ Could not extract user ID from JWT token');
        console.error('🔍 Available fields:', Object.keys(payload));
        console.error('🔍 Payload values:', payload);
        
        // For OAuth2 flows, we might need to generate a fallback ID
        if (payload.email) {
          // Use email hash as fallback ID (not ideal but works)
          userId = btoa(payload.email).replace(/[^a-zA-Z0-9]/g, '');
          console.log(`⚠️ Generated fallback ID from email:`, userId);
        } else if (username) {
          // Last resort: use username as ID (not ideal)
          userId = username;
          console.log(`⚠️ Using username as ID (last resort):`, userId);
        } else {
          return null;
        }
      }

      const user: User = {
        id: userId,
        username: username || userId, // Fallback to ID if no username
        email: payload.email || '',
        roles: payload.roles || payload.authorities || ['ROLE_USER'],
      };

      console.log('✅ Successfully parsed user from JWT:', user);
      return user;
    } catch (error) {
      console.error('Failed to parse JWT token:', error);
      return null;
    }
  }

  /**
   * Initialize user from existing token (on app startup)
   */
  private initializeFromToken(): void {
    console.log('🔄 Initializing user from existing token...');
    const token = this.getAuthToken();
    if (token) {
      console.log('🍪 Found existing token, attempting to parse...');
      if (!this.isTokenExpired(token)) {
        const user = this.parseJwtToken(token);
        if (user) {
          this.currentUser = user;
          console.log('✅ Initialized user from existing token:', user.username, 'ID:', user.id);
          
          // Dispatch auth state change event for consistency
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('auth-state-changed', { 
              detail: { user, isAuthenticated: true } 
            }));
          }, 0);
        } else {
          console.log('❌ Failed to parse user from token, clearing...');
          this.clearAuthToken();
        }
      } else {
        console.log('⏰ Token is expired, clearing...');
        this.clearAuthToken();
      }
    } else {
      console.log('🍪 No existing token found');
    }
  }

  /**
   * Check if token is expired
   */
  private isTokenExpired(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return true;

      const payload = JSON.parse(atob(parts[1]));
      const exp = payload.exp;
      
      if (!exp) return false; // No expiration claim
      
      // Check if token is expired (exp is in seconds, Date.now() is in milliseconds)
      const isExpired = Date.now() >= exp * 1000;
      if (isExpired) {
        console.log('⏰ Token is expired');
      }
      return isExpired;
    } catch (error) {
      console.error('Failed to check token expiration:', error);
      return true; // Assume expired if we can't parse
    }
  }

  // Helper method to make authenticated requests
  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      credentials: 'include', // Important for JWT cookies - automatically sends supported cookies
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add Authorization header if we have a token in cookies
    const token = this.getAuthToken();
    if (token && !this.isTokenExpired(token)) {
      defaultOptions.headers = {
        ...defaultOptions.headers,
        'Authorization': `Bearer ${token}`,
      };
    }

    try {
      const response = await fetch(url, defaultOptions);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Auth request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Sign in user
  async signin(loginRequest: LoginRequest): Promise<User> {
    try {
      const response = await this.makeRequest<JwtResponse>('/signin', {
        method: 'POST',
        body: JSON.stringify(loginRequest),
      });

      // Store the token in both supported cookies
      this.setAuthToken(response.token);

      const user: User = {
        id: response.id,
        username: response.username,
        email: response.email,
        roles: response.roles,
      };

      this.currentUser = user;
      
      // Dispatch custom event for auth state change
      window.dispatchEvent(new CustomEvent('auth-state-changed', { 
        detail: { user, isAuthenticated: true } 
      }));

      console.log('✅ User signed in successfully:', user.username, 'ID:', user.id);
      return user;
    } catch (error) {
      this.currentUser = null;
      this.clearAuthToken();
      window.dispatchEvent(new CustomEvent('auth-state-changed', { 
        detail: { user: null, isAuthenticated: false } 
      }));
      throw error;
    }
  }

  // Sign up user
  async signup(signupRequest: SignupRequest): Promise<MessageResponse> {
    try {
      const response = await this.makeRequest<MessageResponse>('/signup', {
        method: 'POST',
        body: JSON.stringify(signupRequest),
      });

      return response;
    } catch (error) {
      console.warn('Signup error:', error);
      throw error;
    }
  }

  // Sign out user
  async signout(): Promise<void> {
    try {
      await this.makeRequest<MessageResponse>('/signout', {
        method: 'POST',
      });

      this.currentUser = null;
      this.clearAuthToken();
      
      // Dispatch custom event for auth state change
      window.dispatchEvent(new CustomEvent('auth-state-changed', { 
        detail: { user: null, isAuthenticated: false } 
      }));

      console.log('✅ User signed out successfully');
    } catch (error) {
      // Even if signout fails on server, clear local state
      this.currentUser = null;
      this.clearAuthToken();
      window.dispatchEvent(new CustomEvent('auth-state-changed', { 
        detail: { user: null, isAuthenticated: false } 
      }));
      console.warn('Signout failed on server, but cleared local state:', error);
      throw error;
    }
  }

  //  --------------------------------------- Google   ----------------------------
  initiateGoogleLogin(): void {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8099/api/users';
    window.location.href = `${backendUrl}/oauth2/authorize/google`;
  }

  /**
   * Handle OAuth2 callback with token - FIXED VERSION
   */
  async handleOAuth2Callback(token: string): Promise<User> {
    try {
      console.log('🔄 Processing OAuth2 callback...');
      
      // Validate and parse the JWT token
      const user = this.parseJwtToken(token);
      if (!user) {
        throw new Error('Invalid OAuth2 token - could not parse user information');
      }

      console.log('✅ Parsed OAuth2 user:', user);

      // Store the token in both supported cookies
      this.setAuthToken(token);
      
      this.currentUser = user;
      
      // Dispatch auth state change event
      window.dispatchEvent(new CustomEvent('auth-state-changed', { 
        detail: { user, isAuthenticated: true } 
      }));

      console.log('✅ OAuth2 login successful:', user.username, 'ID:', user.id);
      return user;
    } catch (error) {
      console.error('❌ OAuth2 callback failed:', error);
      this.currentUser = null;
      this.clearAuthToken();
      window.dispatchEvent(new CustomEvent('auth-state-changed', { 
        detail: { user: null, isAuthenticated: false } 
      }));
      throw error;
    }
  }

  /**
   * Check available OAuth2 providers
   */
  async getOAuth2Providers(): Promise<any> {
    try {
      const response = await this.makeRequest<any>('/oauth2/providers', {
        method: 'GET',
      });
      return response;
    } catch (error) {
      console.warn('Failed to fetch OAuth2 providers:', error);
      return {};
    }
  }

  // Get current user (from memory)
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    if (this.currentUser) return true;
    
    // Check if we have a valid token
    const token = this.getAuthToken();
    if (token && !this.isTokenExpired(token)) {
      // Try to parse user from token
      const user = this.parseJwtToken(token);
      if (user) {
        this.currentUser = user;
        return true;
      }
    }
    
    return false;
  }

  // Check if user has specific role
  hasRole(role: string): boolean {
    return this.currentUser?.roles.includes(role) || false;
  }

  // Check if user has any of the specified roles
  hasAnyRole(roles: string[]): boolean {
    if (!this.currentUser) return false;
    return roles.some(role => this.currentUser!.roles.includes(role));
  }

  // Check if user is admin
  isAdmin(): boolean {
    return this.hasRole('ROLE_ADMIN');
  }

  // Check if user is moderator
  isModerator(): boolean {
    return this.hasRole('ROLE_MODERATOR');
  }

  // Verify authentication status with server
  async verifyAuth(): Promise<User | null> {
    try {
      console.log('🔄 Verifying authentication status...');
      const token = this.getAuthToken();
      if (token && !this.isTokenExpired(token)) {
        const user = this.parseJwtToken(token);
        if (user) {
          this.currentUser = user;
          console.log('✅ Auth verification successful:', user.username);
          return user;
        }
      }
      
      // If no valid token, clear state
      console.log('❌ Auth verification failed - no valid token');
      this.currentUser = null;
      this.clearAuthToken();
      return null;
    } catch (error) {
      console.error('Auth verification failed:', error);
      this.currentUser = null;
      this.clearAuthToken();
      return null;
    }
  }

  // Clear auth state (client-side only)
  clearAuthState(): void {
    this.currentUser = null;
    this.clearAuthToken();
    window.dispatchEvent(new CustomEvent('auth-state-changed', { 
      detail: { user: null, isAuthenticated: false } 
    }));
  }

  // Get token for other services
  getToken(): string | null {
    return this.getAuthToken();
  }

  // Check if we have access to any supported cookie
  canAccessCookie(): boolean {
    try {
      const cookies = document.cookie;
      return this.COOKIE_NAMES.some(cookieName => cookies.includes(cookieName));
    } catch {
      return false;
    }
  }

  // Debug method to check auth status
  debugAuthStatus(): void {
    console.log('=== Auth Debug Info ===');
    console.log('Current user:', this.currentUser);
    console.log('Supported cookies:', this.COOKIE_NAMES);
    console.log('Can access cookies:', this.canAccessCookie());
    console.log('Is authenticated:', this.isAuthenticated());
    
    const token = this.getAuthToken();
    if (token) {
      console.log('Token found in cookies');
      console.log('Token expired:', this.isTokenExpired(token));
      console.log('Parsed user from token:', this.parseJwtToken(token));
    } else {
      console.log('No token found in any supported cookies');
    }
    console.log('========================');
  }
}

// Create singleton instance
export const authService = new AuthService();

// Utility functions for route protection
export function requireAuth(user: User | null): boolean {
  return user !== null;
}

export function requireRole(user: User | null, role: string): boolean {
  return user?.roles.includes(role) || false;
}

export function requireAnyRole(user: User | null, roles: string[]): boolean {
  if (!user) return false;
  return roles.some(role => user.roles.includes(role));
}