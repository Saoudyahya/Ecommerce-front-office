"use client";

import { AnimatePresence, motion } from "framer-motion";
import { 
  Search,
  Filter,
  MapPin,
  Clock,
  Truck,
  Package,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye,
  ChevronDown,
  ChevronRight,
  Calendar,
  User,
  Phone,
  Mail,
  Navigation,
  Loader2,
  ArrowLeft,
  ExternalLink,
  TrendingUp,
  BarChart3,
  MapPinIcon
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import * as React from "react";

import { Button } from "~/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/ui/primitives/card";
import { Input } from "~/ui/primitives/input";
import { Label } from "~/ui/primitives/label";
import { Badge } from "~/ui/primitives/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/ui/primitives/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/ui/primitives/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/ui/primitives/collapsible";
import { Progress } from "~/ui/primitives/progress";
import { toast } from "sonner";

// Import services
import { 
  shippingService, 
  type Shipping, 
  type EnrichedShipping, 
  type UserShippingStats,
  type TrackingResponse,
  type ShipmentTracking
} from "~/service/shipping";
import { useAuth } from "~/lib/hooks/usrAuth";

// Define all shipping statuses as constants for easy reference
const SHIPPING_STATUS_VALUES = [
  'PENDING',
  'CONFIRMED', 
  'PICKED_UP',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'FAILED_DELIVERY',
  'RETURNED',
  'CANCELED'
] as const;

const getImageUrl = (imagePath: string): string => {
  const serverBaseUrl = "http://localhost:8099";
  if (imagePath?.startsWith("/api/")) {
    return `${serverBaseUrl}${imagePath}`;
  }
  return imagePath || "/placeholder-product.jpg";
};

// Types
interface ShippingFilters {
  status?: string;
  carrier?: string;
  dateRange?: string;
  searchQuery?: string;
}

interface ShippingPageProps {
  userId?: string;
}

// API Response type to handle the snake_case from backend
interface ApiUserShippingStats {
  total: number;
  in_transit: number;
  delivered: number;
  delayed: number;
  by_status: Record<string, number>;
}

// Frontend type with camelCase
interface NormalizedUserShippingStats {
  total: number;
  inTransit: number;
  delivered: number;
  delayed: number;
  byStatus: Record<string, number>;
}

// Status configurations - using string keys to avoid enum issues
const STATUS_CONFIG: Record<string, {
  color: string;
  icon: any;
  label: string;
}> = {
  'PENDING': {
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock,
    label: "Pending"
  },
  'CONFIRMED': {
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: CheckCircle,
    label: "Confirmed"
  },
  'PICKED_UP': {
    color: "bg-purple-100 text-purple-800 border-purple-200",
    icon: Package,
    label: "Picked Up"
  },
  'IN_TRANSIT': {
    color: "bg-indigo-100 text-indigo-800 border-indigo-200",
    icon: Truck,
    label: "In Transit"
  },
  'OUT_FOR_DELIVERY': {
    color: "bg-orange-100 text-orange-800 border-orange-200",
    icon: Navigation,
    label: "Out for Delivery"
  },
  'DELIVERED': {
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle,
    label: "Delivered"
  },
  'FAILED_DELIVERY': {
    color: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
    label: "Failed Delivery"
  },
  'RETURNED': {
    color: "bg-gray-100 text-gray-800 border-gray-200",
    icon: RefreshCw,
    label: "Returned"
  },
  'CANCELED': {
    color: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
    label: "Canceled"
  }
};

// Helper function to normalize API response
const normalizeUserStats = (apiStats: ApiUserShippingStats | any): NormalizedUserShippingStats => {
  return {
    total: apiStats?.total || 0,
    inTransit: apiStats?.in_transit || apiStats?.inTransit || 0,
    delivered: apiStats?.delivered || 0,
    delayed: apiStats?.delayed || 0,
    byStatus: apiStats?.by_status || apiStats?.byStatus || {}
  };
};

// Helper function to get user ID compatible with backend
const getUserIdForBackend = (userId: string): string => {
  // If it's already a UUID format, return as-is
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)) {
    return userId;
  }
  
  // Return MongoDB ObjectId as-is - backend will handle conversion
  return userId;
};

// Component for individual shipping card
const ShippingCard = React.memo(({ 
  shipping, 
  onViewDetails
}: { 
  shipping: Shipping;
  onViewDetails: (shipping: Shipping) => void;
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [trackingData, setTrackingData] = React.useState<TrackingResponse | null>(null);
  const [isLoadingTracking, setIsLoadingTracking] = React.useState(false);

  const statusConfig = STATUS_CONFIG[shipping.status];
  const StatusIcon = statusConfig?.icon || Package;
  
  // Calculate progress based on status
  const progress = React.useMemo(() => {
    const progressMap: Record<string, number> = {
      'PENDING': 0,
      'CONFIRMED': 20,
      'PICKED_UP': 40,
      'IN_TRANSIT': 60,
      'OUT_FOR_DELIVERY': 80,
      'DELIVERED': 100,
      'FAILED_DELIVERY': 75,
      'RETURNED': 50,
      'CANCELED': 0
    };
    return progressMap[shipping.status] || 0;
  }, [shipping.status]);

  // Load tracking data when expanded
  const loadTrackingData = async () => {
    if (trackingData || isLoadingTracking) return;

    setIsLoadingTracking(true);
    try {
      const data = await shippingService.trackOrder(shipping.id);
      setTrackingData(data);
    } catch (error) {
      console.error('Failed to load tracking data:', error);
      toast.error("Failed to load tracking information");
    } finally {
      setIsLoadingTracking(false);
    }
  };

  // Handle timeline toggle
  const handleToggleExpanded = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded && !trackingData) {
      loadTrackingData();
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const getProgressLabel = (status: string) => {
    const phaseMap: Record<string, { current: string; next: string }> = {
      'PENDING': { current: 'Order Processing', next: 'Confirmation' },
      'CONFIRMED': { current: 'Confirmed', next: 'Pickup' },
      'PICKED_UP': { current: 'Picked Up', next: 'In Transit' },
      'IN_TRANSIT': { current: 'In Transit', next: 'Out for Delivery' },
      'OUT_FOR_DELIVERY': { current: 'Out for Delivery', next: 'Delivery' },
      'DELIVERED': { current: 'Delivered', next: 'Complete' },
      'FAILED_DELIVERY': { current: 'Delivery Failed', next: 'Retry' },
      'RETURNED': { current: 'Returned', next: 'Processing' },
      'CANCELED': { current: 'Canceled', next: 'None' }
    };
    
    return phaseMap[status] || { current: 'Unknown', next: 'Unknown' };
  };

  const progressLabels = getProgressLabel(shipping.status);

  return (
    <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${statusConfig?.color.split(' ')[0] || 'bg-gray-100'}`}>
              <StatusIcon className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-lg">Order #{shipping.orderId?.slice(0, 8) || shipping.order_id?.slice(0, 8)}...</CardTitle>
              <p className="text-sm text-muted-foreground">
                {shipping.carrier} • {shipping.trackingNumber || shipping.tracking_number || 'No tracking number'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={statusConfig?.color || "bg-gray-100 text-gray-800 border-gray-200"}
            >
              {statusConfig?.label || shipping.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Delivery Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            Current: {progressLabels.current}
            {progressLabels.next !== 'Complete' && progressLabels.next !== 'None' && 
              ` • Next: ${progressLabels.next}`
            }
          </p>
        </div>

        {/* Key Information */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Created</p>
            <p className="font-medium">{formatDate(shipping.createdAt || shipping.created_at)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Estimated Delivery</p>
            <p className="font-medium">
              {(shipping.estimatedDeliveryDate || shipping.estimated_delivery) ? 
                formatDate(shipping.estimatedDeliveryDate || shipping.estimated_delivery) : 
                'Not available'
              }
            </p>
          </div>
        </div>

        {/* Current Location */}
        {(shipping.currentLatitude || shipping.current_latitude) && (shipping.currentLongitude || shipping.current_longitude) && (
          <div className="flex items-center gap-2 text-sm bg-muted/50 p-2 rounded">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>
              Last known location: {(shipping.currentLatitude || shipping.current_latitude)?.toFixed(4)}, {(shipping.currentLongitude || shipping.current_longitude)?.toFixed(4)}
            </span>
            {(shipping.lastLocationUpdate || shipping.last_location_update) && (
              <span className="text-muted-foreground text-xs">
                • Updated {formatDate(shipping.lastLocationUpdate || shipping.last_location_update)}
              </span>
            )}
          </div>
        )}

        {/* Shipping Cost */}
        {(shipping.shippingCost || shipping.shipping_cost) && (shipping.shippingCost || shipping.shipping_cost) > 0 && (
          <div className="flex items-center justify-between text-sm bg-muted/50 p-2 rounded">
            <span>Shipping Cost:</span>
            <span className="font-medium">${(shipping.shippingCost || shipping.shipping_cost)?.toFixed(2)}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(shipping)}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
          
          <Collapsible open={isExpanded} onOpenChange={handleToggleExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm">
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                Tracking
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="mt-4">
              {isLoadingTracking ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading tracking information...
                </div>
              ) : trackingData ? (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Tracking History</h4>
                  <div className="space-y-2">
                    {trackingData.trackingHistory?.length > 0 ? (
                      trackingData.trackingHistory.map((event, index) => (
                        <div 
                          key={event.id || index} 
                          className={`flex items-start gap-3 text-sm p-2 rounded ${
                            index === 0 ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50'
                          }`}
                        >
                          <div className={`
                            w-2 h-2 rounded-full mt-2 flex-shrink-0
                            ${index === 0 ? 'bg-primary' : 'bg-muted-foreground'}
                          `} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{event.status}</span>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(event.timestamp)}
                              </span>
                            </div>
                            {event.location && (
                              <p className="text-muted-foreground">{event.location}</p>
                            )}
                            {event.notes && (
                              <p className="text-xs text-muted-foreground mt-1">{event.notes}</p>
                            )}
                            {event.latitude && event.longitude && (
                              <div className="flex items-center gap-1 mt-1">
                                <MapPinIcon className="h-3 w-3 text-muted-foreground" />
                                <p className="text-xs text-muted-foreground">
                                  {event.latitude.toFixed(4)}, {event.longitude.toFixed(4)}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No tracking events available
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No tracking information available
                </p>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </CardContent>
    </Card>
  );
});

ShippingCard.displayName = 'ShippingCard';

// Main Shipping Page Component
export default function ShippingPage({ userId }: ShippingPageProps) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [shippings, setShippings] = React.useState<Shipping[]>([]);
  const [userStats, setUserStats] = React.useState<NormalizedUserShippingStats | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [filters, setFilters] = React.useState<ShippingFilters>({});
  const [selectedShipping, setSelectedShipping] = React.useState<Shipping | null>(null);
  const [showDetails, setShowDetails] = React.useState(false);

  // Get the current user ID and ensure it's compatible with backend
  const currentUserId = React.useMemo(() => {
    const id = userId || user?.id;
    return id ? getUserIdForBackend(id) : null;
  }, [userId, user?.id]);

  // Load user's shippings
  const loadShippings = React.useCallback(async (refresh = false) => {
    if (!isAuthenticated || authLoading || !currentUserId) return;

    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      console.log('Loading shippings for user:', currentUserId);
      
      // Load user statistics with error handling
      try {
        const statsResponse = await shippingService.getUserShippingStats(currentUserId);
        console.log('User shipping stats response:', statsResponse);
        const normalizedStats = normalizeUserStats(statsResponse);
        console.log('Normalized stats:', normalizedStats);
        setUserStats(normalizedStats);
      } catch (statsError) {
        console.error('Failed to load user stats:', statsError);
        // Continue without stats - don't fail the whole page
        setUserStats(null);
      }

      // Load user's shippings
      const userShippingsResponse = await shippingService.getShippingsByUser(currentUserId, 50, 0);
      console.log('User shippings response:', userShippingsResponse);
      
      // Extract shippings from response - handle both response formats
      const userShippings = userShippingsResponse.shippings || userShippingsResponse.data?.shippings || [];
      setShippings(userShippings);
      
      if (userShippings.length === 0) {
        console.log('No shippings found for user');
      }
    } catch (error) {
      console.error('Failed to load user shippings:', error);
      toast.error("Failed to load shipments", {
        description: error instanceof Error ? error.message : "Please try again later",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isAuthenticated, authLoading, currentUserId]);

  React.useEffect(() => {
    loadShippings();
  }, [loadShippings]);

  // Filter shippings based on current filters
  const filteredShippings = React.useMemo(() => {
    let filtered = [...shippings];

    if (filters.status) {
      filtered = filtered.filter(s => s.status === filters.status);
    }

    if (filters.carrier) {
      filtered = filtered.filter(s => s.carrier.toLowerCase().includes(filters.carrier!.toLowerCase()));
    }

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        (s.orderId || s.order_id)?.toLowerCase().includes(query) ||
        (s.trackingNumber || s.tracking_number)?.toLowerCase().includes(query) ||
        s.carrier.toLowerCase().includes(query)
      );
    }

    if (filters.dateRange) {
      const now = new Date();
      let startDate: Date;

      switch (filters.dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          startDate = new Date(0);
      }

      filtered = filtered.filter(s => new Date(s.createdAt || s.created_at) >= startDate);
    }

    return filtered;
  }, [shippings, filters]);

  // Group shippings by status - with error handling
  const groupedShippings = React.useMemo(() => {
    try {
      return filteredShippings.reduce((grouped, shipping) => {
        const status = shipping.status;
        if (!grouped[status]) {
          grouped[status] = [];
        }
        grouped[status].push(shipping);
        return grouped;
      }, {} as Record<string, Shipping[]>);
    } catch (error) {
      console.error('Error grouping shippings:', error);
      return {};
    }
  }, [filteredShippings]);

  // Handle search
  const handleSearch = (query: string) => {
    setFilters(prev => ({ ...prev, searchQuery: query }));
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof ShippingFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Handle view details
  const handleViewDetails = (shipping: Shipping) => {
    setSelectedShipping(shipping);
    setShowDetails(true);
  };

  // Get statistics from user stats or fallback to calculated stats
  const stats = React.useMemo(() => {
    try {
      if (userStats) {
        return {
          total: userStats.total,
          inTransit: userStats.inTransit,
          delivered: userStats.delivered,
          delayed: userStats.delayed
        };
      }

      // Fallback calculation
      const total = filteredShippings.length;
      const inTransit = filteredShippings.filter(s => 
        ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(s.status)
      ).length;
      const delivered = filteredShippings.filter(s => s.status === 'DELIVERED').length;
      const delayed = filteredShippings.filter(s => {
        const estimatedDate = s.estimatedDeliveryDate || s.estimated_delivery;
        if (!estimatedDate) return false;
        const estimatedDateObj = new Date(estimatedDate);
        const now = new Date();
        return estimatedDateObj < now && s.status !== 'DELIVERED';
      }).length;

      return { total, inTransit, delivered, delayed };
    } catch (error) {
      console.error('Error calculating stats:', error);
      return { total: 0, inTransit: 0, delivered: 0, delayed: 0 };
    }
  }, [filteredShippings, userStats]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-7xl px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
              <p className="mt-4 text-lg text-muted-foreground">
                Loading shipping information...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <div className="text-center py-20">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-4">Sign in required</h2>
            <p className="text-muted-foreground mb-8">
              Please sign in to view your shipments
            </p>
            <Link href="/auth/sign-in">
              <Button size="lg">Sign In</Button>
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Shipments</h1>
            <p className="text-muted-foreground">
              Track and manage all your shipments in one place
              {currentUserId && (
                <span className="ml-2 text-xs text-muted-foreground">
                  User ID: {currentUserId.slice(0, 8)}...
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => loadShippings(true)}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
            <Link href="/Order">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Orders
              </Button>
            </Link>
          </div>
        </div>

        {/* Enhanced Statistics Cards with User Data */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Package className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Shipments</p>
                  {userStats && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Personal shipments
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Truck className="h-8 w-8 text-indigo-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.inTransit}</p>
                  <p className="text-sm text-muted-foreground">In Transit</p>
                  {userStats && (
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className="h-3 w-3 text-blue-500" />
                      <p className="text-xs text-blue-600">Active deliveries</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.delivered}</p>
                  <p className="text-sm text-muted-foreground">Delivered</p>
                  {userStats && userStats.total > 0 && (
                    <p className="text-xs text-green-600 mt-1">
                      {Math.round((stats.delivered / userStats.total) * 100)}% success rate
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-8 w-8 text-red-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.delayed}</p>
                  <p className="text-sm text-muted-foreground">Delayed</p>
                  {userStats && userStats.total > 0 && (
                    <p className="text-xs text-red-600 mt-1">
                      {Math.round((stats.delayed / userStats.total) * 100)}% delayed
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Breakdown Chart (if user stats available) */}
        {userStats && userStats.byStatus && Object.keys(userStats.byStatus).length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Shipment Status Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {Object.entries(userStats.byStatus).map(([status, count]) => {
                  const statusConfig = STATUS_CONFIG[status] || {};
                  const StatusIcon = statusConfig?.icon || Package;
                  const percentage = userStats.total > 0 ? Math.round((count / userStats.total) * 100) : 0;
                  
                  return (
                    <div key={status} className="text-center p-3 rounded-lg bg-muted/50">
                      <StatusIcon className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-lg font-semibold">{count}</p>
                      <p className="text-xs text-muted-foreground">
                        {statusConfig?.label || status}
                      </p>
                      <p className="text-xs text-muted-foreground">({percentage}%)</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Order ID, tracking number..."
                    className="pl-10"
                    value={filters.searchQuery || ''}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={filters.status || 'all'} 
                  onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {SHIPPING_STATUS_VALUES.map(status => (
                      <SelectItem key={status} value={status}>
                        {STATUS_CONFIG[status]?.label || status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Carrier</Label>
                <Input
                  placeholder="FedEx, UPS, etc."
                  value={filters.carrier || ''}
                  onChange={(e) => handleFilterChange('carrier', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Date Range</Label>
                <Select 
                  value={filters.dateRange || 'all'} 
                  onValueChange={(value) => handleFilterChange('dateRange', value === 'all' ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
              <p className="mt-4 text-lg text-muted-foreground">
                Loading your shipments...
              </p>
            </div>
          </div>
        ) : filteredShippings.length === 0 ? (
          <Card>
            <CardContent className="text-center py-20">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No shipments found</h3>
              <p className="text-muted-foreground mb-6">
                {shippings.length === 0 
                  ? "You don't have any shipments yet." 
                  : "No shipments match your current filters."
                }
              </p>
              {shippings.length === 0 && (
                <Link href="/Order">
                  <Button>View Orders</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="list" className="space-y-6">
            <TabsList>
              <TabsTrigger value="list">List View</TabsTrigger>
              <TabsTrigger value="grouped">Grouped by Status</TabsTrigger>
            </TabsList>
            
            <TabsContent value="list" className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredShippings.length} of {shippings.length} shipments
                </p>
              </div>
              <AnimatePresence>
                {filteredShippings.map((shipping) => (
                  <motion.div
                    key={shipping.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ShippingCard
                      shipping={shipping}
                      onViewDetails={handleViewDetails}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </TabsContent>
            
            <TabsContent value="grouped" className="space-y-6">
              {Object.entries(groupedShippings).map(([status, statusShippings]) => {
                if (statusShippings.length === 0) return null;
                
                const statusConfig = STATUS_CONFIG[status] || {};
                
                return (
                  <div key={status}>
                    <div className="flex items-center gap-2 mb-4">
                      {statusConfig?.icon && React.createElement(statusConfig.icon, { className: "h-5 w-5" })}
                      <h3 className="text-lg font-semibold">
                        {statusConfig?.label || status} ({statusShippings.length})
                      </h3>
                      {userStats && userStats.byStatus && userStats.byStatus[status] && (
                        <Badge variant="secondary" className="ml-2">
                          {Math.round((statusShippings.length / filteredShippings.length) * 100)}%
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-4">
                      {statusShippings.map((shipping) => (
                        <ShippingCard
                          key={shipping.id}
                          shipping={shipping}
                          onViewDetails={handleViewDetails}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </TabsContent>
          </Tabs>
        )}

        {/* Shipping Details Modal/Sheet */}
        {selectedShipping && showDetails && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
            <div className="fixed inset-4 md:inset-8 bg-background border rounded-lg shadow-lg overflow-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">Shipping Details</h2>
                  <Button variant="ghost" onClick={() => setShowDetails(false)}>
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Detailed shipping information */}
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-2">Basic Information</h3>
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium">Order ID:</span> {selectedShipping.orderId || selectedShipping.order_id}</p>
                        <p><span className="font-medium">Tracking Number:</span> {selectedShipping.trackingNumber || selectedShipping.tracking_number || 'Not available'}</p>
                        <p><span className="font-medium">Carrier:</span> {selectedShipping.carrier}</p>
                        <p><span className="font-medium">Status:</span> {selectedShipping.status}</p>
                        <p><span className="font-medium">Weight:</span> {selectedShipping.weight || 'Not specified'} kg</p>
                        <p><span className="font-medium">Dimensions:</span> {selectedShipping.dimensions || 'Not specified'}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-2">Dates & Location</h3>
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium">Created:</span> {new Date(selectedShipping.createdAt || selectedShipping.created_at).toLocaleString()}</p>
                        <p><span className="font-medium">Updated:</span> {new Date(selectedShipping.updatedAt || selectedShipping.updated_at).toLocaleString()}</p>
                        {(selectedShipping.estimatedDeliveryDate || selectedShipping.estimated_delivery) && (
                          <p><span className="font-medium">Estimated Delivery:</span> {new Date(selectedShipping.estimatedDeliveryDate || selectedShipping.estimated_delivery).toLocaleString()}</p>
                        )}
                        {(selectedShipping.currentLatitude || selectedShipping.current_latitude) && (selectedShipping.currentLongitude || selectedShipping.current_longitude) && (
                          <p><span className="font-medium">Current Location:</span> {(selectedShipping.currentLatitude || selectedShipping.current_latitude)?.toFixed(6)}, {(selectedShipping.currentLongitude || selectedShipping.current_longitude)?.toFixed(6)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {(selectedShipping.shippingCost || selectedShipping.shipping_cost) && (selectedShipping.shippingCost || selectedShipping.shipping_cost) > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Cost Information</h3>
                      <p className="text-lg font-bold">${(selectedShipping.shippingCost || selectedShipping.shipping_cost)?.toFixed(2)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}