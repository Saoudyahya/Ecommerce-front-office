"use client";

import * as React from "react";
import { CartProvider } from "~/lib/hooks/use-cart";
import { Footer } from "~/ui/components/footer";
import { Header } from "~/ui/components/header/header";
import { Toaster } from "~/ui/primitives/sonner";
import { useAuth } from "~/lib/hooks/usrAuth";

interface ClientLayoutProps {
  children: React.ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const { user, isAuthenticated } = useAuth();
  
  return (
    <CartProvider userId={isAuthenticated ? user?.id : null}>
      <Header showAuth={true} />
      <main className="flex min-h-screen flex-col pl-15">{children}</main>
      <Footer />
      <Toaster />
    </CartProvider>
  );
}