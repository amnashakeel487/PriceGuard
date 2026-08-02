import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, TrendingDown, TrendingUp, Target, Clock, CheckCheck } from "lucide-react";
import { api } from "../api/client";
import GlassCard from "../components/GlassCard";

const TYPE_CFG = {
  drop:     { Icon: TrendingDown, tint: "var(--emerald-tint)", color: "var(--emerald-light)" },
  target:   { Icon: Target,       tint: "var(--violet-tint)",  color: "var(--indigo-light)"  },
  increase: { Icon: TrendingUp,   tint: "var(--rose-tint)",    color: "var(--rose)"          },
  error:    { Icon: Bell,         tint: "var(--rose-tint)",    color: "var(--rose)"          },
};

const TABS = [
  { key: "all",    label: "All"            },
  { key: "drop",   label: "Price drops"    },
  { key: "target", label: "Target reached" },
  { key: "error",  label: "Errors"         },
];

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState("all");

  const load = () => api.listAlerts(100).then(setAlerts);
  useEffect(() => { load(); }, []);

  const handleMarkAll = async () => { await api.markAllAlertsRead(); load(); };
  const handleMarkOne = async (id) => { await api.markAlertRead(id); load(); };

  const visible = filter === "all" ? alerts : alerts.filter((a) => a.type === filter);
  const sent   = alerts.filter((a) => a.success).length;
  const failed = alerts.filter((a) => !a.success).length;
  const unread = alerts.filter((a) => !a.read).length;

  return (
    <div className="space-y-5 p-4 sm:p-6 lg:p-8">
      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Total alert events",  value: alerts.length, color: "var(--text-primary)" },
          { label: "Successfully sent",   value: sent,          color: "var(--emerald-light)" },
          { label: "Failed (check .env)", value: failed,        color: "var(--rose)"          },
        ].map(({ label, value, color }) => (
          <GlassCard key={label} animate hoverable className="p-5">
            <p className="text-[26px] font-bold" style={{ color }}>{value}</p>
            <p className="mt-1 text-[12.5px]" style={{ color: "var(--text-muted)" }}>{label}</p>
          </GlassCard>
        ))}
      </div>

      {/* Filter + mark all */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setFilter(t.key)}
              className="rounded-xl px-3.5 py-2 text-[12px] font-semibold transition"
              style={filter === t.key
                ? { backgroundColor: "var(--violet-tint)", color: "var(--indigo-light)", border: "1px solid rgba(129,140,248,0.3)", cursor: "pointer" }
                : { backgroundColor: "var(--surface-subtle)", color: "var(--text-muted)", border: "1px solid var(--border)", cursor: "pointer" }}>
              {t.label}
            </button>
          ))}
        </div>
        {unread > 0 && (
          <button onClick={handleMarkAll}
            className="flex items-center gap-1.5 text-[12px] font-medium transition"
            style={{ color: "var(--teal-light)", background: "none", border: "none", cursor: "pointer" }}>
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      {/* Alert list */}
      <GlassCard className="p-5">
        <h3 className="mb-4 text-[13.5px] font-semibold" style={{ color: "var(--text-primary)" }}>
          {TABS.find((t) => t.key === filter)?.label ?? "All"}
        </h3>

        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-14 text-center"
            style={{ borderColor: "var(--border)" }}>
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: "var(--surface-subtle)" }}>
              <Bell size={20} style={{ color: "var(--text-muted)" }} />
            </div>
            <p className="text-[13.5px] font-semibold" style={{ color: "var(--text-primary)" }}>No alerts yet</p>
            <p className="mt-1 text-[12.5px]" style={{ color: "var(--text-muted)" }}>
              They'll appear here once a tracked product drops below its target price.
            </p>
          </div>
        ) : (
          <div className="relative pl-10">
            <div className="absolute bottom-2 left-[15px] top-2 w-px"
              style={{ background: "linear-gradient(to bottom, var(--violet-tint), transparent)" }} />
            <div className="space-y-4">
              <AnimatePresence>
                {visible.map((a) => {
                  const cfg = TYPE_CFG[a.type] ?? TYPE_CFG.error;
                  return (
                    <motion.div key={a.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="relative">
                      <div className="absolute -left-10 top-0.5 flex h-8 w-8 items-center justify-center rounded-full"
                        style={{ backgroundColor: cfg.tint, boxShadow: `0 0 0 4px var(--bg)` }}>
                        <cfg.Icon size={13} style={{ color: cfg.color }} />
                      </div>
                      <div className="rounded-xl p-3.5 transition"
                        style={{
                          backgroundColor: a.read ? "transparent" : "var(--violet-tint)",
                          border: "1px solid var(--border)",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--row-hover)")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = a.read ? "transparent" : "var(--violet-tint)")}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {!a.read && <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "var(--indigo-light)" }} />}
                            <p className="text-[13.5px] font-semibold" style={{ color: "var(--text-primary)" }}>{a.product_name}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--text-muted)" }}>
                              <Clock size={10} /> {a.timestamp}
                            </span>
                            <span className="rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                              style={{ backgroundColor: cfg.tint, color: cfg.color }}>
                              {a.type}
                            </span>
                            {!a.read && (
                              <button onClick={() => handleMarkOne(a.id)}
                                className="rounded px-2 py-0.5 text-[10.5px] font-medium"
                                style={{ backgroundColor: "var(--violet-tint)", color: "var(--indigo-light)", border: "none", cursor: "pointer" }}>
                                Mark read
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="mt-1.5 text-[12.5px]" style={{ color: "var(--text-muted)" }}>{a.message}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
