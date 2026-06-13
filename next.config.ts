import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-0ece7370b83042e198d87ead46aeff51.r2.dev",
      },
    ],
  },
};

export default nextConfig;
