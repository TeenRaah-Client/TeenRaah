import "dotenv/config";
import Redis from "ioredis";

/**
 * Redis is used everywhere we need speed instead of a full Mongo round trip:
 *  - registration OTP codes (short TTL, auto-expiring — perfect fit for Redis)
 *  - the logged-in user's cart (read/written on almost every page view)
 *  - cached product listings / product detail (invalidated on admin writes)
 *  - cached geocoding results (Nominatim is free but rate-limited, so we cache)
 *  - basic rate-limiting counters (OTP resend cooldowns etc.)
 */

const redisUrl =
  process.env.REDIS_URL &&
  !process.env.REDIS_URL.includes("your_redis")
    ? process.env.REDIS_URL
    : "redis://localhost:6379";

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,

  retryStrategy(times) {
    const delay = Math.min(times * 200, 2000);
    return delay;
  },

  lazyConnect: false,
});

redis.on("connect", () => {
  console.log(
    "🔴 Redis connected:",
    redisUrl.replace(/\/\/.*@/, "//***@")
  );
});

redis.on("error", (err) => {
  console.error("🔴 Redis error:", err.message);
});

// ---- Small helpers used across controllers ----

/**
 * JSON-aware get.
 * Returns null if the key doesn't exist or isn't valid JSON.
 */
export const cacheGet = async (key) => {
  try {
    const raw = await redis.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/**
 * JSON-aware set with an optional TTL in seconds.
 */
export const cacheSet = async (key, value, ttlSeconds) => {
  const payload = JSON.stringify(value);

  if (ttlSeconds) {
    await redis.set(key, payload, "EX", ttlSeconds);
  } else {
    await redis.set(key, payload);
  }
};

/**
 * Delete every key matching a prefix.
 * Used to bust product caches on admin writes.
 */
export const cacheDeleteByPrefix = async (prefix) => {
  const stream = redis.scanStream({
    match: `${prefix}*`,
    count: 100,
  });

  const keys = [];

  for await (const found of stream) {
    keys.push(...found);
  }

  if (keys.length) {
    await redis.del(...keys);
  }
};

export default redis;