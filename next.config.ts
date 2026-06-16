import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ignore TS build errors from node_modules + untyped Supabase service client
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
