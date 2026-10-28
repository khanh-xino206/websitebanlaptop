/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,

  // Tối ưu ảnh: cho phép ảnh từ backend local và bật WebP/AVIF tự động
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/uploads/**',
      },
    ],
    // Next.js sẽ tự convert ảnh sang WebP/AVIF và cache lại
    formats: ['image/avif', 'image/webp'],
    // Cache ảnh đã tối ưu trong 30 ngày
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },

  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: 'http://localhost:5000/uploads/:path*',
      },
      {
        source: '/dangky/xacminh',
        destination: '/dang-ky/xac-minh',
      },
      {
        source: '/dangky/xacminh/:path*',
        destination: '/dang-ky/xac-minh/:path*',
      },
    ];
  },
};

export default nextConfig;
