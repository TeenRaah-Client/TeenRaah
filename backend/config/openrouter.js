import axios from "axios";

export const OPENROUTER_BASE_URL =
  "https://openrouter.ai/api/v1";

export const CHAT_MODEL =
  process.env.OPENROUTER_MODEL || "openrouter/free";

export const IMAGE_MODEL =
  process.env.OPENROUTER_IMAGE_MODEL ||
  "google/gemini-2.5-flash-image";

export const openrouter = axios.create({
  baseURL: OPENROUTER_BASE_URL,
  timeout: 60_000,

  headers: {
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
    "HTTP-Referer":
      process.env.CLIENT_URL || "https://teenraah.shop",
    "X-Title": "TeenRaah",
  },
});

export default openrouter;