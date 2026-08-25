import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";
import AddressCard from "../components/address/AddressCard";
import MapPicker from "../components/address/MapPicker";
import Button from "../components/ui/Button";
import { Loader } from "../components/ui/Loader";

const emptyForm = {
  label: "Home",
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
  lat: null,
  lng: null,
};

const Addresses = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/users/addresses");
      setAddresses(data.addresses);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const openNewForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFormOpen(true);
  };

  const openEditForm = (address) => {
    setForm({ ...address });
    setEditingId(address._id);
    setFormOpen(true);
  };

  const handleMapChange = ({ lat, lng, city, state, pincode }) => {
    setForm((f) => ({ ...f, lat, lng, city: city || f.city, state: state || f.state, pincode: pincode || f.pincode }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.lat == null || form.lng == null) {
      toast.error("Please pick a location on the map");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/users/addresses/${editingId}`, form);
        toast.success("Address updated");
      } else {
        await api.post("/users/addresses", form);
        toast.success("Address saved");
      }
      setFormOpen(false);
      fetchAddresses();
    } catch (err) {
      toast.error(err.message || "Could not save address");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/users/addresses/${id}`);
      toast.success("Address removed");
      fetchAddresses();
    } catch (err) {
      toast.error(err.message || "Could not remove address");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-4xl md:text-5xl tracking-wide">MY ADDRESSES</h1>
        <Button variant="dark" icon={Plus} onClick={openNewForm}>
          Add New
        </Button>
      </div>

      {loading ? (
        <Loader />
      ) : addresses.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-ink/15">
          <p className="text-stone mb-4">No saved addresses yet.</p>
          <Button variant="outline" icon={Plus} onClick={openNewForm}>
            Add Your First Address
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-5">
          {addresses.map((a) => (
            <AddressCard key={a._id} address={a} onEdit={openEditForm} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <AnimatePresence>
        {formOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFormOpen(false)}
              className="fixed inset-0 bg-ink/50 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-[5%] bottom-[5%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg bg-paper rounded-2xl z-50 overflow-y-auto"
            >
              <div className="sticky top-0 bg-paper flex items-center justify-between p-5 border-b border-ink/10 z-10">
                <h2 className="font-display text-2xl tracking-wide">{editingId ? "EDIT ADDRESS" : "NEW ADDRESS"}</h2>
                <button onClick={() => setFormOpen(false)} aria-label="Close">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <MapPicker value={form.lat ? { lat: form.lat, lng: form.lng } : null} onChange={handleMapChange} />

                <div className="flex gap-2">
                  {["Home", "Work", "Other"].map((l) => (
                    <button
                      type="button"
                      key={l}
                      onClick={() => setForm((f) => ({ ...f, label: l }))}
                      className={`px-4 py-2 rounded-full text-sm font-semibold border-2 ${
                        form.label === l ? "border-ink bg-ink text-white" : "border-ink/15"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    required
                    placeholder="Full name"
                    value={form.fullName}
                    onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                    className="col-span-2 sm:col-span-1 px-4 py-3 rounded-xl border border-ink/15 text-sm outline-none focus:border-trail-500"
                  />
                  <input
                    required
                    placeholder="Phone number"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="col-span-2 sm:col-span-1 px-4 py-3 rounded-xl border border-ink/15 text-sm outline-none focus:border-trail-500"
                  />
                  <input
                    required
                    placeholder="House / Flat / Building"
                    value={form.line1}
                    onChange={(e) => setForm((f) => ({ ...f, line1: e.target.value }))}
                    className="col-span-2 px-4 py-3 rounded-xl border border-ink/15 text-sm outline-none focus:border-trail-500"
                  />
                  <input
                    placeholder="Landmark / Area (optional)"
                    value={form.line2}
                    onChange={(e) => setForm((f) => ({ ...f, line2: e.target.value }))}
                    className="col-span-2 px-4 py-3 rounded-xl border border-ink/15 text-sm outline-none focus:border-trail-500"
                  />
                  <input
                    required
                    placeholder="City"
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    className="px-4 py-3 rounded-xl border border-ink/15 text-sm outline-none focus:border-trail-500"
                  />
                  <input
                    required
                    placeholder="State"
                    value={form.state}
                    onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                    className="px-4 py-3 rounded-xl border border-ink/15 text-sm outline-none focus:border-trail-500"
                  />
                  <input
                    required
                    placeholder="Pincode"
                    value={form.pincode}
                    onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value }))}
                    className="col-span-2 px-4 py-3 rounded-xl border border-ink/15 text-sm outline-none focus:border-trail-500"
                  />
                </div>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.isDefault || false}
                    onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
                    className="rounded"
                  />
                  Set as default address
                </label>

                <Button type="submit" variant="dark" size="lg" className="w-full" loading={saving}>
                  {editingId ? "Update Address" : "Save Address"}
                </Button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Addresses;
