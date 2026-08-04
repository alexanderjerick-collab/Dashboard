import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.roblox.com" },
      { protocol: "https", hostname: "**.rbxcdn.com" },
    ],
  },
};

export default nextConfig;
