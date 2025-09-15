import type { NextConfig } from "next";
import './src/lib/datadog';

const isDev = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
  reactStrictMode: !isDev,
};

export default nextConfig;
