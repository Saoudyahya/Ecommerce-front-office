"use client";

import * as React from "react";
import { CartProvider, useCartMigration } from "~/lib/hooks/use-cart";
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

// Error Boundary for Cart Operations
class CartErrorBoundary extends React.Component<
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
    console.error('Cart Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <Alert className="m-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Something went wrong with the shopping cart. Please refresh the page.
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

// Cart Provider with Migration
function CartProviderWithMigration({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { migrateGuestCart } = useCartMigration();
  const [cartInitialized, setCartInitialized] = React.useState(false);
  const [cartError, setCartError] = React.useState<string | null>(null);
  const [isOnline, setIsOnline] = React.useState(true);
  
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

  // Handle cart migration when authentication state changes
  React.useEffect(() => {
    const handleCartMigration = async () => {
      if (authLoading) return; // Wait for auth to complete
      
      try {
        setCartError(null);
        
        if (isAuthenticated && user?.id) {
          // User just logged in - migrate guest cart
          console.log('User authenticated, migrating cart for:', user.id);
          await migrateGuestCart(user.id);
        }
        
        setCartInitialized(true);
      } catch (error) {
        console.error('Failed to migrate cart:', error);
        setCartError('Failed to sync your cart. Some items may not be available.');
        setCartInitialized(true); // Still allow the app to work
      }
    };

    handleCartMigration();
  }, [isAuthenticated, user?.id, authLoading, migrateGuestCart]);

  // Show loading state while auth and cart are initializing
  if (authLoading || !cartInitialized) {
    return (
      <div className="flex min-h-screen flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">
              {authLoading ? 'Loading...' : 'Initializing cart...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <CartErrorBoundary>
      <CartProvider userId={isAuthenticated ? user?.id : undefined}>
        {/* Global Cart Status Alert */}
        {!isOnline && (
          <Alert className="mx-4 mt-4">
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              You're offline. Your cart changes are being saved locally and will sync when you reconnect.
            </AlertDescription>
          </Alert>
        )}
        
        {cartError && (
          <Alert className="mx-4 mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {cartError}
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-2"
                onClick={() => setCartError(null)}
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        {children}
      </CartProvider>
    </CartErrorBoundary>
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
      <CartProviderWithMigration>
        <div className="flex min-h-screen flex-col">
          <Header showAuth={true} />
          <main className="flex-1 pl-15">
            {children}
          </main>
          <Footer />
        </div>
        <Toaster />
      </CartProviderWithMigration>
    </NetworkStatusProvider>
  );
}