import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  // Allows testing on a real phone over the LAN (e.g. http://192.168.1.219:3000) —
  // Next.js dev mode blocks HMR/hydration resources from any non-localhost origin
  // by default to prevent DNS rebinding attacks.
  allowedDevOrigins: ['192.168.1.219'],
};

export default nextConfig;
