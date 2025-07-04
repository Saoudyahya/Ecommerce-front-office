import type { NextConfig } from "next";

export default {
  eslint: { ignoreDuringBuilds: true },
  // images: {
  //   formats: ["image/avif", "image/webp"],
  //   remotePatterns: [
  //     { hostname: "**.githubassets.com", protocol: "https" },
  //     { hostname: "**.githubusercontent.com", protocol: "https" },
  //     { hostname: "**.googleusercontent.com", protocol: "https" },
  //     { hostname: "**.ufs.sh", protocol: "https" },
  //     { hostname: "**.unsplash.com", protocol: "https" },
  //     { hostname: "api.github.com", protocol: "https" },
  //     { hostname: "utfs.io", protocol: "https" },
  //   ],
  // },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8099',
        pathname: '/api/products/images/**',
      },
      { hostname: "**.githubassets.com", protocol: "https" },
      { hostname: "**.githubusercontent.com", protocol: "https" },
      { hostname: "**.googleusercontent.com", protocol: "https" },
      { hostname: "**.ufs.sh", protocol: "https" },
      { hostname: "**.unsplash.com", protocol: "https" },
      { hostname: "api.github.com", protocol: "https" },
      { hostname: "utfs.io", protocol: "https" },
      // If you plan to deploy and use a different domain, add it here too
      // {
      //   protocol: 'https',
      //   hostname: 'your-production-domain.com',
      //   pathname: '/api/products/images/**',
      // },
    ],
  },
} satisfies NextConfig;
