
"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function OAuth2RedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleOAuth2Callback = async () => {
      try {
        const token = searchParams?.get('token');
        const type = searchParams?.get('type');
        const errorParam = searchParams?.get('error');

        console.log('OAuth2 Callback - Token:', token ? 'Present' : 'Missing');
        console.log('OAuth2 Callback - Type:', type);
        console.log('OAuth2 Callback - Error:', errorParam);

        if (errorParam) {
          setError(decodeURIComponent(errorParam));
          setIsProcessing(false);
          return;
        }

        if (token && type === 'oauth2') {
          // Store the token in cookie manually since it came from OAuth2
          document.cookie = `user-service=${token}; path=/; max-age=${24 * 60 * 60}; SameSite=Lax`;
          
          // Parse the JWT to get user info and update auth state
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            console.log('JWT Payload:', payload);
            
            const user = {
              id: payload.id || payload.sub,
              username: payload.sub,
              email: payload.email || '',
              roles: payload.roles || ['ROLE_USER']
            };

            console.log('User from JWT:', user);

            // Dispatch auth state change event
            window.dispatchEvent(new CustomEvent('auth-state-changed', { 
              detail: { user, isAuthenticated: true } 
            }));

            // Small delay to ensure state is updated
            setTimeout(() => {
              router.push('/dashboard');
            }, 500);
            
          } catch (parseError) {
            console.error('Error parsing JWT:', parseError);
            setError('Failed to parse authentication token');
            setIsProcessing(false);
          }
        } else {
          setError('Invalid OAuth2 response - missing token or type');
          setIsProcessing(false);
        }
      } catch (error) {
        console.error('OAuth2 callback error:', error);
        setError('Failed to process OAuth2 login');
        setIsProcessing(false);
      }
    };

    // Small delay to ensure searchParams are ready
    const timer = setTimeout(handleOAuth2Callback, 100);
    return () => clearTimeout(timer);
  }, [searchParams, router]);

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Processing Google login...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait while we complete your authentication.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-600 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Google Login Failed
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/auth/sign-in')}
              className="w-full bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-100 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}