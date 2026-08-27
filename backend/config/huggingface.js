import { InferenceClient } from "@huggingface/inference";

const HF_TOKEN = process.env.HF_TOKEN;

if (!HF_TOKEN) {
  console.warn("⚠️ HF_TOKEN is not configured");
}

export const hf = new InferenceClient(HF_TOKEN);

export const HF_IMAGE_MODEL =
  process.env.HF_IMAGE_MODEL ||
  "black-forest-labs/FLUX.1-schnell";