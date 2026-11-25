import asyncHandler from "express-async-handler";
import MarketingCampaign from "../models/MarketingCampaign.js";
import { ok, fail } from "../utils/apiResponse.js";
import { recordAuditLog } from "../utils/auditLog.js";
import { validateMarketingCampaign } from "../utils/marketingCampaignValidation.js";

// @route GET /api/admin/marketing-campaigns
export const listMarketingCampaigns = asyncHandler(async (_req, res) => {
  const campaigns = await MarketingCampaign.find({})
    .select("name objective audienceSegment channel subject message status createdAt updatedAt")
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  return ok(res, { campaigns });
});

// @route POST /api/admin/marketing-campaigns
export const createMarketingCampaign = asyncHandler(async (req, res) => {
  const { error, value } = validateMarketingCampaign(req.body || {});
  if (error) return fail(res, error, 400);

  const campaign = await MarketingCampaign.create({
    ...value,
    createdBy: req.user._id,
  });

  await recordAuditLog({
    req,
    action: "marketing_campaign.create",
    targetType: "MarketingCampaign",
    targetId: campaign._id,
    summary: `Saved marketing campaign draft: ${campaign.name}`,
    metadata: {
      audienceSegment: campaign.audienceSegment,
      channel: campaign.channel,
      objective: campaign.objective,
    },
  });

  return ok(res, { campaign }, "Campaign draft saved", 201);
});

// @route DELETE /api/admin/marketing-campaigns/:id
export const deleteMarketingCampaign = asyncHandler(async (req, res) => {
  const campaign = await MarketingCampaign.findById(req.params.id);
  if (!campaign) return fail(res, "Campaign draft not found", 404);
  if (campaign.status !== "draft") return fail(res, "Only draft campaigns can be deleted", 409);

  await campaign.deleteOne();
  await recordAuditLog({
    req,
    action: "marketing_campaign.delete",
    targetType: "MarketingCampaign",
    targetId: campaign._id,
    summary: `Deleted marketing campaign draft: ${campaign.name}`,
  });

  return ok(res, {}, "Campaign draft deleted");
});
