import { useEffect, useState } from "react";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, RefreshCw, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import { Loader } from "../../components/ui/Loader";

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const AdminInventoryForecast = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const response = await api.get("/admin/inventory-forecast");
      setData(response.data);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not load inventory forecast");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading && !data) return <Loader />;

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-trail-600">INVENTORY INTELLIGENCE</p>
          <h1 className="mt-1 font-display text-3xl tracking-wide">DEMAND FORECAST</h1>
          <p className="mt-1 text-sm text-stone">A read-only 30-day demand estimate from recorded paid orders.</p>
        </div>
        <button onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-ink/10 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {data && <>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            ["Products analyzed", data.totals.productsAnalyzed],
            ["Urgent stockouts", data.totals.urgent],
            ["Reorder alerts", data.totals.reorder],
            ["Insufficient history", data.totals.insufficientHistory],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-white p-5 shadow-card">
              <p className="text-2xl font-bold tabular-nums">{Number(value || 0).toLocaleString("en-IN")}</p>
              <p className="mt-1 text-xs text-stone">{label}</p>
            </div>
          ))}
        </div>

        <section className="overflow-hidden rounded-2xl bg-white shadow-card">
          <div className="border-b border-ink/8 px-5 py-4">
            <h2 className="font-display text-lg tracking-wide">PRODUCT DEMAND & STOCK COVERAGE</h2>
            <p className="mt-1 text-xs text-stone">Sorted by inventory risk · {data.products.length} products shown</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-paper text-xs text-stone">
                <tr>
                  <th className="px-5 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold">Stock</th>
                  <th className="px-4 py-3 font-semibold">Sold · 30d</th>
                  <th className="px-4 py-3 font-semibold">Daily avg.</th>
                  <th className="px-4 py-3 font-semibold">Stock cover</th>
                  <th className="px-4 py-3 font-semibold">Trend</th>
                  <th className="px-5 py-3 font-semibold">Suggested reorder</th>
                  <th className="px-5 py-3 font-semibold">Signal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/8">
                {data.products.map((product) => {
                  const trend = product.trendPercent;
                  const signal = product.recommendation;
                  return (
                    <tr key={product.productId} className="hover:bg-paper/60">
                      <td className="px-5 py-4">
                        <p className="max-w-[230px] truncate font-semibold">{product.name}</p>
                        <p className="text-xs text-stone">{product.sku || product.category}</p>
                      </td>
                      <td className="px-4 py-4 tabular-nums">{product.stock}</td>
                      <td className="px-4 py-4 tabular-nums">{product.unitsSoldLast30Days}</td>
                      <td className="px-4 py-4 tabular-nums">{product.averageUnitsPerDay}</td>
                      <td className="px-4 py-4 tabular-nums">{product.estimatedDaysOfStock === null ? "—" : `${product.estimatedDaysOfStock} days`}</td>
                      <td className="px-4 py-4">
                        {trend === null ? "—" : <span className={`inline-flex items-center gap-1 ${trend > 0 ? "text-amber-700" : trend < 0 ? "text-emerald-700" : "text-stone"}`}>
                          {trend > 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : trend < 0 ? <ArrowDownRight className="h-3.5 w-3.5" /> : null}
                          {trend > 0 ? "+" : ""}{trend}%
                        </span>}
                      </td>
                      <td className="px-5 py-4 tabular-nums">{product.historySufficient ? product.suggestedReorderQty : "—"}</td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          signal === "urgent" ? "bg-red-50 text-red-700" :
                          signal === "reorder" ? "bg-amber-50 text-amber-700" :
                          "bg-stone-100 text-stone-600"
                        }`}>{signal.replaceAll("_", " ")}</span>
                      </td>
                    </tr>
                  );
                })}
                {!data.products.length && <tr><td colSpan="8" className="px-5 py-10 text-center text-stone">No active products found.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-ink/10 bg-paper p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-stone" />
            <div>
              <p className="text-xs font-semibold">FORECAST ASSUMPTIONS</p>
              <p className="mt-1 text-xs leading-5 text-stone">
                This is a transparent baseline, not an AI/ML prediction. It uses the latest 30 calendar days of paid sales, compares them with the previous 30 days, and estimates stock cover using current stock. Suggested reorder quantity targets 30 days of demand and is shown only when at least 14 units sold in the recent window. It does not create purchase orders or change inventory. Seasonality, promotions, supplier lead times, and item-level returns are not modeled.
              </p>
              <p className="mt-2 text-[11px] text-stone">Generated: {new Date(data.generatedAt).toLocaleString("en-IN")}</p>
            </div>
          </div>
        </section>
      </>}
    </div>
  );
};

export default AdminInventoryForecast;
