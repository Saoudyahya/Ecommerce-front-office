"use client";

import * as React from "react";
import { Loader2, Search, AlertCircle, RefreshCw } from "lucide-react";
import { useCart } from "~/lib/hooks/use-cart";
import { ProductCard } from "~/ui/components/product-card";
import { Button } from "~/ui/primitives/button";
import { Input } from "~/ui/primitives/input";
import { Alert, AlertDescription } from "~/ui/primitives/alert";
import { productService, ProductSummary } from "../../service/product";

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
    async (productId: string) => {
      const product = products.find((p) => p.id === productId);
      if (product) {
        try {
          await addItem(
            {
              category: product.category,
              id: product.id,
              image: product.images[0] || "",
              name: product.name,
              price: product.price,
            },
            1 // quantity
          );
        } catch (error) {
          console.error('Failed to add item to cart:', error);
        }
      }
    },
    [addItem, products]
  );

  const handleAddToWishlist = React.useCallback((productId: string) => {
    // TODO: integrate with Wishlist feature
    console.log(`Added ${productId} to wishlist`);
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
            <h1 className="text-3xl font-bold tracking-tight">Products</h1>
            <p className="mt-1 text-lg text-muted-foreground">
              Browse our latest products and find something you&apos;ll love.
            </p>
            
            {/* Stats */}
            <div className="mt-4 flex items-center space-x-4 text-sm text-muted-foreground">
              <span>{products.length} total products</span>
              <span>•</span>
              <span>{categories.length - 1} categories</span>
              <span>•</span>
              <span>{filteredProducts.length} showing</span>
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
                </div>
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