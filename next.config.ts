import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker production builds
  // This creates a minimal production bundle with only required files
  output: "standalone",

  // Experimental features
  experimental: {
    // Enable optimized package imports
    optimizePackageImports: ["@radix-ui/react-dropdown-menu", "lucide-react"],
  },
};

export default nextConfig;
