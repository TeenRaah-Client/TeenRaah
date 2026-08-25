import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Map, List, MapPin } from "lucide-react";
import api from "../../api/axios";
import { Loader } from "../../components/ui/Loader";
import CustomerMap from "../../components/admin/CustomerMap";

const AdminCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [pins, setPins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [customersRes, pinsRes] = await Promise.all([
          api.get("/admin/customers"),
          api.get("/admin/customers/map-points"),
        ]);
        setCustomers(customersRes.data.customers);
        setPins(pinsRes.data.points);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <Loader />;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl tracking-wide">CUSTOMERS</h1>
        <div className="flex gap-1 bg-white rounded-full p-1 border border-ink/10">
          <button
            onClick={() => setView("list")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold ${view === "list" ? "bg-ink text-white" : "text-ink/60"}`}
          >
            <List className="w-3.5 h-3.5" /> List
          </button>
          <button
            onClick={() => setView("map")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold ${view === "map" ? "bg-ink text-white" : "text-ink/60"}`}
          >
            <Map className="w-3.5 h-3.5" /> Map ({pins.length})
          </button>
        </div>
      </div>

      {view === "map" ? (
        <div>
          <p className="text-sm text-stone mb-4 flex items-center gap-1.5">
            <MapPin className="w-4 h-4" /> Every saved customer address, plotted from live GPS coordinates.
          </p>
          <CustomerMap pins={pins} />
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-stone uppercase border-b border-ink/8">
                <th className="px-5 py-3 font-semibold">Customer</th>
                <th className="px-5 py-3 font-semibold">Contact</th>
                <th className="px-5 py-3 font-semibold">Orders</th>
                <th className="px-5 py-3 font-semibold">Spent</th>
                <th className="px-5 py-3 font-semibold">Addresses</th>
                <th className="px-5 py-3 font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/6">
              {customers.map((c) => (
                <motion.tr key={c._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-paper/60">
                  <td className="px-5 py-3">
                    <p className="font-semibold">{c.name}</p>
                    {!c.isVerified && <span className="text-[10px] text-amber-600 font-bold">UNVERIFIED</span>}
                  </td>
                  <td className="px-5 py-3">
                    <p>{c.email}</p>
                    <p className="text-xs text-stone">{c.phone}</p>
                  </td>
                  <td className="px-5 py-3 tnum">{c.orderCount}</td>
                  <td className="px-5 py-3 tnum">₹{c.totalSpent.toLocaleString("en-IN")}</td>
                  <td className="px-5 py-3 tnum">{c.addresses?.length || 0}</td>
                  <td className="px-5 py-3 text-stone">{new Date(c.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {customers.length === 0 && <p className="text-center text-stone py-10">No customers yet.</p>}
        </div>
      )}
    </div>
  );
};

export default AdminCustomers;
