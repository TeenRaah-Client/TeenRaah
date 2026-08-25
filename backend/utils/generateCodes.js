import User from "../models/User.js";

/**
 * Builds a short, memorable referral code from the user's name plus a
 * random suffix, e.g. "ROHAN4F2K", and retries on the rare collision.
 */
export const generateReferralCode = async (name) => {
  const base = (name || "USER")
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase()
    .slice(0, 5) || "TRAAH";

  for (let attempt = 0; attempt < 5; attempt++) {
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    const code = `${base}${suffix}`;
    // eslint-disable-next-line no-await-in-loop
    const exists = await User.exists({ referralCode: code });
    if (!exists) return code;
  }
  // Extremely unlikely fallback
  return `TR${Date.now().toString(36).toUpperCase()}`;
};

export const generateOrderNumber = () => {
  const date = new Date();
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(
    date.getDate()
  ).padStart(2, "0")}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `TR-${stamp}-${rand}`;
};
