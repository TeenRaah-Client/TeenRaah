import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { MapPin, Radio } from "lucide-react";
import api from "../api/axios";
import { useOrderTrackingSocket } from "../hooks/useOrderSocket";
import TrackingTimeline from "../components/order/TrackingTimeline";
import { PageLoader } from "../components/ui/Loader";
import NotFound from "./NotFound";

const OrderTracking = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/orders/${id}`);
        setOrder(data.order);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const handleLiveUpdate = useCallback(
    (updated) => {
      setOrder(updated);
      toast.success(`Order is now: ${updated.status}`, { icon: "📦" });
    },
    []
  );
  useOrderTrackingSocket(id, handleLiveUpdate);

  if (loading) return <PageLoader />;
  if (notFound || !order) return <NotFound />;

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-10">
      <div className="flex items-center gap-2 text-xs text-trail-600 font-semibold mb-2">
        <Radio className="w-3.5 h-3.5 animate-pulseSoft" />
        LIVE TRACKING
      </div>
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
        <h1 className="font-display text-3xl md:text-4xl tracking-wide">ORDER {order.orderNumber}</h1>
      </div>
      <p className="text-stone text-sm mb-10">
        Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
        {order.estimatedDelivery && order.status !== "Delivered" && (
          <> · Estimated delivery {new Date(order.estimatedDelivery).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</>
        )}
      </p>

      <div className="grid md:grid-cols-3 gap-10">
        <div className="md:col-span-2">
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-card mb-6">
            <TrackingTimeline order={order} />
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-card">
            <h3 className="font-display text-lg tracking-wide mb-4">ITEMS</h3>
            <div className="space-y-4">
              {order.items.map((item, i) => (
                <div key={i} className="flex gap-4">
                  <img src={item.image} alt={item.name} className="w-16 h-18 object-cover rounded-lg bg-paper-dark" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{item.name}</p>
                    {item.color && <p className="text-xs text-stone">Color: {item.color}</p>}
                    <p className="text-xs text-stone">Qty {item.quantity}</p>
                  </div>
                  <span className="text-sm font-semibold tnum">₹{(item.price * item.quantity).toLocaleString("en-IN")}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-card">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-trail-600" />
              <h3 className="font-display text-lg tracking-wide">DELIVERING TO</h3>
            </div>
            <p className="text-sm font-semibold">{order.shippingAddress.fullName}</p>
            <p className="text-sm text-ink/70 leading-relaxed">
              {order.shippingAddress.line1}
              {order.shippingAddress.line2 && `, ${order.shippingAddress.line2}`}
              <br />
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}
            </p>
            <p className="text-sm text-stone mt-1">{order.shippingAddress.phone}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-card">
            <h3 className="font-display text-lg tracking-wide mb-3">PAYMENT SUMMARY</h3>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-stone">Items Total</span>
                <span className="tnum">₹{order.itemsTotal.toLocaleString("en-IN")}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-trail-600">
                  <span>Discount {order.couponCode && `(${order.couponCode})`}</span>
                  <span className="tnum">-₹{order.discount.toLocaleString("en-IN")}</span>
                </div>
              )}
              {order.walletUsed > 0 && (
                <div className="flex justify-between text-trail-600">
                  <span>Wallet Used</span>
                  <span className="tnum">-₹{order.walletUsed.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-stone">Delivery</span>
                <span className="tnum">{order.deliveryFee === 0 ? "FREE" : `₹${order.deliveryFee}`}</span>
              </div>
              <div className="flex justify-between font-bold pt-2 border-t border-ink/8 mt-2">
                <span>Total Paid</span>
                <span className="tnum">₹{order.totalAmount.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          <Link to="/orders" className="block text-center text-sm font-semibold text-trail-600">
            ← Back to All Orders
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
