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

export function isPlaceholderConfigValue(value: string | undefined) {
  if (!value) {
    return true;
  }

  const normalized = value.toLowerCase();
  return (
    normalized.includes("mock-") ||
    normalized.includes("-here") ||
    normalized.includes("your-") ||
    normalized.includes("example")
  );
}

export function isSupabaseRuntimeConfigured({
  url,
  serviceKey,
  anonKey,
}: {
  url: string | undefined;
  serviceKey?: string | undefined;
  anonKey?: string | undefined;
}) {
  const key = serviceKey || anonKey;
  return !isPlaceholderConfigValue(url) && !isPlaceholderConfigValue(key);
}
