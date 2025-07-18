"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '~/lib/hooks/usrAuth';
import { Button } from '~/ui/primitives/button';

export default function OAuth2RedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { handleOAuth2Callback } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<string>('Initializing...');

  useEffect(() => {
    const handleOAuth2CallbackProcess = async () => {
      try {
        setStep('Reading callback parameters...');
        
        const token = searchParams?.get('token');
        const type = searchParams?.get('type');
        const errorParam = searchParams?.get('error');

        console.log('🔄 OAuth2 Callback - Token:', token ? 'Present' : 'Missing');
        console.log('🔄 OAuth2 Callback - Type:', type);
        console.log('🔄 OAuth2 Callback - Error:', errorParam);

        if (errorParam) {
          const decodedError = decodeURIComponent(errorParam);
          console.error('❌ OAuth2 Error:', decodedError);
          setError(decodedError);
          setIsProcessing(false);
          return;
        }

        if (!token) {
          setError('No authentication token received from OAuth2 provider');
          setIsProcessing(false);
          return;
        }

        if (type !== 'oauth2') {
          setError('Invalid callback type - expected OAuth2');
          setIsProcessing(false);
          return;
        }

        setStep('Processing authentication token...');

        try {
          // Use the auth hook's callback handler which properly manages tokens
          const user = await handleOAuth2Callback(token);
          
          console.log('✅ OAuth2 authentication successful:', user);
          
          setStep('Redirecting...');
          
          // Small delay to ensure state is properly updated
          setTimeout(() => {
            router.push('/dashboard');
          }, 500);
          
        } catch (callbackError) {
          console.error('❌ OAuth2 callback processing failed:', callbackError);
          setError(
            callbackError instanceof Error 
              ? callbackError.message 
              : 'Failed to process OAuth2 authentication'
          );
          setIsProcessing(false);
        }
        
      } catch (error) {
        console.error('❌ OAuth2 callback error:', error);
        setError('Failed to process OAuth2 login');
        setIsProcessing(false);
      }
    };

    // Small delay to ensure searchParams are ready
    const timer = setTimeout(handleOAuth2CallbackProcess, 100);
    return () => clearTimeout(timer);
  }, [searchParams, router, handleOAuth2Callback]);

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="h-12 w-12 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Completing Google Sign-In
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {step}
          </p>
          <div className="text-sm text-gray-500 space-y-1">
            <p>Please wait while we complete your authentication.</p>
            <p>This should only take a moment...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-600 mb-6">
            <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Google Sign-In Failed
          </h2>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-700 dark:text-red-300 text-sm">
              {error}
            </p>
          </div>
          <div className="space-y-3">
            <Button
              onClick={() => router.push('/auth/sign-in')}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Try Sign-In Again
            </Button>
            <Button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-100 text-gray-900 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Reload Page
            </Button>
            <Button
              onClick={() => router.push('/')}
              className="w-full text-gray-600 hover:text-gray-800 transition-colors text-sm"
            >
              Return to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}