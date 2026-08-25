import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { PackageSearch, ChevronRight } from "lucide-react";
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
              <Link
                to={`/orders/${order._id}`}
                className="flex items-center gap-4 bg-white rounded-2xl p-5 shadow-card hover:shadow-lift transition-shadow"
              >
                <div className="flex -space-x-3 shrink-0">
                  {order.items.slice(0, 3).map((item, idx) => (
                    <img
                      key={idx}
                      src={item.image}
                      alt={item.name}
                      className="w-14 h-14 rounded-xl object-cover border-2 border-white bg-paper-dark"
                    />
                  ))}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-sm">{order.orderNumber}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status]}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-xs text-stone">
                    {order.items.length} item{order.items.length > 1 ? "s" : ""} · ₹{order.totalAmount.toLocaleString("en-IN")} ·{" "}
                    {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-stone shrink-0" />
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrders;
