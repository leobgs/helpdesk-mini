import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ouput build base on deploy
  // output: "standalone",
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  allowedDevOrigins: ["192.168.1.6"],
};

export default nextConfig;
