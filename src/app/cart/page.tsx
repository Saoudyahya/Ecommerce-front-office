// import { CartProvider } from "~/ui/components/cart";
// import { useAuth } from "~/lib/hooks/usrAuth";

// export default function Cart() {
//   const { user, isAuthenticated } = useAuth();

//   return (
//     <CartProvider userId={isAuthenticated ? user?.id : undefined}>
//       <CartPage />
//     </CartProvider>
//   );
// }
"use client";

import CartPage from "./cartComp";

export default function Cart() {
  // No need for CartProvider here since it's already in the layout
  return <CartPage />;
}