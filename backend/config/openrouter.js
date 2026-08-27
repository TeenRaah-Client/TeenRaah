import axios from "axios";

/**
 * TeenRaah - OpenRouter configuration
 *
 * OpenRouter provides an OpenAI-compatible API with access
 * to multiple models through a single API key.
 */

export const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

/**
 * Free Models Router
 *
 * OpenRouter automatically selects an available free model
 * that supports the capabilities required by the request.
 */
export const CHAT_MODEL =
  process.env.OPENROUTER_MODEL || "openrouter/free";

/**
 * Image generation model.
 *
 * This is kept separate from the free chat model because
 * image generation may incur charges depending on the model.
 */
export const IMAGE_MODEL =
  process.env.OPENROUTER_IMAGE_MODEL ||
  "google/gemini-2.5-flash-image";

/**
 * OpenRouter Axios client
 */
export const openrouter = axios.create({
  baseURL: OPENROUTER_BASE_URL,
  timeout: 60_000,

  headers: {
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",

    // Used by OpenRouter for attribution.
    "HTTP-Referer":
      process.env.CLIENT_URL || "https://teenraah.shop",

    "X-Title": "TeenRaah",
  },
});

export default openrouter;