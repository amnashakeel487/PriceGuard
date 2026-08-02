import { useState } from "react";
import { X, Link2, Tag, Check, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api, ApiError } from "../api/client";

export default function AddProductModal({ open, onClose, onAdded }) {
  const [url, setUrl] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reset = () => { setUrl(""); setTargetPrice(""); setError(""); };
  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError("");
    let cleanUrl = url.trim();
    if (!cleanUrl) { setError("Product URL is required."); return; }
    if (!cleanUrl.startsWith("http")) cleanUrl = "https://" + cleanUrl;
    const price = parseFloat(targetPrice);
    if (!price || price <= 0) { setError("Enter a valid target price."); return; }
    setLoading(true);
    try {
      const product = await api.addProduct(cleanUrl, price);
      onAdded?.(product); reset(); onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Is the backend running?");
    } finally { setLoading(false); }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 backdrop-blur-sm" style={{ backgroundColor: "rgba(0,0,0,0.6)" }} onClick={handleClose} />
          <motion.form onSubmit={handleSubmit}
            initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ duration: 0.2 }}
            className="relative w-full max-w-md rounded-2xl p-6 shadow-2xl"
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border-strong)" }}>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-[16px] font-bold" style={{ color: "var(--text-primary)" }}>Add a product</h3>
                <p className="mt-0.5 text-[12px]" style={{ color: "var(--text-muted)" }}>PriceGuard will fetch the current price right away.</p>
              </div>
              <button type="button" onClick={handleClose} className="rounded-lg p-1.5 transition"
                style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--surface-subtle)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                <X size={16} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-[12px] font-medium" style={{ color: "var(--text-secondary)" }}>
                  <Link2 size={12} /> Product URL
                </label>
                <input value={url} onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://amazon.com/product/…" className="input-field" autoFocus />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-[12px] font-medium" style={{ color: "var(--text-secondary)" }}>
                  <Tag size={12} /> Target price (Rs.)
                </label>
                <input value={targetPrice} onChange={(e) => setTargetPrice(e.target.value)}
                  placeholder="0.00" type="number" step="0.01" className="input-field" />
              </div>
              {error && (
                <p className="rounded-xl px-3 py-2.5 text-[12px]" style={{ backgroundColor: "var(--rose-tint)", color: "var(--rose)" }}>
                  {error}
                </p>
              )}
            </div>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={handleClose} className="btn-ghost flex-1">Cancel</button>
              <button type="submit" disabled={loading} className="btn-primary flex-1">
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {loading ? "Fetching…" : "Save product"}
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
