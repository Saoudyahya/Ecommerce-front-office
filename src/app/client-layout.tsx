"use client";

import * as React from "react";
import { CartProvider } from "~/lib/hooks/use-cart";
import { Save4LaterProvider } from "~/lib/hooks/use-saved4later";
import { Footer } from "~/ui/components/footer";
import { Header } from "~/ui/components/header/header";
import { Toaster } from "~/ui/primitives/sonner";
import { useAuth } from "~/lib/hooks/usrAuth";
import { Alert, AlertDescription } from "~/ui/primitives/alert";
import { Loader2, WifiOff, AlertCircle } from "lucide-react";
import { Button } from "~/ui/primitives/button";

interface ClientLayoutProps {
  children: React.ReactNode;
}

// Utility function to extract correct user ID
function extractUserIdFromAuthObject(user: any): { userId: string | undefined; warnings: string[] } {
  const warnings: string[] = [];
  
  if (!user) {
    return { userId: undefined, warnings: ['No user object provided'] };
  }

  // Define possible ID properties in order of preference
  const possibleIdProperties = [
    'id',
    'userId', 
    'uuid',
    'sub', // JWT subject claim
    '_id', // MongoDB style
    'uid', // Firebase style
    'user_id',
    'objectId'
  ];
  
  console.log('🔍 Available user properties:', Object.keys(user));
  console.log('📋 Full user object:', user);
  
  // Try each possible property
  for (const prop of possibleIdProperties) {
    const value = user[prop];
    
    if (value && typeof value === 'string') {
      // Check if it's a UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      if (uuidRegex.test(value)) {
        console.log(`✅ Found valid UUID in property "${prop}":`, value);
        return { userId: value, warnings };
      }
      
      // Check if it's a MongoDB ObjectId format  
      const objectIdRegex = /^[0-9a-fA-F]{24}$/;
      if (objectIdRegex.test(value)) {
        console.log(`✅ Found valid ObjectId in property "${prop}":`, value);
        warnings.push(`Using ObjectId format from ${prop}`);
        return { userId: value, warnings };
      }
      
      // Check if it's a numeric ID
      if (/^\d+$/.test(value)) {
        console.log(`✅ Found numeric ID in property "${prop}":`, value);
        warnings.push(`Using numeric ID from ${prop}`);
        return { userId: value, warnings };
      }
      
      // If it's a string but not in expected format, log it
      console.log(`⚠️ Property "${prop}" contains non-ID string:`, value);
      warnings.push(`Property ${prop} contains string "${value}" but doesn't match expected ID format`);
    } else if (value !== undefined) {
      console.log(`⚠️ Property "${prop}" exists but is not a string:`, typeof value, value);
    }
  }
  
  warnings.push('No valid user ID found in any expected property');
  return { userId: undefined, warnings };
}

// Error Boundary for Cart and Save4Later Operations
class ServiceErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Service Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <Alert className="m-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Something went wrong with the shopping services. Please refresh the page.
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-2"
              onClick={() => window.location.reload()}
            >
              Refresh
            </Button>
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}

// Enhanced Provider with both Cart and Save4Later
function ProviderWithServices({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [servicesInitialized, setServicesInitialized] = React.useState(false);
  const [initializationError, setInitializationError] = React.useState<string | null>(null);
  const [isOnline, setIsOnline] = React.useState(true);
  
  // Helper function to extract correct user ID
  const getUserId = React.useCallback(() => {
    if (!user || !isAuthenticated) return undefined;
    
    console.log('🔐 Extracting user ID from auth object...');
    const { userId, warnings } = extractUserIdFromAuthObject(user);
    
    if (warnings.length > 0) {
      console.warn('⚠️ User ID extraction warnings:');
      warnings.forEach(warning => console.warn('  -', warning));
    }
    
    if (userId) {
      console.log('✅ Successfully extracted user ID:', userId);
      return userId;
    }
    
    console.error('❌ Failed to extract valid user ID from user object');
    return undefined;
  }, [user, isAuthenticated]);

  const validUserId = getUserId();
  
  // Monitor online/offline status
  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle service initialization
  React.useEffect(() => {
    const initializeServices = async () => {
      if (authLoading) return; // Wait for auth to complete
      
      try {
        setInitializationError(null);
        
        if (isAuthenticated && user) {
          console.log('🔐 User authenticated. Checking user ID...');
          
          if (validUserId) {
            console.log('✅ Valid userId found:', validUserId);
            console.log('🚀 Services will initialize for authenticated user');
          } else {
            console.error('❌ Could not extract valid user ID!');
            console.error('🔍 This usually means the auth system is returning a username instead of an ID');
            console.error('📋 Please check your authentication configuration');
            
            // Try to give helpful error message
            const nameFields = ['name', 'username', 'displayName', 'email'];
            const nameValues = nameFields
              .map(field => user[field])
              .filter(val => val && typeof val === 'string');
            
            if (nameValues.length > 0) {
              console.error('🔍 Found name-like values (these should NOT be used as user ID):');
              nameValues.forEach(val => console.error('  -', val));
            }
            
            setInitializationError(
              'Authentication Error: Could not find a valid user ID. ' +
              'The system is receiving a username instead of a user ID. ' +
              'Please check your authentication configuration or contact support.'
            );
            setServicesInitialized(true);
            return;
          }
        } else {
          console.log('👤 Guest mode - services will use localStorage');
        }
        
        setServicesInitialized(true);
        
      } catch (error) {
        console.error('Failed to initialize services:', error);
        setInitializationError('Failed to initialize shopping services. Some features may not work properly.');
        setServicesInitialized(true);
      }
    };

    initializeServices();
  }, [isAuthenticated, user, authLoading, validUserId]);

  // Show loading state while auth and services are initializing
  if (authLoading || !servicesInitialized) {
    return (
      <div className="flex min-h-screen flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">
              {authLoading ? 'Loading...' : 'Initializing services...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ServiceErrorBoundary>
      {/* Cart Provider */}
      <CartProvider userId={validUserId}>
        {/* Save4Later Provider */}
        <Save4LaterProvider userId={validUserId}>
          {/* Global Status Alerts */}
          {!isOnline && (
            <Alert className="mx-4 mt-4">
              <WifiOff className="h-4 w-4" />
              <AlertDescription>
                You're offline. Your changes are being saved locally and will sync when you reconnect.
              </AlertDescription>
            </Alert>
          )}
          
          {initializationError && (
            <Alert className="mx-4 mt-4" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {initializationError}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-2"
                  onClick={() => setInitializationError(null)}
                >
                  Dismiss
                </Button>
              </AlertDescription>
            </Alert>
          )}
          
          {children}
        </Save4LaterProvider>
      </CartProvider>
    </ServiceErrorBoundary>
  );
}

// Network Status Provider (optional - for global network status)
function NetworkStatusProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = React.useState(true);

  React.useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('Network: Back online');
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      console.log('Network: Gone offline');
    };

    setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Make network status available globally if needed
  React.useEffect(() => {
    (window as any).__NETWORK_STATUS__ = isOnline;
  }, [isOnline]);

  return <>{children}</>;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <NetworkStatusProvider>
      <ProviderWithServices>
        <div className="flex min-h-screen flex-col">
          <Header showAuth={true} />
          <main className="flex-1 pl-15">
            {children}
          </main>
          <Footer />
        </div>
        <Toaster />
      </ProviderWithServices>
    </NetworkStatusProvider>
  );
}