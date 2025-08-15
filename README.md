🛒 NexusCommerce Frontend - Modern E-Commerce Experience
Show Image
Show Image
Show Image
Show Image
🌟 Welcome to the Future of Online Shopping
NexusCommerce Frontend is a cutting-edge, responsive e-commerce web application built with modern technologies and best practices. Designed for performance, scalability, and exceptional user experience, it seamlessly integrates with our robust microservices backend to deliver a world-class shopping platform.
🛠️ Technology Stack
<div align="center">
Frontend Core
Show Image
Show Image
Show Image
Show Image
State Management & Data
Show Image
Show Image
Show Image
UI/UX & Animation
Show Image
Show Image
Show Image
Development & Quality
Show Image
Show Image
Show Image
Backend Integration
Show Image
Show Image
Show Image
</div>
🏗️ Frontend Architecture Overview
Our frontend implements a modern, scalable architecture with clean separation of concerns and optimal performance patterns:
mermaidgraph TB
    subgraph "User Interface Layer"
        PAGES[📱 Next.js Pages<br/>App Router]
        COMPONENTS[🧩 React Components<br/>Reusable & Composable]
        LAYOUTS[🖼️ Layouts<br/>Responsive Design]
    end

    subgraph "State Management"
        ZUSTAND[🗃️ Zustand Store<br/>Global State]
        REACT_QUERY[⚡ React Query<br/>Server State]
        FORM_STATE[📝 React Hook Form<br/>Form Management]
        LOCAL_STORAGE[💾 Local Storage<br/>Persistence]
    end

    subgraph "Service Layer"
        API_CLIENT[🌐 API Client<br/>Fetch Wrapper]
        AUTH_SERVICE[🔐 Auth Service<br/>JWT Management]
        CART_SERVICE[🛒 Cart Service<br/>Hybrid Storage]
        ORDER_SERVICE[📋 Order Service<br/>Order Management]
        PRODUCT_SERVICE[📦 Product Service<br/>Catalog Integration]
        PAYMENT_SERVICE[💳 Payment Service<br/>Secure Transactions]
        NOTIFICATION_SERVICE[🔔 Notification Service<br/>Real-time Updates]
        SAVED_SERVICE[❤️ Saved Items Service<br/>Wishlist Management]
    end

    subgraph "Backend Integration"
        GATEWAY[🌉 API Gateway<br/>:8099<br/>Load Balanced]
        
        subgraph "Microservices"
            USER_MS[👤 User Service]
            PRODUCT_MS[📦 Product Service]
            CART_MS[🛒 Cart Service]
            ORDER_MS[📋 Order Service]
            PAYMENT_MS[💳 Payment Service]
            SHIPPING_MS[🚚 Shipping Service]
            LOYALTY_MS[🎁 Loyalty Service]
            NOTIFICATION_MS[🔔 Notification Service]
        end
    end

    subgraph "UI Components Library"
        PRIMITIVES[🎨 UI Primitives<br/>Radix + Tailwind]
        FORMS[📝 Form Components<br/>Validation Ready]
        ANIMATIONS[✨ Motion Components<br/>Framer Motion]
        ICONS[🎯 Icon System<br/>Lucide React]
    end

    %% User Flow
    PAGES --> COMPONENTS
    COMPONENTS --> LAYOUTS
    COMPONENTS --> PRIMITIVES

    %% State Management Flow
    COMPONENTS --> ZUSTAND
    COMPONENTS --> REACT_QUERY
    COMPONENTS --> FORM_STATE
    ZUSTAND --> LOCAL_STORAGE

    %% Service Integration
    REACT_QUERY --> API_CLIENT
    API_CLIENT --> AUTH_SERVICE
    API_CLIENT --> CART_SERVICE
    API_CLIENT --> ORDER_SERVICE
    API_CLIENT --> PRODUCT_SERVICE
    API_CLIENT --> PAYMENT_SERVICE
    API_CLIENT --> NOTIFICATION_SERVICE
    API_CLIENT --> SAVED_SERVICE

    %% Backend Communication
    AUTH_SERVICE --> GATEWAY
    CART_SERVICE --> GATEWAY
    ORDER_SERVICE --> GATEWAY
    PRODUCT_SERVICE --> GATEWAY
    PAYMENT_SERVICE --> GATEWAY
    NOTIFICATION_SERVICE --> GATEWAY
    SAVED_SERVICE --> GATEWAY

    %% Gateway to Services
    GATEWAY --> USER_MS
    GATEWAY --> PRODUCT_MS
    GATEWAY --> CART_MS
    GATEWAY --> ORDER_MS
    GATEWAY --> PAYMENT_MS
    GATEWAY --> SHIPPING_MS
    GATEWAY --> LOYALTY_MS
    GATEWAY --> NOTIFICATION_MS

    %% UI Library
    COMPONENTS --> FORMS
    COMPONENTS --> ANIMATIONS
    COMPONENTS --> ICONS

    %% Styling
    classDef uiLayer fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef stateLayer fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef serviceLayer fill:#e8f5e8,stroke:#388e3c,stroke-width:2px
    classDef backendLayer fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef componentLayer fill:#fce4ec,stroke:#c2185b,stroke-width:2px

    class PAGES,COMPONENTS,LAYOUTS uiLayer
    class ZUSTAND,REACT_QUERY,FORM_STATE,LOCAL_STORAGE stateLayer
    class API_CLIENT,AUTH_SERVICE,CART_SERVICE,ORDER_SERVICE,PRODUCT_SERVICE,PAYMENT_SERVICE,NOTIFICATION_SERVICE,SAVED_SERVICE serviceLayer
    class GATEWAY,USER_MS,PRODUCT_MS,CART_MS,ORDER_MS,PAYMENT_MS,SHIPPING_MS,LOYALTY_MS,NOTIFICATION_MS backendLayer
    class PRIMITIVES,FORMS,ANIMATIONS,ICONS componentLayer
🎨 Component Architecture & Design System
Our component library follows atomic design principles with a comprehensive design system:
mermaidgraph TB
    subgraph "🎨 Design System"
        TOKENS[🎯 Design Tokens<br/>Colors, Typography, Spacing]
        THEMES[🌙 Theme System<br/>Light/Dark Mode]
        BREAKPOINTS[📱 Responsive Breakpoints<br/>Mobile-First]
    end

    subgraph "🔧 Primitive Components"
        BUTTON[🔘 Button<br/>variants, sizes, states]
        INPUT[📝 Input<br/>validation, types]
        CARD[🃏 Card<br/>layouts, shadows]
        DIALOG[💬 Dialog<br/>modals, overlays]
        DROPDOWN[📋 Dropdown<br/>select, menu]
        TOAST[🍞 Toast<br/>notifications]
    end

    subgraph "🧩 Composite Components"
        PRODUCT_CARD[🛍️ ProductCard<br/>image, price, actions]
        CART_ITEM[🛒 CartItem<br/>quantity, remove]
        ORDER_SUMMARY[📊 OrderSummary<br/>totals, breakdown]
        CHECKOUT_FORM[💳 CheckoutForm<br/>validation, steps]
        USER_PROFILE[👤 UserProfile<br/>settings, preferences]
        NOTIFICATION_ITEM[🔔 NotificationItem<br/>status, actions]
    end

    subgraph "📄 Page Components"
        PRODUCT_LIST[📦 ProductListPage<br/>grid, filters, search]
        PRODUCT_DETAIL[🔍 ProductDetailPage<br/>images, reviews, variants]
        CART_PAGE[🛒 CartPage<br/>items, totals, checkout]
        CHECKOUT_PAGE[💳 CheckoutPage<br/>forms, payment, shipping]
        ORDER_PAGE[📋 OrderPage<br/>history, status, tracking]
        PROFILE_PAGE[👤 ProfilePage<br/>settings, orders, wishlist]
    end

    subgraph "🎭 Layout Components"
        HEADER[🔝 Header<br/>navigation, search, cart]
        FOOTER[🔻 Footer<br/>links, info]
        SIDEBAR[📐 Sidebar<br/>filters, categories]
        NAVIGATION[🧭 Navigation<br/>breadcrumbs, pagination]
    end

    %% Design System Flow
    TOKENS --> THEMES
    THEMES --> BREAKPOINTS

    %% Primitive Usage
    TOKENS --> BUTTON
    TOKENS --> INPUT
    TOKENS --> CARD
    TOKENS --> DIALOG
    TOKENS --> DROPDOWN
    TOKENS --> TOAST

    %% Composite Composition
    BUTTON --> PRODUCT_CARD
    CARD --> PRODUCT_CARD
    INPUT --> CART_ITEM
    BUTTON --> CART_ITEM
    CARD --> ORDER_SUMMARY
    INPUT --> CHECKOUT_FORM
    BUTTON --> CHECKOUT_FORM
    DIALOG --> CHECKOUT_FORM
    CARD --> USER_PROFILE
    INPUT --> USER_PROFILE
    TOAST --> NOTIFICATION_ITEM

    %% Page Composition
    PRODUCT_CARD --> PRODUCT_LIST
    SIDEBAR --> PRODUCT_LIST
    NAVIGATION --> PRODUCT_LIST
    PRODUCT_CARD --> PRODUCT_DETAIL
    CART_ITEM --> CART_PAGE
    ORDER_SUMMARY --> CART_PAGE
    CHECKOUT_FORM --> CHECKOUT_PAGE
    ORDER_SUMMARY --> CHECKOUT_PAGE
    ORDER_SUMMARY --> ORDER_PAGE
    NAVIGATION --> ORDER_PAGE
    USER_PROFILE --> PROFILE_PAGE

    %% Layout Integration
    HEADER --> PRODUCT_LIST
    FOOTER --> PRODUCT_LIST
    HEADER --> PRODUCT_DETAIL
    FOOTER --> PRODUCT_DETAIL
    HEADER --> CART_PAGE
    FOOTER --> CART_PAGE
    HEADER --> CHECKOUT_PAGE
    HEADER --> ORDER_PAGE
    FOOTER --> ORDER_PAGE
    HEADER --> PROFILE_PAGE
    FOOTER --> PROFILE_PAGE

    %% Styling
    classDef designSystem fill:#e8eaf6,stroke:#3f51b5,stroke-width:2px
    classDef primitives fill:#e0f2f1,stroke:#00695c,stroke-width:2px
    classDef composites fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
    classDef pages fill:#fce4ec,stroke:#ad1457,stroke-width:2px
    classDef layouts fill:#f3e5f5,stroke:#6a1b9a,stroke-width:2px

    class TOKENS,THEMES,BREAKPOINTS designSystem
    class BUTTON,INPUT,CARD,DIALOG,DROPDOWN,TOAST primitives
    class PRODUCT_CARD,CART_ITEM,ORDER_SUMMARY,CHECKOUT_FORM,USER_PROFILE,NOTIFICATION_ITEM composites
    class PRODUCT_LIST,PRODUCT_DETAIL,CART_PAGE,CHECKOUT_PAGE,ORDER_PAGE,PROFILE_PAGE pages
    class HEADER,FOOTER,SIDEBAR,NAVIGATION layouts
🚀 Key Features
🛍️ Shopping Experience

🎯 Smart Product Catalog: Advanced filtering, search, and categorization
💖 Wishlist Management: Save items for later with availability tracking
🛒 Intelligent Cart: Real-time sync, guest and authenticated modes
🔍 Product Discovery: Recommendations, reviews, and detailed views
📱 Responsive Design: Seamless experience across all devices

👤 User Management

🔐 Secure Authentication: JWT with refresh tokens, OAuth2 integration
📋 Profile Management: Personal information, preferences, addresses
📜 Order History: Complete order tracking and management
🎁 Loyalty Program: Points, tiers, and rewards integration
🔔 Real-time Notifications: Order updates, promotions, system alerts

💳 Checkout & Payments

🎯 Multi-step Checkout: Address, shipping, payment, review
💰 Multiple Payment Methods: Credit cards, PayPal, digital wallets
🚚 Shipping Options: Real-time rates, tracking integration
🧾 Order Management: Status tracking, invoices, returns
🔒 Secure Processing: PCI compliant, encrypted transactions

🎨 User Interface

🌙 Dark/Light Mode: System preference detection and manual toggle
✨ Smooth Animations: Framer Motion for engaging interactions
♿ Accessibility: WCAG compliant, keyboard navigation, screen readers
🎨 Modern Design: Clean, intuitive, conversion-optimized
⚡ Performance: Optimized loading, caching, and rendering

📱 User Journey Flow
This diagram illustrates the complete user experience from discovery to post-purchase:
mermaidjourney
    title E-Commerce User Journey
    section Discovery
      Visit Homepage: 5: User
      Browse Categories: 4: User
      Search Products: 4: User
      View Product Details: 5: User
      Read Reviews: 3: User
    section Shopping
      Add to Cart: 5: User
      Save for Later: 4: User
      Update Quantities: 3: User
      Apply Coupons: 4: User
      View Cart Summary: 4: User
    section Authentication
      Sign Up/Login: 3: User
      OAuth2 Login: 5: User
      Profile Setup: 3: User
      Address Management: 3: User
    section Checkout
      Review Cart: 4: User
      Enter Shipping: 3: User
      Select Payment: 4: User
      Place Order: 5: User
      Confirmation: 5: User
    section Post-Purchase
      Track Order: 4: User
      Receive Notifications: 5: User
      Rate & Review: 3: User
      Earn Loyalty Points: 4: User
      Repeat Purchase: 5: User
🔄 State Management Architecture
Our state management strategy combines multiple approaches for optimal performance and developer experience:
mermaidgraph TB
    subgraph "🌍 Global State (Zustand)"
        USER_STATE[👤 User State<br/>auth, profile, preferences]
        CART_STATE[🛒 Cart State<br/>items, totals, sync status]
        UI_STATE[🎨 UI State<br/>theme, modals, notifications]
        SAVED_STATE[❤️ Saved Items State<br/>wishlist, count, sync]
    end

    subgraph "🔄 Server State (React Query)"
        PRODUCTS[📦 Products Query<br/>catalog, search, filters]
        ORDERS[📋 Orders Query<br/>history, status, details]
        REVIEWS[⭐ Reviews Query<br/>ratings, comments]
        NOTIFICATIONS[🔔 Notifications Query<br/>real-time updates]
        USER_PROFILE[👤 Profile Query<br/>settings, addresses]
    end

    subgraph "📝 Form State (React Hook Form)"
        CHECKOUT_FORM[💳 Checkout Forms<br/>validation, steps]
        PROFILE_FORM[👤 Profile Forms<br/>personal info, settings]
        REVIEW_FORM[⭐ Review Forms<br/>ratings, comments]
        AUTH_FORM[🔐 Auth Forms<br/>login, signup, reset]
    end

    subgraph "💾 Persistent State"
        LOCAL_STORAGE[💽 Local Storage<br/>cart, preferences, tokens]
        SESSION_STORAGE[🔄 Session Storage<br/>temporary data, forms]
        COOKIES[🍪 Cookies<br/>auth tokens, settings]
        INDEXEDDB[🗄️ IndexedDB<br/>offline data, cache]
    end

    subgraph "🔄 State Synchronization"
        SYNC_MANAGER[⚡ Sync Manager<br/>online/offline handling]
        CONFLICT_RESOLVER[🤝 Conflict Resolver<br/>merge strategies]
        QUEUE_MANAGER[📤 Queue Manager<br/>pending operations]
    end

    %% Global State Flow
    USER_STATE --> LOCAL_STORAGE
    CART_STATE --> LOCAL_STORAGE
    UI_STATE --> LOCAL_STORAGE
    SAVED_STATE --> LOCAL_STORAGE

    %% Server State Integration
    PRODUCTS --> INDEXEDDB
    ORDERS --> INDEXEDDB
    REVIEWS --> INDEXEDDB
    NOTIFICATIONS --> SESSION_STORAGE
    USER_PROFILE --> LOCAL_STORAGE

    %% Form State Persistence
    CHECKOUT_FORM --> SESSION_STORAGE
    PROFILE_FORM --> SESSION_STORAGE
    AUTH_FORM --> SESSION_STORAGE

    %% Synchronization
    CART_STATE --> SYNC_MANAGER
    SAVED_STATE --> SYNC_MANAGER
    USER_STATE --> SYNC_MANAGER
    SYNC_MANAGER --> CONFLICT_RESOLVER
    SYNC_MANAGER --> QUEUE_MANAGER

    %% Cross-State Communication
    USER_STATE --> CART_STATE
    USER_STATE --> SAVED_STATE
    CART_STATE --> CHECKOUT_FORM
    USER_PROFILE --> PROFILE_FORM

    %% Styling
    classDef globalState fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef serverState fill:#e8f5e8,stroke:#388e3c,stroke-width:2px
    classDef formState fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef persistentState fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef syncState fill:#ffebee,stroke:#d32f2f,stroke-width:2px

    class USER_STATE,CART_STATE,UI_STATE,SAVED_STATE globalState
    class PRODUCTS,ORDERS,REVIEWS,NOTIFICATIONS,USER_PROFILE serverState
    class CHECKOUT_FORM,PROFILE_FORM,REVIEW_FORM,AUTH_FORM formState
    class LOCAL_STORAGE,SESSION_STORAGE,COOKIES,INDEXEDDB persistentState
    class SYNC_MANAGER,CONFLICT_RESOLVER,QUEUE_MANAGER syncState
🛒 Shopping Cart Architecture
Our hybrid cart system provides seamless experience for both guest and authenticated users:
mermaidsequenceDiagram
    participant User as 👤 User
    participant Frontend as 🖥️ Frontend
    participant CartStore as 🛒 Cart Store
    participant LocalStorage as 💾 Local Storage
    participant API as 🌐 API Gateway
    participant CartService as 🏪 Cart Service
    participant AuthService as 🔐 Auth Service

    Note over User,AuthService: Guest User Shopping

    User->>+Frontend: Add item to cart
    Frontend->>+CartStore: addItem(product, quantity)
    CartStore->>+LocalStorage: Store cart data
    LocalStorage-->>-CartStore: Data stored
    CartStore-->>-Frontend: Cart updated
    Frontend-->>-User: Item added (UI update)

    Note over User,AuthService: User Authentication

    User->>+Frontend: Sign in
    Frontend->>+AuthService: authenticate(credentials)
    AuthService-->>-Frontend: JWT token + user info
    Frontend->>+CartStore: initializeAuthenticatedMode(userId)
    
    Note over CartStore,CartService: Cart Synchronization
    
    CartStore->>+LocalStorage: Get local cart items
    LocalStorage-->>-CartStore: Local cart data
    CartStore->>+API: POST /api/cart/sync
    API->>+CartService: Sync local cart with server
    CartService->>CartService: Merge strategies:<br/>SUM_QUANTITIES,<br/>KEEP_LATEST
    CartService-->>-API: Merged cart data
    API-->>-CartStore: Synchronized cart
    CartStore->>LocalStorage: Clear local cart
    CartStore-->>Frontend: Cart synchronized

    Note over User,AuthService: Authenticated Shopping

    User->>+Frontend: Add another item
    Frontend->>+CartStore: addItem(product, quantity)
    CartStore->>+API: POST /api/cart/items
    API->>+CartService: Add item to user cart
    CartService-->>-API: Updated cart
    API-->>-CartStore: Server response
    CartStore->>LocalStorage: Update local cache
    CartStore-->>-Frontend: Cart updated
    Frontend-->>-User: Item added

    Note over User,AuthService: Offline Handling

    rect rgb(255, 240, 240)
        User->>+Frontend: Add item (offline)
        Frontend->>+CartStore: addItem(product, quantity)
        CartStore->>CartStore: Queue operation
        CartStore->>LocalStorage: Store pending operation
        CartStore-->>-Frontend: Optimistic update
        Frontend-->>-User: Item added (will sync later)
    end

    Note over User,AuthService: Back Online Sync

    rect rgb(240, 255, 240)
        Frontend->>+CartStore: Network detected
        CartStore->>CartStore: Process queued operations
        CartStore->>+API: Sync pending operations
        API->>+CartService: Process bulk operations
        CartService-->>-API: All operations completed
        API-->>-CartStore: Sync successful
        CartStore->>LocalStorage: Clear operation queue
    end
🎨 UI Component Examples
Product Card Component
typescriptinterface ProductCardProps {
  product: ProductSummary;
  onAddToCart: (productId: string, details: ProductDetails) => Promise<void>;
  onAddToWishlist: (productId: string) => void;
}

export function ProductCard({ product, onAddToCart, onAddToWishlist }: ProductCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="group relative bg-white rounded-lg shadow-sm border hover:shadow-md transition-all duration-200"
    >
      {/* Product Image */}
      <div className="aspect-square overflow-hidden rounded-t-lg bg-gray-100">
        <Image
          src={product.images[0] || '/placeholder.jpg'}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
        <p className="text-sm text-gray-500 mt-1">{product.category}</p>
        
        {/* Price & Rating */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-gray-900">
              ${product.price.toFixed(2)}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-gray-500 line-through">
                ${product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>
          <div className="flex items-center">
            <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="text-sm text-gray-600 ml-1">
              {product.rating.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 mt-4">
          <Button
            onClick={() => handleAddToCart()}
            disabled={!product.inStock || isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShoppingCart className="h-4 w-4 mr-2" />
            )}
            {product.inStock ? 'Add to Cart' : 'Out of Stock'}
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleWishlistToggle()}
            className={isSaved ? 'text-red-500' : ''}
          >
            <Heart className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
🔐 Authentication Flow
Our authentication system supports multiple methods with secure token management:
mermaidsequenceDiagram
    participant User as 👤 User
    participant Frontend as 🖥️ Frontend App
    participant AuthService as 🔐 Auth Service
    participant Gateway as 🌐 API Gateway
    participant UserService as 👥 User Service
    participant Google as 🔍 Google OAuth

    Note over User,Google: Standard Login Flow

    User->>+Frontend: Enter credentials
    Frontend->>+AuthService: signin(username, password)
    AuthService->>+Gateway: POST /api/users/signin
    Gateway->>+UserService: Authenticate user
    UserService->>UserService: Validate credentials
    UserService-->>-Gateway: JWT token + user data
    Gateway-->>-AuthService: Authentication response
    AuthService->>AuthService: Store tokens in cookies
    AuthService->>Frontend: Set user state
    AuthService-->>-Frontend: Authentication success
    Frontend-->>-User: Redirect to dashboard

    Note over User,Google: OAuth2 Google Login

    User->>+Frontend: Click "Sign in with Google"
    Frontend->>+AuthService: initiateGoogleLogin()
    AuthService->>AuthService: Redirect to Google OAuth
    AuthService-->>-Frontend: Redirect to OAuth URL
    Frontend-->>-User: Redirect to Google

    User->>+Google: Authorize application
    Google-->>-User: Redirect to callback

    User->>+Frontend: OAuth callback with token
    Frontend->>+AuthService: handleOAuth2Callback(token)
    AuthService->>AuthService: Parse JWT token
    AuthService->>AuthService: Extract user info
    AuthService->>AuthService: Store in cookies
    AuthService-->>-Frontend: User authenticated
    Frontend-->>-User: Welcome to dashboard

    Note over User,Google: Token Refresh Flow

    Frontend->>+AuthService: API call with expired token
    AuthService->>AuthService: Check token expiration
    AuthService->>+Gateway: Refresh token request
    Gateway->>+UserService: Validate refresh token
    UserService-->>-Gateway: New JWT token
    Gateway-->>-AuthService: Token refreshed
    AuthService->>AuthService: Update stored tokens
    AuthService-->>-Frontend: Retry original request

    Note over User,Google: Logout Flow

    User->>+Frontend: Logout request
    Frontend->>+AuthService: signout()
    AuthService->>+Gateway: POST /api/users/signout
    Gateway->>+UserService: Invalidate session
    UserService-->>-Gateway: Session invalidated
    Gateway-->>-AuthService: Logout successful
    AuthService->>AuthService: Clear cookies & state
    AuthService-->>-Frontend: User logged out
    Frontend-->>-User: Redirect to login
📱 Responsive Design Breakpoints
Our design system implements a mobile-first approach with carefully crafted breakpoints:
mermaidgraph LR
    subgraph "📱 Mobile First Design"
        XS[📱 XS: 0-479px<br/>Mobile Portrait]
        SM[📱 SM: 480-767px<br/>Mobile Landscape]
        MD[💻 MD: 768-1023px<br/>Tablet]
        LG[🖥️ LG: 1024-1279px<br/>Desktop]
        XL[🖥️ XL: 1280px+<br/>Large Desktop]
    end

    subgraph "🎨 Component Adaptations"
        GRID[🔲 Grid System<br/>1→2→3→4→5 columns]
        NAV[🧭 Navigation<br/>Hamburger→Horizontal]
        CARDS[🃏 Product Cards<br/>Full→Half→Third width]
        FORMS[📝 Forms<br/>Stack→Side-by-side]
        IMAGES[🖼️ Images<br/>Responsive sizes]
    end

    subgraph "📊 Layout Patterns"
        HEADER[🔝 Header<br/>Collapsible elements]
        SIDEBAR[📐 Sidebar<br/>Drawer→Fixed]
        FOOTER[🔻 Footer<br/>Stacked→Columns]
        MODALS[💬 Modals<br/>Fullscreen→Centered]
    end

    %% Breakpoint Flow
    XS --> SM
    SM --> MD
    MD --> LG
    LG --> XL

    %% Component Adaptations
    XS --> GRID
    SM --> GRID
    MD --> GRID
    LG --> GRID
    XL --> GRID

    XS --> NAV
    MD --> NAV

    XS --> CARDS
    SM --> CARDS
    MD --> CARDS

    XS --> FORMS
    MD --> FORMS

    %% Layout Patterns
    XS --> HEADER
    SM --> SIDEBAR
    XS --> FOOTER
    XS --> MODALS
    MD --> MODALS

    %% Styling
    classDef mobile fill:#ffebee,stroke:#e91e63,stroke-width:2px
    classDef tablet fill:#e8f5e8,stroke:#4caf50,stroke-width:2px
    classDef desktop fill:#e3f2fd,stroke:#2196f3,stroke-width:2px
    classDef adaptation fill:#fff3e0,stroke:#ff9800,stroke-width:2px
    classDef layout fill:#f3e5f5,stroke:#9c27b0,stroke-width:2px

    class XS,SM mobile
    class MD tablet
    class LG,XL desktop
    class GRID,NAV,CARDS,FORMS,IMAGES adaptation
    class HEADER,SIDEBAR,FOOTER,MODALS layout
🚀 Getting Started
Prerequisites
Show Image
Show Image
Show Image

Node.js 18+
npm or yarn
Git
Code editor (VS Code recommended)

Quick Start

Clone the repository:
bashgit clone https://github.com/ZakariaRek/Ecommerce-App.git
cd Ecommerce-App/frontend

Install dependencies:
bashnpm install
# or
yarn install

Set up environment variables:
bashcp .env.example .env.local
Update .env.local with your configuration:
envNEXT_PUBLIC_API_URL=http://localhost:8099/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

Start the development server:
bashnpm run dev
# or
yarn dev

Open your browser:
Navigate to http://localhost:3000

🎯 Available Scripts
bash# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run type-check   # TypeScript type checking

# Testing
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report

# Deployment
npm run build        # Production build
npm run preview      # Preview production build
npm run deploy       # Deploy to Vercel
Development Environment
bash# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8099/api
NEXT_PUBLIC_GATEWAY_URL=http://localhost:8099

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000

# Authentication
NEXTAUTH_SECRET=development-secret-key
JWT_SECRET=development-jwt-secret

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_PWA=true
NEXT_PUBLIC_DEBUG_MODE=true
Production Environment
bash# API Configuration
NEXT_PUBLIC_API_URL=https://api.nexuscommerce.io/api
NEXT_PUBLIC_GATEWAY_URL=https://api.nexuscommerce.io

# Application URLs
NEXT_PUBLIC_APP_URL=https://nexuscommerce.io
NEXTAUTH_URL=https://nexuscommerce.io

# Authentication
NEXTAUTH_SECRET=production-secret-key-very-secure
JWT_SECRET=production-jwt-secret-very-secure

# OAuth Providers
GOOGLE_CLIENT_ID=production-google-client-id
GOOGLE_CLIENT_SECRET=production-google-client-secret

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_PWA=true
NEXT_PUBLIC_DEBUG_MODE=false

# Performance
NEXT_PUBLIC_CDN_URL=https://cdn.nexuscommerce.io
🔧 API Integration
Service Layer Architecture
typescript// Base API Client
class ApiClient {
  private baseURL: string;
  private authService: AuthService;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL!;
    this.authService = new AuthService();
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...this.authService.getAuthHeaders(),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      throw new ApiError(response.status, await response.text());
    }

    return response.json();
  }
}

// Product Service Example
export class ProductService extends ApiClient {
  async getProducts(): Promise<Product[]> {
    return this.request('/products');
  }

  async getProduct(id: string): Promise<Product> {
    return this.request(`/products/${id}`);
  }

  async searchProducts(query: string): Promise<Product[]> {
    return this.request(`/products/search?q=${encodeURIComponent(query)}`);
  }
}
React Query Integration
typescript// Product Queries
export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: () => productService.getProducts(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => productService.getProduct(id),
    enabled: !!id,
  });
}

// Cart Mutations
export function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, quantity }: AddToCartRequest) =>
      cartService.addItem(productId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Item added to cart!');
    },
    onError: (error) => {
      toast.error(`Failed to add item: ${error.message}`);
    },
  });
}
🎨 UI Components Documentation
Design System Components
typescript// Button Component with Variants
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  loading = false,
  disabled = false,
  children,
  onClick,
  ...props 
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded',
    md: 'px-4 py-2 text-sm rounded-md',
    lg: 'px-6 py-3 text-base rounded-lg',
  };

  return (
    <button
      className={cn(
        baseClasses,
        variants[variant],
        sizes[size],
        (disabled || loading) && 'opacity-50 cursor-not-allowed'
      )}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
🚀 Deployment
Vercel Deployment (Recommended)

Connect to Vercel:
bashnpm install -g vercel
vercel login
vercel

Environment Variables:
Set up production environment variables in Vercel dashboard
Automatic Deployments:

Main branch deploys to production
Feature branches create preview deployments



Docker Deployment
dockerfile# Dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["npm", "start"]
yaml# docker-compose.yml
version: '3.8'
services:
  frontend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8099/api
      - NEXTAUTH_URL=http://localhost:3000
    depends_on:
      - backend
    networks:
      - ecommerce-network

networks:
  ecommerce-network:
    driver: bridge
🔍 Performance Optimization
Next.js Optimizations
typescript// Image Optimization
import Image from 'next/image';

<Image
  src={product.image}
  alt={product.name}
  width={300}
  height={300}
  priority={isAboveFold}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>

// Dynamic Imports
const ProductModal = dynamic(() => import('./ProductModal'), {
  loading: () => <Skeleton className="w-full h-96" />,
  ssr: false,
});

// Route Prefetching
import { useRouter } from 'next/navigation';

const router = useRouter();

// Prefetch product pages on hover
const handleMouseEnter = () => {
  router.prefetch(`/products/${product.id}`);
};
Bundle Analysis
bash# Analyze bundle size
npm run build:analyze

# Performance monitoring
npm install @vercel/analytics
npm install @vercel/speed-insights
🧪 Testing Strategy
Component Testing
typescript// ProductCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from './ProductCard';

const mockProduct = {
  id: '1',
  name: 'Test Product',
  price: 29.99,
  image: '/test-image.jpg',
  inStock: true,
};

describe('ProductCard', () => {
  it('renders product information correctly', () => {
    render(<ProductCard product={mockProduct} />);
    
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$29.99')).toBeInTheDocument();
  });

  it('calls onAddToCart when button is clicked', () => {
    const mockAddToCart = jest.fn();
    render(
      <ProductCard 
        product={mockProduct} 
        onAddToCart={mockAddToCart}
      />
    );
    
    fireEvent.click(screen.getByText('Add to Cart'));
    expect(mockAddToCart).toHaveBeenCalledWith(mockProduct.id);
  });
});
E2E Testing with Playwright
typescript// e2e/shopping-flow.spec.ts
import { test, expect } from '@playwright/test';

test('complete shopping flow', async ({ page }) => {
  await page.goto('/');
  
  // Browse products
  await page.click('[data-testid="product-category-electronics"]');
  await expect(page).toHaveURL('/products?category=electronics');
  
  // Add to cart
  await page.click('[data-testid="product-card"]:first-child >> text=Add to Cart');
  await expect(page.locator('[data-testid="cart-count"]')).toContainText('1');
  
  // Checkout
  await page.click('[data-testid="cart-button"]');
  await page.click('[data-testid="checkout-button"]');
  
  // Complete checkout form
  await page.fill('[data-testid="shipping-address"]', '123 Main St');
  await page.fill('[data-testid="credit-card"]', '4111111111111111');
  await page.click('[data-testid="place-order"]');
  
  // Verify success
  await expect(page).toHaveURL(/\/orders\/success/);
  await expect(page.locator('h1')).toContainText('Order Confirmed');
});
📊 Analytics & Monitoring
Performance Monitoring
typescript// lib/analytics.ts
import { Analytics } from '@vercel/analytics';
import { SpeedInsights } from '@vercel/speed-insights';

export function setupAnalytics() {
  // Track page views
  const trackPageView = (url: string) => {
    Analytics.track('page_view', { url });
  };

  // Track e-commerce events
  const trackPurchase = (orderId: string, total: number) => {
    Analytics.track('purchase', { orderId, total });
  };

  const trackAddToCart = (productId: string, quantity: number) => {
    Analytics.track('add_to_cart', { productId, quantity });
  };

  return {
    trackPageView,
    trackPurchase,
    trackAddToCart,
  };
}
Error Monitoring
typescript// lib/error-tracking.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  beforeSend(event) {
    // Filter out non-critical errors
    if (event.exception) {
      const error = event.exception.values?.[0];
      if (error?.type === 'ChunkLoadError') {
        return null; // Ignore chunk loading errors
      }
    }
    return event;
  },
});

// Custom error boundary
export class ErrorBoundary extends Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    Sentry.captureException(error, {
      contexts: { react: errorInfo },
    });
  }
}
📱 Progressive Web App (PWA)
PWA Configuration
typescript// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'offlineCache',
        expiration: {
          maxEntries: 200,
        },
      },
    },
  ],
});

module.exports = withPWA({
  // Next.js config
});
Offline Support
typescript// hooks/useOfflineSync.ts
export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingOperations, setPendingOperations] = useState([]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingOperations();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncPendingOperations = async () => {
    // Sync operations when back online
    for (const operation of pendingOperations) {
      try {
        await operation.execute();
        setPendingOperations(ops => ops.filter(op => op.id !== operation.id));
      } catch (error) {
        console.error('Failed to sync operation:', error);
      }
    }
  };

  return { isOnline, pendingOperations };
}
🤝 Contributing
We welcome contributions! Please see our Contributing Guide for details.
Development Workflow

Fork the repository
Create a feature branch: git checkout -b feature/amazing-feature
Install dependencies: npm install
Start development server: npm run dev
Make your changes with proper testing
Run tests: npm run test
Run linting: npm run lint
Commit changes: git commit -m 'Add amazing feature'
Push to branch: git push origin feature/amazing-feature
Create Pull Request

Code Style Guidelines
bash# ESLint configuration
npm run lint          # Check for issues
npm run lint:fix      # Auto-fix issues

# Prettier formatting
npm run format        # Format code
npm run format:check  # Check formatting

# TypeScript type checking
npm run type-check    # Verify types
📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
🔗 Links & Resources

🌐 Live Demo: https://nexuscommerce-demo.vercel.app
📚 Documentation: https://docs.nexuscommerce.io
🐛 Issue Tracker: GitHub Issues
💬 Discussions: GitHub Discussions
📧 Support: support@nexuscommerce.io

🙏 Acknowledgments

Next.js Team for the amazing framework
Vercel for hosting and deployment platform
Tailwind CSS for the utility-first CSS framework
Open Source Community for the incredible libraries and tools


<div align="center">
🌟 Star us on GitHub if this project helped you!
Show Image
Show Image
Built with ❤️ by the NexusCommerce Team
</div>
