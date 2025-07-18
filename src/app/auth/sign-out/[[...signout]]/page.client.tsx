"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import { useAuth } from "~/lib/hooks/usrAuth";
import { cn } from "~/lib/cn";
import { useMounted } from "~/lib/hooks/use-mounted";
import { Button, buttonVariants } from "~/ui/primitives/button";
import { Skeleton } from "~/ui/primitives/skeleton";

export function SignOutPageClient() {
  const router = useRouter();
  const mounted = useMounted();
  const { signout, isLoading, user, isAuthenticated } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // Handle redirect in useEffect to avoid setState during render
  useEffect(() => {
    if (mounted && !user && !isAuthenticated && !isLoading) {
      console.log('🔄 User not authenticated, redirecting to home...');
      setShouldRedirect(true);
    }
  }, [mounted, user, isAuthenticated, isLoading]);

  // Separate useEffect for actual redirect to avoid batching issues
  useEffect(() => {
    if (shouldRedirect) {
      console.log('🏠 Redirecting to home page...');
      router.push("/");
    }
  }, [shouldRedirect, router]);

  const handlePageBack = async () => {
    router.back();
  };

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      console.log('🚪 Initiating sign out...');
      await signout();
      console.log('✅ Sign out successful, redirecting...');
      // Redirect to home page after successful sign out
      router.push("/");
    } catch (error) {
      console.error("❌ Sign out failed:", error);
      // Even if sign out fails on server, redirect to home
      router.push("/");
    } finally {
      setIsSigningOut(false);
    }
  };

  // Show loading state while checking authentication or during redirect
  if (!mounted || isLoading || shouldRedirect) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="h-8 w-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              {shouldRedirect ? 'Redirecting...' : 'Loading...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If user is still not authenticated after mounting and loading, show a message
  if (!user && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Not Signed In
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              You need to be signed in to access this page.
            </p>
            <Button 
              onClick={() => router.push("/")} 
              size="default" 
              variant="default"
              className="mt-4"
            >
              Go to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Sign Out
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Are you sure you want to sign out of your account?
          </p>
          {/* {user && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Currently signed in as: 
                <span className="font-medium ml-1">{user.username}</span>
              </p>
              {user.email && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  {user.email}
                </p>
              )}
            </div>
          )} */}
        </div>

        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800">
          <div className="space-y-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p className="font-medium mb-2">When you sign out:</p>
              <ul className="space-y-1 list-disc list-inside ml-2">
                <li>You'll be logged out of your account</li>
                <li>Your session will be ended</li>
                <li>Your shopping cart will be saved for next time</li>
                <li>You'll need to sign in again to access your account</li>
              </ul>
            </div>

            <div className="flex w-full flex-col-reverse justify-center gap-3 sm:flex-row">
              <Button 
                onClick={handlePageBack} 
                size="default" 
                variant="outline"
                disabled={isSigningOut}
                className="w-full sm:w-auto"
              >
                Cancel
                <span className="sr-only">Cancel sign out and go back</span>
              </Button>
              
              {mounted ? (
                <Button 
                  onClick={handleSignOut} 
                  size="default" 
                  variant="destructive"
                  disabled={isLoading || isSigningOut}
                  className="w-full sm:w-auto"
                >
                  {isSigningOut ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing out...
                    </div>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </>
                  )}
                  <span className="sr-only">
                    This action will log you out of your account.
                  </span>
                </Button>
              ) : (
                <Skeleton
                  className={cn(
                    buttonVariants({ size: "default", variant: "destructive" }),
                    "bg-muted text-muted-foreground w-full sm:w-auto",
                  )}
                >
                  Sign out
                </Skeleton>
              )}
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Having trouble signing out? Try{" "}
            <Button 
              onClick={() => window.location.reload()} 
              className="underline hover:no-underline"
            >
              refreshing the page
            </Button>
            {" "}or clearing your browser cache.
          </p>
        </div>
      </div>
    </div>
  );
}