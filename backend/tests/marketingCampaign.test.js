import test from "node:test";
import assert from "node:assert/strict";
import { validateMarketingCampaign } from "../utils/marketingCampaignValidation.js";

const valid = {
  name: "November win-back",
  objective: "win_back",
  audienceSegment: "At Risk",
  channel: "email",
  subject: "We would love to see you again",
  message: "A short campaign draft for review.",
};

test("accepts a valid email campaign draft and trims fields", () => {
  const result = validateMarketingCampaign({ ...valid, name: "  November win-back  " });
  assert.equal(result.error, undefined);
  assert.equal(result.value.name, "November win-back");
});

test("requires all mandatory fields", () => {
  assert.match(validateMarketingCampaign({ ...valid, message: " " }).error, /required/);
});

test("requires a subject for email campaigns", () => {
  assert.match(validateMarketingCampaign({ ...valid, subject: "" }).error, /subject/);
});

test("rejects unsupported audience, objective and channel values", () => {
  assert.match(validateMarketingCampaign({ ...valid, audienceSegment: "everyone" }).error, /Invalid/);
  assert.match(validateMarketingCampaign({ ...valid, objective: "send_now" }).error, /Invalid/);
  assert.match(validateMarketingCampaign({ ...valid, channel: "whatsapp" }).error, /Invalid/);
});

test("enforces maximum field lengths", () => {
  assert.match(validateMarketingCampaign({ ...valid, name: "x".repeat(81) }).error, /length/);
  assert.match(validateMarketingCampaign({ ...valid, message: "x".repeat(2001) }).error, /length/);
});

test("allows SMS and onsite drafts without an email subject", () => {
  assert.equal(validateMarketingCampaign({ ...valid, channel: "sms", subject: "" }).error, undefined);
  assert.equal(validateMarketingCampaign({ ...valid, channel: "onsite", subject: "" }).error, undefined);
});
