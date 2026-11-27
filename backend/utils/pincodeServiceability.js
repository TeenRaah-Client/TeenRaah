import { FREE_DELIVERY_THRESHOLD, DELIVERY_FEE } from "./constants.js";
import { RETURN_WINDOW_DAYS } from "./returnPolicy.js";

const PINCODE_REGEX = /^[1-9][0-9]{5}$/;

const METRO_PREFIXES = new Map([
  ["110", { city: "New Delhi", state: "Delhi", zone: "Metro Express" }],
  ["122", { city: "Gurugram", state: "Haryana", zone: "Metro Express" }],
  ["201", { city: "Noida / Ghaziabad", state: "Uttar Pradesh", zone: "Metro Express" }],
  ["380", { city: "Ahmedabad", state: "Gujarat", zone: "Metro Express" }],
  ["400", { city: "Mumbai", state: "Maharashtra", zone: "Metro Express" }],
  ["401", { city: "Mumbai MMR", state: "Maharashtra", zone: "Metro Express" }],
  ["411", { city: "Pune", state: "Maharashtra", zone: "Metro Express" }],
  ["500", { city: "Hyderabad", state: "Telangana", zone: "Metro Express" }],
  ["560", { city: "Bengaluru", state: "Karnataka", zone: "Metro Express" }],
  ["600", { city: "Chennai", state: "Tamil Nadu", zone: "Metro Express" }],
  ["700", { city: "Kolkata", state: "West Bengal", zone: "Metro Express" }],
]);

const EXTENDED_PREFIXES_2 = new Map([
  ["19", { region: "Jammu & Kashmir / Ladakh", zone: "Extended Delivery" }],
  ["74", { region: "Andaman & Nicobar / Bengal", zone: "Extended Delivery" }],
  ["78", { region: "Assam & North-East", zone: "Extended Delivery" }],
  ["79", { region: "North-East India", zone: "Extended Delivery" }],
]);

const ZONE_BY_FIRST_DIGIT = {
  "1": "North India",
  "2": "North India",
  "3": "West India",
  "4": "West & Central India",
  "5": "South India",
  "6": "South India",
  "7": "East India",
  "8": "East India",
  "9": "Army Postal Service",
};

export const addBusinessDays = (startDate, businessDays) => {
  const date = new Date(startDate.getTime());
  let added = 0;
  while (added < businessDays) {
    date.setUTCDate(date.getUTCDate() + 1);
    if (date.getUTCDay() !== 0) {
      added += 1;
    }
  }
  return date;
};

export const isValidIndianPincode = (raw) => {
  if (raw == null) return false;
  return PINCODE_REGEX.test(String(raw).trim());
};

export const estimateDeliveryForPincode = (rawPincode, { orderAmount = 0, now = new Date() } = {}) => {
  const pincode = String(rawPincode ?? "").trim();

  if (!isValidIndianPincode(pincode)) {
    return {
      valid: false,
      serviceable: false,
      pincode,
      message: "Enter a valid 6-digit Indian pincode",
    };
  }

  if (pincode.startsWith("9")) {
    return {
      valid: true,
      serviceable: false,
      pincode,
      region: ZONE_BY_FIRST_DIGIT["9"],
      message: "Courier delivery is currently unavailable for APO/FPO pincodes",
    };
  }

  const metro = METRO_PREFIXES.get(pincode.slice(0, 3));
  const extended = EXTENDED_PREFIXES_2.get(pincode.slice(0, 2));

  let minDays = 3;
  let maxDays = 5;
  let zone = "Standard Pan-India";
  let region = ZONE_BY_FIRST_DIGIT[pincode[0]] || "India";

  if (metro) {
    minDays = 2;
    maxDays = 3;
    zone = metro.zone;
    region = `${metro.city}, ${metro.state}`;
  } else if (extended) {
    minDays = 5;
    maxDays = 7;
    zone = extended.zone;
    region = extended.region;
  }

  const earliestDate = addBusinessDays(now, minDays);
  const latestDate = addBusinessDays(now, maxDays);
  const amount = Number(orderAmount);
  const freeShippingEligible = Number.isFinite(amount) && amount >= FREE_DELIVERY_THRESHOLD;

  return {
    valid: true,
    serviceable: true,
    pincode,
    zone,
    region,
    minDays,
    maxDays,
    earliestDeliveryDate: earliestDate.toISOString(),
    latestDeliveryDate: latestDate.toISOString(),
    freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD,
    deliveryFee: freeShippingEligible ? 0 : DELIVERY_FEE,
    freeShippingEligible,
    returnWindowDays: RETURN_WINDOW_DAYS,
    message: `Delivering to ${region} in ${minDays}–${maxDays} business days`,
  };
};
