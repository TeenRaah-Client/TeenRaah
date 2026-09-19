import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ScrollText } from "lucide-react";
import api from "../../api/axios";
import { Loader } from "../../components/ui/Loader";

const ACTION_COLORS = {
  "product.create": "bg-trail-50 text-trail-700",
  "product.update": "bg-trail-50 text-trail-700",
  "product.delete": "bg-rose/10 text-rose",
  "coupon.create": "bg-amber-50 text-amber-700",
  "coupon.update": "bg-amber-50 text-amber-700",
  "coupon.delete": "bg-rose/10 text-rose",
  "order.status_update": "bg-trail-50 text-trail-700",
  "review.visibility": "bg-stone/10 text-stone",
  "review.delete": "bg-rose/10 text-rose",
  "auth.admin_login": "bg-ink/5 text-ink",
  "auth.2fa_enabled": "bg-trail-50 text-trail-700",
  "auth.2fa_disabled": "bg-rose/10 text-rose",
};

const AdminAuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/admin/audit-log", { params: { page, limit: 40 } });
        setLogs(data.logs);
        setPagination(data.pagination);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [page]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-8">
        <ScrollText className="w-5 h-5 text-trail-600" />
        <h1 className="font-display text-3xl tracking-wide">AUDIT LOG</h1>
      </div>
      <p className="text-sm text-stone mb-6">Every admin action, recorded automatically — who did what, and when.</p>

      {loading ? (
        <Loader />
      ) : (
        <>
          <div className="bg-white rounded-2xl shadow-card divide-y divide-ink/6">
            {logs.map((log, i) => (
              <motion.div
                key={log._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: Math.min(i, 10) * 0.02 }}
                className="flex items-center justify-between px-5 py-3.5 text-sm"
              >
                <div className="min-w-0">
                  <p className="text-ink">{log.summary}</p>
                  <p className="text-xs text-stone">{log.adminName} · {log.adminEmail}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ACTION_COLORS[log.action] || "bg-stone/10 text-stone"}`}>
                    {log.action}
                  </span>
                  <span className="text-xs text-stone tnum w-28 text-right">
                    {new Date(log.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                  </span>
                </div>
              </motion.div>
            ))}
            {logs.length === 0 && <p className="text-center text-stone py-10">No actions recorded yet.</p>}
          </div>

          {pagination && pagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: pagination.pages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-8 h-8 rounded-full text-xs font-medium ${page === i + 1 ? "bg-ink text-white" : "border border-ink/15 hover:bg-ink/5"}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminAuditLog;
