const ALLOWED_PERIODS = new Set(["7d", "30d", "90d", "365d"]);
const INDIA_OFFSET_MINUTES = 330;

export function getAnalyticsRange(period = "30d", now = new Date()) {
  if (!ALLOWED_PERIODS.has(period)) {
    const error = new TypeError("Period must be one of: 7d, 30d, 90d, 365d");
    error.statusCode = 400;
    throw error;
  }

  const days = Number.parseInt(period, 10);
  const end = new Date(now);
  // Analytics days are calendar days in Asia/Kolkata, not server-local days.
  const indiaMidnightUtc = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()) -
    INDIA_OFFSET_MINUTES * 60 * 1000;
  const start = new Date(indiaMidnightUtc - (days - 1) * 24 * 60 * 60 * 1000);
  return { period, start, end };
}
