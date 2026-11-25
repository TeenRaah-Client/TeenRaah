export const RETURN_WINDOW_DAYS = 7;

export const getDeliveryTimestamp = (trackingHistory = []) => {
  const delivered = [...trackingHistory].reverse().find((event) => event.status === "Delivered");
  return delivered?.at ? new Date(delivered.at) : null;
};

export const canRequestReturn = ({
  orderStatus,
  paymentStatus,
  trackingHistory,
  now = new Date(),
  windowDays = RETURN_WINDOW_DAYS,
}) => {
  if (orderStatus !== "Delivered" || paymentStatus !== "paid") return false;
  const deliveredAt = getDeliveryTimestamp(trackingHistory);
  if (!deliveredAt || Number.isNaN(deliveredAt.getTime())) return false;
  const ageMs = now.getTime() - deliveredAt.getTime();
  return ageMs >= 0 && ageMs <= windowDays * 24 * 60 * 60 * 1000;
};
