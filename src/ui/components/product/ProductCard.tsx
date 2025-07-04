"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Heart, ShoppingCart, Star } from "lucide-react";
import { Button } from "~/ui/primitives/button";
import { ProductSummary } from "../../../service/product";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

interface ProductCardProps {
  product: ProductSummary;
  onAddToCart: (productId: string) => void;
  onAddToWishlist: (productId: string) => void;
}

/* -------------------------------------------------------------------------- */
/*                                Component                                   */
/* -------------------------------------------------------------------------- */

export function ProductCard({ product, onAddToCart, onAddToWishlist }: ProductCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const [isHovered, setIsHovered] = React.useState(false);

  // Auto-rotate images when hovered
  React.useEffect(() => {
    if (!isHovered || product.images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        (prevIndex + 1) % product.images.length
      );
    }, 2000); // Change image every 2 seconds

    return () => clearInterval(interval);
  }, [isHovered, product.images.length]);

  const goToNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prevIndex) => 
      (prevIndex + 1) % product.images.length
    );
  };

  const goToPreviousImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prevIndex) => 
      prevIndex === 0 ? product.images.length - 1 : prevIndex - 1
    );
  };

  const goToImage = (index: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentImageIndex(index);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product.id);
  };

  const handleAddToWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToWishlist(product.id);
  };

  const currentImage = product.images[currentImageIndex] || '';
  const hasMultipleImages = product.images.length > 1;

  return (
    <div 
      className={`
        product-card group relative overflow-hidden rounded-lg border bg-card text-card-foreground shadow
        transition-all duration-300 hover:shadow-lg hover:-translate-y-1
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {/* Main Image */}
        {currentImage ? (
          <img
            src={currentImage}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-200 text-gray-500">
            No Image
          </div>
        )}

        {/* Image Navigation - Only show if multiple images */}
        {hasMultipleImages && (
          <>
            {/* Previous/Next Buttons - Show on hover */}
            <div className={`
              absolute inset-0 flex items-center justify-between p-2 opacity-0 transition-opacity duration-300
              ${isHovered ? 'opacity-100' : ''}
            `}>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 bg-white/80 backdrop-blur-sm hover:bg-white"
                onClick={goToPreviousImage}
                disabled={product.images.length <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 bg-white/80 backdrop-blur-sm hover:bg-white"
                onClick={goToNextImage}
                disabled={product.images.length <= 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Image Indicators */}
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 space-x-1">
              {product.images.map((_, index) => (
                <button
                  key={index}
                  className={`
                    h-2 w-2 rounded-full transition-all duration-300
                    ${index === currentImageIndex 
                      ? 'bg-white scale-125 shadow-md' 
                      : 'bg-white/60 hover:bg-white/80'
                    }
                  `}
                  onClick={(e) => goToImage(index, e)}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>

            {/* Image Counter */}
            <div className="absolute top-2 right-2 rounded-md bg-black/60 px-2 py-1 text-xs text-white">
              {currentImageIndex + 1} / {product.images.length}
            </div>
          </>
        )}

        {/* Stock Status Badge */}
        <div className="absolute top-2 left-2">
          <span className={`
            rounded-full px-2 py-1 text-xs font-medium
            ${product.inStock 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
            }
          `}>
            {product.inStock ? 'In Stock' : 'Out of Stock'}
          </span>
        </div>

        {/* Discount Badge */}
        {product.originalPrice && product.originalPrice > product.price && (
          <div className="absolute top-2 right-2">
            <span className="rounded-full bg-red-500 px-2 py-1 text-xs font-medium text-white">
              -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
            </span>
          </div>
        )}

        {/* Wishlist Button */}
        <Button
          variant="outline"
          size="icon"
          className={`
            absolute top-2 right-2 h-8 w-8 bg-white/80 backdrop-blur-sm opacity-0 transition-all duration-300
            hover:bg-white group-hover:opacity-100
            ${product.originalPrice && product.originalPrice > product.price ? 'top-12' : ''}
          `}
          onClick={handleAddToWishlist}
        >
          <Heart className="h-4 w-4" />
        </Button>
      </div>

      {/* Product Info */}
      <div className="p-4">
        {/* Category */}
        <p className="text-sm text-muted-foreground">{product.category}</p>
        
        {/* Product Name */}
        <h3 className="mt-1 font-semibold line-clamp-2" title={product.name}>
          {product.name}
        </h3>

        {/* Rating */}
        <div className="mt-2 flex items-center space-x-1">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < Math.floor(product.rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : i < product.rating
                    ? 'fill-yellow-400/50 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-muted-foreground">
            ({product.rating.toFixed(1)})
          </span>
        </div>

        {/* Price */}
        <div className="mt-3 flex items-center space-x-2">
          <span className="text-lg font-bold">${product.price.toFixed(2)}</span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-sm text-muted-foreground line-through">
              ${product.originalPrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* Add to Cart Button */}
        <Button
          className="mt-4 w-full"
          onClick={handleAddToCart}
          disabled={!product.inStock}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          {product.inStock ? 'Add to Cart' : 'Out of Stock'}
        </Button>
      </div>
    </div>
  );
}