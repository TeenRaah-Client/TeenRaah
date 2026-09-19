import AdminLog from "../models/AdminLog.js";

/**
 * Records one admin action. Called explicitly at the point in each
 * controller where the action actually succeeds — deliberately not a
 * generic "log every admin route" middleware, since that tends to produce
 * a wall of technically-true-but-useless entries ("PUT /api/admin/products/
 * 671a...") instead of readable ones ("Updated price on Trailmark Daypack").
 *
 * Never throws — a logging failure should never take down the actual
 * action it's trying to record.
 */
export const recordAuditLog = async ({ req, admin, action, targetType, targetId, summary, metadata }) => {
  try {
    const actor = admin || req?.user;
    if (!actor) return;

    await AdminLog.create({
      admin: actor._id,
      adminName: actor.name,
      adminEmail: actor.email,
      action,
      targetType,
      targetId,
      summary,
      metadata,
      ip: req?.ip,
    });
  } catch (err) {
    console.error("⚠️  Failed to write audit log:", err.message);
  }
};
