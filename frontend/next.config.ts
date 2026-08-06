import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [{ protocol: "https", hostname: "github.com" }],
  },
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
