import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client"],
webpack: (config) => {
    config.cache = false
    return config
  },
};

export default nextConfig;
