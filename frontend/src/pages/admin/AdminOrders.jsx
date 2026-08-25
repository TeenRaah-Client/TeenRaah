import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import { X, MapPin, ChevronDown } from "lucide-react";
import api from "../../api/axios";
import { getSocket } from "../../api/socket";
import { Loader } from "../../components/ui/Loader";
import TrackingTimeline from "../../components/order/TrackingTimeline";

const STATUSES = ["Placed", "Confirmed", "Packed", "Shipped", "Out for Delivery", "Delivered", "Cancelled", "Returned"];

const STATUS_COLORS = {
  Placed: "bg-stone/10 text-stone",
  Confirmed: "bg-trail-50 text-trail-700",
  Packed: "bg-trail-50 text-trail-700",
  Shipped: "bg-amber-50 text-amber-700",
  "Out for Delivery": "bg-amber-50 text-amber-700",
  Delivered: "bg-trail-100 text-trail-700",
  Cancelled: "bg-rose/10 text-rose",
  Returned: "bg-rose/10 text-rose",
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updating, setUpdating] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/orders", { params: { status: statusFilter || undefined, limit: 50 } });
      setOrders(data.orders);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  useEffect(() => {
    const socket = getSocket();
    const onNewOrder = () => fetchOrders();
    socket.on("order:new", onNewOrder);
    return () => socket.off("order:new", onNewOrder);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStatusUpdate = async (orderId, status) => {
    setUpdating(true);
    try {
      const { data } = await api.put(`/admin/orders/${orderId}/status`, { status });
      toast.success(`Order marked as ${status}`);
      setOrders((prev) => prev.map((o) => (o._id === orderId ? data.order : o)));
      setSelectedOrder(data.order);
    } catch (err) {
      toast.error(err.message || "Could not update status");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1 className="font-display text-3xl tracking-wide">ORDERS</h1>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm border border-ink/15 rounded-full px-4 py-2 bg-white"
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-stone uppercase border-b border-ink/8">
                <th className="px-5 py-3 font-semibold">Order</th>
                <th className="px-5 py-3 font-semibold">Customer</th>
                <th className="px-5 py-3 font-semibold">Total</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/6">
              {orders.map((o) => (
                <tr key={o._id} onClick={() => setSelectedOrder(o)} className="hover:bg-paper/60 cursor-pointer">
                  <td className="px-5 py-3 font-semibold">{o.orderNumber}</td>
                  <td className="px-5 py-3">
                    <p>{o.user?.name}</p>
                    <p className="text-xs text-stone">{o.user?.email}</p>
                  </td>
                  <td className="px-5 py-3 tnum">₹{o.totalAmount.toLocaleString("en-IN")}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[o.status]}`}>{o.status}</span>
                  </td>
                  <td className="px-5 py-3 text-stone">{new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 && <p className="text-center text-stone py-10">No orders found.</p>}
        </div>
      )}

      <AnimatePresence>
        {selectedOrder && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedOrder(null)} className="fixed inset-0 bg-ink/50 z-50" />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="fixed inset-x-4 top-[3%] bottom-[3%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl bg-paper rounded-2xl z-50 overflow-y-auto"
            >
              <div className="sticky top-0 bg-paper flex items-center justify-between p-5 border-b border-ink/10 z-10">
                <div>
                  <h2 className="font-display text-2xl tracking-wide">{selectedOrder.orderNumber}</h2>
                  <p className="text-xs text-stone">{selectedOrder.user?.name} · {selectedOrder.user?.email}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} aria-label="Close"><X className="w-6 h-6" /></button>
              </div>

              <div className="p-5 space-y-6">
                <div>
                  <label className="text-xs font-semibold text-stone uppercase mb-2 block">Update Status</label>
                  <div className="relative">
                    <select
                      value={selectedOrder.status}
                      onChange={(e) => handleStatusUpdate(selectedOrder._id, e.target.value)}
                      disabled={updating}
                      className="w-full appearance-none px-4 py-3 rounded-xl border border-ink/15 text-sm bg-white outline-none focus:border-trail-500"
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone pointer-events-none" />
                  </div>
                </div>

                <div className="bg-white rounded-xl p-5 border border-ink/8">
                  <TrackingTimeline order={selectedOrder} />
                </div>

                <div className="bg-white rounded-xl p-5 border border-ink/8">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-trail-600" />
                    <h3 className="font-semibold text-sm">Delivery Address</h3>
                  </div>
                  <p className="text-sm text-ink/70 leading-relaxed">
                    {selectedOrder.shippingAddress.fullName} · {selectedOrder.shippingAddress.phone}
                    <br />
                    {selectedOrder.shippingAddress.line1}, {selectedOrder.shippingAddress.line2}
                    <br />
                    {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.pincode}
                  </p>
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${selectedOrder.shippingAddress.lat}&mlon=${selectedOrder.shippingAddress.lng}#map=16/${selectedOrder.shippingAddress.lat}/${selectedOrder.shippingAddress.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-trail-600 mt-2 inline-block"
                  >
                    View exact pin on map →
                  </a>
                </div>

                <div className="bg-white rounded-xl p-5 border border-ink/8">
                  <h3 className="font-semibold text-sm mb-3">Items</h3>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, i) => (
                      <div key={i} className="flex gap-3">
                        <img src={item.image} alt={item.name} className="w-12 h-14 object-cover rounded-lg bg-paper-dark" />
                        <div className="flex-1 text-sm">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-stone">{item.color && `${item.color} · `}Qty {item.quantity}</p>
                        </div>
                        <span className="text-sm font-semibold tnum">₹{(item.price * item.quantity).toLocaleString("en-IN")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminOrders;
