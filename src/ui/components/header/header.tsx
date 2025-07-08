"use client";

import { Menu, X, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { SEO_CONFIG } from "~/app";
import { cn } from "~/lib/cn";
import { useCart } from "~/lib/hooks/use-cart";
import { Badge } from "~/ui/primitives/badge";
import { Button } from "~/ui/primitives/button";
import { Skeleton } from "~/ui/primitives/skeleton";

import { NotificationsWidget } from "../notifications/notifications-widget";
import { ThemeToggle } from "../theme-toggle";
import { HeaderUserDropdown } from "./header-user";
import { useAuth } from "~/lib/hooks/usrAuth";

interface HeaderProps {
  children?: React.ReactNode;
  showAuth?: boolean;
}

// Simple cart icon component that uses the existing cart context
function CartIcon() {
  const { itemCount } = useCart();
  
  return (
    <Link href="/cart">
      <Button
        aria-label="Open cart"
        className="relative h-9 w-9 rounded-full"
        size="icon"
        variant="outline"
      >
        <ShoppingCart className="h-4 w-4" />
        {itemCount > 0 && (
          <Badge
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-[10px]"
            variant="default"
          >
            {itemCount}
          </Badge>
        )}
      </Button>
    </Link>
  );
}

export function Header({ showAuth = true }: HeaderProps) {
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const mainNavigation = [
    { href: "/", name: "Home" },
    { href: "/products", name: "Products" },
    { href: "/cart", name: "Cart" },
  ];

  const dashboardNavigation = [
    { href: "/dashboard/stats", name: "Stats" },
    { href: "/dashboard/profile", name: "Profile" },
    { href: "/dashboard/settings", name: "Settings" },
    { href: "/dashboard/uploads", name: "Uploads" },
    { href: "/admin/summary", name: "Admin" },
  ];

  const isDashboard =
    isAuthenticated &&
    (pathname.startsWith("/dashboard") || pathname.startsWith("/admin"));
  const navigation = isDashboard ? dashboardNavigation : mainNavigation;

  // Filter out cart from main navigation if we're already on cart page
  const filteredNavigation = navigation.filter(item => 
    !(item.href === "/cart" && pathname === "/cart")
  );

  const renderContent = () => (
    <header
      className={`
        sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur
        supports-[backdrop-filter]:bg-background/60
      `}
    >
      <div
        className={`
          container mx-auto max-w-7xl px-4
          sm:px-6
          lg:px-8
        `}
      >
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link className="flex items-center gap-2" href="/">
              <span
                className={cn(
                  "text-xl font-bold",
                  !isDashboard &&
                    `
                      bg-gradient-to-r from-primary to-primary/70 bg-clip-text
                      tracking-tight text-transparent
                    `,
                )}
              >
                {SEO_CONFIG.name}
              </span>
            </Link>
            <nav
              className={`
                hidden
                md:flex
              `}
            >
              <ul className="flex items-center gap-6">
                {isLoading
                  ? Array.from({ length: filteredNavigation.length }).map((_, i) => (
                      <li key={i}>
                        <Skeleton className="h-6 w-20" />
                      </li>
                    ))
                  : filteredNavigation.map((item) => {
                      const isActive =
                        pathname === item.href ||
                        (item.href !== "/" && pathname?.startsWith(item.href));

                      return (
                        <li key={item.name}>
                          <Link
                            className={cn(
                              `
                                text-sm font-medium transition-colors
                                hover:text-primary
                              `,
                              isActive
                                ? "font-semibold text-primary"
                                : "text-muted-foreground",
                            )}
                            href={item.href}
                          >
                            {item.name}
                          </Link>
                        </li>
                      );
                    })}
              </ul>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {/* Cart - only show on non-dashboard pages and not on cart page */}
            {!isDashboard && pathname !== "/cart" &&
              (isLoading ? (
                <Skeleton className={`h-9 w-9 rounded-full`} />
              ) : (
                <CartIcon />
              ))}

            {/* Notifications */}
            {isLoading ? (
              <Skeleton className="h-9 w-9 rounded-full" />
            ) : (
              <NotificationsWidget />
            )}

            {/* Authentication Section */}
            {showAuth && (
              <div
                className={`
                  hidden
                  md:block
                `}
              >
                {isAuthenticated && user ? (
                  <HeaderUserDropdown
                    isDashboard={!!isDashboard}
                    userEmail={user.email}
                    userImage={undefined}
                    userName={user.username}
                  />
                ) : isLoading ? (
                  <Skeleton className="h-10 w-32" />
                ) : (
                  <div className="flex items-center gap-2">
                    <Link href="/auth/sign-in">
                      <Button size="sm" variant="ghost">
                        Log in
                      </Button>
                    </Link>
                    <Link href="/auth/sign-up">
                      <Button size="sm">Sign up</Button>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Theme Toggle - only show on non-dashboard pages */}
            {!isDashboard &&
              (isLoading ? (
                <Skeleton className={`h-9 w-9 rounded-full`} />
              ) : (
                <ThemeToggle />
              ))}

            {/* Mobile menu button */}
            <Button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              size="icon"
              variant="ghost"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          {/* Navigation Links */}
          <div className="space-y-1 border-b px-4 py-3">
            {isLoading
              ? Array.from({ length: filteredNavigation.length }).map((_, i) => (
                  <div className="py-2" key={i}>
                    <Skeleton className="h-6 w-32" />
                  </div>
                ))
              : filteredNavigation.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/" && pathname?.startsWith(item.href));

                  return (
                    <Link
                      className={cn(
                        "block rounded-md px-3 py-2 text-base font-medium",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : `
                            text-foreground
                            hover:bg-muted/50 hover:text-primary
                          `,
                      )}
                      href={item.href}
                      key={item.name}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  );
                })}
          </div>

          {/* Authentication Section for Mobile */}
          {showAuth && (
            <div className="space-y-1 border-b px-4 py-3">
              {isAuthenticated && user ? (
                <div className="space-y-1">
                  <div className="px-3 py-2">
                    <div className="text-base font-medium text-foreground">
                      {user.username}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {user.email}
                    </div>
                  </div>
                  {isDashboard && (
                    <>
                      <Link
                        className={`
                          block rounded-md px-3 py-2 text-base font-medium
                          hover:bg-muted/50
                        `}
                        href="/dashboard/profile"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Profile
                      </Link>
                      <Link
                        className={`
                          block rounded-md px-3 py-2 text-base font-medium
                          hover:bg-muted/50
                        `}
                        href="/dashboard/settings"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Settings
                      </Link>
                    </>
                  )}
                  <Link
                    className={`
                      block rounded-md px-3 py-2 text-base font-medium
                      text-red-600 dark:text-red-400
                      hover:bg-red-50 dark:hover:bg-red-950/20
                    `}
                    href="/auth/sign-out"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign out
                  </Link>
                </div>
              ) : isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-6 w-24" />
                </div>
              ) : (
                <div className="space-y-1">
                  <Link
                    className={`
                      block rounded-md px-3 py-2 text-base font-medium
                      hover:bg-muted/50
                    `}
                    href="/auth/sign-in"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Log in
                  </Link>
                  <Link
                    className={`
                      block rounded-md bg-primary px-3 py-2 text-base font-medium
                      text-primary-foreground
                      hover:bg-primary/90
                    `}
                    href="/auth/sign-up"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Mobile Cart Link */}
          {!isDashboard && (
            <div className="border-b px-4 py-3">
              <Link
                href="/cart"
                className="block rounded-md px-3 py-2 text-base font-medium hover:bg-muted/50"
                onClick={() => setMobileMenuOpen(false)}
              >
                Shopping Cart
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );

  return renderContent();
}