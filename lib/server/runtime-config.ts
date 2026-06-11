/**
 * @file runtime-config.ts
 * @description Server runtime feature flags for seminar and production checks.
 */

export function isDemoFallbackEnabled() {
  return process.env.AI_DEMO_FALLBACK_ENABLED !== "false";
}

export function isDebugAiLoggingEnabled() {
  return process.env.AI_DEBUG_LOGS === "true";
}

export function getMaskedConfigValue(value: string | undefined) {
  if (!value) {
    return { configured: false };
  }

  return {
    configured: true,
    preview: `${value.slice(0, 4)}...${value.slice(-4)}`,
  };
}

