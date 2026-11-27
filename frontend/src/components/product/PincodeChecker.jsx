import { useEffect, useState } from "react";
import { MapPin, CheckCircle2, AlertCircle, Truck } from "lucide-react";
import api from "../../api/axios";
import { SAVED_PINCODE_KEY } from "../../utils/storefront";

const formatShortDate = (iso) => {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
};

const PincodeChecker = ({ price = 0 }) => {
  const [pincode, setPincode] = useState(() => {
    try {
      return window.localStorage.getItem(SAVED_PINCODE_KEY) || "";
    } catch {
      return "";
    }
  });
  const [estimate, setEstimate] = useState(null);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const checkPincode = async (pinToCheck) => {
    const clean = String(pinToCheck || "").replace(/\D/g, "").slice(0, 6);
    if (clean.length !== 6) {
      setError("Enter a valid 6-digit Indian pincode");
      setEstimate(null);
      return;
    }

    setChecking(true);
    setError("");
    try {
      const { data } = await api.get(`/location/pincode/${clean}`, { params: { amount: price } });
      setEstimate(data.estimate);
      try {
        window.localStorage.setItem(SAVED_PINCODE_KEY, clean);
      } catch {
        // ignore storage errors
      }
    } catch (err) {
      setEstimate(null);
      setError(err.message || "Could not verify pincode right now");
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (/^[1-9][0-9]{5}$/.test(pincode)) {
      checkPincode(pincode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [price]);

  const handleSubmit = (e) => {
    e.preventDefault();
    checkPincode(pincode);
  };

  return (
    <div className="rounded-2xl bg-paper-dark/60 border border-ink/10 p-4 mb-6">
      <div className="flex items-center gap-2 mb-2.5">
        <MapPin className="w-4 h-4 text-trail-600" />
        <p className="text-xs font-bold uppercase tracking-wider text-ink">Check Delivery &amp; Shipping</p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={pincode}
          onChange={(e) => {
            setPincode(e.target.value.replace(/\D/g, "").slice(0, 6));
            if (error) setError("");
          }}
          placeholder="Enter 6-digit pincode (e.g. 400001)"
          className="flex-1 bg-white rounded-full px-4 py-2 text-sm border border-ink/15 outline-none focus:border-trail-500 tnum"
          aria-label="Delivery pincode"
        />
        <button
          type="submit"
          disabled={checking || pincode.length < 6}
          className="px-5 py-2 rounded-full bg-ink text-white text-xs font-semibold hover:bg-ink-800 transition-colors disabled:opacity-40 shrink-0"
        >
          {checking ? "Checking…" : "Check"}
        </button>
      </form>

      {error && (
        <p className="mt-2.5 flex items-center gap-1.5 text-xs text-rose font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
        </p>
      )}

      {estimate && (
        <div className="mt-3 text-xs space-y-1">
          {estimate.serviceable ? (
            <>
              <p className="flex items-center gap-1.5 font-semibold text-trail-700">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Est. delivery by {formatShortDate(estimate.earliestDeliveryDate)} – {formatShortDate(estimate.latestDeliveryDate)}
              </p>
              <p className="flex items-center gap-1.5 text-stone pl-5">
                <Truck className="w-3.5 h-3.5 shrink-0" />
                {estimate.region} ({estimate.zone}) ·{" "}
                {estimate.freeShippingEligible ? "FREE Shipping" : `₹${estimate.deliveryFee} shipping (Free over ₹${estimate.freeDeliveryThreshold})`}
              </p>
            </>
          ) : (
            <p className="flex items-center gap-1.5 text-rose font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" /> {estimate.message}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default PincodeChecker;
