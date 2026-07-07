import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // xrpl must run from node_modules (not the server bundle) so its Node build
  // with the `ws` WebSocket implementation is used - bundling can pick the
  // browser build, whose WebSocket cannot connect from the server.
  serverExternalPackages: ["@prisma/client", "xrpl"],
webpack: (config) => {
    config.cache = false
    return config
  },
};

export default nextConfig;
