"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Clock, ShoppingBag, Star, Truck, ChevronLeft, ChevronRight, Play, Moon, Sun } from "lucide-react";

// ---------- Mock Data ----------
const heroSlides = [
  {
    id: 1,
    title: "Air Revolution 2025",
    subtitle: "The Future of Performance",
    description: "Experience next-level comfort with revolutionary cushioning technology",
    image: "https://static.nike.com/a/images/w_2880,h_1410,c_fill,f_auto/7a444247-645e-4d8b-9502-ee85626073f5/image.jpg",
    cta: "Shop Revolution",
    bgGradient: "from-blue-900 via-purple-900 to-black"
  },
  {
    id: 2,
    title: "Elite Training Collection",
    subtitle: "Push Beyond Limits",
    description: "Professional-grade gear for athletes who demand excellence",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&auto=format&fit=crop&q=60",
    cta: "Explore Elite",
    bgGradient: "from-orange-900 via-red-900 to-black"
  },
  {
    id: 3,
    title: "Urban Lifestyle",
    subtitle: "Street Ready",
    description: "Where sport meets style in the concrete jungle",
    image: "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800&auto=format&fit=crop&q=60",
    cta: "Shop Urban",
    bgGradient: "from-green-900 via-teal-900 to-black"
  }
];

const categories = [
  {
    name: "Running",
    image: "https://static.nike.com/a/images/w_2880,h_1410,c_fill,f_auto/7a444247-645e-4d8b-9502-ee85626073f5/image.jpg",
    productCount: 120,
    color: "from-blue-500 to-cyan-500"
  },
  {
    name: "Basketball",
    image: "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?w=800&auto=format&fit=crop&q=60",
    productCount: 95,
    color: "from-orange-500 to-red-500"
  },
  {
    name: "Lifestyle",
    image: "https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco/eeb7432c-4791-47cd-b11e-613692a09395/NIKE+STRUCTURE+26.png",
    productCount: 80,
    color: "from-purple-500 to-pink-500"
  },
  {
    name: "Training",
    image: "https://static.nike.com/a/images/c_limit,w_592,f_auto/t_product_v1/4173c9f7-38ff-454b-b1b1-9d0a2640638d/M+NK+DF+STRIDE+2IN1+7IN+SHRT.png",
    productCount: 60,
    color: "from-green-500 to-teal-500"
  },
];

const featuredProducts = [
  {
    id: 1,
    name: "Air Zoom Pegasus 40",
    price: "$130",
    originalPrice: "$160",
    image: "https://static.nike.com/a/images/c_limit,w_592,f_auto/t_product_v1/decee302-e00d-40e5-a170-250eac4ed74d/U+NK+DF+SABRINA+SIGNATURE+FZ.png",
    badge: "Best Seller",
    rating: 4.8
  },
  {
    id: 2,
    name: "Pro Training Jacket",
    price: "$85",
    originalPrice: "$120",
    image: "https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco,u_126ab356-44d8-4a06-89b4-fcdcc8df0245,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/851f1c8a-d7e6-4c15-87f3-ed7ba1923f44/M+J+BRK+DRAFT+JKT+AOP.png",
    badge: "New",
    rating: 4.6
  },
  {
    id: 3,
    name: "Elite Basketball Shorts",
    price: "$45",
    originalPrice: "$65",
    image: "https://static.nike.com/a/images/c_limit,w_592,f_auto/t_product_v1/41502853-939a-49cb-82c2-ccb2355777fd/NIKE+VWEB+SHADO+ELT+LHT.png",
    badge: "Sale",
    rating: 4.9
  },
  {
    id: 4,
    name: "Lifestyle Hoodie",
    price: "$90",
    originalPrice: "$110",
    image: "https://static.nike.com/a/images/c_limit,w_592,f_auto/t_product_v1/4b4ae4f5-6378-453e-8a6f-22b17eaaf4a4/NK+NSW+RPM+BKPK+2.0.png",
    badge: "Limited",
    rating: 4.7
  },
];

const features = [
  {
    title: "Free Shipping",
    description: "Free shipping on all orders over $50. Fast and reliable delivery.",
    icon: <Truck className="h-6 w-6" />,
    color: "from-blue-500 to-cyan-500"
  },
  {
    title: "Secure Checkout",
    description: "Your payment information is safe with industry-grade encryption.",
    icon: <ShoppingBag className="h-6 w-6" />,
    color: "from-green-500 to-emerald-500"
  },
  {
    title: "24/7 Support",
    description: "We're here for you anytime, anywhere.",
    icon: <Clock className="h-6 w-6" />,
    color: "from-purple-500 to-violet-500"
  },
  {
    title: "Quality Guarantee",
    description: "30-day money-back guarantee on all products.",
    icon: <Star className="h-6 w-6" />,
    color: "from-orange-500 to-red-500"
  },
];

const reviews = [
  {
    name: "Alex Morgan",
    text: "Absolutely love my new sneakers! Comfortable, stylish, and arrived super fast.",
    rating: 5,
    image: "https://images.unsplash.com/photo-1494790108755-2616b612b172?w=150&h=150&fit=crop&crop=face",
    location: "New York, NY"
  },
  {
    name: "Chris Evans",
    text: "Great quality sportswear, will definitely order again. The fit is perfect!",
    rating: 4,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    location: "Los Angeles, CA"
  },
  {
    name: "Taylor Smith",
    text: "Customer service was super helpful and friendly. Love the new collection!",
    rating: 5,
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    location: "Chicago, IL"
  },
];

// ---------- Components ----------
function ThemeToggle({ isDark, toggleTheme }) {
  return (
    <motion.button
      onClick={toggleTheme}
      className={`fixed top-6 right-6 z-50 p-3 rounded-full backdrop-blur-md border transition-all duration-300 ${
        isDark 
          ? 'bg-gray-800/80 border-gray-700 text-yellow-400 hover:bg-gray-700/80' 
          : 'bg-white/80 border-gray-200 text-gray-700 hover:bg-gray-50/80'
      }`}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={isDark ? 'dark' : 'light'}
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: 90, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </motion.div>
      </AnimatePresence>
    </motion.button>
  );
}

function HeroSlider({ isDark }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);

  return (
    <div className="relative h-screen overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.8 }}
          className={`absolute inset-0 bg-gradient-to-br ${heroSlides[currentSlide].bgGradient}`}
        >
          <div className={`absolute inset-0 ${isDark ? 'bg-black/60' : 'bg-black/40'}`} />
          <img
            src={heroSlides[currentSlide].image}
            alt={heroSlides[currentSlide].title}
            className="absolute inset-0 w-full h-full object-cover mix-blend-overlay"
          />
          
          <div className="relative z-10 h-full flex items-center">
            <div className="container mx-auto px-4 grid lg:grid-cols-2 items-center gap-10">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="space-y-6"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="inline-block px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium text-white border border-white/20"
                >
                  {heroSlides[currentSlide].subtitle}
                </motion.div>
                
                <h1 className="font-display text-5xl md:text-7xl font-bold text-white leading-tight">
                  {heroSlides[currentSlide].title}
                </h1>
                
                <p className="text-xl text-gray-200 max-w-lg">
                  {heroSlides[currentSlide].description}
                </p>
                
                <div className="flex gap-4">
                  <button className="group bg-white text-black px-8 py-4 rounded-full font-semibold hover:bg-gray-100 transition-all duration-300 flex items-center gap-2">
                    {heroSlides[currentSlide].cta}
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button className="flex items-center gap-2 text-white border border-white/30 px-6 py-4 rounded-full hover:bg-white/10 transition-all duration-300 backdrop-blur-sm">
                    <Play className="h-4 w-4" />
                    Watch Video
                  </button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="relative"
              >
                <div className="relative w-96 h-96 mx-auto">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full blur-3xl opacity-20 animate-pulse" />
                  <div className="relative w-full h-full rounded-full overflow-hidden border border-white/20 backdrop-blur-sm">
                    <img
                      src={heroSlides[currentSlide].image}
                      alt="Featured Product"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-3 z-20">
        {heroSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide ? 'bg-white' : 'bg-white/40'
            }`}
          />
        ))}
      </div>

      {/* Arrow Controls */}
      <button
        onClick={prevSlide}
        className="absolute left-6 top-1/2 transform -translate-y-1/2 bg-white/10 backdrop-blur-sm border border-white/20 p-3 rounded-full hover:bg-white/20 transition-all duration-300 z-20"
      >
        <ChevronLeft className="h-6 w-6 text-white" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-6 top-1/2 transform -translate-y-1/2 bg-white/10 backdrop-blur-sm border border-white/20 p-3 rounded-full hover:bg-white/20 transition-all duration-300 z-20"
      >
        <ChevronRight className="h-6 w-6 text-white" />
      </button>
    </div>
  );
}

function FloatingCard({ children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6 }}
      viewport={{ once: true }}
      whileHover={{ y: -10, scale: 1.02 }}
      className="transition-all duration-300"
    >
      {children}
    </motion.div>
  );
}

function ProductCard({ product, index, isDark }) {
  return (
    <FloatingCard delay={index * 0.1}>
      <div className={`group relative rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border ${
        isDark 
          ? 'bg-gray-800 border-gray-700 hover:border-gray-600' 
          : 'bg-white border-gray-100 hover:border-gray-200'
      }`}>
        {/* Badge */}
        <div className={`absolute top-4 left-4 z-10 px-3 py-1 rounded-full text-xs font-bold text-white ${
          product.badge === 'Sale' ? 'bg-red-500' :
          product.badge === 'New' ? 'bg-green-500' :
          product.badge === 'Limited' ? 'bg-purple-500' :
          'bg-blue-500'
        }`}>
          {product.badge}
        </div>

        {/* Image */}
        <div className={`relative aspect-square overflow-hidden ${
          isDark ? 'bg-gradient-to-br from-gray-700 to-gray-800' : 'bg-gradient-to-br from-gray-50 to-gray-100'
        }`}>
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < Math.floor(product.rating)
                    ? 'text-yellow-400 fill-current'
                    : isDark ? 'text-gray-600' : 'text-gray-300'
                }`}
              />
            ))}
            <span className={`text-sm ml-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>({product.rating})</span>
          </div>
          
          <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{product.name}</h3>
          
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{product.price}</span>
            <span className={`text-lg line-through ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{product.originalPrice}</span>
          </div>

          <button className={`w-full mt-4 py-3 rounded-full font-semibold transition-all duration-300 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 ${
            isDark 
              ? 'bg-white text-black hover:bg-gray-100' 
              : 'bg-black text-white hover:bg-gray-800'
          }`}>
            Add to Cart
          </button>
        </div>
      </div>
    </FloatingCard>
  );
}

// ---------- Main Component ----------
export default function HomePage() {
  const [isDark, setIsDark] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <main className={`min-h-screen transition-colors duration-500 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Theme Toggle */}
      <ThemeToggle isDark={isDark} toggleTheme={toggleTheme} />

      {/* Custom Cursor */}
      <div
        className="fixed w-4 h-4 bg-blue-500 rounded-full pointer-events-none z-40 mix-blend-difference transition-all duration-150 ease-out"
        style={{
          left: mousePosition.x - 8,
          top: mousePosition.y - 8,
        }}
      />

      {/* Hero Slider */}
      <HeroSlider isDark={isDark} />

      {/* Categories */}
      <section className={`py-20 transition-colors duration-500 ${
        isDark ? 'bg-gradient-to-b from-gray-800 to-gray-900' : 'bg-gradient-to-b from-gray-50 to-white'
      }`}>
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className={`text-5xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Shop by Sport</h2>
            <p className={`text-xl ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Find your perfect gear for every activity</p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {categories.map((cat, i) => (
              <FloatingCard key={cat.name} delay={i * 0.1}>
                <div className={`group relative rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer ${
                  isDark ? 'bg-gray-800' : 'bg-white'
                }`}>
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t ${cat.color} opacity-60 group-hover:opacity-80 transition-opacity duration-300`} />
                    <div className="absolute inset-0 bg-black/20" />
                  </div>
                  
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h3 className="text-2xl font-bold mb-1">{cat.name}</h3>
                    <p className="text-sm opacity-90">{cat.productCount} products</p>
                  </div>

                  <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                    <ArrowRight className="h-5 w-5 text-white" />
                  </div>
                </div>
              </FloatingCard>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className={`py-20 transition-colors duration-500 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className={`text-5xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Featured Products</h2>
            <p className={`text-xl ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Discover our most popular items</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} isDark={isDark} />
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className={`py-20 transition-colors duration-500 ${
        isDark ? 'bg-black text-white' : 'bg-gray-900 text-white'
      }`}>
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold mb-4">Why Choose Us</h2>
            <p className="text-xl text-gray-300">Experience the difference with our premium service</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, i) => (
              <FloatingCard key={feature.title} delay={i * 0.1}>
                <div className="text-center p-8 rounded-3xl bg-gradient-to-b from-white/5 to-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300">
                  <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${feature.color} mb-6`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-gray-300">{feature.description}</p>
                </div>
              </FloatingCard>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className={`py-20 transition-colors duration-500 ${
        isDark ? 'bg-gradient-to-b from-gray-800 to-gray-900' : 'bg-gradient-to-b from-gray-50 to-white'
      }`}>
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className={`text-5xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>What Our Customers Say</h2>
            <p className={`text-xl ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Join thousands of satisfied athletes</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {reviews.map((review, i) => (
              <FloatingCard key={review.name} delay={i * 0.1}>
                <div className={`rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border ${
                  isDark 
                    ? 'bg-gray-800 border-gray-700 hover:border-gray-600' 
                    : 'bg-white border-gray-100 hover:border-gray-200'
                }`}>
                  <div className="flex items-center mb-6">
                    <img
                      src={review.image}
                      alt={review.name}
                      className="w-16 h-16 rounded-full object-cover mr-4"
                    />
                    <div>
                      <h4 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{review.name}</h4>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{review.location}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center mb-4">
                    {[...Array(5)].map((_, starIndex) => (
                      <Star
                        key={starIndex}
                        className={`h-5 w-5 ${
                          starIndex < review.rating
                            ? 'text-yellow-400 fill-current'
                            : isDark ? 'text-gray-600' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  
                  <p className={`italic ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>"{review.text}"</p>
                </div>
              </FloatingCard>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className={`py-20 transition-colors duration-500 ${
        isDark ? 'bg-black text-white' : 'bg-black text-white'
      }`}>
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-5xl font-bold mb-4">Stay in the Loop</h2>
            <p className="text-xl text-gray-300 mb-8">Get exclusive access to new drops and special offers</p>
            
            <div className="max-w-md mx-auto flex gap-4">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-6 py-4 rounded-full bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-white/40 transition-colors"
              />
              <button className="bg-white text-black px-8 py-4 rounded-full font-semibold hover:bg-gray-100 transition-colors">
                Subscribe
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}