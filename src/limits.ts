import type { PluginInput } from "@opencode-ai/plugin"

/**
 * Resolving a model's context window.
 *
 * Kiro reports context usage as a percentage; to drive opencode's token-based gauge we
 * convert that percentage into a token count against the model's context window. The
 * authoritative window sizes already live in the user's opencode config (provider model
 * `limit.context`), so we read them live via the SDK client and cache the result. The
 * hardcoded table below is only a fallback for when the config can't be read.
 */
const FALLBACK_LIMITS: Record<string, number> = {
  auto: 1_000_000,
  "claude-opus-4.8": 1_000_000,
  "claude-opus-4.7": 1_000_000,
  "claude-opus-4.6": 1_000_000,
  "claude-sonnet-4.6": 1_000_000,
  "claude-opus-4.5": 200_000,
  "claude-sonnet-4.5": 200_000,
  "claude-sonnet-4": 200_000,
  "claude-haiku-4.5": 200_000,
  "glm-5": 200_000,
  "deepseek-3.2": 164_000,
  "minimax-m2.5": 196_000,
  "minimax-m2.1": 196_000,
  "qwen3-coder-next": 256_000,
}
export const DEFAULT_CONTEXT_LIMIT = 1_000_000

type Client = PluginInput["client"]

// The providers list is stable for a process lifetime, so fetch once and cache the promise.
let limitsPromise: Promise<Record<string, number>> | null = null

async function loadConfiguredLimits(client: Client, providerId: string): Promise<Record<string, number>> {
  const res = (await client.config.providers()) as any
  const body = res?.data ?? res
  const providers: any[] = Array.isArray(body?.providers) ? body.providers : []
  const provider = providers.find((p) => p?.id === providerId)
  const out: Record<string, number> = {}
  if (provider?.models) {
    for (const [id, model] of Object.entries<any>(provider.models)) {
      const ctx = model?.limit?.context
      if (typeof ctx === "number" && ctx > 0) out[id] = ctx
    }
  }
  return out
}

/**
 * Resolve the context window for `model`, preferring the live opencode config and falling
 * back to the bundled table (then a 1M default). Never throws.
 */
export async function resolveContextLimit(
  client: Client | undefined,
  providerId: string,
  model: string,
): Promise<number> {
  if (client && !limitsPromise) {
    limitsPromise = loadConfiguredLimits(client, providerId).catch(() => ({}))
  }
  const configured = limitsPromise ? await limitsPromise : {}
  return configured[model] ?? FALLBACK_LIMITS[model] ?? DEFAULT_CONTEXT_LIMIT
}
