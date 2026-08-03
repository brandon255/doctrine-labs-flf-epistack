/**
 * Ollama adapter for the FLF Epistemic Stack.
 *
 * Local-first, provider-agnostic. Speaks the OpenAI chat-completions format so it
 * can talk to Ollama, llama.cpp's server, or LM Studio by only changing base_url.
 *
 * SECURITY: REFUSES any non-local endpoint. The local LLM is the product thesis —
 * a hosted key would contradict the whole gift. This guard is enforced in code,
 * not in prose.
 *
 * Phase 4 replaces the stub health check with a real one.
 */

const DEFAULT_BASE_URL = "http://127.0.0.1:11434/v1";
const DEFAULT_MODEL = "llama3.1";

function isLocalUrl(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    return (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "::1" ||
      host.endsWith(".localhost")
    );
  } catch {
    return false;
  }
}

function config() {
  const base_url = process.env.LLM_BASE_URL || DEFAULT_BASE_URL;
  const model = process.env.LLM_MODEL || DEFAULT_MODEL;
  return {
    enabled: process.env.LLM_ENABLED !== "0",
    base_url,
    model,
    require_local: true,
    // Generous by default. An 8B model on a laptop can take well over a minute
    // per call, and adjudication makes two of them back to back; a tight
    // timeout turns "slow machine" into "job failed", which reads like a bug in
    // the tool. Override with LLM_TIMEOUT_MS.
    timeout_ms: Number(process.env.LLM_TIMEOUT_MS) || 300000,
  };
}

/**
 * Health check: is Ollama up, and is our model pulled?
 * Returns { ok, ready, model, reason }.
 */
export async function getLlmStatus() {
  const cfg = config();
  if (!cfg.enabled) return { ok: false, ready: false, reason: "LLM disabled by env" };
  if (cfg.require_local && !isLocalUrl(cfg.base_url)) {
    return { ok: false, ready: false, reason: `refused non-local base_url ${cfg.base_url}` };
  }
  try {
    const res = await fetch(`${cfg.base_url}/models`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return { ok: false, ready: false, reason: `Ollama HTTP ${res.status}` };
    const data = await res.json();
    const models = (data?.data ?? []).map((m) => m.id).filter(Boolean);
    // Resolve the requested model to an actually-pulled name.
    // Ollama tags like "llama3.1:8b" should satisfy a request for "llama3.1".
    const resolved =
      models.find((m) => m === cfg.model) ??
      models.find((m) => m.startsWith(cfg.model + ":")) ??
      models.find((m) => m.startsWith(cfg.model));
    const hasModel = Boolean(resolved);
    return {
      ok: true,
      ready: hasModel,
      model: resolved ?? cfg.model,
      requested_model: cfg.model,
      models,
      reason: hasModel ? null : `model '${cfg.model}' not pulled (run: ollama pull ${cfg.model})`,
    };
  } catch (e) {
    return {
      ok: false,
      ready: false,
      reason: `Ollama not reachable at ${cfg.base_url} — ${e.message}`,
    };
  }
}

/**
 * OpenAI-compatible chat completion call. Strict local-only.
 * @param {{ messages: Array<{role: string, content: string}>, model?: string, temperature?: number, max_tokens?: number }} params
 * @returns {Promise<{ text: string, model: string, raw: object }>}
 */
export async function callLlm({ messages, model, temperature = 0.2, max_tokens = 800 }) {
  const cfg = config();
  if (!cfg.enabled) throw new Error("LLM disabled by env");
  if (cfg.require_local && !isLocalUrl(cfg.base_url)) {
    throw new Error(`REFUSED: non-local base_url ${cfg.base_url} (require_local=true)`);
  }
  // Resolve requested → actually-pulled model name (llama3.1 → llama3.1:8b etc.)
  let useModel = model || cfg.model;
  try {
    const listRes = await fetch(`${cfg.base_url}/models`, { signal: AbortSignal.timeout(3000) });
    if (listRes.ok) {
      const list = await listRes.json();
      const pulled = (list?.data ?? []).map((m) => m.id).filter(Boolean);
      useModel =
        pulled.find((m) => m === useModel) ??
        pulled.find((m) => m.startsWith(useModel + ":")) ??
        pulled.find((m) => m.startsWith(useModel)) ??
        useModel;
    }
  } catch {
    /* fall through with unresolved model */
  }
  let res;
  try {
    res = await fetch(`${cfg.base_url}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ model: useModel, messages, temperature, max_tokens, stream: false }),
      signal: AbortSignal.timeout(cfg.timeout_ms),
    });
  } catch (e) {
    if (e?.name === "TimeoutError" || /aborted due to timeout/i.test(e?.message ?? "")) {
      throw new Error(
        `LLM timed out after ${Math.round(cfg.timeout_ms / 1000)}s (model ${useModel}). ` +
          `A slow machine is the usual cause, not a broken install. ` +
          `Raise the limit with LLM_TIMEOUT_MS, or use a smaller model.`
      );
    }
    throw e;
  }
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`LLM HTTP ${res.status}: ${errText.slice(0, 300)}`);
  }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content ?? "";
  return { text, model: data?.model ?? useModel, raw: data };
}
