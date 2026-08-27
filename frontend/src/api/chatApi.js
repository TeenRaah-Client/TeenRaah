import api from "./axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

/**
 * Streams a chat response from the backend. Uses raw fetch + a
 * ReadableStream reader rather than the axios instance, because axios's
 * browser adapter doesn't expose an incremental stream the way fetch does —
 * EventSource can't be used either since it only supports GET, and this
 * needs to POST the conversation history.
 *
 * callbacks:
 *  - onDelta(text)       — a chunk of the assistant's reply
 *  - onAttachments(data) — { products, imageSuggestion } gathered from tool calls
 *  - onDone()            — stream finished normally
 *  - onError(message)    — something went wrong
 */
export const streamChatMessage = async (messages, { onDelta, onAttachments, onDone, onError, signal }) => {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ messages }),
      signal,
    });
  } catch (err) {
    if (err.name === "AbortError") return;
    onError?.("Couldn't reach the assistant — check your connection.");
    return;
  }

  if (!response.ok || !response.body) {
    let message = "The assistant is unavailable right now.";
    try {
      const body = await response.json();
      message = body?.message || message;
    } catch {
      // response wasn't JSON — keep the default message
    }
    onError?.(message);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    let chunk;
    try {
      chunk = await reader.read();
    } catch (err) {
      if (err.name === "AbortError") return;
      onError?.("Connection to the assistant dropped.");
      return;
    }
    if (chunk.done) break;

    buffer += decoder.decode(chunk.value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() || ""; // keep the last, possibly-partial event for next read

    for (const raw of events) {
      let eventType = "message";
      let dataLine = "";
      for (const line of raw.split("\n")) {
        if (line.startsWith("event:")) eventType = line.slice(6).trim();
        else if (line.startsWith("data:")) dataLine = line.slice(5).trim();
      }
      if (!dataLine) continue;

      let data;
      try {
        data = JSON.parse(dataLine);
      } catch {
        continue;
      }

      if (eventType === "delta") onDelta?.(data.text);
      else if (eventType === "attachments") onAttachments?.(data);
      else if (eventType === "done") onDone?.();
      else if (eventType === "error") onError?.(data.message);
    }
  }
};

/** Non-streaming — goes through the normal axios instance for consistent error handling. */
export const generateConceptImage = async ({ category, description }) => {
  const { data } = await api.post("/chat/generate-image", { category, description });
  return data;
};
