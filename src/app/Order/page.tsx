"use client";

import { AnimatePresence, motion } from "framer-motion";
import { 
  ArrowLeft, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Eye, 
  Loader2, 
  Package, 
  ShoppingBag, 
  Truck,
  X,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";

import { cn } from "~/lib/cn";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/ui/primitives/card";
import { Separator } from "~/ui/primitives/separator";
import { toast } from "sonner";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/ui/primitives/select";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/ui/primitives/alert-dialog";

// Import your services and hooks
import { orderService, type EnrichedOrderResponse, type OrderStatus } from "~/service/Order";
import { useAuth } from "~/lib/hooks/usrAuth"; // Import the useAuth hook

// Simple Badge component (in case you don't have one)
const Badge = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <span className={cn(
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
    className
  )}>
    {children}
  </span>
);

// Get image URL helper - adjust to your needs
const getImageUrl = (imagePath: string): string => {
  // Adjust this to match your image service URL
  const serverBaseUrl = 'http://localhost:8099';
  
  if (imagePath?.startsWith('/api/')) {
    return `${serverBaseUrl}${imagePath}`;
  }
  
  return imagePath || '/placeholder-product.jpg';
};

// Order status configurations
const ORDER_STATUS_CONFIG = {
  PENDING: {
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock,
    label: "Pending",
    description: "Order is being processed"
  },
  CONFIRMED: {
    color: "bg-blue-100 text-blue-800",
    icon: CheckCircle,
    label: "Confirmed",
    description: "Order has been confirmed"
  },
  PROCESSING: {
    color: "bg-purple-100 text-purple-800",
    icon: Package,
    label: "Processing",
    description: "Order is being prepared"
  },
  SHIPPED: {
    color: "bg-indigo-100 text-indigo-800",
    icon: Truck,
    label: "Shipped",
    description: "Order is on its way"
  },
  DELIVERED: {
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
    label: "Delivered",
    description: "Order has been delivered"
  },
  CANCELLED: {
    color: "bg-red-100 text-red-800",
    icon: X,
    label: "Cancelled",
    description: "Order has been cancelled"
  },
  RETURNED: {
    color: "bg-orange-100 text-orange-800",
    icon: RefreshCw,
    label: "Returned",
    description: "Order has been returned"
  },
  REFUNDED: {
    color: "bg-gray-100 text-gray-800",
    icon: RefreshCw,
    label: "Refunded",
    description: "Order has been refunded"
  }
} as const;

interface OrdersPageProps {
  userId?: string;
}

export default function OrdersPageComponent({ userId }: OrdersPageProps) {
  // Use the auth hook instead of manual authentication
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [orders, setOrders] = React.useState<EnrichedOrderResponse[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [selectedStatus, setSelectedStatus] = React.useState<string>("all");
  const [cancelOrderId, setCancelOrderId] = React.useState<string | null>(null);
  const [processingOrderId, setProcessingOrderId] = React.useState<string | null>(null);

  // Get current user ID - prefer passed userId, then from auth hook
  const currentUserId = userId || user?.id;

  // Load orders
  const loadOrders = React.useCallback(async () => {
    // Don't try to load orders if still checking auth or not authenticated
    if (authLoading || !isAuthenticated || !currentUserId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      console.log('Loading orders for user:', currentUserId);
      
      const response = await orderService.getUserOrdersBatch({
        userId: currentUserId,
        status: selectedStatus === 'all' ? undefined : selectedStatus,
        includeProducts: true,
        limit: 50
      });

      console.log('Orders loaded:', response);
      setOrders(response.orders || []);
      
      if (response.failed > 0) {
        toast.warning("Some orders failed to load", {
          description: `${response.failed} orders could not be loaded`,
        });
      }
      
    } catch (error) {
      console.error('Failed to load orders:', error);
      toast.error("Failed to load orders", {
        description: "Please try again later",
      });
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [authLoading, isAuthenticated, currentUserId, selectedStatus]);

  // Load orders when authentication is ready and when filters change
  React.useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Update order status
  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    if (!isAuthenticated) {
      toast.error("Authentication required", {
        description: "Please sign in to update orders",
        action: {
          label: "Sign In",
          onClick: () => window.location.href = '/auth/sign-in'
        }
      });
      return;
    }

    setIsUpdating(true);
    setProcessingOrderId(orderId);
    
    try {
      await orderService.updateOrderStatus(orderId, { status: newStatus });
      
      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus }
          : order
      ));
      
      toast.success("Order updated", {
        description: `Order status changed to ${newStatus.toLowerCase()}`,
      });
      
    } catch (error) {
      console.error('Failed to update order status:', error);
      toast.error("Failed to update order", {
        description: "Please try again later",
      });
    } finally {
      setIsUpdating(false);
      setProcessingOrderId(null);
    }
  };

  // Cancel order
  const cancelOrder = async (orderId: string) => {
    await updateOrderStatus(orderId, 'CANCELLED');
    setCancelOrderId(null);
  };

  // Continue with order (change status to CONFIRMED)
  const continueOrder = async (orderId: string) => {
    await updateOrderStatus(orderId, 'CONFIRMED');
  };

  // Get filtered orders
  const filteredOrders = React.useMemo(() => {
    if (selectedStatus === 'all') return orders;
    return orders.filter(order => order.status === selectedStatus);
  }, [orders, selectedStatus]);

  // Get status badge component
  const getStatusBadge = (status: string) => {
    const config = ORDER_STATUS_CONFIG[status as keyof typeof ORDER_STATUS_CONFIG];
    if (!config) return null;

    const Icon = config.icon;
    return (
      <Badge className={cn("flex items-center gap-1", config.color)}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // Check if order can be cancelled
  const canCancelOrder = (order: EnrichedOrderResponse) => {
    return ['PENDING', 'CONFIRMED'].includes(order.status);
  };

  // Check if order can be continued
  const canContinueOrder = (order: EnrichedOrderResponse) => {
    return order.status === 'PENDING';
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-7xl px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
              <p className="mt-4 text-lg text-muted-foreground">
                Checking authentication...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show auth required state
  if (!isAuthenticated || !currentUserId) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-7xl px-4 py-8">
          <div className="text-center py-20">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-4">Sign in required</h2>
            <p className="text-muted-foreground mb-8">
              Please sign in to view your order history
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/auth/sign-in">
                <Button size="lg">Sign In</Button>
              </Link>
              <Link href="/products">
                <Button variant="outline" size="lg">
                  Continue Shopping
                </Button>
              </Link>
            </div>
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
            <Link href="/products">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Shopping
              </Button>
            </Link>
            <Link href="/cart">
              <Button variant="outline" size="sm">
                <ShoppingBag className="h-4 w-4 mr-2" />
                View Cart
              </Button>
            </Link>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                My Orders
              </h1>
              <p className="text-muted-foreground">
                Welcome back, {user?.name || user?.email}!
              </p>
              <p className="text-muted-foreground">
                {isLoading 
                  ? "Loading your orders..." 
                  : `${filteredOrders.length} order${filteredOrders.length !== 1 ? 's' : ''} found`
                }
              </p>
            </div>
            
            {/* Status Filter */}
            <div className="flex items-center gap-4">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Orders</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="PROCESSING">Processing</SelectItem>
                  <SelectItem value="SHIPPED">Shipped</SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                onClick={loadOrders}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {isLoading ? (
          /* Loading State */
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
              <p className="mt-4 text-lg text-muted-foreground">
                Loading your orders...
              </p>
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="mb-8 flex h-32 w-32 items-center justify-center rounded-full bg-muted mx-auto">
              <Package className="h-16 w-16 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-semibold mb-4">
              {selectedStatus === 'all' ? 'No orders found' : `No ${selectedStatus.toLowerCase()} orders`}
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              {selectedStatus === 'all' 
                ? "You haven't placed any orders yet. Start shopping to see your orders here!"
                : `You don't have any ${selectedStatus.toLowerCase()} orders at the moment.`
              }
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/products">
                <Button size="lg">
                  Start Shopping
                </Button>
              </Link>
              {selectedStatus !== 'all' && (
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => setSelectedStatus('all')}
                >
                  View All Orders
                </Button>
              )}
            </div>
          </motion.div>
        ) : (
          /* Orders List */
          <div className="space-y-6">
            <AnimatePresence>
              {filteredOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <Card className={cn(
                    "transition-all duration-200",
                    isUpdating && processingOrderId === order.id && "opacity-50"
                  )}>
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div>
                            <CardTitle className="text-lg">
                              Order #{order.id?.slice(0, 8)}...
                            </CardTitle>
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {new Date(order.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          {getStatusBadge(order.status)}
                        </div>
                        
                        <div className="text-right">
                          <div className="text-lg font-semibold">
                            ${order.totalAmount.toFixed(2)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      {/* Order Items */}
                      <div className="space-y-3 mb-4">
                        {order.items.slice(0, 3).map((item) => (
                          <div key={item.id} className="flex items-center gap-3">
                            <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md border">
                              <Image
                                src={getImageUrl(item.productImage || '')}
                                alt={item.productName || 'Product'}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {item.productName || `Product ${item.productId}`}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Qty: {item.quantity} × ${item.priceAtPurchase.toFixed(2)}
                              </p>
                            </div>
                            <div className="font-medium">
                              ${item.total.toFixed(2)}
                            </div>
                          </div>
                        ))}
                        
                        {order.items.length > 3 && (
                          <div className="text-sm text-muted-foreground text-center py-2">
                            +{order.items.length - 3} more item{order.items.length - 3 !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                      
                      <Separator className="my-4" />
                      
                      {/* Order Actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Link href={`/orders/${order.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                          </Link>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {canContinueOrder(order) && (
                            <Button
                              size="sm"
                              onClick={() => continueOrder(order.id)}
                              disabled={isUpdating}
                            >
                              {isUpdating && processingOrderId === order.id ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <CheckCircle className="h-4 w-4 mr-2" />
                              )}
                              Continue Order
                            </Button>
                          )}
                          
                          {canCancelOrder(order) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCancelOrderId(order.id)}
                              disabled={isUpdating}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Cancel Order
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Cancel Order Confirmation Dialog */}
      <AlertDialog open={!!cancelOrderId} onOpenChange={() => setCancelOrderId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this order? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Order</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancelOrderId && cancelOrder(cancelOrderId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Cancel Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}