import axios from "axios";

/**
 * OpenRouter (openrouter.ai) — one API key, many models, OpenAI-compatible
 * request/response shapes for both text chat and image generation.
 *
 * Model choice is env-driven rather than hardcoded on purpose: OpenRouter's
 * free-tier model lineup rotates fairly often (models get added/retired with
 * little notice). Check https://openrouter.ai/models before relying on the
 * defaults below long-term — they were current as of this build, not
 * guaranteed to stay that way.
 */

export const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

// A well-established, currently-free chat model — good default for the
// shopping assistant. Swap via OPENROUTER_MODEL without touching code.
export const CHAT_MODEL = process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free";

// Image generation on OpenRouter is NOT free on any model as of this build —
// every call has a real per-image cost, billed all-or-nothing. There is no
// free-tier default to fall back to here; this only controls which paid
// model is used. See README for cost-control notes before enabling this.
export const IMAGE_MODEL = process.env.OPENROUTER_IMAGE_MODEL || "google/gemini-2.5-flash-image";

export const openrouter = axios.create({
  baseURL: OPENROUTER_BASE_URL,
  timeout: 60_000,
  headers: {
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY || "missing_openrouter_api_key"}`,
    "Content-Type": "application/json",
    // OpenRouter uses these purely for attribution/leaderboards — harmless
    // to omit, but good practice to include.
    "HTTP-Referer": process.env.CLIENT_URL || "http://localhost:5173",
    "X-Title": "TeenRaah",
  },
});

export default openrouter;
