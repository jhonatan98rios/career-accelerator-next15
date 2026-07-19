import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  reactStrictMode: !isDev,
  // ponytail: gzip buffers full body — kills SSE streaming. Disable globally;
  // Vercel's edge handles its own compression without buffering.
  compress: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "s.gravatar.com" },
      { protocol: "https", hostname: "cdn.auth0.com" },
    ],
  },
};

export default nextConfig;
