// "use client";

// import React from "react";
// import { useRouter } from "next/navigation";
// import { useEffect, useState, createContext, useContext } from "react";

// // Mock user type
// export type User = {
//   id: string;
//   name: string;
//   email: string;
//   image?: string;
// };

// // Mock session type
// export type Session = {
//   expires: string;
// };

// // Mock auth state
// type AuthState = {
//   user: User | null;
//   session: Session | null;
// };

// // Create auth context
// const AuthContext = createContext<{
//   authState: AuthState;
//   setAuthState: React.Dispatch<React.SetStateAction<AuthState>>;
//   isPending: boolean;
// }>({ 
//   authState: { user: null, session: null },
//   setAuthState: () => {},
//   isPending: true 
// });

// // Mock auth provider component
// export function AuthProvider({ children }: { children: React.ReactNode }) {
//   const [authState, setAuthState] = useState<AuthState>({
//     user: null,
//     session: null
//   });
//   const [isPending, setIsPending] = useState(true);

//   // Check for stored auth on mount
//   useEffect(() => {
//     const storedAuth = typeof localStorage !== 'undefined' ? localStorage.getItem('mockAuth') : null;
//     if (storedAuth) {
//       try {
//         setAuthState(JSON.parse(storedAuth));
//       } catch (e) {
//         console.error('Failed to parse stored auth', e);
//       }
//     }
//     setIsPending(false);
//   }, []);

//   // Use createElement instead of JSX
//   return React.createElement(
//     AuthContext.Provider,
//     { value: { authState, setAuthState, isPending } },
//     children
//   );
// }

// // Mock auth methods
// export const signIn = async ({ email, password }: { email: string; password: string }) => {
//   // Mock successful sign in with demo user
//   const mockUser: User = {
//     id: '1',
//     name: 'Demo User',
//     email: email || 'demo@example.com',
//     image: 'https://via.placeholder.com/150'
//   };
  
//   const mockSession: Session = {
//     expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
//   };

//   const authState = { user: mockUser, session: mockSession };
//   if (typeof localStorage !== 'undefined') {
//     localStorage.setItem('mockAuth', JSON.stringify(authState));
//   }
  
//   return { user: mockUser, session: mockSession };
// };

// export const signOut = async () => {
//   if (typeof localStorage !== 'undefined') {
//     localStorage.removeItem('mockAuth');
//   }
//   return true;
// };

// export const signUp = async ({ email, password, name }: { email: string; password: string; name: string }) => {
//   // Mock successful sign up
//   const mockUser: User = {
//     id: '1',
//     name: name || 'New User',
//     email: email || 'new@example.com',
//     image: 'https://via.placeholder.com/150'
//   };
  
//   const mockSession: Session = {
//     expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
//   };

//   const authState = { user: mockUser, session: mockSession };
//   if (typeof localStorage !== 'undefined') {
//     localStorage.setItem('mockAuth', JSON.stringify(authState));
//   }
  
//   return { user: mockUser, session: mockSession };
// };

// // Mock useSession hook
// export const useSession = () => {
//   const { authState, isPending } = useContext(AuthContext);
  
//   return {
//     data: authState.user ? { user: authState.user, session: authState.session } : null,
//     isPending
//   };
// };

// // Mock two-factor methods (simplified)
// export const twoFactor = {
//   verify: async () => ({ success: true }),
//   challenge: async () => ({ success: true }),
// };

// // Hook to get current user data and loading state
// export const useCurrentUser = () => {
//   const { data, isPending } = useSession();
//   return {
//     isPending,
//     session: data?.session,
//     user: data?.user,
//   };
// };

// // Hook for client-side auth with redirect
// export const useCurrentUserOrRedirect = (
//   forbiddenUrl = "/auth/sign-in",
//   okUrl = "",
//   ignoreForbidden = false,
// ) => {
//   const { data, isPending } = useSession();
//   const router = useRouter();

//   useEffect(() => {
//     // only perform redirects after loading is complete and router is ready
//     if (!isPending && router) {
//       // if no user is found
//       if (!data?.user) {
//         // redirect to forbidden url unless explicitly ignored
//         if (!ignoreForbidden) {
//           router.push(forbiddenUrl);
//         }
//         // if ignoreforbidden is true, we do nothing and let the hook return the null user
//       } else if (okUrl) {
//         // if user is found and an okurl is provided, redirect there
//         router.push(okUrl);
//       }
//     }
//     // depend on loading state, user data, router instance, and redirect urls
//   }, [isPending, data?.user, router, forbiddenUrl, okUrl, ignoreForbidden]);

//   return {
//     isPending,
//     session: data?.session,
//     user: data?.user,
//   };
// };

// // Helper function to get raw session data
// export const getRawSession = async () => {
//   try {
//     if (typeof localStorage === 'undefined') {
//       return { data: null, error: null };
//     }
    
//     const storedAuth = localStorage.getItem('mockAuth');
//     if (storedAuth) {
//       const parsed = JSON.parse(storedAuth);
//       return { data: parsed, error: null };
//     }
//     return { data: null, error: null };
//   } catch (error) {
//     return { data: null, error };
//   }
// };
