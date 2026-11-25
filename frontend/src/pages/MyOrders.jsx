import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { PackageSearch, ChevronRight, RotateCcw, X } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";
import { Loader } from "../components/ui/Loader";

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

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [returnOrderId, setReturnOrderId] = useState(null);
  const [returnReason, setReturnReason] = useState("Damaged item");
  const [returnNote, setReturnNote] = useState("");
  const [submittingReturn, setSubmittingReturn] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await api.get("/orders/mine");
        setOrders(data.orders);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const submitReturnRequest = async (orderId) => {
    setSubmittingReturn(true);
    try {
      const { data } = await api.post(`/orders/${orderId}/return`, { reason: returnReason, note: returnNote });
      setOrders((current) => current.map((order) => order._id === orderId ? data.order : order));
      setReturnOrderId(null);
      setReturnNote("");
      toast.success("Return request submitted");
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Could not submit return request");
    } finally {
      setSubmittingReturn(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-10">
      <h1 className="font-display text-4xl md:text-5xl tracking-wide mb-8">MY ORDERS</h1>

      {loading ? (
        <Loader />
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-ink/15">
          <PackageSearch className="w-10 h-10 text-stone mx-auto mb-4" />
          <p className="text-stone mb-4">You haven't placed any orders yet.</p>
          <Link to="/shop" className="text-trail-600 font-semibold text-sm">
            Start Shopping →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order, i) => (
            <motion.div
              key={order._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="bg-white rounded-2xl p-5 shadow-card">
                <Link to={`/orders/${order._id}`} className="flex items-center gap-4 hover:opacity-90 transition-opacity">
                  <div className="flex -space-x-3 shrink-0">
                    {order.items.slice(0, 3).map((item, idx) => (
                      <img key={idx} src={item.image} alt={item.name} className="w-14 h-14 rounded-xl object-cover border-2 border-white bg-paper-dark" />
                    ))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm">{order.orderNumber}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status]}`}>{order.status}</span>
                    </div>
                    <p className="text-xs text-stone">
                      {order.items.length} item{order.items.length > 1 ? "s" : ""} · ₹{order.totalAmount.toLocaleString("en-IN")} · {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-stone shrink-0" />
                </Link>

                {order.returnRequest?.status && order.returnRequest.status !== "none" ? (
                  <div className="mt-4 rounded-xl bg-paper px-4 py-3 text-xs">
                    <p className="font-semibold">Return request: <span className="capitalize">{order.returnRequest.status}</span></p>
                    <p className="text-stone mt-1">{order.returnRequest.reason} · Refund: {order.returnRequest.refundStatus || "Not started"}</p>
                    {order.returnRequest.refundId && <p className="text-stone mt-1">Refund reference: {order.returnRequest.refundId}</p>}
                  </div>
                ) : order.status === "Delivered" && order.payment?.status === "paid" ? (
                  <div className="mt-4">
                    {returnOrderId === order._id ? (
                      <div className="rounded-xl border border-ink/10 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-sm">Request a return</p>
                          <button type="button" onClick={() => setReturnOrderId(null)} aria-label="Close return form"><X className="w-4 h-4" /></button>
                        </div>
                        <select value={returnReason} onChange={(event) => setReturnReason(event.target.value)} className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm bg-white">
                          {["Damaged item", "Wrong item received", "Different from description", "Quality issue", "Other"].map((reason) => <option key={reason}>{reason}</option>)}
                        </select>
                        <textarea value={returnNote} onChange={(event) => setReturnNote(event.target.value)} maxLength={1000} rows={3} placeholder="Add details (optional)" className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm resize-y" />
                        <button type="button" disabled={submittingReturn} onClick={() => submitReturnRequest(order._id)} className="w-full rounded-full bg-ink text-white py-2.5 text-sm font-semibold disabled:opacity-50">
                          {submittingReturn ? "Submitting…" : "Submit return request"}
                        </button>
                        <p className="text-[11px] text-stone">Eligible within 7 days of delivery. Refunds are reviewed by the TeenRaah team.</p>
                      </div>
                    ) : (
                      <button type="button" onClick={() => setReturnOrderId(order._id)} className="inline-flex items-center gap-2 text-xs font-semibold text-trail-700 hover:text-trail-900">
                        <RotateCcw className="w-3.5 h-3.5" /> Request a return
                      </button>
                    )}
                  </div>
                ) : null}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrders;
