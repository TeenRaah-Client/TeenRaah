const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ALLOWED_SOURCES = new Set(["footer", "checkout", "popup", "homepage"]);

export const normalizeSubscriberEmail = (raw) => {
  if (typeof raw !== "string") return "";
  return raw.trim().toLowerCase();
};

export const validateSubscriberInput = ({ email, source = "footer" } = {}) => {
  const normalizedEmail = normalizeSubscriberEmail(email);
  if (!normalizedEmail || normalizedEmail.length > 254 || !EMAIL_REGEX.test(normalizedEmail)) {
    return { valid: false, error: "Please enter a valid email address" };
  }

  const cleanedSource = typeof source === "string" ? source.trim().toLowerCase() : "footer";
  const safeSource = ALLOWED_SOURCES.has(cleanedSource) ? cleanedSource : "footer";

  return { valid: true, email: normalizedEmail, source: safeSource };
};
