"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Mock types to replace backend types
interface User {
  id: string;
  email: string;
  name: string;
}

interface PolarSubscription {
  id: string;
  subscriptionId: string;
  productId: string;
  status: "active" | "canceled" | "past_due";
  createdAt: string;
  updatedAt: string;
}

import { PaymentForm } from "~/ui/components/payments/PaymentForm";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/ui/primitives/card";
import { Alert, AlertDescription, AlertTitle } from "~/ui/primitives/alert";
import { Skeleton } from "~/ui/primitives/skeleton";
import { Badge } from "~/ui/primitives/badge";

interface SubscriptionsResponse {
  subscriptions: PolarSubscription[];
}

interface CustomerStateResponse {
  id: string;
  email: string;
  subscriptions: any[];
  [key: string]: any;
}

interface BillingPageClientProps {
  user: User | null;
}

export function BillingPageClient({ user }: BillingPageClientProps) {
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<PolarSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customerState, setCustomerState] = useState<any | null>(null);

  useEffect(() => {
    if (!user) {
      router.push("/auth/sign-in");
      return;
    }

    // Mock data loading with a delay to simulate API calls
    const loadMockData = async () => {
      try {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Mock subscription data
        const mockSubscriptions: PolarSubscription[] = [
          {
            id: "sub_1",
            subscriptionId: "sub_mock123456",
            productId: "Pro Plan",
            status: "active",
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
            updatedAt: new Date().toISOString()
          }
        ];
        
        // Mock customer state
        const mockCustomerState = {
          id: "cus_mock123456",
          email: user.email || "user@example.com",
          subscriptions: mockSubscriptions,
          name: user.name || "Demo User",
          created: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() // 60 days ago
        };
        
        setSubscriptions(mockSubscriptions);
        setCustomerState(mockCustomerState);
      } catch (err) {
        console.error("Error loading mock data:", err);
        setError("Failed to load subscription data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadMockData();
  }, [user, router]);

  const hasActiveSubscription = subscriptions.some(sub => sub.status === "active");

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const checkoutSuccess = urlParams.get("checkout_success");
    
    if (checkoutSuccess === "true") {
      // Clear the URL parameter
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      
      // Show success message using toast or alert
      // This would typically be handled by a toast notification system
      alert("Subscription successful! Thank you for your purchase.");
      
      // Refresh the page to show updated subscription status
      router.refresh();
    }
  }, [router]);

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6">Billing</h1>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Billing</h1>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Subscription Status */}
      <div className="grid gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Subscription Status</CardTitle>
            <CardDescription>
              Your current subscription plan and status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {subscriptions.length > 0 ? (
              <div className="space-y-4">
                {subscriptions.map((subscription) => (
                  <div key={subscription.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{subscription.productId}</h3>
                      <p className="text-sm text-muted-foreground">
                        ID: {subscription.subscriptionId}
                      </p>
                    </div>
                    <Badge variant={subscription.status === "active" ? "default" : "outline"}>
                      {subscription.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">You don't have any active subscriptions.</p>
            )}
          </CardContent>
          <CardFooter>
            {hasActiveSubscription && (
              <Button 
                variant="outline" 
                onClick={() => {
                  // In a real app, this would redirect to a payment provider's customer portal
                  // For the mock version, we'll show a message
                  alert("In a real app, this would open the payment provider's customer portal where you can manage your subscription.");
                }}
              >
                Manage Subscription
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>

      {/* Payment Plans */}
      {!hasActiveSubscription && (
        <div className="grid gap-6 md:grid-cols-2">
          <PaymentForm 
            productSlug="pro" 
            title="Pro Plan"
            description="Get access to all premium features and priority support."
            buttonText="Subscribe to Pro"
          />
          <PaymentForm 
            productSlug="premium" 
            title="Premium Plan"
            description="Everything in Pro plus exclusive content and early access to new features."
            buttonText="Subscribe to Premium"
          />
        </div>
      )}
    </div>
  );
}
