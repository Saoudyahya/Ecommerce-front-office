"use client";

// React Hook for Authentication
import { useState, useEffect, useCallback } from 'react';
import { authService, type AuthState, type LoginRequest, type MessageResponse, type SignupRequest } from '~/service/Auth';

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Handle auth state changes
  useEffect(() => {
    // Only add event listeners and initialize if we're in the browser
    if (typeof window === 'undefined') return;

    const handleAuthStateChange = (event: CustomEvent) => {
      const { user, isAuthenticated } = event.detail;
      setAuthState(prev => ({
        ...prev,
        user,
        isAuthenticated,
        isLoading: false,
        error: null,
      }));
    };

    window.addEventListener('auth-state-changed', handleAuthStateChange as EventListener);

    // Initialize auth state from service
    const initializeAuth = () => {
      try {
        const currentUser = authService.getCurrentUser();
        const isAuthenticated = authService.isAuthenticated();
        
        setAuthState({
          user: currentUser,
          isAuthenticated,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error('Failed to initialize auth state:', error);
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Failed to initialize authentication',
        });
      }
    };

    initializeAuth();

    return () => {
      window.removeEventListener('auth-state-changed', handleAuthStateChange as EventListener);
    };
  }, []);

  // Sign in function
  const signin = useCallback(async (loginRequest: LoginRequest): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await authService.signin(loginRequest);
      // State will be updated by the event listener
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Sign in failed',
      }));
      throw error;
    }
  }, []);

  // Sign up function
  const signup = useCallback(async (signupRequest: SignupRequest): Promise<MessageResponse> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await authService.signup(signupRequest);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return response;
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Sign up failed',
      }));
      throw error;
    }
  }, []);

  // Sign out function
  const signout = useCallback(async (): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await authService.signout();
      // State will be updated by the event listener
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Sign out failed',
      }));
      throw error;
    }
  }, []);

  // Clear error function
  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...authState,
    signin,
    signup,
    signout,
    clearError,
    hasRole: (role: string) => authService.hasRole(role),
    hasAnyRole: (roles: string[]) => authService.hasAnyRole(roles),
    isAdmin: () => authService.isAdmin(),
    isModerator: () => authService.isModerator(),
    getToken: () => authService.getToken(),
    debugAuth: () => authService.debugAuthStatus(),
  };
}