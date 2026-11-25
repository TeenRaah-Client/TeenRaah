import { useEffect, useState } from "react";
import { AlertTriangle, IndianRupee, PackageCheck, ShoppingBag, Users } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import toast from "react-hot-toast";
import api from "../../api/axios";
import { Loader } from "../../components/ui/Loader";

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const PERIODS = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "365d", label: "365 days" },
];

const AdminAnalytics = () => {
  const [period, setPeriod] = useState("30d");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setReport(null);
    api.get("/admin/analytics", { params: { period } })
      .then(({ data }) => { if (active) setReport(data); })
      .catch((error) => { if (active) toast.error(error.message || "Could not load analytics"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [period]);

  if (loading && !report) return <Loader />;
  if (!report) {
    return <div className="rounded-2xl bg-white p-6 shadow-card"><h1 className="font-display text-2xl">BUSINESS ANALYTICS</h1><p className="mt-2 text-sm text-stone">Analytics could not be loaded. Please retry.</p><button onClick={() => window.location.reload()} className="mt-4 rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white">Retry</button></div>;
  }

  const cards = [
    { label: "Net collected", value: money(report.summary.netCollected), icon: IndianRupee },
    { label: "Gross collected", value: money(report.summary.grossCollected), icon: ShoppingBag },
    { label: "Processed refunds", value: money(report.summary.refundsProcessed), icon: PackageCheck },
    { label: "Paid orders", value: report.summary.paidOrders.toLocaleString("en-IN"), icon: ShoppingBag },
    { label: "New customers", value: report.summary.newCustomers.toLocaleString("en-IN"), icon: Users },
    { label: "Average order value", value: money(report.summary.averageOrderValue), icon: IndianRupee },
  ];

  const chartData = report.daily.map((row) => ({
    ...row,
    label: new Date(`${row.date}T00:00:00+05:30`).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
  }));

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-semibold tracking-[0.18em] text-trail-600">PERFORMANCE</p><h1 className="mt-1 font-display text-3xl tracking-wide">BUSINESS ANALYTICS</h1><p className="mt-1 text-sm text-stone">Read-only reporting from recorded orders and refunds.</p></div>
        <label className="flex items-center gap-3 text-sm font-medium text-stone">Period<select value={period} onChange={(event) => setPeriod(event.target.value)} className="rounded-xl border border-ink/10 bg-white px-4 py-2 text-ink outline-none focus:border-trail-500">{PERIODS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
        {cards.map(({ label, value, icon: Icon }) => <div key={label} className="rounded-2xl bg-white p-5 shadow-card"><div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-trail-50 text-trail-700"><Icon className="h-4 w-4" /></div><p className="text-xl font-bold tabular-nums md:text-2xl">{value}</p><p className="mt-1 text-xs text-stone">{label}</p></div>)}
      </div>

      <section className="rounded-2xl bg-white p-5 shadow-card md:p-6">
        <div className="mb-5"><h2 className="font-display text-lg tracking-wide">COLLECTION TREND</h2><p className="text-xs text-stone">Net collected after confirmed refunds · India Standard Time</p></div>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><defs><linearGradient id="analyticsNetGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2F5233" stopOpacity={0.3} /><stop offset="100%" stopColor="#2F5233" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#E7E3D9" vertical={false} /><XAxis dataKey="label" tick={{ fontSize: 11, fill: "#8A8578" }} axisLine={false} tickLine={false} /><YAxis tickFormatter={(value) => `₹${Number(value).toLocaleString("en-IN")}`} tick={{ fontSize: 11, fill: "#8A8578" }} axisLine={false} tickLine={false} width={76} /><Tooltip formatter={(value) => [money(value), "Net collected"]} contentStyle={{ borderRadius: 12, border: "1px solid #E7E3D9", fontSize: 12 }} /><Area type="monotone" dataKey="netCollected" stroke="#2F5233" strokeWidth={2} fill="url(#analyticsNetGradient)" /></AreaChart></ResponsiveContainer>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl bg-white p-5 shadow-card"><h2 className="mb-4 font-display text-lg tracking-wide">TOP PRODUCTS</h2><p className="mb-4 text-xs text-stone">Ranked by units sold. Item value is before refunds.</p>{report.topProducts.length ? <div className="divide-y divide-ink/8">{report.topProducts.map((product, index) => <div key={`${product.productId || product.name}-${index}`} className="flex items-center justify-between gap-4 py-3 text-sm"><div className="min-w-0"><p className="truncate font-semibold">{product.name}</p><p className="text-xs text-stone">{product.unitsSold} units</p></div><p className="shrink-0 font-semibold tabular-nums">{money(product.orderValue)}</p></div>)}</div> : <p className="text-sm text-stone">No paid orders in this period.</p>}</section>

        <section className="rounded-2xl bg-white p-5 shadow-card"><h2 className="mb-4 font-display text-lg tracking-wide">LOW STOCK</h2>{report.lowStockProducts.length ? <div className="divide-y divide-ink/8">{report.lowStockProducts.map((product) => <div key={product._id} className="flex items-center justify-between gap-4 py-3 text-sm"><div className="min-w-0"><p className="truncate font-semibold">{product.name}</p><p className="text-xs text-stone">{product.sku || product.category}</p></div><span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${product.stock === 0 ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>{product.stock} left</span></div>)}</div> : <p className="text-sm text-stone">No active products at or below five units.</p>}</section>
      </div>

      <section className="rounded-2xl border border-ink/10 bg-paper p-4"><div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-stone" /><div><p className="text-xs font-semibold">REPORTING NOTES</p><p className="mt-1 text-xs leading-5 text-stone">Net collected = recorded Razorpay order amount less refunds marked processed. This is not accounting profit: gateway fees, operating expenses, and product cost are not stored as structured values in the current data model. Product ranking shows item value before refunds.</p></div></div></section>
    </div>
  );
};

export default AdminAnalytics;
