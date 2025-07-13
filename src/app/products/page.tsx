"use client";

import * as React from "react";
import { Loader2, Search, AlertCircle, RefreshCw, Heart } from "lucide-react";
import { useCart } from "~/lib/hooks/use-cart";
import { ProductCard } from "~/ui/components/product-card";
import { Button } from "~/ui/primitives/button";
import { Input } from "~/ui/primitives/input";
import { Alert, AlertDescription } from "~/ui/primitives/alert";
import { productService, ProductSummary } from "../../service/product";
import { savedForLaterService } from "~/service/Saved4Later";
import { toast } from "sonner";
import Link from "next/link";

/* -------------------------------------------------------------------------- */
/*                               Component                                    */
/* -------------------------------------------------------------------------- */

export default function ProductsPage() {
  const { addItem, isGuest, cartMode, isOnline } = useCart();

  /* ----------------------------- State ---------------------------------- */
  const [products, setProducts] = React.useState<ProductSummary[]>([]);
  const [categories, setCategories] = React.useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = React.useState<string>("All");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [retryCount, setRetryCount] = React.useState(0);
  const [savedCount, setSavedCount] = React.useState(0);

  /* --------------------- Filtered products (memo) ----------------------- */
  const filteredProducts = React.useMemo(() => {
    let filtered = products;

    // Filter by category
    if (selectedCategory !== "All") {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [products, selectedCategory, searchQuery]);

  /* ---------------------- Saved items count ----------------------------- */
  React.useEffect(() => {
    const updateSavedCount = () => {
      setSavedCount(savedForLaterService.getItemCount());
    };
    
    updateSavedCount();
    
    // Listen for localStorage changes to update count
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'Saved4Later') {
        updateSavedCount();
      }
    };
    
    // Listen for visibility change to refresh count when user returns to tab
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        updateSavedCount();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  /* ------------------------ Load Data Effect ---------------------------- */
  React.useEffect(() => {
    loadData();
  }, [retryCount]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load products and categories in parallel
      const [productsData, categoriesData] = await Promise.all([
        productService.getProductsForDisplay(),
        productService.getUniqueCategories(),
      ]);

      setProducts(productsData);
      setCategories(["All", ...categoriesData]);
    } catch (err) {
      console.error("Error loading data:", err);
      setError(
        err instanceof Error 
          ? err.message 
          : "Failed to load products. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  /* --------------------------- Handlers --------------------------------- */
  const handleAddToCart = React.useCallback(
    async (productId: string, productDetails: {
      name: string;
      imagePath: string;
      category: string;
      price: number;
    }) => {
      try {
        await addItem(
          {
            category: productDetails.category,
            id: productId,
            image: productDetails.imagePath,
            name: productDetails.name,
            price: productDetails.price,
          },
          1 // quantity
        );

        // Update saved count in case it changed
        setSavedCount(savedForLaterService.getItemCount());
      } catch (error) {
        console.error('Failed to add item to cart:', error);
        toast.error("Error", {
          description: "Failed to add item to cart. Please try again.",
        });
      }
    },
    [addItem]
  );

  const handleAddToWishlist = React.useCallback((productId: string) => {
    // This is handled by the ProductCard component directly now
    // But we can update the saved count here
    setTimeout(() => {
      setSavedCount(savedForLaterService.getItemCount());
    }, 100);
  }, []);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSearchQuery(""); // Clear search when changing category
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (e.target.value.trim()) {
      setSelectedCategory("All"); // Reset category when searching
    }
  };

  /* ----------------------------- Render --------------------------------- */

  // Cart Status Alert
  const CartStatusAlert = () => {
    if (!isOnline) {
      return (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You're offline. Items added to cart will be saved locally and synced when you reconnect.
          </AlertDescription>
        </Alert>
      );
    }

    if (isGuest) {
      return (
        <Alert className="mb-6">
          <AlertDescription>
            Shopping as guest. Items will be saved locally. <a href="/auth/sign-in" className="underline hover:no-underline">Sign in</a> to sync across devices.
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  };

  // Loading State
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex-1 py-10">
          <div className="container px-4 md:px-6">
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">Products</h1>
              <p className="mt-1 text-lg text-muted-foreground">
                Browse our latest products and find something you&apos;ll love.
              </p>
            </div>
            
            <CartStatusAlert />
            
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-lg text-muted-foreground">
                  Loading products...
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Fetching the latest products from our catalog
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex-1 py-10">
          <div className="container px-4 md:px-6">
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">Products</h1>
              <p className="mt-1 text-lg text-muted-foreground">
                Browse our latest products and find something you&apos;ll love.
              </p>
            </div>
            
            <CartStatusAlert />
            
            <div className="flex items-center justify-center py-20">
              <div className="text-center max-w-md">
                <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
                <h2 className="mt-4 text-xl font-semibold">
                  Oops! Something went wrong
                </h2>
                <p className="mt-2 text-muted-foreground">
                  {error}
                </p>
                <Button 
                  onClick={handleRetry}
                  className="mt-6"
                  variant="outline"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <p className="mt-4 text-xs text-muted-foreground">
                  Make sure the backend services are running on localhost:8099
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 py-10">
        <div className="container px-4 md:px-6">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Products</h1>
                <p className="mt-1 text-lg text-muted-foreground">
                  Browse our latest products and find something you&apos;ll love.
                </p>
              </div>
              
              {/* Saved Items Link */}
              {savedCount > 0 && (
                <Link href="/saved-for-later">
                  <Button variant="outline" size="sm">
                    <Heart className="h-4 w-4 mr-2 fill-current text-red-500" />
                    Saved Items ({savedCount})
                  </Button>
                </Link>
              )}
            </div>
            
            {/* Stats */}
            <div className="mt-4 flex items-center space-x-4 text-sm text-muted-foreground">
              <span>{products.length} total products</span>
              <span>•</span>
              <span>{categories.length - 1} categories</span>
              <span>•</span>
              <span>{filteredProducts.length} showing</span>
              {savedCount > 0 && (
                <>
                  <span>•</span>
                  <span className="text-red-600">{savedCount} saved</span>
                </>
              )}
              {cartMode === 'guest' && (
                <>
                  <span>•</span>
                  <span className="text-blue-600">Guest mode</span>
                </>
              )}
              {!isOnline && (
                <>
                  <span>•</span>
                  <span className="text-amber-600">Offline</span>
                </>
              )}
            </div>
          </div>

          {/* Cart Status Alert */}
          <CartStatusAlert />

          {/* Controls Section */}
          <div className="mb-8 space-y-4">
            {/* Search Bar */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-10"
              />
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  aria-pressed={category === selectedCategory}
                  className="rounded-full"
                  onClick={() => handleCategoryChange(category)}
                  size="sm"
                  title={`Filter by ${category}`}
                  variant={
                    category === selectedCategory ? "default" : "outline"
                  }
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Active Filters */}
          {(selectedCategory !== "All" || searchQuery.trim()) && (
            <div className="mb-6 flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {selectedCategory !== "All" && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedCategory("All")}
                  className="h-7 rounded-full px-3"
                >
                  {selectedCategory} ✕
                </Button>
              )}
              {searchQuery.trim() && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                  className="h-7 rounded-full px-3"
                >
                  &quot;{searchQuery.trim()}&quot; ✕
                </Button>
              )}
            </div>
          )}

          {/* Product Grid */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  onAddToWishlist={handleAddToWishlist}
                />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="py-20 text-center">
              <div className="mx-auto max-w-md">
                <Search className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No products found</h3>
                <p className="mt-2 text-muted-foreground">
                  {searchQuery.trim()
                    ? `No products match "${searchQuery.trim()}"`
                    : selectedCategory !== "All"
                    ? `No products found in "${selectedCategory}" category`
                    : "No products available at the moment"}
                </p>
                <div className="mt-6 space-x-2">
                  {searchQuery.trim() && (
                    <Button
                      variant="outline"
                      onClick={() => setSearchQuery("")}
                    >
                      Clear search
                    </Button>
                  )}
                  {selectedCategory !== "All" && (
                    <Button
                      variant="outline"
                      onClick={() => setSelectedCategory("All")}
                    >
                      View all products
                    </Button>
                  )}
                  {savedCount > 0 && (
                    <Link href="/saved-for-later">
                      <Button variant="outline">
                        <Heart className="h-4 w-4 mr-2 fill-current text-red-500" />
                        View Saved ({savedCount})
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions Bar */}
          {savedCount > 0 && (
            <div className="mt-12 p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border border-red-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Heart className="h-5 w-5 fill-current text-red-500" />
                  <div>
                    <h3 className="font-medium text-gray-900">
                      You have {savedCount} saved item{savedCount !== 1 ? 's' : ''}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Review your saved products and add them to cart when ready
                    </p>
                  </div>
                </div>
                <Link href="/saved-for-later">
                  <Button className="bg-red-500 hover:bg-red-600 text-white">
                    View Saved Items
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Pagination Placeholder */}
          {filteredProducts.length > 0 && (
            <nav
              aria-label="Pagination"
              className="mt-12 flex items-center justify-center gap-2"
            >
              <Button disabled variant="outline">
                Previous
              </Button>
              <Button aria-current="page" variant="default">
                1
              </Button>
              <Button disabled variant="outline">
                Next
              </Button>
            </nav>
          )}
        </div>
      </main>
    </div>
  );
}