import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Plus, ExternalLink, Trash2, RefreshCw, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "../api/client";
import GlassCard from "../components/GlassCard";
import AddProductModal from "../components/AddProductModal";

function Badge({ belowTarget, alertSent }) {
  if (belowTarget) return (
    <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-medium"
      style={{ backgroundColor: "var(--emerald-tint)", color: "var(--emerald-light)", borderColor: "rgba(52,211,153,0.2)" }}>
      ✅ Target reached
    </span>
  );
  if (alertSent) return (
    <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-medium"
      style={{ backgroundColor: "var(--violet-tint)", color: "var(--indigo-light)", borderColor: "rgba(129,140,248,0.2)" }}>
      📬 Alert sent
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-medium"
      style={{ backgroundColor: "var(--violet-tint)", color: "var(--indigo-light)", borderColor: "rgba(129,140,248,0.15)" }}>
      👁 Monitoring
    </span>
  );
}

const PAGE_SIZE = 6;

export default function Products() {
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [checkingUrl, setCheckingUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  const load = async () => {
    try { setProducts(await api.listProducts()); setError(""); }
    catch { setError("Couldn't reach the PriceGuard API."); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let rows = products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
    return [...rows].sort((a, b) => sortAsc ? a.last_price - b.last_price : b.last_price - a.last_price);
  }, [products, query, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDelete = async (url) => {
    if (!confirm("Stop tracking this product?")) return;
    await api.deleteProduct(url); load();
  };
  const handleCheckNow = async (url) => {
    setCheckingUrl(url);
    try { await api.checkProductNow(url); await load(); } finally { setCheckingUrl(null); }
  };

  const belowTarget = products.filter((p) => p.below_target).length;
  const potentialSavings = products.reduce((s, p) => s + Math.max(0, p.last_price - p.target_price), 0);

  return (
    <div className="relative pb-24">
      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-4 border-b px-4 py-5 sm:grid-cols-4 sm:px-6 lg:px-8"
        style={{ borderColor: "var(--border)", background: "linear-gradient(90deg, var(--violet-tint) 0%, transparent 60%, var(--teal-tint) 100%)" }}>
        {[
          { label: "Tracked items",      value: products.length },
          { label: "At or below target", value: belowTarget, accent: "var(--emerald-light)" },
          { label: "Potential savings",  value: `Rs. ${potentialSavings.toFixed(0)}` },
          { label: "Avg. drop tracked",  value: products.length ? `${(products.reduce((s,p)=>s+p.drop_percentage,0)/products.length).toFixed(1)}%` : "0%", accent: "var(--indigo-light)" },
        ].map(({ label, value, accent }) => (
          <div key={label}>
            <p className="text-[11.5px] font-medium" style={{ color: "var(--text-muted)" }}>{label}</p>
            <p className="mt-1 text-[22px] font-bold" style={{ color: accent ?? "var(--text-primary)" }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-5 p-4 sm:p-6 lg:p-8">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-xs">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
            <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder="Search products…" className="input-field pl-9" />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setSortAsc(!sortAsc)} className="btn-ghost px-3.5 py-2.5 text-[12.5px]">
              <ArrowUpDown size={13} /> Price {sortAsc ? "↑" : "↓"}
            </button>
            <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>{filtered.length} products</span>
          </div>
        </div>

        {error && <GlassCard className="p-6 text-center"><p style={{ color: "var(--rose)" }}>{error}</p></GlassCard>}

        {!error && (
          <GlassCard className="overflow-hidden">
            {pageItems.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed m-4 px-6 py-16 text-center"
                style={{ borderColor: "var(--border-strong)" }}>
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: "var(--surface-subtle)" }}>
                  <Search size={22} style={{ color: "var(--text-muted)" }} />
                </div>
                <p className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>No products found</p>
                <p className="mt-1 text-[12.5px]" style={{ color: "var(--text-muted)" }}>Add one with the + button.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px]">
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--table-header-bg)" }}>
                        {["Product","Website","Current Price","Target Price","Difference","Status",""].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap"
                            style={{ color: "var(--text-muted)" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pageItems.map((p) => {
                        const diff = p.last_price - p.target_price;
                        return (
                          <motion.tr key={p.url} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="group transition-colors"
                            style={{ borderBottom: "1px solid var(--table-row-border)" }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--row-hover)")}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                            <td className="px-4 py-3.5">
                              <a href={p.url} target="_blank" rel="noreferrer"
                                className="block max-w-[200px] truncate text-[13px] font-medium transition-colors sm:max-w-xs"
                                style={{ color: "var(--text-primary)" }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--indigo-light)")}
                                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-primary)")}>
                                {p.name}
                              </a>
                            </td>
                            <td className="px-4 py-3.5 text-[13px]" style={{ color: "var(--text-secondary)" }}>{p.site}</td>
                            <td className="px-4 py-3.5 text-[13px] font-semibold whitespace-nowrap" style={{ color: "var(--text-primary)" }}>
                              Rs. {p.last_price.toLocaleString()}
                            </td>
                            <td className="px-4 py-3.5 text-[13px] whitespace-nowrap" style={{ color: "var(--text-secondary)" }}>
                              Rs. {p.target_price.toLocaleString()}
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <span className="text-[12.5px] font-medium"
                                style={{ color: diff <= 0 ? "var(--emerald-light)" : "var(--rose)" }}>
                                {diff <= 0 ? "✓ Reached!" : `Rs. ${diff.toLocaleString()} away`}
                              </span>
                            </td>
                            <td className="px-4 py-3.5"><Badge belowTarget={p.below_target} alertSent={p.alert_sent} /></td>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                                <button onClick={() => handleCheckNow(p.url)} title="Check now"
                                  className="rounded-lg p-2 transition"
                                  style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}
                                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--surface-subtle)")}
                                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                                  <RefreshCw size={13} className={checkingUrl === p.url ? "animate-spin" : ""} />
                                </button>
                                <a href={p.url} target="_blank" rel="noreferrer"
                                  className="rounded-lg p-2 transition"
                                  style={{ color: "var(--text-muted)" }}
                                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--surface-subtle)")}
                                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                                  <ExternalLink size={13} />
                                </a>
                                <button onClick={() => handleDelete(p.url)} title="Delete"
                                  className="rounded-lg p-2 transition"
                                  style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}
                                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--rose-tint)"; e.currentTarget.style.color = "var(--rose)"; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}>
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: "1px solid var(--border)" }}>
                    <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>Page {page} of {totalPages}</p>
                    <div className="flex items-center gap-1.5">
                      <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
                        className="rounded-lg p-1.5 transition disabled:opacity-30"
                        style={{ border: "1px solid var(--border)", color: "var(--text-secondary)", background: "none", cursor: "pointer" }}>
                        <ChevronLeft size={15} />
                      </button>
                      <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}
                        className="rounded-lg p-1.5 transition disabled:opacity-30"
                        style={{ border: "1px solid var(--border)", color: "var(--text-secondary)", background: "none", cursor: "pointer" }}>
                        <ChevronRight size={15} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </GlassCard>
        )}
      </div>

      {/* FAB */}
      <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.96 }}
        onClick={() => setModalOpen(true)}
        className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-2xl"
        style={{ background: "linear-gradient(135deg,#6366f1,#10b981)", boxShadow: "0 8px 30px -6px rgba(99,102,241,0.5)" }}>
        <Plus size={22} />
      </motion.button>

      <AddProductModal open={modalOpen} onClose={() => setModalOpen(false)} onAdded={load} />
    </div>
  );
}
