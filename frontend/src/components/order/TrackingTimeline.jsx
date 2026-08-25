import { motion } from "framer-motion";
import { Check, PackageCheck, PackageSearch, Truck, Home, XCircle, RotateCcw } from "lucide-react";

const STEP_ORDER = ["Placed", "Confirmed", "Packed", "Shipped", "Out for Delivery", "Delivered"];

const STEP_META = {
  Placed: { icon: PackageCheck, label: "Order Placed" },
  Confirmed: { icon: Check, label: "Confirmed" },
  Packed: { icon: PackageSearch, label: "Packed" },
  Shipped: { icon: Truck, label: "Shipped" },
  "Out for Delivery": { icon: Truck, label: "Out for Delivery" },
  Delivered: { icon: Home, label: "Delivered" },
};

const formatDate = (d) =>
  new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

/** props: order (with .status and .trackingHistory) */
const TrackingTimeline = ({ order }) => {
  const isCancelled = order.status === "Cancelled" || order.status === "Returned";
  const currentIndex = STEP_ORDER.indexOf(order.status);
  const historyMap = new Map(order.trackingHistory.map((h) => [h.status, h]));

  if (isCancelled) {
    const event = order.trackingHistory[order.trackingHistory.length - 1];
    return (
      <div className="flex items-center gap-4 bg-rose/5 border border-rose/20 rounded-2xl p-6">
        {order.status === "Cancelled" ? (
          <XCircle className="w-8 h-8 text-rose shrink-0" />
        ) : (
          <RotateCcw className="w-8 h-8 text-rose shrink-0" />
        )}
        <div>
          <p className="font-semibold text-ink">Order {order.status}</p>
          <p className="text-sm text-stone">{event && formatDate(event.at)}</p>
          {event?.note && <p className="text-sm text-stone mt-1">{event.note}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="relative pl-2">
      {/* The animated "path" line — literal brand motif: the order's route being walked */}
      <div className="absolute left-[27px] top-3 bottom-3 w-0.5 bg-ink/10">
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: `${(currentIndex / (STEP_ORDER.length - 1)) * 100}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="w-full bg-trail-500"
        />
      </div>

      <div className="space-y-8">
        {STEP_ORDER.map((step, i) => {
          const { icon: Icon, label } = STEP_META[step];
          const done = i <= currentIndex;
          const event = historyMap.get(step);
          const isCurrent = i === currentIndex;

          return (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="relative flex items-center gap-5"
            >
              <motion.div
                animate={isCurrent ? { scale: [1, 1.12, 1] } : {}}
                transition={{ duration: 1.6, repeat: isCurrent ? Infinity : 0 }}
                className={`relative z-10 w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${
                  done ? "bg-trail-500 text-white" : "bg-white border-2 border-ink/10 text-stone"
                }`}
              >
                <Icon className="w-5 h-5" />
              </motion.div>
              <div>
                <p className={`font-semibold ${done ? "text-ink" : "text-stone"}`}>{label}</p>
                {event ? (
                  <p className="text-xs text-stone">{formatDate(event.at)}</p>
                ) : (
                  <p className="text-xs text-stone/60">Pending</p>
                )}
                {event?.note && <p className="text-xs text-stone mt-0.5">{event.note}</p>}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default TrackingTimeline;
