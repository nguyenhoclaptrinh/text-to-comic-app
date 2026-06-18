/**
 * @file next.config.ts
 * @description Next.js runtime configuration.
 */

import type { NextConfig } from "next";

function parseAllowedDevOrigins(rawValue = process.env.ALLOWED_DEV_ORIGINS) {
  const configuredOrigins = rawValue
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (configuredOrigins && configuredOrigins.length > 0) {
    return configuredOrigins;
  }

  return ["*.ngrok-free.dev", "*.ngrok-free.app", "*.ngrok.app"];
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: parseAllowedDevOrigins(),
};

export default nextConfig;
