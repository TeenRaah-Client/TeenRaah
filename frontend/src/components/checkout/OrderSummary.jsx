const Row = ({ label, value, highlight, muted }) => (
  <div className="flex justify-between text-sm py-1.5">
    <span className={muted ? "text-stone" : "text-ink/70"}>{label}</span>
    <span className={`tnum ${highlight ? "text-trail-600 font-semibold" : "font-medium"}`}>{value}</span>
  </div>
);

/** props: items, itemsTotal, discount, deliveryFee, walletUsed, total */
const OrderSummary = ({ items, itemsTotal, discount = 0, deliveryFee = 0, walletUsed = 0, total }) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-card">
      <h2 className="font-display text-xl tracking-wide mb-4">ORDER SUMMARY</h2>

      <div className="space-y-3 max-h-48 overflow-y-auto mb-4 pr-1">
        {items.map((item) => (
          <div key={`${item.productId}-${item.color}`} className="flex gap-3">
            <img src={item.image} alt={item.name} className="w-12 h-14 object-cover rounded-lg bg-paper-dark shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold line-clamp-1">{item.name}</p>
              <p className="text-xs text-stone">
                {item.color && `${item.color} · `}Qty {item.quantity}
              </p>
            </div>
            <span className="text-xs font-semibold tnum">₹{item.lineTotal.toLocaleString("en-IN")}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-ink/8 pt-3">
        <Row label="Items Total" value={`₹${itemsTotal.toLocaleString("en-IN")}`} />
        {discount > 0 && <Row label="Coupon Discount" value={`-₹${discount.toLocaleString("en-IN")}`} highlight />}
        {walletUsed > 0 && <Row label="Wallet Credit Used" value={`-₹${walletUsed.toLocaleString("en-IN")}`} highlight />}
        <Row label="Delivery Fee" value={deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`} highlight={deliveryFee === 0} muted={deliveryFee !== 0} />
        <div className="border-t border-ink/8 mt-2 pt-3 flex justify-between items-baseline">
          <span className="font-display text-lg tracking-wide">TOTAL</span>
          <span className="font-display text-2xl tnum">₹{total.toLocaleString("en-IN")}</span>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
