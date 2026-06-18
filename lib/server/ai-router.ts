/**
 * @file ai-router.ts
 * @description Shared server-side AI model routing, timeout and retry policy.
 */

export type AiProvider =
  | "gemini"
  | "imagen"
  | "huggingface"
  | "kaggle"
  | "image-backend"
  | "fallback";
export type AiCapability = "storyboard" | "image";

export type AiModelCandidate = {
  provider: AiProvider;
  model: string;
  capability: AiCapability;
  priority: number;
  stable: boolean;
  enabled: boolean;
};

export type AiRotationPolicy = {
  maxAttempts: number;
  stopOnAuthError: boolean;
  stopOnValidationError: boolean;
  retryableStatuses: number[];
  timeoutMs: number;
};

export type AiRouteSuccess<T> = {
  ok: true;
  provider: AiProvider;
  model: string;
  durationMs: number;
  source: AiProvider;
  value: T;
  warning?: string;
};

export type AiRouteFailure = {
  ok: false;
  durationMs: number;
  warning: string;
  error?: unknown;
  provider?: AiProvider;
  model?: string;
  source?: AiProvider;
};

export type AiRouteResult<T> = AiRouteSuccess<T> | AiRouteFailure;

export class AiProviderError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "AiProviderError";
  }
}

export const DEFAULT_AI_TIMEOUT_MS = 20_000;

export const DEFAULT_AI_ROTATION_POLICY: AiRotationPolicy = {
  maxAttempts: 4,
  stopOnAuthError: true,
  stopOnValidationError: true,
  retryableStatuses: [408, 409, 429, 500, 502, 503, 504],
  timeoutMs: DEFAULT_AI_TIMEOUT_MS,
};

export function parseModelList(
  rawValue: string | undefined,
  fallbackModels: string[],
) {
  const source = rawValue?.trim() ? rawValue.split(",") : fallbackModels;
  const seen = new Set<string>();

  return source
    .map((model) => model.trim())
    .filter((model) => model.length > 0)
    .filter((model) => {
      if (seen.has(model)) {
        return false;
      }
      seen.add(model);
      return true;
    });
}

export function createModelCandidates({
  provider,
  capability,
  models,
  stable = true,
}: {
  provider: AiProvider;
  capability: AiCapability;
  models: string[];
  stable?: boolean;
}): AiModelCandidate[] {
  return models.map((model, index) => ({
    provider,
    model,
    capability,
    priority: index + 1,
    stable,
    enabled: model.trim().length > 0,
  }));
}

export function getAiTimeoutMs(rawValue = process.env.AI_MODEL_TIMEOUT_MS) {
  const parsed = Number(rawValue);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_AI_TIMEOUT_MS;
}

export async function routeAiModels<T>({
  candidates,
  policy,
  run,
}: {
  candidates: AiModelCandidate[];
  policy?: Partial<AiRotationPolicy>;
  run: (candidate: AiModelCandidate) => Promise<T>;
}): Promise<AiRouteResult<T>> {
  const startedAt = Date.now();
  const resolvedPolicy = { ...DEFAULT_AI_ROTATION_POLICY, ...policy };
  const orderedCandidates = candidates
    .filter((candidate) => candidate.enabled)
    .sort((a, b) => a.priority - b.priority)
    .slice(0, resolvedPolicy.maxAttempts);

  let lastError: unknown;
  let lastCandidate: AiModelCandidate | undefined;

  for (const candidate of orderedCandidates) {
    lastCandidate = candidate;
    try {
      const value = await run(candidate);
      return {
        ok: true,
        provider: candidate.provider,
        model: candidate.model,
        durationMs: Date.now() - startedAt,
        source: candidate.provider,
        value,
      };
    } catch (error) {
      lastError = error;
      if (shouldStopRouting(error, resolvedPolicy)) {
        break;
      }
    }
  }

  return {
    ok: false,
    provider: lastCandidate?.provider,
    model: lastCandidate?.model,
    durationMs: Date.now() - startedAt,
    source: lastCandidate?.provider,
    warning: getAiErrorMessage(lastError),
    error: lastError,
  };
}

export async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = getAiTimeoutMs(),
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new AiProviderError("AI request timed out.", 408, "TIMEOUT");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function createAiProviderErrorFromResponse(
  response: Response,
  detail = "",
) {
  const status = response.status;
  const message = detail
    ? `AI provider failed with status ${status}: ${detail}`
    : `AI provider failed with status ${status}.`;
  return new AiProviderError(message, status);
}

function shouldStopRouting(error: unknown, policy: AiRotationPolicy) {
  const status = getErrorStatus(error);

  if (!status) {
    return false;
  }

  if (policy.stopOnAuthError && (status === 401 || status === 403)) {
    return true;
  }

  if (policy.stopOnValidationError && status === 400) {
    return true;
  }

  return !policy.retryableStatuses.includes(status);
}

function getErrorStatus(error: unknown) {
  if (error instanceof AiProviderError) {
    return error.status;
  }

  if (error instanceof Error) {
    const match = error.message.match(
      /\b(400|401|403|408|409|429|500|502|503|504)\b/,
    );
    return match ? Number(match[1]) : undefined;
  }

  return undefined;
}

function getAiErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "All configured AI models failed.";
}
