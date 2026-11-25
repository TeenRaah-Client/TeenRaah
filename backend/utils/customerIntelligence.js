const SEGMENT_ORDER = ["Champions", "Loyal", "New", "At Risk", "Dormant"];

export function classifyCustomer({ orderCount, daysSinceLastOrder }) {
  const orders = Math.max(0, Number(orderCount) || 0);
  const hasRecency = daysSinceLastOrder !== null && daysSinceLastOrder !== undefined && daysSinceLastOrder !== "";
  const recencyValue = hasRecency ? Number(daysSinceLastOrder) : NaN;
  const recency = Number.isFinite(recencyValue) ? Math.max(0, recencyValue) : Infinity;

  if (orders >= 3 && recency <= 30) return "Champions";
  if (orders >= 2 && recency <= 60) return "Loyal";
  if (orders === 1 && recency <= 30) return "New";
  if (orders >= 2 && recency <= 120) return "At Risk";
  return "Dormant";
}

export function buildCustomerIntelligence(rows, generatedAt = new Date()) {
  const now = generatedAt instanceof Date ? generatedAt.getTime() : new Date(generatedAt).getTime();
  const segments = Object.fromEntries(
    SEGMENT_ORDER.map((name) => [name, { name, customers: 0, netRevenue: 0, orders: 0 }])
  );

  let repeatCustomers = 0;
  let netRevenue = 0;
  let orderCount = 0;
  let recencyTotal = 0;

  for (const row of rows || []) {
    const count = Math.max(0, Number(row.orderCount) || 0);
    const gross = Math.max(0, Number(row.grossRevenue) || 0);
    const refunds = Math.max(0, Number(row.processedRefunds) || 0);
    const customerNet = Math.max(0, gross - refunds);
    const lastDate = row.lastOrderAt ? new Date(row.lastOrderAt).getTime() : NaN;
    const days = Number.isFinite(lastDate)
      ? Math.max(0, Math.floor((now - lastDate) / 86400000))
      : Infinity;
    const segmentName = classifyCustomer({ orderCount: count, daysSinceLastOrder: days });
    const segment = segments[segmentName];

    segment.customers += 1;
    segment.netRevenue += customerNet;
    segment.orders += count;
    netRevenue += customerNet;
    orderCount += count;
    recencyTotal += Number.isFinite(days) ? days : 0;
    if (count > 1) repeatCustomers += 1;
  }

  const customerCount = (rows || []).length;
  return {
    windowDays: 365,
    generatedAt: new Date(now).toISOString(),
    summary: {
      purchasingCustomers: customerCount,
      repeatCustomers,
      repeatPurchaseRate: customerCount ? (repeatCustomers / customerCount) * 100 : 0,
      netRevenue,
      revenuePerCustomer: customerCount ? netRevenue / customerCount : 0,
      averageOrdersPerCustomer: customerCount ? orderCount / customerCount : 0,
      averageDaysSinceLastOrder: customerCount ? recencyTotal / customerCount : 0,
    },
    segments: SEGMENT_ORDER.map((name) => ({
      ...segments[name],
      averageNetRevenue: segments[name].customers
        ? segments[name].netRevenue / segments[name].customers
        : 0,
    })),
    definitions: {
      window: "Rolling 365 days based on order creation date.",
      eligibleOrders: "Orders with payment.status = paid. Fully refunded orders are excluded.",
      netRevenue: "Order total less refunds marked processed; this is not accounting profit.",
      repeatPurchaseRate: "Customers with at least two eligible paid orders divided by all customers with at least one eligible paid order.",
      segments: "Rule-based recency and frequency groups; not machine-learning predictions.",
    },
  };
}

export { SEGMENT_ORDER };
