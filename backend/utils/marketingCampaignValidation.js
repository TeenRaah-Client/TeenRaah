const OBJECTIVES = new Set(["repeat_purchase", "win_back", "new_customer", "product_launch", "seasonal"]);
const SEGMENTS = new Set(["all_purchasers", "Champions", "Loyal", "New", "At Risk", "Dormant"]);
const CHANNELS = new Set(["email", "sms", "onsite"]);

export function validateMarketingCampaign(input = {}) {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const message = typeof input.message === "string" ? input.message.trim() : "";
  const subject = typeof input.subject === "string" ? input.subject.trim() : "";
  const { objective, audienceSegment, channel } = input;

  if (!name || !message || !objective || !audienceSegment || !channel) {
    return { error: "Name, objective, audience, channel and message are required" };
  }
  if (name.length > 80 || message.length > 2000 || subject.length > 120) {
    return { error: "Campaign fields exceed the allowed length" };
  }
  if (!OBJECTIVES.has(objective) || !SEGMENTS.has(audienceSegment) || !CHANNELS.has(channel)) {
    return { error: "Invalid campaign objective, audience or channel" };
  }
  if (channel === "email" && !subject) {
    return { error: "Email campaigns require a subject" };
  }

  return { value: { name, objective, audienceSegment, channel, subject, message } };
}
