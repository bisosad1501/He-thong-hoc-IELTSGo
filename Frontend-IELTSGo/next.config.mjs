/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Enable image optimization for better performance
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    // Allow external image domains
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.unsplash.com',
        port: '',
        pathname: '/**',
      },
      // Add other common image hosting services
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.s3.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      // Allow example.com for demo images
      {
        protocol: 'https',
        hostname: 'example.com',
        port: '',
        pathname: '/**',
      },
      // Allow localhost for development
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '**',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
        port: '**',
        pathname: '/**',
      },
    ],
  },
  // Optimize production builds (SWC minification is enabled by default in Next.js 15)
  compress: true,
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  // Webpack optimizations
  webpack: (config, { isServer }) => {
    // Optimize bundle splitting (only for JS, let Next.js handle CSS)
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: (chunk) => {
            // Only split JS chunks, not CSS (Next.js handles CSS separately)
            return !chunk.name || !chunk.name.includes('.css')
          },
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk for heavy libraries (JS only)
            recharts: {
              name: 'recharts',
              chunks: 'all',
              test: /[\\/]node_modules[\\/]recharts[\\/]/,
              priority: 20,
              enforce: true,
              // Only match JS modules, not CSS
              type: 'javascript/auto',
            },
            // Common vendor chunk (JS only)
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /[\\/]node_modules[\\/]/,
              priority: 10,
              reuseExistingChunk: true,
              // Only match JS modules, not CSS
              type: 'javascript/auto',
            },
          },
        },
      }
    }
    return config
  },
}

export default nextConfig
