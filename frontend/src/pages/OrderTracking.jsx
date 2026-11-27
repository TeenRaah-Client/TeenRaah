import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { MapPin, Radio, FileText, Printer, X, RefreshCw } from "lucide-react";
import api from "../api/axios";
import { useOrderTrackingSocket } from "../hooks/useOrderSocket";
import { useCart } from "../context/CartContext";
import TrackingTimeline from "../components/order/TrackingTimeline";
import { PageLoader } from "../components/ui/Loader";
import NotFound from "./NotFound";

const OrderTracking = () => {
  const { id } = useParams();
  const { addItem } = useCart();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [invoice, setInvoice] = useState(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [reordering, setReordering] = useState(false);

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

  const handleLiveUpdate = useCallback((updated) => {
    setOrder(updated);
    toast.success(`Order is now: ${updated.status}`, { icon: "📦" });
  }, []);
  useOrderTrackingSocket(id, handleLiveUpdate);

  const openInvoice = async () => {
    setLoadingInvoice(true);
    try {
      const { data } = await api.get(`/orders/${id}/invoice`);
      setInvoice(data.invoice);
    } catch (err) {
      toast.error(err.message || "Could not load GST invoice");
    } finally {
      setLoadingInvoice(false);
    }
  };

  const handleBuyAgain = async () => {
    if (!order?.items?.length) return;
    setReordering(true);
    try {
      for (const item of order.items) {
        if (item.product) {
          await addItem(item.product, item.quantity || 1, item.color || "");
        }
      }
    } catch (err) {
      toast.error(err.message || "Some items could not be added back to your bag");
    } finally {
      setReordering(false);
    }
  };

  if (loading) return <PageLoader />;
  if (notFound || !order) return <NotFound />;

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-10">
      <div className="flex items-center gap-2 text-xs text-trail-600 font-semibold mb-2">
        <Radio className="w-3.5 h-3.5 animate-pulseSoft" />
        LIVE TRACKING
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <h1 className="font-display text-3xl md:text-4xl tracking-wide">ORDER {order.orderNumber}</h1>
        <div className="flex flex-wrap gap-2 no-print">
          <button
            type="button"
            disabled={loadingInvoice}
            onClick={openInvoice}
            className="inline-flex items-center gap-1.5 rounded-full bg-white border border-ink/15 px-4 py-2 text-xs font-semibold text-ink hover:border-ink/40 disabled:opacity-50"
          >
            <FileText className="w-3.5 h-3.5 text-trail-600" />
            {loadingInvoice ? "Loading…" : "GST Invoice"}
          </button>
          <button
            type="button"
            disabled={reordering}
            onClick={handleBuyAgain}
            className="inline-flex items-center gap-1.5 rounded-full bg-ink text-white px-4 py-2 text-xs font-semibold hover:bg-ink-800 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${reordering ? "animate-spin" : ""}`} />
            Buy Again
          </button>
        </div>
      </div>

      <p className="text-stone text-sm mb-10">
        Placed on{" "}
        {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
        {order.estimatedDelivery && order.status !== "Delivered" && (
          <>
            {" "}
            · Estimated delivery{" "}
            {new Date(order.estimatedDelivery).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          </>
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
                  <span className="text-sm font-semibold tnum">
                    ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                  </span>
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

          <Link to="/orders" className="block text-center text-sm font-semibold text-trail-600 no-print">
            ← Back to All Orders
          </Link>
        </div>
      </div>

      {/* GST Tax Invoice Modal */}
      {invoice && (
        <div
          onClick={() => setInvoice(null)}
          className="fixed inset-0 z-[75] bg-ink/60 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-lift my-8"
          >
            <div className="flex items-start justify-between gap-4 border-b border-ink/10 pb-4 mb-5">
              <div>
                <p className="font-display text-2xl tracking-wide text-ink">TAX INVOICE</p>
                <p className="text-xs text-stone">
                  {invoice.invoiceNumber} · Issued{" "}
                  {new Date(invoice.issuedAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="flex items-center gap-2 no-print">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-full bg-ink text-white px-4 py-2 text-xs font-semibold"
                >
                  <Printer className="w-3.5 h-3.5" /> Print / Save PDF
                </button>
                <button
                  type="button"
                  onClick={() => setInvoice(null)}
                  aria-label="Close invoice"
                  className="p-2 rounded-full hover:bg-paper-dark"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 text-xs mb-6">
              <div>
                <p className="font-bold uppercase text-stone mb-1">Sold By</p>
                <p className="font-semibold text-ink">{invoice.seller.name}</p>
                <p className="text-stone">{invoice.seller.state}</p>
                <p className="text-stone">{invoice.seller.supportEmail}</p>
              </div>
              <div>
                <p className="font-bold uppercase text-stone mb-1">Billed &amp; Shipped To</p>
                <p className="font-semibold text-ink">{invoice.customer.fullName}</p>
                <p className="text-stone">
                  {invoice.customer.addressLine1}
                  {invoice.customer.addressLine2 ? `, ${invoice.customer.addressLine2}` : ""}
                </p>
                <p className="text-stone">
                  {invoice.customer.city}, {invoice.customer.state} - {invoice.customer.pincode}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto mb-5">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-ink/15 text-left text-stone">
                    <th className="py-2 pr-2">Item</th>
                    <th className="py-2 px-2">HSN</th>
                    <th className="py-2 px-2 text-right">Qty</th>
                    <th className="py-2 px-2 text-right">Taxable</th>
                    <th className="py-2 pl-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/8">
                  {invoice.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 pr-2 font-medium text-ink">
                        {item.name}
                        {item.color ? ` (${item.color})` : ""}
                      </td>
                      <td className="py-2.5 px-2 text-stone tnum">{item.hsnCode}</td>
                      <td className="py-2.5 px-2 text-right tnum">{item.quantity}</td>
                      <td className="py-2.5 px-2 text-right tnum">₹{item.taxableValue.toLocaleString("en-IN")}</td>
                      <td className="py-2.5 pl-2 text-right font-semibold tnum">
                        ₹{item.lineTotal.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-ink/10 pt-4 space-y-1.5 text-xs tnum max-w-xs ml-auto">
              <div className="flex justify-between">
                <span className="text-stone">Taxable Value</span>
                <span>₹{invoice.summary.taxableValue.toLocaleString("en-IN")}</span>
              </div>
              {invoice.summary.taxType === "CGST+SGST" ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-stone">CGST ({invoice.summary.gstRatePercent / 2}%)</span>
                    <span>₹{invoice.summary.cgst.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone">SGST ({invoice.summary.gstRatePercent / 2}%)</span>
                    <span>₹{invoice.summary.sgst.toLocaleString("en-IN")}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between">
                  <span className="text-stone">IGST ({invoice.summary.gstRatePercent}%)</span>
                  <span>₹{invoice.summary.igst.toLocaleString("en-IN")}</span>
                </div>
              )}
              {invoice.summary.walletUsed > 0 && (
                <div className="flex justify-between text-trail-700">
                  <span>Wallet Credit</span>
                  <span>-₹{invoice.summary.walletUsed.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm pt-2 border-t border-ink/10">
                <span>Total Paid</span>
                <span>₹{invoice.summary.totalPaid.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTracking;
