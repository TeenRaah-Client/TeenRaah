import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import { ok, fail } from "../utils/apiResponse.js";

// @route  PUT /api/users/me
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  const user = await User.findById(req.user._id);
  if (name) user.name = name;
  if (phone) user.phone = phone;
  await user.save();
  return ok(res, { user: user.toSafeObject() }, "Profile updated");
});

// ---------------- Addresses (Zomato/Blinkit style) ----------------

// @route  GET /api/users/addresses
export const getAddresses = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  return ok(res, { addresses: user.addresses });
});

// @route  POST /api/users/addresses
export const addAddress = asyncHandler(async (req, res) => {
  const { label, fullName, phone, line1, line2, city, state, pincode, country, lat, lng, isDefault } =
    req.body;

  if (!fullName || !phone || !line1 || !city || !state || !pincode || lat == null || lng == null) {
    return fail(res, "Missing required address fields", 400);
  }

  const user = await User.findById(req.user._id);

  if (isDefault || user.addresses.length === 0) {
    user.addresses.forEach((a) => (a.isDefault = false));
  }

  user.addresses.push({
    label,
    fullName,
    phone,
    line1,
    line2,
    city,
    state,
    pincode,
    country,
    lat,
    lng,
    isDefault: isDefault || user.addresses.length === 0,
  });

  await user.save();
  return ok(res, { addresses: user.addresses }, "Address saved", 201);
});

// @route  PUT /api/users/addresses/:addressId
export const updateAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.addressId);
  if (!address) return fail(res, "Address not found", 404);

  const fields = ["label", "fullName", "phone", "line1", "line2", "city", "state", "pincode", "country", "lat", "lng"];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) address[f] = req.body[f];
  });

  if (req.body.isDefault) {
    user.addresses.forEach((a) => (a.isDefault = false));
    address.isDefault = true;
  }

  await user.save();
  return ok(res, { addresses: user.addresses }, "Address updated");
});

// @route  DELETE /api/users/addresses/:addressId
export const deleteAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.addressId);
  if (!address) return fail(res, "Address not found", 404);

  const wasDefault = address.isDefault;
  address.deleteOne();

  if (wasDefault && user.addresses.length > 0) {
    user.addresses[0].isDefault = true;
  }

  await user.save();
  return ok(res, { addresses: user.addresses }, "Address removed");
});

// ---------------- Referral ----------------

// @route  GET /api/users/referral
export const getReferralInfo = asyncHandler(async (req, res) => {
  const referredUsers = await User.find({ referredBy: req.user._id }).select("name createdAt referralRewardGiven");

  return ok(res, {
    referralCode: req.user.referralCode,
    walletBalance: req.user.walletBalance,
    referredCount: referredUsers.length,
    referredUsers,
    shareMessage: `Join me on TeenRaah and get a welcome discount on your first bag! Use my code ${req.user.referralCode} at signup.`,
  });
});
