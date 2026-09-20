import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel-compatible settings
  output: "standalone", // Nix deploy bundles the standalone server
  images: {
    unoptimized: false,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
