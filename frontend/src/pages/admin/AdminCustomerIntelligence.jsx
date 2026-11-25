import { useEffect, useState } from "react";
import { Activity, Crown, Repeat2, RefreshCw, ShieldAlert, UserPlus, Users } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import { Loader } from "../../components/ui/Loader";

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const SEGMENT_STYLES = {
  Champions: "bg-emerald-50 text-emerald-800",
  Loyal: "bg-sky-50 text-sky-800",
  New: "bg-violet-50 text-violet-800",
  "At Risk": "bg-amber-50 text-amber-800",
  Dormant: "bg-stone-100 text-stone-700",
};
const SEGMENT_DESCRIPTIONS = {
  Champions: "3+ paid orders; last purchase within 30 days",
  Loyal: "2+ paid orders; last purchase within 60 days",
  New: "1 paid order; last purchase within 30 days",
  "At Risk": "2+ paid orders; last purchase 61–120 days ago",
  Dormant: "Older or inactive purchasing customers",
};

export default function AdminCustomerIntelligence() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/customer-intelligence");
      setReport(data);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not load customer intelligence");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading && !report) return <Loader />;

  const summary = report?.summary;
  const total = summary?.purchasingCustomers || 0;
  const metrics = [
    { label: "Purchasing customers", value: total.toLocaleString("en-IN"), icon: Users },
    { label: "Repeat purchase rate", value: `${Number(summary?.repeatPurchaseRate || 0).toFixed(1)}%`, icon: Repeat2 },
    { label: "Net revenue · 365d", value: money(summary?.netRevenue), icon: Activity },
    { label: "Revenue per buyer", value: money(summary?.revenuePerCustomer), icon: Crown },
  ];

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-trail-600">CUSTOMER LIFECYCLE</p>
          <h1 className="mt-1 font-display text-3xl tracking-wide">CUSTOMER INTELLIGENCE</h1>
          <p className="mt-1 text-sm text-stone">Rule-based customer segments from paid orders in the rolling 365-day window.</p>
        </div>
        <button onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-ink/10 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {report ? <>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {metrics.map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-2xl bg-white p-5 shadow-card">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-trail-50 text-trail-700"><Icon className="h-4 w-4" /></div>
              <p className="text-xl font-bold tabular-nums md:text-2xl">{value}</p>
              <p className="mt-1 text-xs text-stone">{label}</p>
            </div>
          ))}
        </div>

        <section className="rounded-2xl bg-white p-5 shadow-card md:p-6">
          <div className="mb-5">
            <h2 className="font-display text-lg tracking-wide">CUSTOMER SEGMENTS</h2>
            <p className="mt-1 text-xs text-stone">Segments are calculated from order frequency and days since last paid order.</p>
          </div>
          <div className="space-y-5">
            {(report.segments || []).map((segment) => {
              const share = total ? (segment.customers / total) * 100 : 0;
              return (
                <div key={segment.name}>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${SEGMENT_STYLES[segment.name] || "bg-stone-100 text-stone-700"}`}>{segment.name}</span>
                      <span className="text-xs text-stone">{SEGMENT_DESCRIPTIONS[segment.name]}</span>
                    </div>
                    <span className="text-sm font-semibold tabular-nums">{segment.customers.toLocaleString("en-IN")} · {share.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-paper"><div className="h-full rounded-full bg-trail-600 transition-all" style={{ width: `${share}%` }} /></div>
                  <div className="mt-1 flex justify-between text-[11px] text-stone">
                    <span>Net revenue {money(segment.netRevenue)}</span>
                    <span>{segment.orders.toLocaleString("en-IN")} paid orders</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-card">
            <div className="mb-2 flex items-center gap-2 text-stone"><Repeat2 className="h-4 w-4" /><p className="text-xs font-semibold">REPEAT BUYERS</p></div>
            <p className="text-2xl font-bold tabular-nums">{Number(summary.repeatCustomers || 0).toLocaleString("en-IN")}</p>
            <p className="mt-1 text-xs text-stone">Customers with at least two paid orders</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-card">
            <div className="mb-2 flex items-center gap-2 text-stone"><Activity className="h-4 w-4" /><p className="text-xs font-semibold">AVG. ORDERS / BUYER</p></div>
            <p className="text-2xl font-bold tabular-nums">{Number(summary.averageOrdersPerCustomer || 0).toFixed(2)}</p>
            <p className="mt-1 text-xs text-stone">Across customers with a paid order</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-card">
            <div className="mb-2 flex items-center gap-2 text-stone"><UserPlus className="h-4 w-4" /><p className="text-xs font-semibold">AVG. DAYS SINCE PURCHASE</p></div>
            <p className="text-2xl font-bold tabular-nums">{Number(summary.averageDaysSinceLastOrder || 0).toFixed(0)}</p>
            <p className="mt-1 text-xs text-stone">Across purchasing customers in this window</p>
          </div>
        </div>

        <section className="rounded-2xl border border-ink/10 bg-paper p-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-stone" />
            <div>
              <p className="text-xs font-semibold">METHODOLOGY & LIMITATIONS</p>
              <p className="mt-1 text-xs leading-5 text-stone">
                {report.definitions?.eligibleOrders} {report.definitions?.netRevenue} {report.definitions?.repeatPurchaseRate}
                {" "}Segments are transparent rules, not AI predictions. Customers without a paid order in the last 365 days are not included. This page returns aggregate counts only and does not expose customer contact details.
              </p>
              <p className="mt-2 text-[11px] text-stone">Generated: {new Date(report.generatedAt).toLocaleString("en-IN")}</p>
            </div>
          </div>
        </section>
      </> : (
        <div className="rounded-2xl bg-white p-6 text-sm text-stone shadow-card">Customer intelligence could not be loaded. Use Refresh to retry.</div>
      )}
    </div>
  );
}
