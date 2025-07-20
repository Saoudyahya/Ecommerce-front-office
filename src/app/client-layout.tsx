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

// Enhanced utility function to extract correct user ID with better validation
function extractUserIdFromAuthObject(user: any): { userId: string | undefined; warnings: string[] } {
  const warnings: string[] = [];
  
  if (!user) {
    warnings.push('No user object provided');
    return { userId: undefined, warnings };
  }

  // Define possible ID properties in order of preference
  const possibleIdProperties = [
    'id',         // Most common ID field
    'userId',     // Explicit user ID
    'uid',        // Common in Firebase/Auth systems
    'user_id',    // Snake case variant
    '_id',        // MongoDB style
    'objectId',   // Explicit object ID
    'uuid',       // UUID field
    'sub'         // JWT subject (last resort, might be username)
  ];
  
  console.log('🔍 Available user properties:', Object.keys(user));
  console.log('📋 Full user object:', user);
  
  // Try each possible property
  for (const prop of possibleIdProperties) {
    const value = user[prop];
    
    if (value && typeof value === 'string') {
      // Validation patterns for different ID types
      const validationPatterns = {
        uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        objectId: /^[0-9a-fA-F]{24}$/,
        numeric: /^\d+$/,
        alphanumeric: /^[a-zA-Z0-9_-]+$/,
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      };
      
      // Check if it's a UUID (highest priority)
      if (validationPatterns.uuid.test(value)) {
        console.log(`✅ Found valid UUID in property "${prop}":`, value);
        return { userId: value, warnings };
      }
      
      // Check if it's a MongoDB ObjectId
      if (validationPatterns.objectId.test(value)) {
        console.log(`✅ Found valid ObjectId in property "${prop}":`, value);
        warnings.push(`Using ObjectId format from ${prop}`);
        return { userId: value, warnings };
      }
      
      // Check if it's a numeric ID
      if (validationPatterns.numeric.test(value)) {
        console.log(`✅ Found numeric ID in property "${prop}":`, value);
        warnings.push(`Using numeric ID from ${prop}`);
        return { userId: value, warnings };
      }
      
      // For 'sub' field, be more careful as it might be username
      if (prop === 'sub') {
        // If sub looks like an email, it's probably not a good ID
        if (validationPatterns.email.test(value)) {
          console.log(`⚠️ Property "sub" contains email, skipping:`, value);
          warnings.push(`Skipped 'sub' field containing email: ${value}`);
          continue;
        }
        
        // If sub contains spaces or looks like a display name, skip it
        if (value.includes(' ') || value.length < 3) {
          console.log(`⚠️ Property "sub" looks like display name, skipping:`, value);
          warnings.push(`Skipped 'sub' field containing display name: ${value}`);
          continue;
        }
      }
      
      // Check if it's alphanumeric (could be a valid ID)
      if (validationPatterns.alphanumeric.test(value) && value.length >= 3) {
        // Additional check: if it looks like a real name or email, skip it
        const looksLikeName = /^[A-Z][a-z]+ [A-Z][a-z]+/.test(value); // "John Doe" pattern
        const hasSpaces = value.includes(' ');
        
        if (hasSpaces || looksLikeName) {
          console.log(`⚠️ Property "${prop}" looks like a name, not an ID:`, value);
          warnings.push(`Skipped ${prop} - appears to be a name: "${value}"`);
          continue;
        }
        
        console.log(`✅ Found alphanumeric ID in property "${prop}":`, value);
        warnings.push(`Using alphanumeric ID from ${prop}`);
        return { userId: value, warnings };
      }
      
      // If it's a string but doesn't match our patterns, log it
      console.log(`⚠️ Property "${prop}" contains string but doesn't match expected ID format:`, value);
      warnings.push(`Property ${prop} contains string "${value}" but doesn't match expected ID format`);
    } else if (value !== undefined) {
      console.log(`⚠️ Property "${prop}" exists but is not a string:`, typeof value, value);
    }
  }
  
  // If we reach here, we couldn't find a suitable ID
  warnings.push('No valid user ID found in any expected property');
  
  // Last resort: try to generate an ID from available information
  if (user.email && typeof user.email === 'string') {
    // Create a hash-like ID from email
    const emailId = btoa(user.email).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
    console.log(`🔄 Generated fallback ID from email:`, emailId);
    warnings.push(`Generated fallback ID from email`);
    return { userId: emailId, warnings };
  }
  
  console.error('❌ Complete failure to extract user ID');
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
  
  // Memoize user ID extraction to prevent re-renders
  const validUserId = React.useMemo(() => {
    if ( !isAuthenticated) {
      console.log('👤 No authenticated user - using guest mode');
      return undefined;
    }
    
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
  
  // Monitor online/offline status
  React.useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('🌐 Network: Back online');
    };
    const handleOffline = () => {
      setIsOnline(false);
      console.log('🌐 Network: Gone offline');
    };

    setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle service initialization with better error handling
  React.useEffect(() => {
    const initializeServices = async () => {
      if (authLoading) {
        console.log('⏳ Waiting for authentication to complete...');
        return;
      }
      
      try {
        setInitializationError(null);
        
        if (isAuthenticated && user) {
          console.log('🔐 User authenticated. Checking user ID...');
          
          if (validUserId) {
            console.log('✅ Valid userId found:', validUserId);
            console.log('🚀 Services will initialize for authenticated user');
          } else {
            console.error('❌ Could not extract valid user ID!');
            
            // Enhanced error reporting
            const errorMessage = 
              'Authentication Error: Could not find a valid user ID. ' +
              'The system appears to be receiving user information without a proper ID field. ' +
              'Please contact support if this issue persists.';
            
            console.error('🔍 Error details:', errorMessage);
            setInitializationError(errorMessage);
            setServicesInitialized(true);
            return;
          }
        } else {
          console.log('👤 Guest mode - services will use localStorage');
        }
        
        console.log('✅ Services initialized successfully');
        setServicesInitialized(true);
        
      } catch (error) {
        console.error('Failed to initialize services:', error);
        setInitializationError('Failed to initialize shopping services. Some features may not work properly.');
        setServicesInitialized(true);
      }
    };

    initializeServices();
  }, [isAuthenticated, authLoading, validUserId]);

  // Show loading state while auth and services are initializing
  if (authLoading || !servicesInitialized) {
    return (
      <div className="flex min-h-screen flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
            <h2 className="text-lg font-semibold mb-2">
              {authLoading ? 'Loading...' : 'Initializing services...'}
            </h2>
            <p className="text-muted-foreground text-sm">
              {authLoading 
                ? 'Checking your authentication status...' 
                : 'Setting up your personalized experience...'
              }
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
                <div className="space-y-2">
                  <p>{initializationError}</p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setInitializationError(null)}
                    >
                      Dismiss
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.location.reload()}
                    >
                      Refresh
                    </Button>
                  </div>
                </div>
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
      console.log('🌐 Network: Back online');
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      console.log('🌐 Network: Gone offline');
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