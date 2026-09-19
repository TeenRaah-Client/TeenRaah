import crypto from "crypto";
import { finalizeOrderCore } from "./orderController.js";

/**
 * Why this exists alongside /api/payment/verify: that flow only completes
 * if the customer's browser stays open and the network holds up long enough
 * to call back after Razorpay's checkout closes. If they close the tab, lose
 * signal, or the app crashes at exactly the wrong moment, a customer can be
 * charged with no order ever created — this webhook is Razorpay telling us
 * directly, server-to-server, independent of what the browser does.
 *
 * finalizeOrderCore() is idempotent (the payment intent is consumed exactly
 * once from Redis), so whichever of the two paths — this webhook or the
 * browser callback — arrives first does the real work; the other safely
 * no-ops via the alreadyFinalized flag.
 *
 * Setup: Razorpay Dashboard → Settings → Webhooks → add this endpoint's URL,
 * subscribe to "payment.captured", and copy the signing secret into
 * RAZORPAY_WEBHOOK_SECRET. This is a DIFFERENT secret from RAZORPAY_KEY_SECRET.
 */
export const handleRazorpayWebhook = async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || secret.includes("your_razorpay")) {
    console.warn("⚠️  RAZORPAY_WEBHOOK_SECRET not configured — webhook safety net is inactive.");
    return res.status(200).json({ received: true, note: "webhook not configured" });
  }

  // req.body is the RAW Buffer here (see server.js — this route is mounted
  // with express.raw(), before the global JSON parser, since the signature
  // is computed over the exact raw bytes, not a re-serialized copy).
  const signature = req.headers["x-razorpay-signature"];
  const expectedSignature = crypto.createHmac("sha256", secret).update(req.body).digest("hex");

  if (!signature || signature !== expectedSignature) {
    console.warn("⚠️  Razorpay webhook signature mismatch — rejecting.");
    return res.status(400).json({ received: false });
  }

  let payload;
  try {
    payload = JSON.parse(req.body.toString("utf8"));
  } catch {
    return res.status(400).json({ received: false });
  }

  // Always 200 once the signature is valid, even if we don't act on this
  // particular event — Razorpay retries on non-2xx, and there's nothing to
  // retry for events we don't handle.
  if (payload.event !== "payment.captured") {
    return res.status(200).json({ received: true });
  }

  const payment = payload.payload?.payment?.entity;
  if (!payment?.order_id || !payment?.id) {
    return res.status(200).json({ received: true, note: "missing payment fields" });
  }

  try {
    await finalizeOrderCore({
      razorpayOrderId: payment.order_id,
      razorpayPaymentId: payment.id,
      // No client-submitted signature exists on this path — the webhook
      // signature above already proved authenticity, so this field is
      // just recorded as "verified-via-webhook" for the order's audit trail.
      razorpaySignature: "verified-via-webhook",
    });
  } catch (err) {
    console.error("Webhook order finalization failed:", err.message);
    // Still 200 — Razorpay isn't the right retry mechanism for our own bugs,
    // and this is already logged for manual follow-up.
  }

  return res.status(200).json({ received: true });
};
