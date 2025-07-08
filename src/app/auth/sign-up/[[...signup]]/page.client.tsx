"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Mail, User, Lock, CheckCircle, AlertCircle, Sparkles } from "lucide-react";

import { SEO_CONFIG } from "~/app";
import {  type SignupRequest } from "~/service/Auth";
import { GitHubIcon } from "~/ui/components/icons/github";
import { GoogleIcon } from "~/ui/components/icons/google";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent } from "~/ui/primitives/card";
import { Input } from "~/ui/primitives/input";
import { Label } from "~/ui/primitives/label";
import { Separator } from "~/ui/primitives/separator";
// import { useToast } from "~/ui/primitives/use-toast";
import { toast } from "sonner";
import { cn } from "~/lib/cn";
import { useAuth } from "~/lib/hooks/usrAuth";

export function SignUpPageClient() {
  const router = useRouter();
  const { signup, isLoading, error, clearError } = useAuth();
  // const { toast } = useToast(); // Removed to fix Toaster error
  
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Password strength calculation
  useEffect(() => {
    const password = formData.password;
    let strength = 0;
    
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 12.5;
    if (/[^A-Za-z0-9]/.test(password)) strength += 12.5;
    
    setPasswordStrength(Math.min(100, strength));
  }, [formData.password]);

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
      errors.username = "Username is required";
    } else if (formData.username.length < 3) {
      errors.username = "Username must be at least 3 characters";
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      errors.username = "Username can only contain letters, numbers, and underscores";
    }

    // Email validation
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
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
      const signupRequest: SignupRequest = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        roles: ["user"],
      };

      const response = await signup(signupRequest);
      
      // Success - no toast needed, redirect handles the success
      console.log("Registration successful:", response.message);
      router.push("/auth/sign-in?registered=true");
    } catch (err) {
      // Handle specific server errors
      const errorMessage = error || "An unexpected error occurred. Please try again.";
      
      // Check for specific error types and handle them appropriately
      if (errorMessage.includes("Email is already in use")) {
        setValidationErrors(prev => ({
          ...prev,
          email: "This email is already registered. Try signing in instead."
        }));
        
        toast({
          title: "Email Already Registered",
          description: "This email is already in use. Would you like to sign in instead?",
          variant: "destructive",
        });
      } else if (errorMessage.includes("Username is already taken")) {
        setValidationErrors(prev => ({
          ...prev,
          username: "This username is already taken. Please choose another one."
        }));
        
        toast({
          title: "Username Unavailable",
          description: "This username is already taken. Please try a different one.",
          variant: "destructive",
        });
      } else if (errorMessage.includes("Invalid email format")) {
        setValidationErrors(prev => ({
          ...prev,
          email: "Please enter a valid email address."
        }));
      } else if (errorMessage.includes("Password")) {
        setValidationErrors(prev => ({
          ...prev,
          password: errorMessage.replace("Error: ", "")
        }));
      } else {
        // Generic server error
        setServerError(errorMessage.replace("Error: ", ""));
        
        toast({
          title: "Registration Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    }
  };

  const handleOAuthSignUp = (provider: 'github' | 'google') => {
    toast({
      title: "Coming Soon",
      description: `${provider.charAt(0).toUpperCase() + provider.slice(1)} sign-up will be available soon!`,
    });
  };

  const getFieldError = (field: string): string | undefined => {
    return validationErrors[field];
  };

  const isEmailAlreadyInUse = () => {
    return getFieldError("email")?.includes("already registered") || 
           serverError?.includes("Email is already in use") ||
           error?.includes("Email is already in use");
  };

  const isUsernameAlreadyTaken = () => {
    return getFieldError("username")?.includes("already taken") || 
           serverError?.includes("Username is already taken") ||
           error?.includes("Username is already taken");
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 30) return "bg-gray-300";
    if (passwordStrength < 60) return "bg-gray-400";
    if (passwordStrength < 80) return "bg-gray-600";
    return "bg-gray-800";
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 30) return "Weak";
    if (passwordStrength < 60) return "Fair";
    if (passwordStrength < 80) return "Good";
    return "Strong";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left side - Enhanced Image Section */}
        <div className="relative hidden lg:flex lg:flex-col lg:justify-between overflow-hidden">
          <div className="absolute inset-0">
            <Image
              alt="Sign-up background image"
              className="object-cover"
              fill
              priority
              sizes="50vw"
              src="https://images.unsplash.com/photo-1719811059181-09032aef07b8?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3"
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
                Start your journey with us today
              </h2>
              <p className="text-xl text-white/90 leading-relaxed">
                {SEO_CONFIG.slogan}
              </p>
              <div className="flex items-center gap-4 text-white/80">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>Secure & Private</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>Easy Setup</span>
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
            {/* Header */}
            <div className="text-center space-y-3">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Create Account
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Join our community and start your journey
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
                    {/* Username Field */}
                    <motion.div
                      className="space-y-2"
                      whileTap={{ scale: 0.995 }}
                    >
                      <Label htmlFor="username" className="text-sm font-medium flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Username
                      </Label>
                      <div className="relative">
                        <Input
                          id="username"
                          name="username"
                          onChange={handleChange}
                          onFocus={() => setFocusedField("username")}
                          onBlur={() => setFocusedField(null)}
                          placeholder="Choose your username"
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
                            {getFieldError("username")?.includes("already taken") && (
                              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                  Try adding numbers, underscores, or different variations to make it unique.
                                </p>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>

                    {/* Email Field */}
                    <motion.div
                      className="space-y-2"
                      whileTap={{ scale: 0.995 }}
                    >
                      <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </Label>
                      <div className="relative">
                        <Input
                          id="email"
                          name="email"
                          onChange={handleChange}
                          onFocus={() => setFocusedField("email")}
                          onBlur={() => setFocusedField(null)}
                          placeholder="Enter your email"
                          required
                          type="email"
                          value={formData.email}
                          className={cn(
                            "pl-4 pr-4 py-3 text-base transition-all duration-200",
                            "border-2 rounded-xl",
                            focusedField === "email" && "border-gray-900 dark:border-gray-100 shadow-lg shadow-gray-500/20",
                            getFieldError("email") && "border-red-500",
                            !getFieldError("email") && focusedField !== "email" && "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                          )}
                        />
                        <AnimatePresence>
                          {formData.email && !getFieldError("email") && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && (
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
                        {getFieldError("email") && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-2"
                          >
                            <div className="flex items-center gap-2 text-sm text-red-600">
                              <AlertCircle className="h-4 w-4" />
                              {getFieldError("email")}
                            </div>
                            {getFieldError("email")?.includes("already registered") && (
                              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                                  Already have an account with this email?
                                </p>
                                <Link
                                  href="/auth/sign-in"
                                  className="inline-flex items-center text-sm font-medium text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                                >
                                  Sign in instead →
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
                      <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          name="password"
                          onChange={handleChange}
                          onFocus={() => setFocusedField("password")}
                          onBlur={() => setFocusedField(null)}
                          placeholder="Create a strong password"
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
                      
                      {/* Password Strength Indicator */}
                      <AnimatePresence>
                        {formData.password && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-2"
                          >
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Password strength</span>
                              <span className="font-medium text-gray-700 dark:text-gray-300">
                                {getPasswordStrengthText()}
                              </span>
                            </div>
                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <motion.div
                                className={cn("h-full rounded-full transition-all duration-300", getPasswordStrengthColor())}
                                initial={{ width: 0 }}
                                animate={{ width: `${passwordStrength}%` }}
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <AnimatePresence>
                        {getFieldError("password") && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex items-center gap-2 text-sm text-red-600"
                          >
                            <AlertCircle className="h-4 w-4" />
                            {getFieldError("password")}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>

                    {/* Confirm Password Field */}
                    <motion.div
                      className="space-y-2"
                      whileTap={{ scale: 0.995 }}
                    >
                      <Label htmlFor="confirmPassword" className="text-sm font-medium flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Confirm Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          onChange={handleChange}
                          onFocus={() => setFocusedField("confirmPassword")}
                          onBlur={() => setFocusedField(null)}
                          placeholder="Confirm your password"
                          required
                          type={showConfirmPassword ? "text" : "password"}
                          value={formData.confirmPassword}
                          className={cn(
                            "pl-4 pr-12 py-3 text-base transition-all duration-200",
                            "border-2 rounded-xl",
                            focusedField === "confirmPassword" && "border-gray-900 dark:border-gray-100 shadow-lg shadow-gray-500/20",
                            getFieldError("confirmPassword") && "border-red-500",
                            !getFieldError("confirmPassword") && focusedField !== "confirmPassword" && "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                          )}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                        <AnimatePresence>
                          {formData.confirmPassword && formData.password === formData.confirmPassword && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              className="absolute right-12 top-1/2 -translate-y-1/2"
                            >
                              <CheckCircle className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <AnimatePresence>
                        {getFieldError("confirmPassword") && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex items-center gap-2 text-sm text-red-600"
                          >
                            <AlertCircle className="h-4 w-4" />
                            {getFieldError("confirmPassword")}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>

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
                              {(serverError || error)?.includes("Email is already in use") && (
                                <div className="mt-3 flex items-center gap-3">
                                  <Link
                                    href="/auth/sign-in"
                                    className="text-sm text-red-700 dark:text-red-300 underline hover:no-underline font-medium"
                                  >
                                    Sign in with this email instead
                                  </Link>
                                  <span className="text-red-400">|</span>
                                  <button
                                    onClick={() => {
                                      setServerError("");
                                      clearError();
                                    }}
                                    className="text-sm text-red-700 dark:text-red-300 underline hover:no-underline font-medium"
                                  >
                                    Try different email
                                  </button>
                                </div>
                              )}
                              {(serverError || error) && !(serverError || error)?.includes("Email is already in use") && !(serverError || error)?.includes("Username is already taken") && (
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
                              )}
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
                            Creating your account...
                          </div>
                        ) : (
                          "Create Account"
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
                          onClick={() => handleOAuthSignUp('github')}
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
                          onClick={() => handleOAuthSignUp('google')}
                          variant="outline"
                          type="button"
                        >
                          <GoogleIcon className="h-5 w-5 mr-2" />
                          Google
                        </Button>
                      </motion.div>
                    </div>
                  </div>

                  {/* Sign In Link */}
                  <div className="mt-8 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Already have an account?{" "}
                      <Link
                        className="font-semibold text-gray-900 hover:text-gray-700 dark:text-white dark:hover:text-gray-300 transition-colors underline-offset-4 hover:underline"
                        href="/auth/sign-in"
                      >
                        Sign in instead
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