import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  basePath: "/NoteTogether",
  assetPrefix: "/NoteTogether/",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
