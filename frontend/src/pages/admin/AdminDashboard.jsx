import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { IndianRupee, ClipboardList, Users, Package, Radio } from "lucide-react";
import api from "../../api/axios";
import { getSocket } from "../../api/socket";
import { Loader } from "../../components/ui/Loader";

const STAT_CARDS = [
  { key: "totalRevenue", label: "Total Revenue", icon: IndianRupee, format: (v) => `₹${v.toLocaleString("en-IN")}`, color: "bg-trail-50 text-trail-600" },
  { key: "totalOrders", label: "Total Orders", icon: ClipboardList, format: (v) => v, color: "bg-amber-50 text-amber-600" },
  { key: "totalCustomers", label: "Customers", icon: Users, format: (v) => v, color: "bg-rose/10 text-rose" },
  { key: "totalProducts", label: "Products Listed", icon: Package, format: (v) => v, color: "bg-stone/10 text-stone" },
];

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liveCount, setLiveCount] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get("/admin/dashboard");
        setStats(data);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();

    const socket = getSocket();
    const onNewOrder = () => {
      setLiveCount((c) => c + 1);
      fetchStats();
    };
    socket.on("order:new", onNewOrder);
    return () => socket.off("order:new", onNewOrder);
  }, []);

  if (loading || !stats) return <Loader />;

  const chartData = stats.dailyRevenue.map((d) => ({
    date: new Date(d._id).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    revenue: d.revenue,
    orders: d.orders,
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl tracking-wide">DASHBOARD</h1>
        {liveCount > 0 && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5 text-xs font-semibold bg-trail-50 text-trail-700 px-3 py-1.5 rounded-full"
          >
            <Radio className="w-3 h-3 animate-pulseSoft" /> {liveCount} new order{liveCount > 1 ? "s" : ""} live
          </motion.span>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STAT_CARDS.map(({ key, label, icon: Icon, format, color }, i) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-white rounded-2xl p-5 shadow-card"
          >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-3 ${color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold tnum">{format(stats[key])}</p>
            <p className="text-xs text-stone mt-0.5">{label}</p>
          </motion.div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-card mb-8">
        <h2 className="font-display text-lg tracking-wide mb-5">REVENUE — LAST 7 DAYS</h2>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2F5233" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#2F5233" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E7E3D9" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#8A8578" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#8A8578" }} axisLine={false} tickLine={false} width={50} />
            <Tooltip
              formatter={(value, name) => [name === "revenue" ? `₹${value.toLocaleString("en-IN")}` : value, name === "revenue" ? "Revenue" : "Orders"]}
              contentStyle={{ borderRadius: 12, border: "1px solid #E7E3D9", fontSize: 13 }}
            />
            <Area type="monotone" dataKey="revenue" stroke="#2F5233" strokeWidth={2} fill="url(#revenueGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg tracking-wide">RECENT ORDERS</h2>
          <Link to="orders" className="text-sm font-semibold text-trail-600">View All</Link>
        </div>
        <div className="divide-y divide-ink/8">
          {stats.recentOrders.map((o) => (
            <div key={o._id} className="flex items-center justify-between py-3 text-sm">
              <div>
                <p className="font-semibold">{o.orderNumber}</p>
                <p className="text-xs text-stone">{o.user?.name} · {o.user?.email}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold tnum">₹{o.totalAmount.toLocaleString("en-IN")}</p>
                <p className="text-xs text-stone">{o.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
