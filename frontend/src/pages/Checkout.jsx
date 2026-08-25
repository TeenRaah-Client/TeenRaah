import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Wallet, Plus, ShieldCheck } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import AddressCard from "../components/address/AddressCard";
import CouponInput from "../components/checkout/CouponInput";
import OrderSummary from "../components/checkout/OrderSummary";
import Button from "../components/ui/Button";
import { PageLoader } from "../components/ui/Loader";

// Mirrors backend/utils/constants.js — used ONLY to render a live preview.
// The real, trusted total is always computed server-side in
// paymentController.createPaymentOrder; this never decides what gets charged.
const FREE_DELIVERY_THRESHOLD = 999;
const DELIVERY_FEE = 79;

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    if (document.getElementById("razorpay-checkout-js")) {
      document.getElementById("razorpay-checkout-js").addEventListener("load", () => resolve(true));
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-checkout-js";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const Checkout = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { items, subtotal, refreshCart } = useCart();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [coupon, setCoupon] = useState(null);
  const [useWallet, setUseWallet] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const { data } = await api.get("/users/addresses");
        setAddresses(data.addresses);
        const def = data.addresses.find((a) => a.isDefault) || data.addresses[0];
        if (def) setSelectedAddressId(def._id);
      } finally {
        setLoadingAddresses(false);
      }
    };
    fetchAddresses();
  }, []);

  if (loadingAddresses) return <PageLoader />;
  if (items.length === 0) {
    navigate("/cart");
    return null;
  }

  // Live preview only — see note above.
  const discount = coupon?.discount || 0;
  const afterCoupon = subtotal - discount;
  const previewDeliveryFee = afterCoupon >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const maxWalletUsable = Math.max(0, afterCoupon + previewDeliveryFee - 1);
  const previewWalletUsed = useWallet ? Math.min(user?.walletBalance || 0, maxWalletUsable) : 0;
  const previewTotal = Math.max(1, Math.round(afterCoupon + previewDeliveryFee - previewWalletUsed));

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      toast.error("Please select a delivery address");
      return;
    }

    setPlacingOrder(true);
    try {
      const { data: orderData } = await api.post("/payment/create-order", {
        addressId: selectedAddressId,
        couponCode: coupon?.code,
        useWallet,
      });

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error("Couldn't load payment gateway. Check your connection and try again.");
        setPlacingOrder(false);
        return;
      }

      const razorpay = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.amount * 100,
        currency: orderData.currency,
        name: "TeenRaah",
        description: `Order for ${items.length} item(s)`,
        image: "/logo.png",
        order_id: orderData.razorpayOrderId,
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: user?.phone || "",
        },
        theme: { color: "#2F5233" },
        handler: async (response) => {
          try {
            const { data: verifyData } = await api.post("/payment/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            await Promise.all([refreshCart(), refreshUser()]);
            toast.success("Order placed! 🎉");
            navigate(`/orders/${verifyData.order._id}`);
          } catch (err) {
            toast.error(err.message || "Payment verification failed. Contact support if money was deducted.");
          } finally {
            setPlacingOrder(false);
          }
        },
        modal: {
          ondismiss: () => setPlacingOrder(false),
        },
      });

      razorpay.on("payment.failed", () => {
        toast.error("Payment failed. Please try again.");
        setPlacingOrder(false);
      });

      razorpay.open();
    } catch (err) {
      toast.error(err.message || "Could not start checkout");
      setPlacingOrder(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-10">
      <h1 className="font-display text-4xl md:text-5xl tracking-wide mb-8">CHECKOUT</h1>

      <div className="grid md:grid-cols-3 gap-10">
        <div className="md:col-span-2 space-y-8">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl tracking-wide">DELIVERY ADDRESS</h2>
              <Link to="/addresses" className="flex items-center gap-1 text-sm font-semibold text-trail-600">
                <Plus className="w-4 h-4" /> Add New
              </Link>
            </div>

            {addresses.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-ink/15 p-8 text-center">
                <p className="text-stone mb-4">You don't have any saved addresses yet.</p>
                <Link to="/addresses">
                  <Button variant="outline">Add Delivery Address</Button>
                </Link>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {addresses.map((a) => (
                  <AddressCard
                    key={a._id}
                    address={a}
                    selectable
                    selected={selectedAddressId === a._id}
                    onSelect={() => setSelectedAddressId(a._id)}
                  />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="font-display text-xl tracking-wide mb-4">COUPON</h2>
            <CouponInput subtotal={subtotal} appliedCoupon={coupon} onApply={setCoupon} onRemove={() => setCoupon(null)} />
          </section>

          {user?.walletBalance > 0 && (
            <section>
              <h2 className="font-display text-xl tracking-wide mb-4">WALLET</h2>
              <label className="flex items-center justify-between bg-white rounded-xl border border-ink/10 p-4 cursor-pointer">
                <div className="flex items-center gap-3">
                  <Wallet className="w-5 h-5 text-amber-500" />
                  <div>
                    <p className="text-sm font-semibold">Use wallet balance</p>
                    <p className="text-xs text-stone">₹{user.walletBalance.toLocaleString("en-IN")} available</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={useWallet}
                  onChange={(e) => setUseWallet(e.target.checked)}
                  className="w-5 h-5 rounded accent-trail-500"
                />
              </label>
            </section>
          )}

          <div className="flex items-center gap-2 text-xs text-stone">
            <ShieldCheck className="w-4 h-4 text-trail-600 shrink-0" />
            Payments are processed securely by Razorpay. TeenRaah never stores your card details.
          </div>
        </div>

        <div>
          <div className="sticky top-24 space-y-4">
            <OrderSummary
              items={items}
              itemsTotal={subtotal}
              discount={discount}
              deliveryFee={previewDeliveryFee}
              walletUsed={previewWalletUsed}
              total={previewTotal}
            />
            <Button
              variant="dark"
              size="lg"
              className="w-full"
              onClick={handlePlaceOrder}
              loading={placingOrder}
              disabled={addresses.length === 0}
            >
              Pay ₹{previewTotal.toLocaleString("en-IN")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
