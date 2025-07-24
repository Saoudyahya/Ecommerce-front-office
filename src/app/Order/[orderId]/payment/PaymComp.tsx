"use client";

import { AnimatePresence, motion } from "framer-motion";
import { 
  ArrowLeft, 
  ArrowRight,
  Check,
  CreditCard as CreditCardIcon,
  Loader2, 
  Lock,
  Shield,
  AlertCircle,
  Bitcoin,
  Banknote,
  Gift,
  Coins,
  MapPin,
  Truck,
  Clock,
  Package
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Button } from "~/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/ui/primitives/card";
import { Input } from "~/ui/primitives/input";
import { Label } from "~/ui/primitives/label";
import { Separator } from "~/ui/primitives/separator";
import { RadioGroup, RadioGroupItem } from "~/ui/primitives/radio-group";
import { Checkbox } from "~/ui/primitives/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/ui/primitives/select";
import { toast } from "sonner";

// Import your services
import { paymentService, type PaymentMethodRequestDto } from "~/service/payment";
import { orderService, type EnrichedOrderResponse } from "~/service/Order";
import { shippingService, type CreateShippingWithAddressRequest, type Shipping } from "~/service/shipping";
import { useAuth } from "~/lib/hooks/usrAuth";

const getImageUrl = (imagePath: string): string => {
  const serverBaseUrl = "http://localhost:8099";
  if (imagePath?.startsWith("/api/")) {
    return `${serverBaseUrl}${imagePath}`;
  }
  return imagePath || "/placeholder-product.jpg";
};

// Types
type PaymentMethod = 
  | "CREDIT_CARD" 
  | "DEBIT_CARD" 
  | "PAYPAL" 
  | "BANK_TRANSFER" 
  | "CRYPTO" 
  | "POINTS" 
  | "GIFT_CARD";

type ShippingMethod = {
  id: string;
  name: string;
  carrier: string;
  estimatedDays: string;
  cost: number;
  description: string;
};

type PaymentStep = "address" | "shipping" | "payment" | "review";

interface Address {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface PaymentPageProps {
  orderId: string;
}

interface PaymentFormData {
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  cardholderName?: string;
  email?: string;
  accountNumber?: string;
  routingNumber?: string;
  accountHolderName?: string;
  walletAddress?: string;
  cryptoType?: string;
  pointsToUse?: string;
  giftCardNumber?: string;
  securityCode?: string;
}

// Shipping methods configuration
const SHIPPING_METHODS: ShippingMethod[] = [
  {
    id: "standard",
    name: "Standard Shipping",
    carrier: "FedEx Ground",
    estimatedDays: "5-7 business days",
    cost: 9.99,
    description: "Most economical option"
  },
  {
    id: "express",
    name: "Express Shipping",
    carrier: "FedEx Express",
    estimatedDays: "2-3 business days",
    cost: 19.99,
    description: "Faster delivery"
  },
  {
    id: "overnight",
    name: "Overnight Shipping",
    carrier: "FedEx Overnight",
    estimatedDays: "1 business day",
    cost: 39.99,
    description: "Next business day delivery"
  },
  {
    id: "same_day",
    name: "Same Day Delivery",
    carrier: "Local Courier",
    estimatedDays: "Same day",
    cost: 29.99,
    description: "Delivered within 4-6 hours"
  }
];

// Payment method configurations
const PAYMENT_METHODS = {
  CREDIT_CARD: {
    id: "CREDIT_CARD",
    label: "Credit Card",
    icon: CreditCardIcon,
    description: "Pay securely with your credit card",
    fields: ["cardNumber", "expiryDate", "cvv", "cardholderName"]
  },
  DEBIT_CARD: {
    id: "DEBIT_CARD",
    label: "Debit Card", 
    icon: CreditCardIcon,
    description: "Pay directly from your bank account",
    fields: ["cardNumber", "expiryDate", "cvv", "cardholderName"]
  },
  PAYPAL: {
    id: "PAYPAL",
    label: "PayPal",
    icon: () => (
      <div className="w-5 h-5 bg-blue-600 rounded text-white flex items-center justify-center text-xs font-bold">
        P
      </div>
    ),
    description: "Pay with your PayPal account",
    fields: ["email"]
  },
  BANK_TRANSFER: {
    id: "BANK_TRANSFER",
    label: "Bank Transfer",
    icon: Banknote,
    description: "Direct bank account transfer",
    fields: ["accountNumber", "routingNumber", "accountHolderName"]
  },
  CRYPTO: {
    id: "CRYPTO",
    label: "Cryptocurrency",
    icon: Bitcoin,
    description: "Pay with Bitcoin or other cryptocurrencies",
    fields: ["walletAddress", "cryptoType"]
  },
  POINTS: {
    id: "POINTS",
    label: "Loyalty Points",
    icon: Coins,
    description: "Use your accumulated loyalty points",
    fields: ["pointsToUse"]
  },
  GIFT_CARD: {
    id: "GIFT_CARD",
    label: "Gift Card",
    icon: Gift,
    description: "Redeem your gift card",
    fields: ["giftCardNumber", "securityCode"]
  }
} as const;

const STEPS = [
  { id: "address", label: "Shipping & Billing", icon: MapPin },
  { id: "shipping", label: "Shipping Method", icon: Truck },
  { id: "payment", label: "Payment Method", icon: CreditCardIcon },
  { id: "review", label: "Review & Complete", icon: Check }
] as const;

// Move AddressForm outside to prevent re-creation on every render
const AddressForm = React.memo(({ 
  address, 
  type, 
  onChange,
  formErrors
}: { 
  address: Address; 
  type: 'shipping' | 'billing'; 
  onChange: (field: string, value: string) => void;
  formErrors: Record<string, string>;
}) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor={`${type}-firstName`}>First Name</Label>
        <Input
          id={`${type}-firstName`}
          placeholder="John"
          value={address.firstName}
          onChange={(e) => onChange('firstName', e.target.value)}
          className={formErrors[`${type}.firstName`] ? 'border-red-500' : ''}
        />
        {formErrors[`${type}.firstName`] && (
          <p className="text-sm text-red-500">{formErrors[`${type}.firstName`]}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor={`${type}-lastName`}>Last Name</Label>
        <Input
          id={`${type}-lastName`}
          placeholder="Doe"
          value={address.lastName}
          onChange={(e) => onChange('lastName', e.target.value)}
          className={formErrors[`${type}.lastName`] ? 'border-red-500' : ''}
        />
        {formErrors[`${type}.lastName`] && (
          <p className="text-sm text-red-500">{formErrors[`${type}.lastName`]}</p>
        )}
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor={`${type}-email`}>Email</Label>
        <Input
          id={`${type}-email`}
          type="email"
          placeholder="john@example.com"
          value={address.email}
          onChange={(e) => onChange('email', e.target.value)}
          className={formErrors[`${type}.email`] ? 'border-red-500' : ''}
        />
        {formErrors[`${type}.email`] && (
          <p className="text-sm text-red-500">{formErrors[`${type}.email`]}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor={`${type}-phone`}>Phone</Label>
        <Input
          id={`${type}-phone`}
          placeholder="+1 (555) 123-4567"
          value={address.phone}
          onChange={(e) => onChange('phone', e.target.value)}
          className={formErrors[`${type}.phone`] ? 'border-red-500' : ''}
        />
        {formErrors[`${type}.phone`] && (
          <p className="text-sm text-red-500">{formErrors[`${type}.phone`]}</p>
        )}
      </div>
    </div>

    <div className="space-y-2">
      <Label htmlFor={`${type}-address1`}>Address Line 1</Label>
      <Input
        id={`${type}-address1`}
        placeholder="123 Main Street"
        value={address.address1}
        onChange={(e) => onChange('address1', e.target.value)}
        className={formErrors[`${type}.address1`] ? 'border-red-500' : ''}
      />
      {formErrors[`${type}.address1`] && (
        <p className="text-sm text-red-500">{formErrors[`${type}.address1`]}</p>
      )}
    </div>

    <div className="space-y-2">
      <Label htmlFor={`${type}-address2`}>Address Line 2 (Optional)</Label>
      <Input
        id={`${type}-address2`}
        placeholder="Apartment, suite, etc."
        value={address.address2}
        onChange={(e) => onChange('address2', e.target.value)}
      />
    </div>

    <div className="grid grid-cols-3 gap-4">
      <div className="space-y-2">
        <Label htmlFor={`${type}-city`}>City</Label>
        <Input
          id={`${type}-city`}
          placeholder="New York"
          value={address.city}
          onChange={(e) => onChange('city', e.target.value)}
          className={formErrors[`${type}.city`] ? 'border-red-500' : ''}
        />
        {formErrors[`${type}.city`] && (
          <p className="text-sm text-red-500">{formErrors[`${type}.city`]}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor={`${type}-state`}>State</Label>
        <Input
          id={`${type}-state`}
          placeholder="NY"
          value={address.state}
          onChange={(e) => onChange('state', e.target.value)}
          className={formErrors[`${type}.state`] ? 'border-red-500' : ''}
        />
        {formErrors[`${type}.state`] && (
          <p className="text-sm text-red-500">{formErrors[`${type}.state`]}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor={`${type}-zipCode`}>ZIP Code</Label>
        <Input
          id={`${type}-zipCode`}
          placeholder="10001"
          value={address.zipCode}
          onChange={(e) => onChange('zipCode', e.target.value)}
          className={formErrors[`${type}.zipCode`] ? 'border-red-500' : ''}
        />
        {formErrors[`${type}.zipCode`] && (
          <p className="text-sm text-red-500">{formErrors[`${type}.zipCode`]}</p>
        )}
      </div>
    </div>
  </div>
));

AddressForm.displayName = 'AddressForm';

export default function PaymentPageComponent({ orderId }: PaymentPageProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  
  const [order, setOrder] = React.useState<EnrichedOrderResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = React.useState(false);
  const [currentStep, setCurrentStep] = React.useState<PaymentStep>("address");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = React.useState<PaymentMethod>("CREDIT_CARD");
  const [selectedShippingMethod, setSelectedShippingMethod] = React.useState<string>("standard");
  const [formData, setFormData] = React.useState<PaymentFormData>({});
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});
  const [useSameBilling, setUseSameBilling] = React.useState(true);
  
  // Address states
  const [shippingAddress, setShippingAddress] = React.useState<Address>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States"
  });
  
  const [billingAddress, setBillingAddress] = React.useState<Address>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States"
  });

  // Get selected shipping method details
  const selectedShipping = SHIPPING_METHODS.find(method => method.id === selectedShippingMethod);

  // Calculate total with shipping
  const calculateTotal = () => {
    if (!order || !selectedShipping) return 0;
    return order.totalAmount + selectedShipping.cost;
  };

  // Get user ID from auth
  const getUserId = (): string | null => {
    if (!user?.id) {
      console.error('User ID not available from auth');
      return null;
    }
    return user.id;
  };

  // Load order details
  const loadOrder = React.useCallback(async () => {
    if (!orderId || authLoading || !isAuthenticated) {
      setIsLoading(false);
      return;
    }

    try {
      console.log('Loading order:', orderId);
      const orderData = await orderService.getEnrichedOrder(orderId, true);
      setOrder(orderData);
      
      if (!['PENDING', 'CONFIRMED'].includes(orderData.status)) {
        toast.error("Payment not available", {
          description: "This order cannot be paid at this time",
        });
        router.push(`/Order/${orderId}`);
        return;
      }
    } catch (error) {
      console.error('Failed to load order:', error);
      toast.error("Failed to load order", {
        description: "Please try again later",
      });
      router.push('/Order');
    } finally {
      setIsLoading(false);
    }
  }, [orderId, authLoading, isAuthenticated, router]);

  React.useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  // Handle address input changes
  const handleAddressChange = (type: 'shipping' | 'billing', field: string, value: string) => {
    if (type === 'shipping') {
      setShippingAddress(prev => ({ ...prev, [field]: value }));
      if (useSameBilling) {
        setBillingAddress(prev => ({ ...prev, [field]: value }));
      }
    } else {
      setBillingAddress(prev => ({ ...prev, [field]: value }));
    }
    
    if (formErrors[`${type}.${field}`]) {
      setFormErrors(prev => ({ ...prev, [`${type}.${field}`]: '' }));
    }
  };

  // Handle payment form input changes
  const handlePaymentInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Toggle same billing address
  const handleSameBillingToggle = (checked: boolean) => {
    setUseSameBilling(checked);
    if (checked) {
      setBillingAddress({ ...shippingAddress });
    }
  };

  // Validate address
  const validateAddress = (address: Address, type: 'shipping' | 'billing'): boolean => {
    const errors: Record<string, string> = {};
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'address1', 'city', 'state', 'zipCode'];
    
    requiredFields.forEach(field => {
      if (!address[field as keyof Address] || address[field as keyof Address].trim() === '') {
        errors[`${type}.${field}`] = `${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required`;
      }
    });

    if (address.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email)) {
      errors[`${type}.email`] = 'Please enter a valid email address';
    }

    if (address.phone && !/^\+?[\d\s\-\(\)]{10,}$/.test(address.phone)) {
      errors[`${type}.phone`] = 'Please enter a valid phone number';
    }

    if (address.zipCode && !/^\d{5}(-\d{4})?$/.test(address.zipCode)) {
      errors[`${type}.zipCode`] = 'Please enter a valid ZIP code';
    }

    setFormErrors(prev => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  };

  // Validate payment form
  const validatePaymentForm = (): boolean => {
    const errors: Record<string, string> = {};
    const method = PAYMENT_METHODS[selectedPaymentMethod];
    
    method.fields.forEach(field => {
      const value = formData[field as keyof PaymentFormData];
      
      if (!value || value.trim() === '') {
        errors[field] = `${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required`;
      } else {
        switch (field) {
          case 'cardNumber':
            if (!/^\d{16}$/.test(value.replace(/\s/g, ''))) {
              errors[field] = 'Please enter a valid 16-digit card number';
            }
            break;
          case 'expiryDate':
            if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(value)) {
              errors[field] = 'Please enter date in MM/YY format';  
            }
            break;
          case 'cvv':
            if (!/^\d{3,4}$/.test(value)) {
              errors[field] = 'Please enter a valid CVV';
            }
            break;
          case 'email':
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
              errors[field] = 'Please enter a valid email address';
            }
            break;
        }
      }
    });
    
    setFormErrors(prev => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  };

  // Format card number input
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\D/g, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  // Format expiry date input
  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\D/g, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  // Navigate to next step
  const handleNextStep = () => {
    if (currentStep === "address") {
      const shippingValid = validateAddress(shippingAddress, 'shipping');
      const billingValid = useSameBilling ? true : validateAddress(billingAddress, 'billing');
      
      if (shippingValid && billingValid) {
        setCurrentStep("shipping");
      }
    } else if (currentStep === "shipping") {
      setCurrentStep("payment");
    } else if (currentStep === "payment") {
      if (validatePaymentForm()) {
        setCurrentStep("review");
      }
    }
  };

  // Navigate to previous step
  const handlePreviousStep = () => {
    if (currentStep === "payment") {
      setCurrentStep("shipping");
    } else if (currentStep === "shipping") {
      setCurrentStep("address");
    } else if (currentStep === "review") {
      setCurrentStep("payment");
    }
  };

  // Use useCallback for address change handlers to prevent re-renders
  const handleShippingAddressChange = React.useCallback((field: string, value: string) => {
    setShippingAddress(prev => ({ ...prev, [field]: value }));
    if (useSameBilling) {
      setBillingAddress(prev => ({ ...prev, [field]: value }));
    }
    
    if (formErrors[`shipping.${field}`]) {
      setFormErrors(prev => ({ ...prev, [`shipping.${field}`]: '' }));
    }
  }, [useSameBilling, formErrors]);

  const handleBillingAddressChange = React.useCallback((field: string, value: string) => {
    setBillingAddress(prev => ({ ...prev, [field]: value }));
    
    if (formErrors[`billing.${field}`]) {
      setFormErrors(prev => ({ ...prev, [`billing.${field}`]: '' }));
    }
  }, [formErrors]);

  // Create shipping after successful payment
  const createShipping = async (orderId: string): Promise<Shipping | null> => {
    if (!selectedShipping) {
      console.error('No shipping method selected');
      return null;
    }

    const userId = getUserId();
    if (!userId) {
      console.error('User ID not available for shipping creation');
      toast.error("User authentication error", {
        description: "Unable to create shipping. Please sign in again.",
      });
      return null;
    }

    try {
      console.log('Creating shipping with user ID:', userId);
      
      const shippingRequest: CreateShippingWithAddressRequest = {
        order_id: orderId,
        user_id: userId, // This is required by the backend
        carrier: selectedShipping.carrier,
        shipping_address: {
          first_name: shippingAddress.firstName,
          last_name: shippingAddress.lastName,
          company: "", // Optional field
          address_line1: shippingAddress.address1,
          address_line2: shippingAddress.address2 || "",
          city: shippingAddress.city,
          state: shippingAddress.state,
          postal_code: shippingAddress.zipCode,
          country: shippingAddress.country,
          phone: shippingAddress.phone,
          email: shippingAddress.email
        },
        weight: 1.0, // Default weight - you might want to calculate this from order items
        dimensions: "Standard Package" // Default dimensions
      };

      console.log('Shipping request payload:', JSON.stringify(shippingRequest, null, 2));
      
      const shipping = await shippingService.createShippingWithAddress(shippingRequest);
      
      console.log('Shipping created successfully:', shipping);
      return shipping;
    } catch (error) {
      console.error('Failed to create shipping:', error);
      
      // Provide more specific error handling
      if (error instanceof Error) {
        if (error.message.includes('user_id is required')) {
          toast.error("Authentication required", {
            description: "Please sign in to complete your order.",
          });
        } else if (error.message.includes('shipping address not found')) {
          toast.error("Address validation failed", {
            description: "Please check your shipping address.",
          });
        } else {
          toast.error("Shipping creation failed", {
            description: error.message,
          });
        }
      } else {
        toast.error("Shipping creation failed", {
          description: "An unexpected error occurred. Please try again.",
        });
      }
      
      return null;
    }
  };

  // Process payment
  const handlePayment = async () => {
    if (!order) {
      console.error('No order available for payment');
      return;
    }

    const userId = getUserId();
    if (!userId) {
      toast.error("Authentication required", {
        description: "Please sign in to complete your payment.",
      });
      return;
    }

    setIsProcessingPayment(true);
    
    try {
      console.log('Processing payment for order:', orderId, 'user:', userId);
      
      const paymentRequest: PaymentMethodRequestDto = {
        paymentMethod: selectedPaymentMethod,
        currency: "USD"
      };

      console.log('Payment request:', paymentRequest);
      const response = await paymentService.processOrderPayment(orderId, paymentRequest);
      
      console.log('Payment response:', response);
      
      if (response.success) {
        console.log('Payment successful, creating shipping...');
        
        // Create shipping after successful payment
        const shipping = await createShipping(orderId);
        
        if (shipping) {
          toast.success("Payment and shipping created successfully!", {
            description: `Your order has been paid and shipping has been created with tracking number: ${shipping.trackingNumber || 'TBD'}`,
          });
        } else {
          toast.success("Payment processed successfully!", {
            description: "Your order has been paid. Shipping will be processed shortly.",
          });
        }
        
        // Redirect to order page with success parameter
        router.push(`/Order/${orderId}?payment=success`);
      } else {
        throw new Error(response.message || 'Payment failed');
      }
    } catch (error) {
      console.error('Payment failed:', error);
      
      let errorMessage = "Please try again later";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast.error("Payment failed", {
        description: errorMessage,
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
              <p className="mt-4 text-lg text-muted-foreground">
                Loading payment page...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show auth required state
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <div className="text-center py-20">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-4">Sign in required</h2>
            <p className="text-muted-foreground mb-8">
              Please sign in to complete your payment
            </p>
            <Link href="/auth/sign-in">
              <Button size="lg">Sign In</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
              <p className="mt-4 text-lg text-muted-foreground">
                Loading order details...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <div className="text-center py-20">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-4">Order not found</h2>
            <p className="text-muted-foreground mb-8">
              The order you're trying to pay for could not be found
            </p>
            <Link href="/Order">
              <Button size="lg">View Orders</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href={`/Order/${orderId}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Order
              </Button>
            </Link>
          </div>
          
          <div className="flex items-center gap-2 mb-2">
            <Lock className="h-5 w-5 text-green-600" />
            <span className="text-sm text-green-600 font-medium">Secure Payment</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Complete Your Payment
          </h1>
          <p className="text-muted-foreground">
            Order #{order.id?.slice(0, 8)}... • Total: ${calculateTotal().toFixed(2)}
          </p>
          {user && (
            <p className="text-sm text-muted-foreground">
              Logged in as: {user.email || user.username || 'User'}
            </p>
          )}
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = STEPS.findIndex(s => s.id === currentStep) > index;
              
              return (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center">
                    <div className={`
                      w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors
                      ${isActive ? 'border-primary bg-primary text-primary-foreground' : ''}
                      ${isCompleted ? 'border-green-500 bg-green-500 text-white' : ''}
                      ${!isActive && !isCompleted ? 'border-muted bg-muted text-muted-foreground' : ''}
                    `}>
                      {isCompleted ? <Check className="h-5 w-5" /> : <StepIcon className="h-5 w-5" />}
                    </div>
                    <span className={`mt-2 text-sm font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                      {step.label}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`
                      flex-1 h-0.5 mx-4 transition-colors
                      ${isCompleted ? 'bg-green-500' : 'bg-muted'}
                    `} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="wait">
              {/* Step 1: Address */}
              {currentStep === "address" && (
                <motion.div
                  key="address"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Shipping Address */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Shipping Address
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <AddressForm
                        address={shippingAddress}
                        type="shipping"
                        onChange={handleShippingAddressChange}
                        formErrors={formErrors}
                      />
                    </CardContent>
                  </Card>

                  {/* Billing Address */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <CreditCardIcon className="h-5 w-5" />
                          Billing Address
                        </CardTitle>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="same-billing"
                            checked={useSameBilling}
                            onCheckedChange={handleSameBillingToggle}
                          />
                          <Label htmlFor="same-billing" className="text-sm">
                            Same as shipping address
                          </Label>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {!useSameBilling && (
                        <AddressForm
                          address={billingAddress}
                          type="billing"
                          onChange={handleBillingAddressChange}
                          formErrors={formErrors}
                        />
                      )}
                      {useSameBilling && (
                        <p className="text-muted-foreground text-center py-8">
                          Billing address will be the same as shipping address
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Step 2: Shipping Method */}
              {currentStep === "shipping" && (
                <motion.div
                  key="shipping"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Truck className="h-5 w-5" />
                        Choose Shipping Method
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <RadioGroup
                        value={selectedShippingMethod}
                        onValueChange={setSelectedShippingMethod}
                        className="space-y-4"
                      >
                        {SHIPPING_METHODS.map((method) => (
                          <div key={method.id} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                            <RadioGroupItem value={method.id} id={method.id} />
                            <Label htmlFor={method.id} className="flex items-center justify-between cursor-pointer flex-1">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full">
                                  {method.id === 'same_day' && <Clock className="h-5 w-5 text-primary" />}
                                  {method.id === 'overnight' && <Package className="h-5 w-5 text-primary" />}
                                  {method.id === 'express' && <Truck className="h-5 w-5 text-primary" />}
                                  {method.id === 'standard' && <Package className="h-5 w-5 text-primary" />}
                                </div>
                                <div>
                                  <div className="font-medium">{method.name}</div>
                                  <div className="text-sm text-muted-foreground">{method.carrier}</div>
                                  <div className="text-sm text-muted-foreground">{method.estimatedDays}</div>
                                  <div className="text-xs text-muted-foreground">{method.description}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold">${method.cost.toFixed(2)}</div>
                              </div>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Step 3: Payment Method */}
              {currentStep === "payment" && (
                <motion.div
                  key="payment"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Payment Method Selection */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Payment Method</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <RadioGroup
                        value={selectedPaymentMethod}
                        onValueChange={(value) => setSelectedPaymentMethod(value as PaymentMethod)}
                        className="space-y-3"
                      >
                        {Object.values(PAYMENT_METHODS).map((method) => (
                          <div key={method.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                            <RadioGroupItem value={method.id} id={method.id} />
                            <Label htmlFor={method.id} className="flex items-center gap-3 cursor-pointer flex-1">
                              {React.createElement(method.icon, { className: "h-5 w-5" })}
                              <div>
                                <div className="font-medium">{method.label}</div>
                                <div className="text-sm text-muted-foreground">{method.description}</div>
                              </div>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </CardContent>
                  </Card>

                  {/* Payment Details Form */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Payment Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={selectedPaymentMethod}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-4"
                        >
                          {/* Credit Card / Debit Card Fields */}
                          {(selectedPaymentMethod === "CREDIT_CARD" || selectedPaymentMethod === "DEBIT_CARD") && (
                            <>
                              <div className="space-y-2">
                                <Label htmlFor="cardholderName">Cardholder Name</Label>
                                <Input
                                  id="cardholderName"
                                  placeholder="John Doe"
                                  value={formData.cardholderName || ''}
                                  onChange={(e) => handlePaymentInputChange('cardholderName', e.target.value)}
                                  className={formErrors.cardholderName ? 'border-red-500' : ''}
                                />
                                {formErrors.cardholderName && (
                                  <p className="text-sm text-red-500">{formErrors.cardholderName}</p>
                                )}
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="cardNumber">Card Number</Label>
                                <Input
                                  id="cardNumber"
                                  placeholder="1234 5678 9012 3456"
                                  value={formData.cardNumber || ''}
                                  onChange={(e) => handlePaymentInputChange('cardNumber', formatCardNumber(e.target.value))}
                                  className={formErrors.cardNumber ? 'border-red-500' : ''}
                                  maxLength={19}
                                />
                                {formErrors.cardNumber && (
                                  <p className="text-sm text-red-500">{formErrors.cardNumber}</p>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="expiryDate">Expiry Date</Label>
                                  <Input
                                    id="expiryDate"
                                    placeholder="MM/YY"
                                    value={formData.expiryDate || ''}
                                    onChange={(e) => handlePaymentInputChange('expiryDate', formatExpiryDate(e.target.value))}
                                    className={formErrors.expiryDate ? 'border-red-500' : ''}
                                    maxLength={5}
                                  />
                                  {formErrors.expiryDate && (
                                    <p className="text-sm text-red-500">{formErrors.expiryDate}</p>
                                  )}
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="cvv">CVV</Label>
                                  <Input
                                    id="cvv"
                                    placeholder="123"
                                    value={formData.cvv || ''}
                                    onChange={(e) => handlePaymentInputChange('cvv', e.target.value.replace(/\D/g, ''))}
                                    className={formErrors.cvv ? 'border-red-500' : ''}
                                    maxLength={4}
                                  />
                                  {formErrors.cvv && (
                                    <p className="text-sm text-red-500">{formErrors.cvv}</p>
                                  )}
                                </div>
                              </div>
                            </>
                          )}

                          {/* PayPal Fields */}
                          {selectedPaymentMethod === "PAYPAL" && (
                            <div className="space-y-2">
                              <Label htmlFor="email">PayPal Email</Label>
                              <Input
                                id="email"
                                type="email"
                                placeholder="your@email.com"
                                value={formData.email || ''}
                                onChange={(e) => handlePaymentInputChange('email', e.target.value)}
                                className={formErrors.email ? 'border-red-500' : ''}
                              />
                              {formErrors.email && (
                                <p className="text-sm text-red-500">{formErrors.email}</p>
                              )}
                            </div>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Step 4: Review */}
              {currentStep === "review" && (
                <motion.div
                  key="review"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Review Addresses */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Review Addresses</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium mb-2">Shipping Address</h4>
                          <div className="text-sm space-y-1 text-muted-foreground">
                            <p>{shippingAddress.firstName} {shippingAddress.lastName}</p>
                            <p>{shippingAddress.address1}</p>
                            {shippingAddress.address2 && <p>{shippingAddress.address2}</p>}
                            <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}</p>
                            <p>{shippingAddress.email}</p>
                            <p>{shippingAddress.phone}</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Billing Address</h4>
                          <div className="text-sm space-y-1 text-muted-foreground">
                            {useSameBilling ? (
                              <p className="text-muted-foreground">Same as shipping address</p>
                            ) : (
                              <>
                                <p>{billingAddress.firstName} {billingAddress.lastName}</p>
                                <p>{billingAddress.address1}</p>
                                {billingAddress.address2 && <p>{billingAddress.address2}</p>}
                                <p>{billingAddress.city}, {billingAddress.state} {billingAddress.zipCode}</p>
                                <p>{billingAddress.email}</p>
                                <p>{billingAddress.phone}</p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Review Shipping Method */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Shipping Method</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedShipping && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Truck className="h-5 w-5 text-primary" />
                            <div>
                              <p className="font-medium">{selectedShipping.name}</p>
                              <p className="text-sm text-muted-foreground">{selectedShipping.carrier}</p>
                              <p className="text-sm text-muted-foreground">{selectedShipping.estimatedDays}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">${selectedShipping.cost.toFixed(2)}</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Review Payment Method */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Payment Method</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3">
                        {React.createElement(PAYMENT_METHODS[selectedPaymentMethod].icon, { className: "h-5 w-5" })}
                        <div>
                          <p className="font-medium">{PAYMENT_METHODS[selectedPaymentMethod].label}</p>
                          <p className="text-sm text-muted-foreground">
                            {PAYMENT_METHODS[selectedPaymentMethod].description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={handlePreviousStep}
                disabled={currentStep === "address"}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              
              {currentStep !== "review" ? (
                <Button onClick={handleNextStep}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handlePayment}
                  disabled={isProcessingPayment}
                  size="lg"
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Complete Payment ${calculateTotal().toFixed(2)}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {order.items.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded border">
                        <Image
                          src={getImageUrl(item.productImage) || '/placeholder-product.jpg'}
                          alt={item.productName || 'Product'}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {item.productName || `Product ${item.productId}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <div className="text-sm font-medium">
                        ${item.total.toFixed(2)}
                      </div>
                    </div>
                  ))}
                  
                  {order.items.length > 3 && (
                    <div className="text-xs text-muted-foreground text-center py-1">
                      +{order.items.length - 3} more item{order.items.length - 3 !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>${(order.totalAmount - (order.tax || 0) - (order.shippingCost || 0)).toFixed(2)}</span>
                  </div>
                  {order.tax && order.tax > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Tax</span>
                      <span>${order.tax.toFixed(2)}</span>
                    </div>
                  )}
                  {selectedShipping && (
                    <div className="flex justify-between text-sm">
                      <span>Shipping ({selectedShipping.name})</span>
                      <span>${selectedShipping.cost.toFixed(2)}</span>
                    </div>
                  )}
                  {order.discount && order.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span>-${order.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Info */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-green-600 font-medium">Secure Payment</p>
                    <p>Your payment information is encrypted and secure</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}