"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Mail, Lock, CheckCircle, AlertCircle, Sparkles, LogIn } from "lucide-react";

import { SEO_CONFIG } from "~/app";
import {  LoginRequest } from "~/service/Auth";
import { GitHubIcon } from "~/ui/components/icons/github";
import { GoogleIcon } from "~/ui/components/icons/google";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent } from "~/ui/primitives/card";
import { Input } from "~/ui/primitives/input";
import { Label } from "~/ui/primitives/label";
import { Separator } from "~/ui/primitives/separator";
import { cn } from "~/lib/cn";
import { useAuth } from "~/lib/hooks/usrAuth";

export function SignInPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signin, isLoading, error, clearError, isAuthenticated ,signinWithGoogle } = useAuth();

  
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);





  // Check for registration success message
  const registered = searchParams?.get('registered');
  const [showSuccessMessage, setShowSuccessMessage] = useState(!!registered);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  // Hide success message after a delay
  useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessMessage]);

  const handleOAuthSignIn = (provider: 'github' | 'google') => {
    if (provider === 'google') {
      try {
        signinWithGoogle();
      } catch (error) {
        console.error('Google sign-in failed:', error);
        // The error will be handled by the useAuth hook
      }
    } else {
      // For GitHub or other providers not yet implemented
      alert(`${provider.charAt(0).toUpperCase() + provider.slice(1)} sign-in will be available soon!`);
    }
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    // Clear server error when user makes changes
    if (serverError) {
      setServerError("");
    }
    
    // Clear auth error when user makes changes
    if (error) {
      clearError();
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Username validation
    if (!formData.username.trim()) {
      errors.username = "Username or email is required";
    }

    // Password validation
    if (!formData.password) {
      errors.password = "Password is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setServerError("");
    setValidationErrors({});
    
    if (!validateForm()) {
      return;
    }

    try {
      const loginRequest: LoginRequest = {
        username: formData.username.trim(),
        password: formData.password,
      };

      await signin(loginRequest);
      
      // Success - redirect will be handled by useEffect
      console.log("Sign in successful");
      
    } catch (err) {
      // Handle specific server errors
      const errorMessage = error || "An unexpected error occurred. Please try again.";
      
      // Check for specific error types and handle them appropriately
      if (errorMessage.includes("Invalid credentials") || 
          errorMessage.includes("Bad credentials") ||
          errorMessage.includes("Authentication failed")) {
        setValidationErrors(prev => ({
          ...prev,
          password: "Invalid username or password. Please try again."
        }));
        console.error("Invalid credentials:", errorMessage);
      } else if (errorMessage.includes("User not found") || 
                 errorMessage.includes("Username not found")) {
        setValidationErrors(prev => ({
          ...prev,
          username: "No account found with this username. Please check your username or sign up."
        }));
        console.error("User not found:", errorMessage);
      } else if (errorMessage.includes("Account locked") || 
                 errorMessage.includes("Account disabled")) {
        setServerError("Your account has been locked or disabled. Please contact support.");
        console.error("Account locked:", errorMessage);
      } else if (errorMessage.includes("Too many attempts")) {
        setServerError("Too many login attempts. Please wait a few minutes before trying again.");
        console.error("Too many attempts:", errorMessage);
      } else {
        // Generic server error
        setServerError(errorMessage.replace("Error: ", ""));
        console.error("Sign in failed:", errorMessage);
      }
    }
  };

  // const handleOAuthSignIn = (provider: 'github' | 'google') => {
  //   // For now, show a simple alert instead of toast
  //   alert(`${provider.charAt(0).toUpperCase() + provider.slice(1)} sign-in will be available soon!`);
  // };

  const getFieldError = (field: string): string | undefined => {
    return validationErrors[field];
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left side - Enhanced Image Section */}
        <div className="relative hidden lg:flex lg:flex-col lg:justify-between overflow-hidden">
          <div className="absolute inset-0">
            <Image
              alt="Sign-in background image"
              className="object-cover"
              fill
              priority
              sizes="50vw"
              src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3"
            />
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
          </div>
          
          <div className="relative z-10 p-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="flex items-center gap-3"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">{SEO_CONFIG.name}</h1>
            </motion.div>
          </div>

          <div className="relative z-10 p-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-6"
            >
              <h2 className="text-4xl font-bold text-white leading-tight">
                Welcome back to your workspace
              </h2>
              <p className="text-xl text-white/90 leading-relaxed">
                Sign in to continue your journey with {SEO_CONFIG.name}
              </p>
              <div className="flex items-center gap-4 text-white/80">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>Secure Access</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>Fast & Reliable</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Floating Elements */}
          <motion.div
            className="absolute top-1/4 right-12 h-20 w-20 rounded-full bg-white/10 backdrop-blur-sm"
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-1/3 right-1/4 h-16 w-16 rounded-2xl bg-white/10 backdrop-blur-sm"
            animate={{ y: [0, 20, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />
        </div>

        {/* Right side - Enhanced Form Section */}
        <div className="flex items-center justify-center p-6 lg:p-12">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md space-y-8"
          >
            {/* Success Message for Registration */}
            <AnimatePresence>
              {showSuccessMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-4"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                        Account created successfully!
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        Please sign in with your new credentials.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Header */}
            <div className="text-center space-y-3">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Welcome Back
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Sign in to your account to continue
                </p>
              </motion.div>
            </div>

            {/* Main Form Card */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="border-0 shadow-xl bg-white dark:bg-gray-900">
                <CardContent className="p-8">
                  <form className="space-y-6" onSubmit={handleSubmit}>
                    {/* Username/Email Field */}
                    <motion.div
                      className="space-y-2"
                      whileTap={{ scale: 0.995 }}
                    >
                      <Label htmlFor="username" className="text-sm font-medium flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Username or Email
                      </Label>
                      <div className="relative">
                        <Input
                          id="username"
                          name="username"
                          onChange={handleChange}
                          onFocus={() => setFocusedField("username")}
                          onBlur={() => setFocusedField(null)}
                          placeholder="Enter your username or email"
                          required
                          type="text"
                          value={formData.username}
                          className={cn(
                            "pl-4 pr-4 py-3 text-base transition-all duration-200",
                            "border-2 rounded-xl",
                            focusedField === "username" && "border-gray-900 dark:border-gray-100 shadow-lg shadow-gray-500/20",
                            getFieldError("username") && "border-red-500",
                            !getFieldError("username") && focusedField !== "username" && "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                          )}
                        />
                        <AnimatePresence>
                          {formData.username && !getFieldError("username") && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              className="absolute right-3 top-1/2 -translate-y-1/2"
                            >
                              <CheckCircle className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <AnimatePresence>
                        {getFieldError("username") && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-2"
                          >
                            <div className="flex items-center gap-2 text-sm text-red-600">
                              <AlertCircle className="h-4 w-4" />
                              {getFieldError("username")}
                            </div>
                            {getFieldError("username")?.includes("No account found") && (
                              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                                  Don't have an account yet?
                                </p>
                                <Link
                                  href="/auth/sign-up"
                                  className="inline-flex items-center text-sm font-medium text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                                >
                                  Create account →
                                </Link>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>

                    {/* Password Field */}
                    <motion.div
                      className="space-y-2"
                      whileTap={{ scale: 0.995 }}
                    >
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          Password
                        </Label>
                        <Link
                          href="/auth/forgot-password"
                          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                          Forgot password?
                        </Link>
                      </div>
                      <div className="relative">
                        <Input
                          id="password"
                          name="password"
                          onChange={handleChange}
                          onFocus={() => setFocusedField("password")}
                          onBlur={() => setFocusedField(null)}
                          placeholder="Enter your password"
                          required
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          className={cn(
                            "pl-4 pr-12 py-3 text-base transition-all duration-200",
                            "border-2 rounded-xl",
                            focusedField === "password" && "border-gray-900 dark:border-gray-100 shadow-lg shadow-gray-500/20",
                            getFieldError("password") && "border-red-500",
                            !getFieldError("password") && focusedField !== "password" && "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                          )}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      <AnimatePresence>
                        {getFieldError("password") && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-2"
                          >
                            <div className="flex items-center gap-2 text-sm text-red-600">
                              <AlertCircle className="h-4 w-4" />
                              {getFieldError("password")}
                            </div>
                            {getFieldError("password")?.includes("Invalid username or password") && (
                              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                                  Having trouble signing in?
                                </p>
                                <div className="flex flex-col gap-1">
                                  <Link
                                    href="/auth/forgot-password"
                                    className="text-sm font-medium text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                                  >
                                    Reset your password →
                                  </Link>
                                  <Link
                                    href="/auth/sign-up"
                                    className="text-sm font-medium text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                                  >
                                    Create a new account →
                                  </Link>
                                </div>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>

                    {/* Remember Me */}
                    <div className="flex items-center">
                      <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                      />
                      <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        Remember me for 30 days
                      </label>
                    </div>

                    {/* Error Display */}
                    <AnimatePresence>
                      {(error || serverError) && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-4"
                        >
                          <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                                {serverError || error}
                              </p>
                              <div className="mt-3">
                                <button
                                  onClick={() => {
                                    setServerError("");
                                    clearError();
                                  }}
                                  className="text-sm text-red-700 dark:text-red-300 underline hover:no-underline font-medium"
                                >
                                  Try again
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Submit Button */}
                    <motion.div whileTap={{ scale: 0.98 }}>
                      <Button 
                        className="w-full py-3 text-base font-semibold rounded-xl bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl" 
                        disabled={isLoading} 
                        type="submit"
                      >
                        {isLoading ? (
                          <div className="flex items-center gap-3">
                            <div className="h-5 w-5 border-2 border-white/30 border-t-white dark:border-gray-900/30 dark:border-t-gray-900 rounded-full animate-spin" />
                            Signing in...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <LogIn className="h-5 w-5" />
                            Sign In
                          </div>
                        )}
                      </Button>
                    </motion.div>
                  </form>

                  {/* OAuth Section */}
                  <div className="mt-8">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <Separator className="w-full" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white dark:bg-gray-900 px-4 text-gray-500 font-medium">
                          Or continue with
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-6 grid grid-cols-2 gap-4">
                      <motion.div whileTap={{ scale: 0.98 }}>
                        <Button
                          className="w-full py-3 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-gray-600 dark:hover:bg-gray-800 transition-all duration-200"
                          disabled={isLoading}
                          onClick={() => handleOAuthSignIn('github')}
                          variant="outline"
                          type="button"
                        >
                          <GitHubIcon className="h-5 w-5 mr-2" />
                          GitHub
                        </Button>
                      </motion.div>
                      <motion.div whileTap={{ scale: 0.98 }}>
                        <Button
                          className="w-full py-3 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-gray-600 dark:hover:bg-gray-800 transition-all duration-200"
                          disabled={isLoading}
                          onClick={() => handleOAuthSignIn('google')}
                          variant="outline"
                          type="button"
                        >
                          <GoogleIcon className="h-5 w-5 mr-2" />
                          Google
                        </Button>
                      </motion.div>
                    </div>
                  </div>

                  {/* Sign Up Link */}
                  <div className="mt-8 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Don't have an account?{" "}
                      <Link
                        className="font-semibold text-gray-900 hover:text-gray-700 dark:text-white dark:hover:text-gray-300 transition-colors underline-offset-4 hover:underline"
                        href="/auth/sign-up"
                      >
                        Sign up for free
                      </Link>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}