import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'triad.my.id',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
