import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  serverExternalPackages: ["@tensorflow/tfjs", "nsfwjs", "obscenity"],
  experimental: {
    serverActions: {
      bodySizeLimit: "9mb",
    },
  },
};

export default nextConfig;
