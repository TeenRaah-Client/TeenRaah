import asyncHandler from "express-async-handler";
import axios from "axios";
import { ok, fail } from "../utils/apiResponse.js";
import { cacheGet, cacheSet } from "../config/redis.js";

// Free, no-API-key geocoding via OpenStreetMap Nominatim — this is what
// powers the "search your address" box on the Zomato/Blinkit-style address
// picker. We proxy through our own backend (rather than calling it from the
// browser) so we can (a) attach the required User-Agent per Nominatim's
// usage policy and (b) cache results in Redis, since Nominatim asks
// integrators to cache and rate-limit rather than hammer it per keystroke.
const nominatim = axios.create({
  baseURL: process.env.NOMINATIM_BASE_URL || "https://nominatim.openstreetmap.org",
  headers: { "User-Agent": process.env.GEOCODE_USER_AGENT || "TeenRaah-App/1.0" },
  timeout: 8000,
});

// @route GET /api/location/search?q=
export const searchAddress = asyncHandler(async (req, res) => {
  const q = req.query.q?.trim();
  if (!q || q.length < 3) return ok(res, { results: [] });

  const cacheKey = `geocode:search:${q.toLowerCase()}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return ok(res, { results: cached });

  try {
    const { data } = await nominatim.get("/search", {
      params: { q, format: "jsonv2", addressdetails: 1, limit: 6, countrycodes: "in" },
    });

    const results = data.map((r) => ({
      displayName: r.display_name,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
      city: r.address?.city || r.address?.town || r.address?.village || r.address?.suburb || "",
      state: r.address?.state || "",
      pincode: r.address?.postcode || "",
    }));

    await cacheSet(cacheKey, results, 60 * 60 * 24); // 24h — addresses don't move
    return ok(res, { results });
  } catch (err) {
    return fail(res, "Address search is temporarily unavailable, please enter it manually", 502);
  }
});

// @route GET /api/location/reverse?lat=&lng=
export const reverseGeocode = asyncHandler(async (req, res) => {
  const { lat, lng } = req.query;
  if (lat == null || lng == null) return fail(res, "lat and lng are required", 400);

  const cacheKey = `geocode:reverse:${Number(lat).toFixed(5)},${Number(lng).toFixed(5)}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return ok(res, { result: cached });

  try {
    const { data } = await nominatim.get("/reverse", {
      params: { lat, lon: lng, format: "jsonv2", addressdetails: 1 },
    });

    const result = {
      displayName: data.display_name,
      city: data.address?.city || data.address?.town || data.address?.village || data.address?.suburb || "",
      state: data.address?.state || "",
      pincode: data.address?.postcode || "",
      lat: parseFloat(data.lat),
      lng: parseFloat(data.lon),
    };

    await cacheSet(cacheKey, result, 60 * 60 * 24);
    return ok(res, { result });
  } catch (err) {
    return fail(res, "Couldn't resolve that location, please enter your address manually", 502);
  }
});
