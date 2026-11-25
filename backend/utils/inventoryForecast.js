const finiteNonNegative = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
};

/**
 * Transparent baseline forecast. Uses the last 30 calendar days of paid sales.
 * This is a planning estimate, not an ML prediction or a purchase order.
 */
export const calculateInventoryForecast = ({
  stock,
  recentUnits,
  previousUnits,
  recentDays = 30,
  previousDays = 30,
  targetDays = 30,
  minimumUnitsForSuggestion = 14,
}) => {
  const currentStock = finiteNonNegative(stock);
  const recent = finiteNonNegative(recentUnits);
  const previous = finiteNonNegative(previousUnits);
  const days = Math.max(1, Number(recentDays) || 30);
  const priorDays = Math.max(1, Number(previousDays) || 30);
  const dailyDemand = recent / days;
  const previousDailyDemand = previous / priorDays;
  const coverageDays = dailyDemand > 0 ? currentStock / dailyDemand : null;
  const reorderTarget = Math.ceil(dailyDemand * Math.max(1, targetDays));
  const suggestedReorderQty = Math.max(0, reorderTarget - currentStock);

  let trendPercent = null;
  if (previousDailyDemand > 0) {
    trendPercent = Math.round(((dailyDemand - previousDailyDemand) / previousDailyDemand) * 100);
  } else if (dailyDemand > 0) {
    trendPercent = 100;
  }

  const historySufficient = recent > 0 && recent >= minimumUnitsForSuggestion;
  let recommendation = "monitor";
  if (currentStock === 0 && dailyDemand > 0) recommendation = "urgent";
  else if (dailyDemand > 0 && coverageDays !== null && coverageDays <= 14) recommendation = "reorder";
  else if (dailyDemand === 0 && currentStock === 0) recommendation = "no_sales_no_stock";

  return {
    stock: currentStock,
    unitsSoldLast30Days: recent,
    unitsSoldPrevious30Days: previous,
    averageUnitsPerDay: Number(dailyDemand.toFixed(3)),
    estimatedDaysOfStock: coverageDays === null ? null : Number(coverageDays.toFixed(1)),
    trendPercent,
    suggestedReorderQty: historySufficient ? suggestedReorderQty : 0,
    historySufficient,
    recommendation,
  };
};
