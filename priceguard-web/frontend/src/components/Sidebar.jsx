import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Package, BarChart3, Bell, Settings as SettingsIcon,
  ShieldCheck, Sparkles,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/products",  label: "Products",  icon: Package },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/alerts",    label: "Alerts",    icon: Bell },
  { to: "/settings",  label: "Settings",  icon: SettingsIcon },
];

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  return (
    <>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 backdrop-blur-sm lg:hidden"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col transition-transform duration-300 lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          backgroundColor: "var(--nav-bg)",
          borderRight: "1px solid var(--sidebar-border)",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-2.5 px-5 py-5"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl shadow-lg"
            style={{ background: "linear-gradient(135deg, #6366f1, #10b981)", boxShadow: "0 4px 14px -4px rgba(99,102,241,0.5)" }}
          >
            <ShieldCheck size={17} className="text-white" strokeWidth={2.4} />
          </div>
          <div>
            <p className="text-[14px] font-bold leading-tight" style={{ color: "var(--text-primary)" }}>PriceGuard</p>
            <p className="text-[10.5px] leading-tight" style={{ color: "var(--text-muted)" }}>Price tracker</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="mt-3 flex flex-1 flex-col gap-0.5 px-3 py-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileOpen(false)}
                className="relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-medium transition-all duration-150"
                style={({ isActive }) => isActive
                  ? { background: "linear-gradient(90deg, rgba(99,102,241,0.15), rgba(59,130,246,0.10))", color: "var(--text-primary)" }
                  : { color: "var(--text-muted)", background: "transparent" }
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="active-pill"
                        className="absolute left-0 h-6 w-1 rounded-r-full"
                        style={{ background: "linear-gradient(180deg,#818cf8,#34d399)" }}
                      />
                    )}
                    <Icon size={17} strokeWidth={2} style={{ color: isActive ? "var(--indigo-light)" : "var(--text-muted)" }} />
                    <span style={{ color: isActive ? "var(--text-primary)" : "var(--text-muted)" }}>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom promo */}
        <div
          className="m-3 rounded-2xl p-4"
          style={{ background: "linear-gradient(135deg, var(--violet-tint), var(--teal-tint))", border: "1px solid var(--border)" }}
        >
          <div className="mb-1.5 flex items-center gap-2">
            <Sparkles size={14} style={{ color: "var(--teal-light)" }} />
            <p className="text-[12px] font-semibold" style={{ color: "var(--text-primary)" }}>Monitoring bot</p>
          </div>
          <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Control the background price-check loop from the Settings page.
          </p>
        </div>
      </aside>
    </>
  );
}
