"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "~/lib/hooks/usrAuth";
import { cn } from "~/lib/cn";
import { useMounted } from "~/lib/hooks/use-mounted";
import { Button, buttonVariants } from "~/ui/primitives/button";
import { Skeleton } from "~/ui/primitives/skeleton";

export function SignOutPageClient() {
  const router = useRouter();
  const mounted = useMounted();
  const { signout, isLoading, user } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handlePageBack = async () => {
    router.back();
  };

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signout();
      // Redirect to home page after successful sign out
      router.push("/");
    } catch (error) {
      console.error("Sign out failed:", error);
      // Even if sign out fails on server, redirect to home
      router.push("/");
    } finally {
      setIsSigningOut(false);
    }
  };

  // If user is not authenticated, redirect to home
  if (mounted && !user) {
    router.push("/");
    return null;
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
          {user && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
              Signed in as: <span className="font-medium">{user.username}</span>
            </p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800">
          <div className="space-y-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p>When you sign out:</p>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li>You'll be logged out of your account</li>
                <li>Your session will be ended</li>
                <li>You'll need to sign in again to access your account</li>
              </ul>
            </div>

            <div
              className={`
                flex w-full flex-col-reverse justify-center gap-3
                sm:flex-row
              `}
            >
              <Button 
                onClick={handlePageBack} 
                size="default" 
                variant="outline"
                disabled={isSigningOut}
                className="w-full sm:w-auto"
              >
                Go back
                <span className="sr-only">Previous page</span>
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
                    "Sign out"
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
            Having trouble signing out? Try refreshing the page or clearing your browser cache.
          </p>
        </div>
      </div>
    </div>
  );
}