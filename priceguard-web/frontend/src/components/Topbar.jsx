import { Menu, Bell, Circle, LogOut, CheckCircle, XCircle, X, CheckCheck } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

function AlertDropdown({ onClose, onCountChange }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = useCallback(() => {
    api.listAlerts(10).then(setAlerts).catch(() => setAlerts([])).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleMarkOne(id) {
    try { await api.markAlertRead(id); setAlerts((p) => p.map((a) => a.id === id ? { ...a, read: true } : a)); onCountChange(); } catch { }
  }
  async function handleMarkAll() {
    try { await api.markAllAlertsRead(); setAlerts((p) => p.map((a) => ({ ...a, read: true }))); onCountChange(); } catch { }
  }

  const hasUnread = alerts.some((a) => !a.read);

  return (
    <div className="absolute right-0 top-full mt-2 w-[22rem] rounded-2xl shadow-2xl z-50 overflow-hidden animate-scale-in"
      style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border-strong)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <span className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>Notifications</span>
        <div className="flex items-center gap-3">
          {hasUnread && (
            <button onClick={handleMarkAll} className="flex items-center gap-1 text-[11.5px] font-medium"
              style={{ color: "var(--teal-light)", background: "none", border: "none", cursor: "pointer" }}>
              <CheckCheck size={13} /> Mark all read
            </button>
          )}
          <button onClick={() => { navigate("/alerts"); onClose(); }} className="text-[11.5px] font-medium"
            style={{ color: "var(--indigo-light)", background: "none", border: "none", cursor: "pointer" }}>
            View all
          </button>
          <button onClick={onClose} style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}>
            <X size={14} />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-72 overflow-y-auto">
        {loading ? (
          <p className="px-4 py-6 text-center text-[12.5px]" style={{ color: "var(--text-muted)" }}>Loading…</p>
        ) : alerts.length === 0 ? (
          <p className="px-4 py-6 text-center text-[12.5px]" style={{ color: "var(--text-muted)" }}>
            No alerts yet. Add a product and run a check!
          </p>
        ) : alerts.map((a) => (
          <div key={a.id} className="flex items-start gap-3 px-4 py-3 transition-colors cursor-default"
            style={{ borderBottom: "1px solid var(--border)", backgroundColor: a.read ? "transparent" : "var(--violet-tint)" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--surface-subtle)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = a.read ? "transparent" : "var(--violet-tint)")}>
            <div className="mt-0.5 shrink-0">
              {a.success ? <CheckCircle size={14} style={{ color: "var(--emerald-light)" }} />
                         : <XCircle size={14}    style={{ color: "var(--rose)" }} />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                {!a.read && <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: "var(--indigo-light)" }} />}
                <p className="truncate text-[12.5px] font-medium" style={{ color: "var(--text-primary)" }} title={a.product_name}>
                  {a.product_name}
                </p>
              </div>
              <p className="mt-0.5 line-clamp-2 text-[11.5px] leading-relaxed" style={{ color: "var(--text-muted)" }}>{a.message}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <span className="text-[10.5px]" style={{ color: "var(--text-muted)" }}>{a.timestamp.slice(11, 16)}</span>
              {!a.read && (
                <button onClick={() => handleMarkOne(a.id)} className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                  style={{ color: "var(--indigo-light)", backgroundColor: "var(--violet-tint)", border: "none", cursor: "pointer" }}>
                  Mark read
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Topbar({ title, subtitle, onMenu, monitorRunning, alertCount, onAlertCountChange }) {
  const { user, logout, logoutError, setLogoutError } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const bellRef = useRef(null);

  async function handleLogout() { setLoggingOut(true); await logout(); setLoggingOut(false); }

  useEffect(() => {
    if (!dropdownOpen) return;
    function h(e) { if (bellRef.current && !bellRef.current.contains(e.target)) setDropdownOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [dropdownOpen]);

  const initial = user?.email ? user.email[0].toUpperCase() : "PG";

  return (
    <header className="sticky top-0 z-30 px-4 py-4 sm:px-6 lg:px-8"
      style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--topbar-bg)", backdropFilter: "blur(20px)" }}>
      <div className="flex items-center justify-between gap-4">

        {/* Left: hamburger + title */}
        <div className="flex items-center gap-3">
          <button onClick={onMenu} className="rounded-lg p-2 lg:hidden"
            style={{ color: "var(--text-secondary)", background: "none", border: "none", cursor: "pointer" }}>
            <Menu size={18} />
          </button>
          <div>
            <h1 className="text-[17px] font-bold" style={{ color: "var(--text-primary)" }}>{title}</h1>
            {subtitle && <p className="hidden text-[12px] sm:block" style={{ color: "var(--text-muted)" }}>{subtitle}</p>}
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Bot status */}
          <div className="hidden items-center gap-2 rounded-full px-3 py-1.5 text-[11.5px] font-medium sm:flex"
            style={{
              backgroundColor: monitorRunning ? "var(--emerald-tint)" : "var(--surface-subtle)",
              color: monitorRunning ? "var(--emerald-light)" : "var(--text-muted)",
            }}>
            <Circle size={7} fill="currentColor" className={monitorRunning ? "animate-pulse" : ""} />
            Bot {monitorRunning ? "running" : "stopped"}
          </div>

          {/* Bell */}
          <div className="relative" ref={bellRef}>
            <button onClick={() => setDropdownOpen((o) => !o)} title="Notifications"
              className="relative rounded-xl p-2.5 transition"
              style={{
                color: dropdownOpen ? "var(--indigo-light)" : "var(--text-secondary)",
                background: "var(--surface-subtle)", border: "1px solid var(--border)", cursor: "pointer",
              }}>
              <Bell size={17} />
              {alertCount > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full"
                  style={{ backgroundColor: "var(--emerald-light)", boxShadow: "0 0 0 2px var(--bg)" }} />
              )}
            </button>
            {dropdownOpen && <AlertDropdown onClose={() => setDropdownOpen(false)} onCountChange={onAlertCountChange} />}
          </div>

          {/* Avatar + logout */}
          {user && (
            <div className="flex items-center gap-2 rounded-xl py-1.5 pl-1.5 pr-3 transition"
              style={{ background: "var(--surface-subtle)", border: "1px solid var(--border)" }}>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-bold text-white"
                style={{ background: "linear-gradient(135deg,#6366f1,#10b981)" }} title={user.email}>
                {initial}
              </div>
              <span className="hidden text-[13px] font-medium sm:block" style={{ color: "var(--text-primary)" }}>
                {user.email.split("@")[0]}
              </span>
              <button onClick={handleLogout} disabled={loggingOut} title="Sign out"
                className="ml-1 rounded-lg p-1 transition disabled:opacity-50"
                style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--rose)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}>
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Logout error */}
      {logoutError && (
        <div className="mt-2 flex items-center justify-between rounded-xl px-3 py-2 text-[12px]"
          style={{ backgroundColor: "var(--rose-tint)", color: "var(--rose)" }}>
          {logoutError}
          <button onClick={() => setLogoutError("")} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit" }}>
            <X size={13} />
          </button>
        </div>
      )}
    </header>
  );
}
