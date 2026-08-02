import { ShieldCheck, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12"
      style={{ backgroundColor: "var(--bg)" }}>
      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full opacity-20"
          style={{ background: "#6366f1", filter: "blur(120px)" }} />
        <div className="absolute bottom-0 right-1/4 h-80 w-80 rounded-full opacity-15"
          style={{ background: "#10b981", filter: "blur(100px)" }} />
      </div>

      {/* Back to home */}
      <Link to="/" className="absolute left-5 top-5 flex items-center gap-1.5 text-[12.5px] font-medium transition-colors sm:left-8 sm:top-6"
        style={{ color: "var(--text-muted)", textDecoration: "none" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}>
        <ArrowLeft size={13} /> Back to home
      </Link>

      {/* Brand */}
      <Link to="/" className="relative z-10 mb-7 flex items-center gap-2.5" style={{ textDecoration: "none" }}>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl shadow-lg"
          style={{ background: "linear-gradient(135deg,#6366f1,#10b981)", boxShadow: "0 4px 20px -4px rgba(99,102,241,0.6)" }}>
          <ShieldCheck size={18} className="text-white" strokeWidth={2.4} />
        </div>
        <span className="text-[17px] font-bold" style={{ color: "var(--text-primary)" }}>PriceGuard</span>
      </Link>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-sm rounded-2xl p-8"
        style={{
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border-strong)",
          boxShadow: "0 24px 60px -12px rgba(0,0,0,0.4)",
        }}
      >
        <h1 className="text-[21px] font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>{title}</h1>
        {subtitle && (
          <p className="mt-1.5 text-[13px]" style={{ color: "var(--text-muted)" }}>{subtitle}</p>
        )}
        <div className="mt-6">{children}</div>
      </motion.div>
    </div>
  );
}
