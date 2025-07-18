"use client";

// React Hook for Authentication
import { useState, useEffect, useCallback } from 'react';
import { authService, type AuthState, type LoginRequest, type MessageResponse, type SignupRequest, type User } from '~/service/Auth';

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
      console.log('🔄 Auth state changed:', { user: user?.username, isAuthenticated });
      
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
        console.log('🔄 Initializing auth state...');
        const currentUser = authService.getCurrentUser();
        const isAuthenticated = authService.isAuthenticated();
        
        console.log('📊 Initial auth state:', { 
          user: currentUser?.username, 
          id: currentUser?.id,
          isAuthenticated,
          hasToken: !!authService.getToken()
        });
        
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
    console.log('🔑 Attempting sign in for user:', loginRequest.username);
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const user = await authService.signin(loginRequest);
      console.log('✅ Sign in successful:', user.username, 'ID:', user.id);
      // State will be updated by the event listener
    } catch (error) {
      console.error('❌ Sign in failed:', error);
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
    console.log('📝 Attempting sign up for user:', signupRequest.username);
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await authService.signup(signupRequest);
      console.log('✅ Sign up successful');
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return response;
    } catch (error) {
      console.error('❌ Sign up failed:', error);
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
    console.log('🚪 Attempting sign out...');
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await authService.signout();
      console.log('✅ Sign out successful');
      // State will be updated by the event listener
    } catch (error) {
      console.error('❌ Sign out failed:', error);
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

  // Google sign in function
  const signinWithGoogle = useCallback((): void => {
    console.log('🔑 Initiating Google sign in...');
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      authService.initiateGoogleLogin();
      // The actual authentication will be handled by the OAuth2 callback page
    } catch (error) {
      console.error('❌ Google sign in initiation failed:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Google sign-in failed',
      }));
    }
  }, []);

  // Handle OAuth2 callback
  const handleOAuth2Callback = useCallback(async (token: string): Promise<User> => {
    console.log('🔄 Processing OAuth2 callback...');
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const user = await authService.handleOAuth2Callback(token);
      console.log('✅ OAuth2 callback successful:', user.username, 'ID:', user.id);
      // State will be updated by the event listener
      return user;
    } catch (error) {
      console.error('❌ OAuth2 callback failed:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'OAuth2 callback failed',
      }));
      throw error;
    }
  }, []);

  // Get OAuth2 providers
  const getOAuth2Providers = useCallback(async () => {
    try {
      return await authService.getOAuth2Providers();
    } catch (error) {
      console.warn('Failed to get OAuth2 providers:', error);
      return {};
    }
  }, []);

  // Verify authentication status
  const verifyAuth = useCallback(async () => {
    console.log('🔍 Verifying authentication status...');
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const user = await authService.verifyAuth();
      const isAuthenticated = !!user;
      
      console.log('📊 Auth verification result:', { 
        user: user?.username, 
        id: user?.id, 
        isAuthenticated 
      });
      
      setAuthState(prev => ({
        ...prev,
        user,
        isAuthenticated,
        isLoading: false,
        error: null,
      }));
      
      return user;
    } catch (error) {
      console.error('❌ Auth verification failed:', error);
      setAuthState(prev => ({
        ...prev,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Authentication verification failed',
      }));
      return null;
    }
  }, []);

  // Debug authentication status
  const debugAuth = useCallback(() => {
    console.log('=== USEAUTH DEBUG INFO ===');
    console.log('Hook Auth State:', authState);
    console.log('Service Current User:', authService.getCurrentUser());
    console.log('Service Is Authenticated:', authService.isAuthenticated());
    console.log('Service Token Present:', !!authService.getToken());
    console.log('Service Can Access Cookies:', authService.canAccessCookie());
    
    // Call service debug method
    authService.debugAuthStatus();
    
    console.log('=========================');
  }, [authState]);

  return {
    ...authState,
    signin,
    signup,
    signout,
    signinWithGoogle,
    handleOAuth2Callback,
    getOAuth2Providers,
    verifyAuth,
    clearError,
    debugAuth,
    hasRole: (role: string) => authService.hasRole(role),
    hasAnyRole: (roles: string[]) => authService.hasAnyRole(roles),
    isAdmin: () => authService.isAdmin(),
    isModerator: () => authService.isModerator(),
    getToken: () => authService.getToken(),
  };
}