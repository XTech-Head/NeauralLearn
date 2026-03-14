import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
    ],
  },
  // Silence the Clerk + next 16 peer dep warning
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb", // for audio uploads via /api/transcribe
    },
  },
};

export default nextConfig;