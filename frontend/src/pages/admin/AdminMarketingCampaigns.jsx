import { useEffect, useState } from "react";
import { Megaphone, Plus, RefreshCw, Trash2, FileText, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import { Loader } from "../../components/ui/Loader";

const EMPTY = {
  name: "",
  objective: "repeat_purchase",
  audienceSegment: "Champions",
  channel: "email",
  subject: "",
  message: "",
};

const OBJECTIVES = [
  ["repeat_purchase", "Encourage repeat purchase"],
  ["win_back", "Win back inactive customers"],
  ["new_customer", "Welcome new customers"],
  ["product_launch", "Product launch"],
  ["seasonal", "Seasonal promotion"],
];

const SEGMENTS = [
  ["all_purchasers", "All purchasers"],
  ["Champions", "Champions"],
  ["Loyal", "Loyal"],
  ["New", "New customers"],
  ["At Risk", "At risk"],
  ["Dormant", "Dormant"],
];

const CHANNELS = [
  ["email", "Email"],
  ["sms", "SMS"],
  ["onsite", "On-site message"],
];

const AdminMarketingCampaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [showForm, setShowForm] = useState(false);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/marketing-campaigns");
      setCampaigns(data.campaigns || []);
    } catch (error) {
      toast.error(error.message || "Could not load campaign drafts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCampaigns(); }, []);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post("/admin/marketing-campaigns", form);
      toast.success("Campaign draft saved");
      setForm(EMPTY);
      setShowForm(false);
      await fetchCampaigns();
    } catch (error) {
      toast.error(error.message || "Could not save campaign");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (campaign) => {
    if (!window.confirm(`Delete the draft “${campaign.name}”?`)) return;
    try {
      await api.delete(`/admin/marketing-campaigns/${campaign._id}`);
      toast.success("Draft deleted");
      await fetchCampaigns();
    } catch (error) {
      toast.error(error.message || "Could not delete draft");
    }
  };

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-trail-600">CUSTOMER RETENTION</p>
          <h1 className="mt-1 font-display text-3xl tracking-wide">MARKETING STUDIO</h1>
          <p className="mt-1 text-sm text-stone">Create and organize campaign drafts for your retention strategy.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchCampaigns} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-ink/10 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button onClick={() => setShowForm((value) => !value)} className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white">
            <Plus className="h-4 w-4" /> New draft
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-800" />
          <div>
            <p className="text-sm font-semibold text-amber-950">Draft-only mode</p>
            <p className="mt-1 text-xs leading-5 text-amber-900">This release does not send email or SMS, schedule campaigns, export customer contacts, or create coupons. Drafts are stored for admin review only.</p>
          </div>
        </div>
      </div>

      {showForm && (
        <form onSubmit={submit} className="rounded-2xl bg-white p-5 shadow-card md:p-6">
          <div className="mb-5 flex items-center gap-2"><Megaphone className="h-5 w-5 text-trail-700" /><h2 className="font-display text-xl">NEW CAMPAIGN DRAFT</h2></div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-xs font-semibold text-stone">Campaign name
              <input required maxLength={80} value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. November win-back" className="mt-1.5 w-full rounded-xl border border-ink/15 px-3 py-3 text-sm text-ink outline-none focus:border-trail-500" />
            </label>
            <label className="text-xs font-semibold text-stone">Objective
              <select value={form.objective} onChange={(e) => update("objective", e.target.value)} className="mt-1.5 w-full rounded-xl border border-ink/15 bg-white px-3 py-3 text-sm text-ink outline-none focus:border-trail-500">{OBJECTIVES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
            </label>
            <label className="text-xs font-semibold text-stone">Audience segment
              <select value={form.audienceSegment} onChange={(e) => update("audienceSegment", e.target.value)} className="mt-1.5 w-full rounded-xl border border-ink/15 bg-white px-3 py-3 text-sm text-ink outline-none focus:border-trail-500">{SEGMENTS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
            </label>
            <label className="text-xs font-semibold text-stone">Channel
              <select value={form.channel} onChange={(e) => update("channel", e.target.value)} className="mt-1.5 w-full rounded-xl border border-ink/15 bg-white px-3 py-3 text-sm text-ink outline-none focus:border-trail-500">{CHANNELS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
            </label>
            {form.channel === "email" && (
              <label className="text-xs font-semibold text-stone md:col-span-2">Email subject
                <input required maxLength={120} value={form.subject} onChange={(e) => update("subject", e.target.value)} placeholder="Subject line" className="mt-1.5 w-full rounded-xl border border-ink/15 px-3 py-3 text-sm text-ink outline-none focus:border-trail-500" />
              </label>
            )}
            <label className="text-xs font-semibold text-stone md:col-span-2">Message draft
              <textarea required maxLength={2000} rows={5} value={form.message} onChange={(e) => update("message", e.target.value)} placeholder="Write the campaign copy for review..." className="mt-1.5 w-full resize-y rounded-xl border border-ink/15 px-3 py-3 text-sm text-ink outline-none focus:border-trail-500" />
              <span className="mt-1 block text-right text-[11px] font-normal text-stone">{form.message.length}/2000</span>
            </label>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={() => { setShowForm(false); setForm(EMPTY); }} className="rounded-xl border border-ink/10 px-4 py-2.5 text-sm font-semibold">Cancel</button>
            <button disabled={saving} type="submit" className="rounded-xl bg-trail-700 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving..." : "Save draft"}</button>
          </div>
        </form>
      )}

      {loading ? <Loader /> : (
        <section className="grid gap-4 lg:grid-cols-2">
          {campaigns.map((campaign) => (
            <article key={campaign._id} className="rounded-2xl bg-white p-5 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-trail-50 text-trail-700"><FileText className="h-5 w-5" /></div>
                  <div className="min-w-0"><h3 className="truncate font-semibold">{campaign.name}</h3><p className="text-xs text-stone">{new Date(campaign.createdAt).toLocaleDateString("en-IN")}</p></div>
                </div>
                <button onClick={() => remove(campaign)} aria-label={`Delete ${campaign.name}`} className="rounded-lg p-2 text-stone hover:bg-rose-50 hover:text-rose-700"><Trash2 className="h-4 w-4" /></button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
                <span className="rounded-full bg-stone-100 px-3 py-1 font-semibold text-stone-700">DRAFT</span>
                <span className="rounded-full bg-trail-50 px-3 py-1 font-semibold text-trail-800">{campaign.audienceSegment.replaceAll("_", " ")}</span>
                <span className="rounded-full bg-sky-50 px-3 py-1 font-semibold text-sky-800">{campaign.channel}</span>
              </div>
              {campaign.subject && <p className="mt-3 text-sm font-semibold">{campaign.subject}</p>}
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-stone">{campaign.message}</p>
            </article>
          ))}
          {!campaigns.length && <div className="rounded-2xl border border-dashed border-ink/15 bg-white p-10 text-center lg:col-span-2"><Megaphone className="mx-auto h-8 w-8 text-stone" /><p className="mt-3 font-semibold">No campaign drafts yet</p><p className="mt-1 text-sm text-stone">Create a draft to plan your next customer-retention campaign.</p></div>}
        </section>
      )}
    </div>
  );
};

export default AdminMarketingCampaigns;
