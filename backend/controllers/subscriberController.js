import asyncHandler from "express-async-handler";
import Subscriber from "../models/Subscriber.js";
import { ok, fail } from "../utils/apiResponse.js";
import { validateSubscriberInput } from "../utils/subscriberValidation.js";

// @route POST /api/subscribers
export const subscribeNewsletter = asyncHandler(async (req, res) => {
  const validation = validateSubscriberInput(req.body);
  if (!validation.valid) {
    return fail(res, validation.error, 400);
  }

  const existing = await Subscriber.findOne({ email: validation.email });
  if (existing) {
    if (!existing.isActive) {
      existing.isActive = true;
      existing.source = validation.source;
      existing.subscribedAt = new Date();
      await existing.save();
      return ok(res, { subscribed: true, alreadySubscribed: false }, "Welcome back! You're subscribed.");
    }
    return ok(res, { subscribed: true, alreadySubscribed: true }, "You're already on the TeenRaah list!");
  }

  await Subscriber.create({
    email: validation.email,
    source: validation.source,
    isActive: true,
    subscribedAt: new Date(),
  });

  return ok(res, { subscribed: true, alreadySubscribed: false }, "You're on the list! Watch for weekly drops.", 201);
});
