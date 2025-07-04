"use client";

import * as React from "react";
import { Search, X, Filter, SlidersHorizontal, ChevronDown } from "lucide-react";
import { Button } from "~/ui/primitives/button";
import { Input } from "~/ui/primitives/input";
import { ProductSummary } from "../../../service/product";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

interface SearchFilters {
  category: string;
  priceRange: {
    min: number;
    max: number;
  };
  inStockOnly: boolean;
  rating: number;
  sortBy: 'name' | 'price-low' | 'price-high' | 'rating' | 'newest';
}

interface ProductSearchProps {
  products: ProductSummary[];
  categories: string[];
  onFilteredProducts: (products: ProductSummary[]) => void;
  className?: string;
}

/* -------------------------------------------------------------------------- */
/*                                Component                                   */
/* -------------------------------------------------------------------------- */

export function ProductSearch({ 
  products, 
  categories, 
  onFilteredProducts, 
  className = "" 
}: ProductSearchProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [showFilters, setShowFilters] = React.useState(false);
  const [filters, setFilters] = React.useState<SearchFilters>({
    category: "All",
    priceRange: { min: 0, max: 1000 },
    inStockOnly: false,
    rating: 0,
    sortBy: 'name'
  });

  // Debounced search
  const [debouncedSearchQuery, setDebouncedSearchQuery] = React.useState("");
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Calculate price range from products
  const priceRange = React.useMemo(() => {
    if (products.length === 0) return { min: 0, max: 1000 };
    
    const prices = products.map(p => p.price);
    return {
      min: Math.floor(Math.min(...prices)),
      max: Math.ceil(Math.max(...prices))
    };
  }, [products]);

  // Filter and sort products
  const filteredProducts = React.useMemo(() => {
    let filtered = [...products];

    // Text search
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase().trim();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (filters.category !== "All") {
      filtered = filtered.filter(product => product.category === filters.category);
    }

    // Price range filter
    filtered = filtered.filter(product => 
      product.price >= filters.priceRange.min && 
      product.price <= filters.priceRange.max
    );

    // Stock filter
    if (filters.inStockOnly) {
      filtered = filtered.filter(product => product.inStock);
    }

    // Rating filter
    if (filters.rating > 0) {
      filtered = filtered.filter(product => product.rating >= filters.rating);
    }

    // Sort products
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        case 'newest':
          return b.name.localeCompare(a.name); // Fallback since we don't have creation date
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return filtered;
  }, [products, debouncedSearchQuery, filters]);

  // Update parent component when filtered products change
  React.useEffect(() => {
    onFilteredProducts(filteredProducts);
  }, [filteredProducts, onFilteredProducts]);

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearSearch = () => {
    setSearchQuery("");
    setDebouncedSearchQuery("");
  };

  const resetFilters = () => {
    setFilters({
      category: "All",
      priceRange: { min: priceRange.min, max: priceRange.max },
      inStockOnly: false,
      rating: 0,
      sortBy: 'name'
    });
    setSearchQuery("");
    setDebouncedSearchQuery("");
  };

  const hasActiveFilters = 
    filters.category !== "All" ||
    filters.priceRange.min !== priceRange.min ||
    filters.priceRange.max !== priceRange.max ||
    filters.inStockOnly ||
    filters.rating > 0 ||
    debouncedSearchQuery.trim() !== "";

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search products, categories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="ml-2 h-2 w-2 rounded-full bg-blue-500" />
            )}
          </Button>

          {/* Quick Sort */}
          <div className="relative">
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="name">Sort by Name</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="newest">Newest First</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span>{filteredProducts.length} products</span>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-8 px-2 text-xs"
            >
              Clear all
            </Button>
          )}
        </div>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="rounded-lg border bg-card p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Category Filter */}
            <div>
              <label className="text-sm font-medium">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="All">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="text-sm font-medium">Price Range</label>
              <div className="mt-1 flex items-center space-x-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.priceRange.min}
                  onChange={(e) => handleFilterChange('priceRange', {
                    ...filters.priceRange,
                    min: parseInt(e.target.value) || 0
                  })}
                  className="w-20 rounded-md border border-input bg-background px-2 py-1 text-sm"
                />
                <span className="text-muted-foreground">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.priceRange.max}
                  onChange={(e) => handleFilterChange('priceRange', {
                    ...filters.priceRange,
                    max: parseInt(e.target.value) || 1000
                  })}
                  className="w-20 rounded-md border border-input bg-background px-2 py-1 text-sm"
                />
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                ${priceRange.min} - ${priceRange.max}
              </div>
            </div>

            {/* Rating Filter */}
            <div>
              <label className="text-sm font-medium">Minimum Rating</label>
              <select
                value={filters.rating}
                onChange={(e) => handleFilterChange('rating', parseFloat(e.target.value))}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value={0}>Any Rating</option>
                <option value={4}>4+ Stars</option>
                <option value={3}>3+ Stars</option>
                <option value={2}>2+ Stars</option>
                <option value={1}>1+ Stars</option>
              </select>
            </div>

            {/* Stock Filter */}
            <div>
              <label className="text-sm font-medium">Availability</label>
              <label className="mt-1 flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.inStockOnly}
                  onChange={(e) => handleFilterChange('inStockOnly', e.target.checked)}
                  className="rounded border border-input"
                />
                <span className="text-sm">In stock only</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Active Filter Tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {debouncedSearchQuery.trim() && (
            <div className="flex items-center space-x-1 rounded-full bg-blue-100 px-3 py-1 text-sm">
              <span>Search: "{debouncedSearchQuery.trim()}"</span>
              <button
                onClick={clearSearch}
                className="ml-1 rounded-full hover:bg-blue-200 p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          
          {filters.category !== "All" && (
            <div className="flex items-center space-x-1 rounded-full bg-green-100 px-3 py-1 text-sm">
              <span>Category: {filters.category}</span>
              <button
                onClick={() => handleFilterChange('category', 'All')}
                className="ml-1 rounded-full hover:bg-green-200 p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          
          {(filters.priceRange.min !== priceRange.min || filters.priceRange.max !== priceRange.max) && (
            <div className="flex items-center space-x-1 rounded-full bg-purple-100 px-3 py-1 text-sm">
              <span>Price: ${filters.priceRange.min} - ${filters.priceRange.max}</span>
              <button
                onClick={() => handleFilterChange('priceRange', { min: priceRange.min, max: priceRange.max })}
                className="ml-1 rounded-full hover:bg-purple-200 p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          
          {filters.rating > 0 && (
            <div className="flex items-center space-x-1 rounded-full bg-yellow-100 px-3 py-1 text-sm">
              <span>Rating: {filters.rating}+ stars</span>
              <button
                onClick={() => handleFilterChange('rating', 0)}
                className="ml-1 rounded-full hover:bg-yellow-200 p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          
          {filters.inStockOnly && (
            <div className="flex items-center space-x-1 rounded-full bg-orange-100 px-3 py-1 text-sm">
              <span>In stock only</span>
              <button
                onClick={() => handleFilterChange('inStockOnly', false)}
                className="ml-1 rounded-full hover:bg-orange-200 p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}