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

  allowedDevOrigins:
    process.env.ALLOWED_DEV_ORIGINS?.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean) ?? [],
};

export default nextConfig;
