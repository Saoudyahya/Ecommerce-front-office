"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Heart, 
  Share2, 
  Star, 
  ShoppingCart, 
  Loader2, 
  AlertCircle,
  Plus,
  Minus,
  Truck,
  Shield,
  RotateCcw,
  Edit2,
  Trash2,
  MessageSquare,
  Filter,
  ChevronDown
} from "lucide-react";
import { Button } from "~/ui/primitives/button";
import { Input } from "~/ui/primitives/input";
import { Textarea } from "~/ui/primitives/Textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/ui/primitives/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/ui/primitives/select";
import { Badge } from "~/ui/primitives/badge";
import { Separator } from "~/ui/primitives/separator";
import { useCart } from "~/lib/hooks/use-cart";
import { useAuth } from "~/lib/hooks/usrAuth";
import { productService, Product } from "../../../service/product";
import { reviewService, Review, ReviewSummary, ReviewStats, ReviewSortBy, CreateReviewRequest, UpdateReviewRequest } from "../../../service/Review";
import { Product_Service_URL } from "~/lib/apiEndPoints";

/* -------------------------------------------------------------------------- */
/*                                Component                                   */
/* -------------------------------------------------------------------------- */

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addItem } = useCart();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Get user ID from authenticated user
  const currentUserId = user?.id || "";
  
  // Product state
  const [product, setProduct] = React.useState<Product | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = React.useState(0);
  const [quantity, setQuantity] = React.useState(1);
  const [activeTab, setActiveTab] = React.useState<'description' | 'reviews' | 'shipping'>('description');
  const [isInWishlist, setIsInWishlist] = React.useState(false);

  // Review state
  const [reviews, setReviews] = React.useState<ReviewSummary[]>([]);
  const [reviewStats, setReviewStats] = React.useState<ReviewStats | null>(null);
  const [reviewsLoading, setReviewsLoading] = React.useState(false);
  const [reviewsError, setReviewsError] = React.useState<string | null>(null);
  
  // Review form state
  const [showReviewDialog, setShowReviewDialog] = React.useState(false);
  const [editingReview, setEditingReview] = React.useState<Review | null>(null);
  const [newReview, setNewReview] = React.useState<CreateReviewRequest>({
    userId: currentUserId,
    productId: "",
    rating: 5,
    comment: ""
  });
  
  // Review filters and sorting
  const [reviewSort, setReviewSort] = React.useState<ReviewSortBy>(ReviewSortBy.NEWEST);
  const [reviewFilter, setReviewFilter] = React.useState({
    verified: null as boolean | null,
    minRating: null as number | null
  });

  const productId = params.id as string;

  /* ------------------------ Update User ID when Auth Changes --------------------------- */
  React.useEffect(() => {
    setNewReview(prev => ({
      ...prev,
      userId: currentUserId
    }));
  }, [currentUserId]);

  /* ------------------------ Load Product Data --------------------------- */
  React.useEffect(() => {
    if (productId) {
      loadProductData();
      loadReviewData();
    }
  }, [productId]);

  const loadProductData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const products = await productService.getAllProducts();
      const foundProduct = products.find(p => p.id === productId);
      
      if (!foundProduct) {
        setError("Product not found");
        return;
      }
      
      setProduct(foundProduct);
      setNewReview(prev => ({ ...prev, productId }));
    } catch (err) {
      console.error("Error loading product:", err);
      setError(err instanceof Error ? err.message : "Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  const loadReviewData = async () => {
    try {
      setReviewsLoading(true);
      setReviewsError(null);
      
      // Load reviews and stats in parallel
      const [reviewsData, statsData] = await Promise.all([
        reviewService.getReviewsByProductId(productId),
        reviewService.getProductReviewStatistics(productId).catch(() => null)
      ]);
      
      setReviews(reviewsData);
      setReviewStats(statsData);
    } catch (err) {
      console.error("Error loading reviews:", err);
      setReviewsError(err instanceof Error ? err.message : "Failed to load reviews");
    } finally {
      setReviewsLoading(false);
    }
  };

  /* --------------------------- Review Handlers -------------------------- */
  const handleCreateReview = async () => {
    if (!isAuthenticated) {
      alert("Please sign in to write a review");
      return;
    }

    try {
      if (!newReview.comment.trim()) {
        alert("Please add a comment to your review");
        return;
      }

      const reviewData = {
        ...newReview,
        userId: currentUserId // Ensure we use the current user ID
      };

      const createdReview = await reviewService.createReview(reviewData);
      
      // Reload reviews to get updated data
      await loadReviewData();
      
      // Reset form
      setNewReview(prev => ({
        ...prev,
        rating: 5,
        comment: ""
      }));
      setShowReviewDialog(false);
      
      alert("Review submitted successfully!");
    } catch (err) {
      console.error("Error creating review:", err);
      alert(err instanceof Error ? err.message : "Failed to submit review");
    }
  };

  const handleEditReview = async (review: Review) => {
    if (!isAuthenticated || review.userId !== currentUserId) {
      alert("You can only edit your own reviews");
      return;
    }

    setEditingReview(review);
    setNewReview({
      userId: currentUserId,
      productId: review.productId,
      rating: review.rating,
      comment: review.comment
    });
    setShowReviewDialog(true);
  };

  const handleUpdateReview = async () => {
    if (!editingReview || !isAuthenticated) return;
    
    try {
      const updateData: UpdateReviewRequest = {
        rating: newReview.rating,
        comment: newReview.comment
      };
      
      await reviewService.partialUpdateReview(editingReview.id, updateData);
      
      // Reload reviews
      await loadReviewData();
      
      // Reset form
      setEditingReview(null);
      setNewReview(prev => ({
        ...prev,
        rating: 5,
        comment: ""
      }));
      setShowReviewDialog(false);
      
      alert("Review updated successfully!");
    } catch (err) {
      console.error("Error updating review:", err);
      alert(err instanceof Error ? err.message : "Failed to update review");
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!isAuthenticated) {
      alert("Please sign in to delete reviews");
      return;
    }

    if (!confirm("Are you sure you want to delete this review?")) {
      return;
    }
    
    try {
      await reviewService.deleteReview(reviewId);
      await loadReviewData();
      alert("Review deleted successfully!");
    } catch (err) {
      console.error("Error deleting review:", err);
      alert(err instanceof Error ? err.message : "Failed to delete review");
    }
  };

  const closeReviewDialog = () => {
    setShowReviewDialog(false);
    setEditingReview(null);
    setNewReview(prev => ({
      ...prev,
      rating: 5,
      comment: ""
    }));
  };

  /* ----------------------- Review Processing ---------------------------- */
  const processedReviews = React.useMemo(() => {
    let filtered = [...reviews];
    
    // Apply filters
    if (reviewFilter.verified !== null) {
      filtered = filtered.filter(r => r.verified === reviewFilter.verified);
    }
    
    if (reviewFilter.minRating !== null) {
      filtered = filtered.filter(r => r.rating >= reviewFilter.minRating!);
    }
    
    // Apply sorting
    return reviewService.sortReviews(filtered, reviewSort);
  }, [reviews, reviewSort, reviewFilter]);

  const userHasReviewed = React.useMemo(() => {
    return currentUserId ? reviews.some(review => review.userId === currentUserId) : false;
  }, [reviews, currentUserId]);

  const canWriteReview = isAuthenticated && !userHasReviewed && !authLoading;

  /* --------------------------- Other Handlers --------------------------- */
  const handleAddToCart = () => {
    if (!product) return;
    
    addItem(
      {
        category: product.categories[0]?.name || 'Uncategorized',
        id: product.id,
        image: product.images[0] || "",
        name: product.name,
        price: product.price,
      },
      quantity
    );
  };

  const handleAddToWishlist = () => {
    if (!isAuthenticated) {
      alert("Please sign in to add items to wishlist");
      return;
    }

    setIsInWishlist(!isInWishlist);
    console.log(`${isInWishlist ? 'Removed from' : 'Added to'} wishlist:`, product?.name);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name,
          text: product?.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Product link copied to clipboard!');
    }
  };

  const incrementQuantity = () => {
    if (product && quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const calculateSavings = () => {
    if (!product) return null;
    
    const activeDiscounts = product.discounts.filter(discount => {
      const now = new Date();
      const startDate = new Date(discount.startDate);
      const endDate = new Date(discount.endDate);
      return now >= startDate && now <= endDate;
    });

    if (activeDiscounts.length === 0) return null;

    const totalDiscount = activeDiscounts.reduce((total, discount) => {
      if (discount.discountType === 'PERCENTAGE') {
        return total + (product.price * discount.discountValue / 100);
      } else if (discount.discountType === 'FIXED_AMOUNT') {
        return total + discount.discountValue;
      }
      return total;
    }, 0);

    const originalPrice = product.price + totalDiscount;
    return {
      originalPrice,
      savings: totalDiscount,
      percentage: Math.round((totalDiscount / originalPrice) * 100)
    };
  };

  const getImageUrl = (imagePath: string): string => {
    const serverBaseUrl = Product_Service_URL.replace('/api/products', '');
    
    if (imagePath.startsWith('/api/')) {
      return `${serverBaseUrl}${imagePath}`;
    }
    return imagePath;
  };

  /* ----------------------------- Render --------------------------------- */

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-lg text-muted-foreground">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
          <h2 className="mt-4 text-xl font-semibold">Product Not Found</h2>
          <p className="mt-2 text-muted-foreground">
            {error || "The product you're looking for doesn't exist."}
          </p>
          <Button 
            onClick={() => router.push('/products')}
            className="mt-6"
            variant="outline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  const averageRating = reviewStats?.averageRating || 0;
  const totalReviews = reviewStats?.totalReviews || 0;
  const savings = calculateSavings();
  const isInStock = product.status === 'ACTIVE' && product.stock > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container px-4 py-4 md:px-6">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container px-4 py-8 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-square overflow-hidden rounded-lg border bg-gray-100">
              {product.images.length > 0 ? (
                <img
                  src={getImageUrl(product.images[selectedImageIndex])}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-gray-500">
                  No Image Available
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`
                      aspect-square overflow-hidden rounded-md border-2 transition-all
                      ${index === selectedImageIndex 
                        ? 'border-primary ring-2 ring-primary ring-offset-2' 
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <img
                      src={getImageUrl(image)}
                      alt={`${product.name} ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    {product.categories[0]?.name || 'Uncategorized'}
                  </p>
                  <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleAddToWishlist}
                    className={isInWishlist ? 'text-red-500' : ''}
                    disabled={!isAuthenticated}
                    title={!isAuthenticated ? "Sign in to add to wishlist" : ""}
                  >
                    <Heart className={`h-4 w-4 ${isInWishlist ? 'fill-current' : ''}`} />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleShare}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Rating */}
              <div className="mt-4 flex items-center space-x-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(averageRating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : i < averageRating
                          ? 'fill-yellow-400/50 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {averageRating.toFixed(1)} ({totalReviews} reviews)
                </span>
              </div>

              {/* User Info (for debugging) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-2 text-xs text-muted-foreground">
                  {isAuthenticated ? `Signed in as: ${user?.username} (ID: ${currentUserId})` : 'Not signed in'}
                </div>
              )}
            </div>

            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <span className="text-3xl font-bold">${product.price.toFixed(2)}</span>
                {savings && (
                  <span className="text-lg text-muted-foreground line-through">
                    ${savings.originalPrice.toFixed(2)}
                  </span>
                )}
              </div>
              {savings && (
                <div className="flex items-center space-x-2">
                  <span className="rounded-full bg-red-100 px-2 py-1 text-sm font-medium text-red-800">
                    Save ${savings.savings.toFixed(2)} ({savings.percentage}% off)
                  </span>
                </div>
              )}
            </div>

            {/* Stock Status */}
            <div className="flex items-center space-x-2">
              <div className={`h-3 w-3 rounded-full ${isInStock ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className={`text-sm font-medium ${isInStock ? 'text-green-700' : 'text-red-700'}`}>
                {isInStock ? `In Stock (${product.stock} available)` : 'Out of Stock'}
              </span>
            </div>

            {/* Quantity & Add to Cart */}
            {isInStock && (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-medium">Quantity:</label>
                  <div className="flex items-center border rounded-md">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={decrementQuantity}
                      disabled={quantity <= 1}
                      className="h-8 w-8"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      min="1"
                      max={product.stock}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, parseInt(e.target.value) || 1)))}
                      className="w-16 border-0 text-center focus-visible:ring-0"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={incrementQuantity}
                      disabled={quantity >= product.stock}
                      className="h-8 w-8"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={handleAddToCart}
                  className="w-full"
                  size="lg"
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Add to Cart - ${(product.price * quantity).toFixed(2)}
                </Button>
              </div>
            )}

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t">
              <div className="text-center">
                <Truck className="mx-auto h-6 w-6 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium">Free Shipping</p>
                <p className="text-xs text-muted-foreground">On orders over $50</p>
              </div>
              <div className="text-center">
                <Shield className="mx-auto h-6 w-6 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium">Warranty</p>
                <p className="text-xs text-muted-foreground">1 year coverage</p>
              </div>
              <div className="text-center">
                <RotateCcw className="mx-auto h-6 w-6 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium">Returns</p>
                <p className="text-xs text-muted-foreground">30 day returns</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mt-16">
          <div className="border-b">
            <nav className="flex space-x-8">
              {[
                { id: 'description', label: 'Description' },
                { id: 'reviews', label: `Reviews (${totalReviews})` },
                { id: 'shipping', label: 'Shipping' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="py-8">
            {activeTab === 'description' && (
              <div className="prose max-w-none">
                <p className="text-muted-foreground leading-relaxed">
                  {product.description || 'No description available for this product.'}
                </p>
                
                {product.sku && (
                  <div className="mt-6 p-4 bg-muted rounded-lg">
                    <h4 className="font-medium">Product Details</h4>
                    <dl className="mt-2 space-y-1">
                      <div className="flex justify-between">
                        <dt className="text-sm text-muted-foreground">SKU:</dt>
                        <dd className="text-sm font-mono">{product.sku}</dd>
                      </div>
                      {product.weight && (
                        <div className="flex justify-between">
                          <dt className="text-sm text-muted-foreground">Weight:</dt>
                          <dd className="text-sm">{product.weight}g</dd>
                        </div>
                      )}
                      {product.dimensions && (
                        <div className="flex justify-between">
                          <dt className="text-sm text-muted-foreground">Dimensions:</dt>
                          <dd className="text-sm">{product.dimensions}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6">
                {/* Review Summary */}
                {reviewStats && (
                  <div className="bg-muted/50 p-6 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Review Summary</h3>
                        <div className="flex items-center space-x-4 mb-4">
                          <div className="text-4xl font-bold">{averageRating.toFixed(1)}</div>
                          <div>
                            <div className="flex items-center mb-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-5 w-5 ${
                                    i < Math.floor(averageRating)
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <p className="text-sm text-muted-foreground">{totalReviews} total reviews</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {Object.entries(reviewStats.ratingDistribution)
                            .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
                            .map(([rating, count]) => {
                              const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                              return (
                                <div key={rating} className="flex items-center space-x-2">
                                  <span className="text-sm w-16">{rating} ⭐</span>
                                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-yellow-400 h-2 rounded-full" 
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                  <span className="text-sm text-muted-foreground w-8">{count}</span>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                      
                      <div>
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div className="p-4 bg-background rounded-lg">
                            <div className="text-2xl font-bold text-green-600">{reviewStats.verifiedReviews}</div>
                            <p className="text-sm text-muted-foreground">Verified Reviews</p>
                          </div>
                          <div className="p-4 bg-background rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">{reviewStats.unverifiedReviews}</div>
                            <p className="text-sm text-muted-foreground">Unverified Reviews</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Review Actions */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    {/* Sort and Filter */}
                    <Select value={reviewSort} onValueChange={(value) => setReviewSort(value as ReviewSortBy)}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ReviewSortBy.NEWEST}>Newest First</SelectItem>
                        <SelectItem value={ReviewSortBy.OLDEST}>Oldest First</SelectItem>
                        <SelectItem value={ReviewSortBy.HIGHEST_RATING}>Highest Rating</SelectItem>
                        <SelectItem value={ReviewSortBy.LOWEST_RATING}>Lowest Rating</SelectItem>
                        <SelectItem value={ReviewSortBy.MOST_HELPFUL}>Most Helpful</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={reviewFilter.verified?.toString() || "all"} onValueChange={(value) => 
                      setReviewFilter(prev => ({ 
                        ...prev, 
                        verified: value === "all" ? null : value === "true" 
                      }))
                    }>
                      <SelectTrigger className="w-32">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Filter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Reviews</SelectItem>
                        <SelectItem value="true">Verified Only</SelectItem>
                        <SelectItem value="false">Unverified Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Add Review Button */}
                  {canWriteReview ? (
                    <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
                      <DialogTrigger asChild>
                        <Button>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Write a Review
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>
                            {editingReview ? 'Edit Review' : 'Write a Review'}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">Rating</label>
                            <div className="flex items-center space-x-1 mt-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                                  className="focus:outline-none"
                                >
                                  <Star
                                    className={`h-6 w-6 ${
                                      star <= newReview.rating
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300 hover:text-yellow-400'
                                    }`}
                                  />
                                </button>
                              ))}
                              <span className="ml-2 text-sm text-muted-foreground">
                                {newReview.rating} star{newReview.rating !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium">Comment</label>
                            <Textarea
                              placeholder="Share your experience with this product..."
                              value={newReview.comment}
                              onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                              className="mt-1"
                              rows={4}
                            />
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button 
                              onClick={editingReview ? handleUpdateReview : handleCreateReview}
                              className="flex-1"
                            >
                              {editingReview ? 'Update Review' : 'Submit Review'}
                            </Button>
                            <Button variant="outline" onClick={closeReviewDialog}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  ) : !isAuthenticated ? (
                    <Button disabled>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Sign in to Review
                    </Button>
                  ) : userHasReviewed ? (
                    <Button disabled>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      You've Already Reviewed
                    </Button>
                  ) : null}
                </div>

                {/* Reviews List */}
                {reviewsLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                    <p className="mt-2 text-muted-foreground">Loading reviews...</p>
                  </div>
                ) : reviewsError ? (
                  <div className="text-center py-8">
                    <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
                    <p className="mt-2 text-destructive">{reviewsError}</p>
                  </div>
                ) : processedReviews.length > 0 ? (
                  <div className="space-y-6">
                    {processedReviews.map((review) => (
                      <div key={review.id} className="border rounded-lg p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < review.rating
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              {review.verified && (
                                <Badge variant="secondary" className="bg-green-100 text-green-800">
                                  <Shield className="w-3 h-3 mr-1" />
                                  Verified Purchase
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-muted-foreground mb-2">
                              {review.commentPreview}
                            </p>
                            
                            <p className="text-sm text-muted-foreground">
                              {reviewService.formatReviewDate(review.createdAt)}
                            </p>
                          </div>
                          
                          {review.userId === currentUserId && isAuthenticated && (
                            <div className="flex space-x-2 ml-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  const fullReview = await reviewService.getReviewById(review.id);
                                  handleEditReview(fullReview);
                                }}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteReview(review.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium">No reviews yet</h3>
                    <p className="text-muted-foreground">Be the first to review this product!</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'shipping' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">Shipping Options</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Standard Shipping</span>
                        <span>5-7 business days - Free</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Express Shipping</span>
                        <span>2-3 business days - $9.99</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Overnight Shipping</span>
                        <span>1 business day - $19.99</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Return Policy</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>• 30-day return window</p>
                      <p>• Free return shipping</p>
                      <p>• Items must be in original condition</p>
                      <p>• Refund processed within 5-7 business days</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}