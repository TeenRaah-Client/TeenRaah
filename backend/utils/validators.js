import { body, param, query } from "express-validator";

// ---------------- Auth ----------------

export const registerValidator = [
  body("name").trim().isLength({ min: 2, max: 80 }).withMessage("Name must be 2-80 characters"),
  body("email").trim().isEmail().withMessage("Enter a valid email").normalizeEmail(),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/[A-Za-z]/)
    .withMessage("Password must include a letter")
    .matches(/[0-9]/)
    .withMessage("Password must include a number"),
  body("phone").optional({ checkFalsy: true }).trim().isLength({ min: 7, max: 15 }).withMessage("Enter a valid phone number"),
  body("referralCode").optional({ checkFalsy: true }).trim().isLength({ max: 20 }).withMessage("Invalid referral code"),
];

export const loginValidator = [
  body("email").trim().isEmail().withMessage("Enter a valid email").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

export const otpValidator = [
  body("email").trim().isEmail().withMessage("Enter a valid email").normalizeEmail(),
  body("otp").isLength({ min: 6, max: 6 }).isNumeric().withMessage("Enter the 6-digit code"),
];

export const totpCodeValidator = [body("code").isLength({ min: 6, max: 6 }).isNumeric().withMessage("Enter the 6-digit code")];

// ---------------- Addresses ----------------

export const addressValidator = [
  body("fullName").trim().isLength({ min: 2, max: 100 }).withMessage("Enter a valid name"),
  body("phone").trim().isLength({ min: 7, max: 15 }).withMessage("Enter a valid phone number"),
  body("line1").trim().isLength({ min: 3, max: 200 }).withMessage("Enter the address line"),
  body("city").trim().isLength({ min: 2, max: 100 }).withMessage("Enter a valid city"),
  body("state").trim().isLength({ min: 2, max: 100 }).withMessage("Enter a valid state"),
  body("pincode").trim().isLength({ min: 4, max: 10 }).withMessage("Enter a valid pincode"),
  body("lat").isFloat({ min: -90, max: 90 }).withMessage("Invalid location"),
  body("lng").isFloat({ min: -180, max: 180 }).withMessage("Invalid location"),
];

// ---------------- Checkout / payment ----------------

export const createPaymentOrderValidator = [
  body("addressId").isMongoId().withMessage("Select a valid delivery address"),
  body("couponCode").optional({ checkFalsy: true }).trim().isLength({ max: 30 }).withMessage("Invalid coupon code"),
  body("useWallet").optional().isBoolean().withMessage("Invalid wallet option"),
];

export const verifyPaymentValidator = [
  body("razorpay_order_id").notEmpty().withMessage("Missing payment reference"),
  body("razorpay_payment_id").notEmpty().withMessage("Missing payment reference"),
  body("razorpay_signature").notEmpty().withMessage("Missing payment signature"),
];

// ---------------- Admin: products ----------------

export const productValidator = [
  body("name").trim().isLength({ min: 2, max: 150 }).withMessage("Name must be 2-150 characters"),
  body("description").trim().isLength({ min: 10, max: 3000 }).withMessage("Description must be at least 10 characters"),
  body("category").notEmpty().withMessage("Category is required"),
  body("price").isFloat({ min: 1 }).withMessage("Price must be a positive number"),
  body("mrp").isFloat({ min: 1 }).withMessage("MRP must be a positive number"),
  body("stock").optional().isInt({ min: 0 }).withMessage("Stock must be 0 or more"),
];

// ---------------- Admin: coupons ----------------

export const couponValidator = [
  body("code").trim().isLength({ min: 3, max: 30 }).withMessage("Code must be 3-30 characters"),
  body("discountType").isIn(["percentage", "flat"]).withMessage("Invalid discount type"),
  body("discountValue").isFloat({ min: 0.01 }).withMessage("Discount value must be positive"),
  body("expiresAt").isISO8601().toDate().withMessage("Enter a valid expiry date"),
  body("minOrderValue").optional().isFloat({ min: 0 }).withMessage("Invalid minimum order value"),
  body("usageLimit").optional({ checkFalsy: true }).isInt({ min: 1 }).withMessage("Invalid usage limit"),
];

// ---------------- Reviews ----------------

export const reviewValidator = [
  body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be 1-5"),
  body("comment").trim().isLength({ min: 5, max: 1000 }).withMessage("Review must be 5-1000 characters"),
];

// ---------------- Generic Mongo ID param ----------------

export const mongoIdParam = (name = "id") => param(name).isMongoId().withMessage("Invalid ID");
