import Razorpay from "razorpay";

/**
 * Razorpay test mode is free to use — no charges until you go live with
 * real KYC-verified keys. Create test keys at:
 * https://dashboard.razorpay.com/app/keys
 */
export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "placeholder_secret",
});

export default razorpay;
