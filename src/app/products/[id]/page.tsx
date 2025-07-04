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
  RotateCcw
} from "lucide-react";
import { Button } from "~/ui/primitives/button";
import { Input } from "~/ui/primitives/input";
import { useCart } from "~/lib/hooks/use-cart";
import { productService, Product, Review } from "../../../service/product";
import { Product_Service_URL } from "~/lib/apiEndPoints";

/* -------------------------------------------------------------------------- */
/*                                Component                                   */
/* -------------------------------------------------------------------------- */

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addItem } = useCart();
  
  const [product, setProduct] = React.useState<Product | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = React.useState(0);
  const [quantity, setQuantity] = React.useState(1);
  const [activeTab, setActiveTab] = React.useState<'description' | 'reviews' | 'shipping'>('description');
  const [isInWishlist, setIsInWishlist] = React.useState(false);

  const productId = params.id as string;

  /* ------------------------ Load Product Data --------------------------- */
  React.useEffect(() => {
    if (productId) {
      loadProductData();
    }
  }, [productId]);

  const loadProductData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // For now, we'll get the product from the general endpoint
      // since we don't have a dedicated detailed endpoint
      const products = await productService.getAllProducts();
      const foundProduct = products.find(p => p.id === productId);
      
      if (!foundProduct) {
        setError("Product not found");
        return;
      }
      
      setProduct(foundProduct);
    } catch (err) {
      console.error("Error loading product:", err);
      setError(err instanceof Error ? err.message : "Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  /* --------------------------- Handlers --------------------------------- */
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
    setIsInWishlist(!isInWishlist);
    // TODO: Implement wishlist API call
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
      // Fallback: copy to clipboard
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

  const calculateAverageRating = (reviews: Review[]) => {
    if (reviews.length === 0) return 0;
    return reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
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

  /* ----------------------------- Render --------------------------------- */

  if (loading) {
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
  const getImageUrl = (imagePath: string): string => {
    // Get server base URL: "http://localhost:8099"
    const serverBaseUrl = Product_Service_URL.replace('/api/products', '');
    
    if (imagePath.startsWith('/api/')) {
      // For "/api/products/images/file.png"
      // Result: "http://localhost:8099" + "/api/products/images/file.png"
      // = "http://localhost:8099/api/products/images/file.png" ✅
      return `${serverBaseUrl}${imagePath}`;
    }
  };

  const averageRating = calculateAverageRating(product.reviews);
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
                  {averageRating.toFixed(1)} ({product.reviews.length} reviews)
                </span>
              </div>
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
                { id: 'reviews', label: `Reviews (${product.reviews.length})` },
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
                {product.reviews.length > 0 ? (
                  product.reviews.map((review) => (
                    <div key={review.id} className="border-b pb-6 last:border-b-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
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
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              Verified Purchase
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="mt-2 text-muted-foreground">{review.comment}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">No reviews yet. Be the first to review this product!</p>
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