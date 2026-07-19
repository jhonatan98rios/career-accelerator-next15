import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  reactStrictMode: !isDev,
  // ponytail: gzip at origin buffers full body — kills SSE streaming.
  // Vercel's edge/CDN handles compression without buffering, so origin
  // compression is redundant and harmful for streaming routes.
  compress: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "s.gravatar.com" },
      { protocol: "https", hostname: "cdn.auth0.com" },
    ],
  },
};

export default nextConfig;
