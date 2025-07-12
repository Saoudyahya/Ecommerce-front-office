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
  private readonly COOKIE_NAME = 'user-service';

  constructor(baseURL: string = Auth_URL) {
    this.baseURL = baseURL;
    // Try to initialize user from existing token on startup
    this.initializeFromToken();
  }

  /**
   * Get authentication token from the user-service cookie
   */
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
      console.warn('Could not read cookie from document.cookie:', error);
    }
    return null;
  }

  /**
   * Clear authentication token from cookies
   */
  private clearAuthToken(): void {
    try {
      // Clear the cookie by setting it with an expired date
      // We need to match the same path and domain that were used when setting the cookie
      document.cookie = `${this.COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict;`;
      
      // Also try common variations in case the cookie was set with different parameters
      document.cookie = `${this.COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}; SameSite=Strict;`;
      document.cookie = `${this.COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax;`;
      
      console.log('Auth token cleared from cookies');
    } catch (error) {
      console.warn('Failed to clear auth token from cookies:', error);
    }
  }

  /**
   * Parse JWT token to extract user information
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
      
      // Extract user information from JWT payload
      // Adjust these field names based on your JWT structure
      const user: User = {
        id: payload.sub || payload.userId || payload.id,
        username: payload.sub || payload.username,
        email: payload.email || '',
        roles: payload.roles || payload.authorities || [],
      };

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
    const token = this.getAuthToken();
    if (token) {
      const user = this.parseJwtToken(token);
      if (user) {
        this.currentUser = user;
        console.log('Initialized user from existing token:', user.username);
      }
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
      return Date.now() >= exp * 1000;
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
      credentials: 'include', // Important for JWT cookies - automatically sends user-service cookie
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

      console.log('User signed in successfully:', user.username);
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

      console.log('User signed out successfully');
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
   * Handle OAuth2 callback with token
   */
  async handleOAuth2Callback(token: string): Promise<User> {
    try {
      // Validate and parse the JWT token
      const user = this.parseJwtToken(token);
      if (!user) {
        throw new Error('Invalid OAuth2 token');
      }

      // Store the token
      document.cookie = `${this.COOKIE_NAME}=${token}; path=/; max-age=${24 * 60 * 60}; SameSite=Strict`;
      
      this.currentUser = user;
      
      // Dispatch auth state change event
      window.dispatchEvent(new CustomEvent('auth-state-changed', { 
        detail: { user, isAuthenticated: true } 
      }));

      console.log('OAuth2 login successful:', user.username);
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
      // You could add a /auth/me endpoint to verify the token
      // For now, we'll check if we have a valid token and parse it
      const token = this.getAuthToken();
      if (token && !this.isTokenExpired(token)) {
        const user = this.parseJwtToken(token);
        if (user) {
          this.currentUser = user;
          return user;
        }
      }
      
      // If no valid token, clear state
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

  // Check if we have access to the cookie
  canAccessCookie(): boolean {
    try {
      const cookies = document.cookie;
      return cookies.includes(this.COOKIE_NAME);
    } catch {
      return false;
    }
  }

  // Debug method to check auth status
  debugAuthStatus(): void {
    console.log('=== Auth Debug Info ===');
    console.log('Current user:', this.currentUser);
    console.log('Can access cookie:', this.canAccessCookie());
    console.log('Is authenticated:', this.isAuthenticated());
    
    const token = this.getAuthToken();
    if (token) {
      console.log('Token expired:', this.isTokenExpired(token));
      console.log('Parsed user from token:', this.parseJwtToken(token));
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