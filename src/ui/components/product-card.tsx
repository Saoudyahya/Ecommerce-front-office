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
import { useToast } from "~/ui/primitives/use-toast";

type ProductCardProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onError"
> & {
  onAddToCart?: (productId: string) => void;
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
  const [isInWishlist, setIsInWishlist] = React.useState(false);
  const { toast } = useToast();

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
    setIsAddingToCart(true);

    try {
      if (useCartHook && cartHook) {
        // Use cart hook if available
        await cartHook.addToCart(product.id, 1);
      } else if (onAddToCart) {
        // Use callback function
        onAddToCart(product.id);
      } else {
        // Fallback: show success message
        toast({
          title: "Added to Cart",
          description: `${product.name} has been added to your cart.`,
        });
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Add a small delay for better UX
      setTimeout(() => setIsAddingToCart(false), 600);
    }
  };

  // Get the first image from the images array
  const primaryImage = product.images && product.images.length > 0 ? product.images[0] : null;

  const handleAddToWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onAddToWishlist) {
      setIsInWishlist(!isInWishlist);
      onAddToWishlist(product.id);
    } else {
      setIsInWishlist(!isInWishlist);
      toast({
        title: isInWishlist ? "Removed from Wishlist" : "Added to Wishlist",
        description: `${product.name} has been ${isInWishlist ? 'removed from' : 'added to'} your wishlist.`,
      });
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
                  text-white
                `}
              >
                Out of Stock
              </Badge>
            )}

            {/* Wishlist button */}
            <Button
              className={cn(
                `
                  absolute right-2 bottom-2 z-10 rounded-full bg-background/80
                  backdrop-blur-sm transition-opacity duration-300
                `,
                !isHovered && !isInWishlist && "opacity-0"
              )}
              onClick={handleAddToWishlist}
              size="icon"
              type="button"
              variant="outline"
            >
              <Heart
                className={cn(
                  "h-4 w-4",
                  isInWishlist
                    ? "fill-destructive text-destructive"
                    : "text-muted-foreground"
                )}
              />
              <span className="sr-only">Add to wishlist</span>
            </Button>
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