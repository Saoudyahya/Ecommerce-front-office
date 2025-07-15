"use client";

import { Heart, ShoppingCart, Star, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import { Product_Service_URL } from "~/lib/apiEndPoints";

import { cn } from "~/lib/cn";
import { Badge } from "~/ui/primitives/badge";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent, CardFooter } from "~/ui/primitives/card";
// import { useToast } from "~/ui/primitives/use-toast";
import { save4LaterService, type SavedProduct } from "~/service/Saved4Later";
import { toast } from "sonner";

type ProductCardProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onError"
> & {
  onAddToCart?: (productId: string, productDetails: {
    name: string;
    imagePath: string;
    category: string;
    price: number;
  }) => void;
  onAddToWishlist?: (productId: string) => void;
  product: {
    category: string;
    id: string;
    images: string[]; // Changed from 'image' to 'images' array
    inStock?: boolean;
    name: string;
    originalPrice?: number;
    price: number;
    rating?: number;
  };
  variant?: "compact" | "default";
  // New props for cart integration
  useCartHook?: boolean; // Whether to use the cart hook directly
  showAddToCart?: boolean; // Whether to show add to cart button
};

const getImageUrl = (imagePath: string): string => {
  // Get server base URL: "http://localhost:8099"
  const serverBaseUrl = Product_Service_URL.replace('/api/products', '');
  
  if (imagePath.startsWith('/api/')) {
    // For "/api/products/images/file.png"
    // Result: "http://localhost:8099" + "/api/products/images/file.png"
    // = "http://localhost:8099/api/products/images/file.png" ✅
    return `${serverBaseUrl}${imagePath}`;
  }
  
  return imagePath; // Return as-is if not an API path
};

export function ProductCard({
  className,
  onAddToCart,
  onAddToWishlist,
  product,
  variant = "default",
  useCartHook = false,
  showAddToCart = true,
  ...props
}: ProductCardProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isAddingToCart, setIsAddingToCart] = React.useState(false);
  const [isSaved, setIsSaved] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  // const { toast: legacyToast } = useToast();

  // Check if item is already saved on mount
  React.useEffect(() => {
    setIsSaved(save4LaterService.isItemSaved(product.id));
  }, [product.id]);

  // Dynamically import cart hook only if needed
  const [cartHook, setCartHook] = React.useState<any>(null);
  
  React.useEffect(() => {
    if (useCartHook) {
      import("~/ui/components/cart").then(({ useCart }) => {
        try {
          setCartHook(useCart());
        } catch (error) {
          console.warn('Cart hook not available in this context:', error);
        }
      });
    }
  }, [useCartHook]);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAddingToCart(true);

    try {
      const productDetails = {
        name: product.name,
        imagePath: primaryImage || '/placeholder-product.jpg',
        category: product.category,
        price: product.price
      };

      if (useCartHook && cartHook) {
        // Use cart hook if available
        await cartHook.addToCart(product.id, 1);
      } else if (onAddToCart) {
        // Use callback function with product details
        onAddToCart(product.id, productDetails);
      } else {
        // Fallback: show success message
        toast.success("Added to Cart", {
          description: `${product.name} has been added to your cart.`,
        });
      }

      toast.success("Added to cart", {
        description: `${product.name} has been added to your cart`,
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error("Error", {
        description: "Failed to add item to cart. Please try again.",
      });
    } finally {
      // Add a small delay for better UX
      setTimeout(() => setIsAddingToCart(false), 600);
    }
  };

  // Get the first image from the images array
  const primaryImage = product.images && product.images.length > 0 ? product.images[0] : null;

  const handleAddToSaved = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSaving(true);

    try {
      const savedProduct: SavedProduct = {
        id: product.id,
        name: product.name,
        price: product.price,
        imagePath: primaryImage || '/placeholder-product.jpg',
        category: product.category
      };

      if (isSaved) {
        // Remove from saved
        save4LaterService.removeItem(product.id);
        setIsSaved(false);
        
        toast.success("Removed from saved", {
          description: `${product.name} has been removed from your saved items`,
        });
      } else {
        // Add to saved
        save4LaterService.addItem(savedProduct);
        setIsSaved(true);
        
        toast.success("Saved for later", {
          description: `${product.name} has been added to your saved items`,
        });
      }

      // Also call the legacy onAddToWishlist if provided
      if (onAddToWishlist) {
        onAddToWishlist(product.id);
      }
    } catch (error) {
      console.error('Error toggling saved status:', error);
      toast.error("Error", {
        description: "Failed to update saved status",
      });
    } finally {
      setTimeout(() => setIsSaving(false), 400);
    }
  };

  const discount = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100
      )
    : 0;

  const renderStars = () => {
    const rating = product.rating ?? 0;
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    return (
      <div className="flex items-center">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            className={cn(
              "h-4 w-4",
              i < fullStars
                ? "fill-yellow-400 text-yellow-400"
                : i === fullStars && hasHalfStar
                ? "fill-yellow-400/50 text-yellow-400"
                : "stroke-muted/40 text-muted"
            )}
            key={`star-${product.id}-position-${i + 1}`}
          />
        ))}
        {rating > 0 && (
          <span className="ml-1 text-xs text-muted-foreground">
            {rating.toFixed(1)}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className={cn("group", className)} {...props}>
      <Link href={`/products/${product.id}`}>
        <Card
          className={cn(
            `
              relative h-full overflow-hidden rounded-lg py-0 transition-all
              duration-200 ease-in-out
              hover:shadow-md
            `,
            isHovered && "ring-1 ring-primary/20"
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="relative aspect-square overflow-hidden rounded-t-lg">
            {primaryImage ? (
              <Image
                alt={product.name}
                className={cn(
                  "object-cover transition-transform duration-300 ease-in-out",
                  isHovered && "scale-105"
                )}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                src={getImageUrl(primaryImage)}
              />
            ) : (
              // Fallback when no image is available
              <div className="flex h-full w-full items-center justify-center bg-muted">
                <span className="text-muted-foreground">No Image</span>
              </div>
            )}

            {/* Category badge */}
            <Badge
              className={`
                absolute top-2 left-2 bg-background/80 backdrop-blur-sm
              `}
              variant="outline"
            >
              {product.category}
            </Badge>

            {/* Discount badge */}
            {discount > 0 && (
              <Badge
                className={`
                absolute top-2 right-2 bg-destructive
                text-destructive-foreground
              `}
              >
                {discount}% OFF
              </Badge>
            )}

            {/* Stock status */}
            {product.inStock === false && (
              <Badge
                className={`
                  absolute bottom-2 left-2 bg-red-500
                  text-white z-20
                `}
              >
                Out of Stock
              </Badge>
            )}

            {/* Save for Later button - Bottom Left */}
            <Button
              className={cn(
                `
                  absolute left-2 bottom-2 z-10 h-8 w-8 rounded-full 
                  bg-white/90 backdrop-blur-sm transition-all duration-300
                  hover:bg-white hover:scale-110 shadow-sm
                `,
                isSaved 
                  ? "bg-red-50 border-red-200 hover:bg-red-100" 
                  : "border-gray-200",
                (!isHovered && !isSaved) && "opacity-70 hover:opacity-100"
              )}
              onClick={handleAddToSaved}
              size="icon"
              type="button"
              variant="outline"
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
              ) : (
                <Heart
                  className={cn(
                    "h-4 w-4 transition-colors",
                    isSaved
                      ? "fill-red-500 text-red-500"
                      : "text-gray-600 hover:text-red-500"
                  )}
                />
              )}
              <span className="sr-only">
                {isSaved ? "Remove from saved" : "Save for later"}
              </span>
            </Button>

            {/* Quick Add to Cart button - Bottom Right (on hover) */}
            {showAddToCart && (
              <Button
                className={cn(
                  `
                    absolute right-2 bottom-2 z-10 h-8 w-8 rounded-full 
                    bg-primary/90 backdrop-blur-sm transition-all duration-300
                    hover:bg-primary hover:scale-110 shadow-sm text-primary-foreground
                  `,
                  !isHovered && "opacity-0 pointer-events-none"
                )}
                onClick={handleAddToCart}
                size="icon"
                type="button"
                disabled={isAddingToCart || product.inStock === false}
              >
                {isAddingToCart ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShoppingCart className="h-4 w-4" />
                )}
                <span className="sr-only">Quick add to cart</span>
              </Button>
            )}
          </div>

          <CardContent className="p-4 pt-4">
            {/* Product name with line clamp */}
            <h3
              className={`
                line-clamp-2 text-base font-medium transition-colors
                group-hover:text-primary
              `}
            >
              {product.name}
            </h3>

            {variant === "default" && (
              <>
                <div className="mt-1.5">{renderStars()}</div>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="font-medium text-foreground">
                    ${product.price.toFixed(2)}
                  </span>
                  {product.originalPrice ? (
                    <span className="text-sm text-muted-foreground line-through">
                      ${product.originalPrice.toFixed(2)}
                    </span>
                  ) : null}
                </div>
              </>
            )}
          </CardContent>

          {variant === "default" && showAddToCart && (
            <CardFooter className="p-4 pt-0">
              <Button
                className={cn(
                  "w-full gap-2 transition-all",
                  isAddingToCart && "opacity-70"
                )}
                disabled={isAddingToCart || product.inStock === false}
                onClick={handleAddToCart}
              >
                {isAddingToCart ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : product.inStock === false ? (
                  "Out of Stock"
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4" />
                    Add to Cart
                  </>
                )}
              </Button>
            </CardFooter>
          )}

          {variant === "compact" && (
            <CardFooter className="p-4 pt-0">
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-foreground">
                    ${product.price.toFixed(2)}
                  </span>
                  {product.originalPrice ? (
                    <span className="text-sm text-muted-foreground line-through">
                      ${product.originalPrice.toFixed(2)}
                    </span>
                  ) : null}
                </div>
                {showAddToCart && (
                  <Button
                    className="h-8 w-8 rounded-full"
                    disabled={isAddingToCart || product.inStock === false}
                    onClick={handleAddToCart}
                    size="icon"
                    variant="ghost"
                  >
                    {isAddingToCart ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ShoppingCart className="h-4 w-4" />
                    )}
                    <span className="sr-only">Add to cart</span>
                  </Button>
                )}
              </div>
            </CardFooter>
          )}
        </Card>
      </Link>
    </div>
  );
}