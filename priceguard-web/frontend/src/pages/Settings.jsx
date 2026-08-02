import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Play, Square, Zap, Clock, RefreshCw, Mail, User, Moon, Sun,
  Bell, PackageCheck, Key, Check, Loader2, ShieldCheck,
} from "lucide-react";
import { api, ApiError } from "../api/client";
import GlassCard from "../components/GlassCard";
import { useAuth } from "../context/AuthContext";

/* ── Helpers ──────────────────────────────────────────────────────── */
function usePref(key, defaultVal) {
  const [val, setVal] = useState(() => {
    try { const s = localStorage.getItem(key); return s !== null ? JSON.parse(s) : defaultVal; }
    catch { return defaultVal; }
  });
  const set = (v) => { setVal(v); localStorage.setItem(key, JSON.stringify(v)); };
  return [val, set];
}

function Toggle({ checked, onChange, disabled = false }) {
  return (
    <button onClick={() => !disabled && onChange(!checked)} disabled={disabled}
      className="relative h-6 w-11 shrink-0 rounded-full transition-colors"
      style={{
        background: checked ? "linear-gradient(90deg,#6366f1,#3b82f6)" : "var(--surface-subtle-2)",
        border: "none", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
      }}>
      <motion.span layout transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow"
        style={{ left: checked ? 22 : 2 }} />
    </button>
  );
}

function SettingsRow({ icon: Icon, title, desc, children, last = false }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4"
      style={{ borderBottom: last ? "none" : "1px solid var(--border)" }}>
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ backgroundColor: "var(--surface-subtle)" }}>
          <Icon size={15} style={{ color: "var(--text-muted)" }} />
        </div>
        <div>
          <p className="text-[13.5px] font-medium" style={{ color: "var(--text-primary)" }}>{title}</p>
          {desc && <p className="text-[11.5px]" style={{ color: "var(--text-muted)" }}>{desc}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function Toast({ msg, type }) {
  if (!msg) return null;
  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      className="mb-4 flex items-center gap-2 rounded-xl px-4 py-3 text-[13px] font-medium"
      style={{
        backgroundColor: type === "success" ? "var(--emerald-tint)" : "var(--rose-tint)",
        border: `1px solid ${type === "success" ? "rgba(52,211,153,0.25)" : "rgba(248,113,113,0.25)"}`,
        color: type === "success" ? "var(--emerald-light)" : "var(--rose)",
      }}>
      {type === "success" && <Check size={14} />}
      {msg}
    </motion.div>
  );
}

/* ── Main ─────────────────────────────────────────────────────────── */
export default function Settings() {
  const { user } = useAuth();
  const [section, setSection] = useState("monitoring");

  /* Monitoring */
  const [status, setStatus] = useState(null);
  const [intervalInput, setIntervalInput] = useState(3600);
  const [busy, setBusy] = useState(false);
  const [monitorMsg, setMonitorMsg] = useState({ msg: "", type: "success" });

  const refreshStatus = async () => {
    try { const s = await api.monitorStatus(); setStatus(s); setIntervalInput(s.interval_seconds); } catch {}
  };
  useEffect(() => { refreshStatus(); const t = setInterval(refreshStatus, 5000); return () => clearInterval(t); }, []);

  const withBusy = (fn, successMsg = "") => async () => {
    setBusy(true); setMonitorMsg({ msg: "", type: "success" });
    try { await fn(); await refreshStatus(); if (successMsg) setMonitorMsg({ msg: successMsg, type: "success" }); }
    catch (e) { setMonitorMsg({ msg: e.message || "Something went wrong.", type: "error" }); }
    finally { setBusy(false); }
  };

  /* Profile / password */
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState({ msg: "", type: "success" });

  const handleChangePassword = async (e) => {
    e.preventDefault(); setPwMsg({ msg: "", type: "success" });
    if (!currentPw || !newPw || !confirmPw) { setPwMsg({ msg: "All fields are required.", type: "error" }); return; }
    if (newPw.length < 6) { setPwMsg({ msg: "New password must be at least 6 characters.", type: "error" }); return; }
    if (newPw !== confirmPw) { setPwMsg({ msg: "New passwords do not match.", type: "error" }); return; }
    setPwLoading(true);
    try {
      await api.auth.changePassword(currentPw, newPw);
      setPwMsg({ msg: "Password changed successfully.", type: "success" });
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } catch (err) {
      setPwMsg({ msg: err instanceof ApiError ? err.message : "Failed to change password.", type: "error" });
    } finally { setPwLoading(false); }
  };

  /* Email prefs */
  const [emailAlerts, setEmailAlerts] = usePref("pg_emailAlerts", true);
  const [weeklyDigest, setWeeklyDigest] = usePref("pg_weeklyDigest", false);
  const [emailMsg, setEmailMsg] = useState({ msg: "", type: "success" });

  const saveEmailPrefs = () => {
    setEmailMsg({ msg: "Email preferences saved.", type: "success" });
    setTimeout(() => setEmailMsg({ msg: "", type: "success" }), 3000);
  };

  /* Appearance */
  const [darkMode, setDarkMode] = usePref("pg_darkMode", true);
  const [pushEnabled, setPushEnabled] = usePref("pg_pushNotif", false);
  const [pushStatus, setPushStatus] = useState("");
  const [appearMsg, setAppearMsg] = useState({ msg: "", type: "success" });

  useEffect(() => {
    if (darkMode) { document.documentElement.classList.remove("light"); }
    else          { document.documentElement.classList.add("light"); }
  }, [darkMode]);

  useEffect(() => {
    if ("Notification" in window) setPushStatus(Notification.permission);
  }, []);

  const handlePushToggle = async (val) => {
    if (val && "Notification" in window) {
      const perm = await Notification.requestPermission();
      setPushStatus(perm);
      if (perm !== "granted") {
        setAppearMsg({ msg: "Browser blocked notifications. Allow them in your browser settings.", type: "error" });
        return;
      }
      new Notification("PriceGuard", { body: "Push notifications enabled!" });
    }
    setPushEnabled(val);
  };

  const saveAppearance = () => {
    setAppearMsg({ msg: "Appearance preferences saved.", type: "success" });
    setTimeout(() => setAppearMsg({ msg: "", type: "success" }), 3000);
  };

  const SECTIONS = [
    { key: "monitoring", label: "Monitoring",    icon: Clock },
    { key: "profile",    label: "Profile",       icon: User },
    { key: "email",      label: "Email settings",icon: Mail },
    { key: "appearance", label: "Appearance",    icon: darkMode ? Moon : Sun },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">

        {/* Side nav */}
        <nav className="flex gap-1.5 overflow-x-auto lg:flex-col lg:overflow-visible">
          {SECTIONS.map(({ key, label, icon: Icon }) => {
            const active = section === key;
            return (
              <button key={key} onClick={() => setSection(key)}
                className="flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-[13px] font-medium transition lg:shrink"
                style={{
                  backgroundColor: active ? "var(--surface-subtle-2)" : "transparent",
                  color: active ? "var(--text-primary)" : "var(--text-muted)",
                  border: "none", cursor: "pointer",
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = "var(--surface-subtle)"; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.backgroundColor = "transparent"; }}>
                <Icon size={15} /> {label}
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <GlassCard className="max-w-2xl p-6">

          {/* ── MONITORING ── */}
          {section === "monitoring" && (
            <div>
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>Monitoring Bot</h3>
                  <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                    Runs in the background — checks all your products on a schedule.
                  </p>
                </div>
                <span className="rounded-full px-3 py-1 text-[11.5px] font-medium"
                  style={{
                    backgroundColor: status?.running ? "var(--emerald-tint)" : "var(--surface-subtle)",
                    color: status?.running ? "var(--emerald-light)" : "var(--text-muted)",
                  }}>
                  {status?.running ? "● Running" : "○ Stopped"}
                </span>
              </div>

              <Toast msg={monitorMsg.msg} type={monitorMsg.type} />

              <div className="grid grid-cols-2 gap-3">
                <button onClick={withBusy(api.monitorStart, "Bot started.")} disabled={busy || status?.running} className="btn-primary justify-center">
                  <Play size={14} /> Start bot
                </button>
                <button onClick={withBusy(api.monitorStop, "Bot stopped.")} disabled={busy || !status?.running} className="btn-ghost justify-center">
                  <Square size={14} /> Stop bot
                </button>
              </div>

              <button onClick={withBusy(api.monitorCheckNow, "Check complete.")} disabled={busy} className="btn-ghost mt-3 w-full justify-center">
                <RefreshCw size={14} className={busy ? "animate-spin" : ""} /> Check all products now
              </button>

              {status?.last_cycle_log?.length > 0 && (
                <div className="mt-4 rounded-xl p-4 space-y-1.5"
                  style={{ backgroundColor: "var(--surface-subtle)", border: "1px solid var(--border)" }}>
                  <p className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Last cycle</p>
                  {status.last_cycle_log.map((line, i) => (
                    <p key={i} className="text-[12px]" style={{ color: "var(--text-secondary)" }}>{line}</p>
                  ))}
                </div>
              )}
              <p className="mt-3 text-[11.5px]" style={{ color: "var(--text-muted)" }}>
                Last run: {status?.last_run ?? "never"} · Next: {status?.next_run ?? "—"}
              </p>

              <div className="mt-6 pt-5" style={{ borderTop: "1px solid var(--border)" }}>
                <h4 className="mb-3 text-[13.5px] font-semibold" style={{ color: "var(--text-primary)" }}>Monitoring Interval</h4>
                <div className="flex items-center gap-3">
                  <Clock size={15} style={{ color: "var(--text-muted)" }} />
                  <input type="number" min={10} value={intervalInput}
                    onChange={(e) => setIntervalInput(Number(e.target.value))} className="input-field max-w-[130px]" />
                  <span className="text-[12.5px]" style={{ color: "var(--text-muted)" }}>seconds</span>
                  <button onClick={withBusy(() => api.monitorSetInterval(intervalInput), "Interval updated.")} disabled={busy} className="btn-ghost ml-auto">
                    <Zap size={13} /> Apply
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[[900,"15 min"],[1800,"30 min"],[3600,"1 hour"],[21600,"6 hours"]].map(([secs, label]) => (
                    <button key={secs} onClick={() => setIntervalInput(secs)}
                      className="rounded-xl px-3 py-1.5 text-[11.5px] font-medium transition"
                      style={{
                        backgroundColor: intervalInput === secs ? "var(--violet-tint)" : "var(--surface-subtle)",
                        color: intervalInput === secs ? "var(--indigo-light)" : "var(--text-secondary)",
                        border: "none", cursor: "pointer",
                      }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── PROFILE ── */}
          {section === "profile" && (
            <div>
              <h3 className="mb-5 text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>Profile</h3>
              <div className="flex items-center gap-4 rounded-xl p-4"
                style={{ backgroundColor: "var(--surface-subtle)", border: "1px solid var(--border)" }}>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-[20px] font-bold text-white"
                  style={{ background: "linear-gradient(135deg,#6366f1,#10b981)" }}>
                  {user?.email?.[0].toUpperCase() ?? "P"}
                </div>
                <div>
                  <p className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>{user?.email?.split("@")[0]}</p>
                  <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>{user?.email}</p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <ShieldCheck size={11} style={{ color: "var(--emerald-light)" }} />
                    <span className="text-[11px]" style={{ color: "var(--emerald-light)" }}>Verified account</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-5" style={{ borderTop: "1px solid var(--border)" }}>
                <div className="mb-4 flex items-center gap-2">
                  <Key size={15} style={{ color: "var(--indigo-light)" }} />
                  <h4 className="text-[13.5px] font-semibold" style={{ color: "var(--text-primary)" }}>Change Password</h4>
                </div>
                <Toast msg={pwMsg.msg} type={pwMsg.type} />
                <form onSubmit={handleChangePassword} className="space-y-3">
                  {[
                    { label: "Current password", val: currentPw, set: setCurrentPw, auto: "current-password" },
                    { label: "New password",     val: newPw,     set: setNewPw,     auto: "new-password", hint: "At least 6 characters" },
                    { label: "Confirm new password", val: confirmPw, set: setConfirmPw, auto: "new-password", hint: "Repeat new password" },
                  ].map(({ label, val, set, auto, hint }) => (
                    <div key={label}>
                      <label className="mb-1 block text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>{label}</label>
                      <input type="password" value={val} onChange={(e) => set(e.target.value)}
                        placeholder={hint ?? label} autoComplete={auto} className="input-field" />
                    </div>
                  ))}
                  <div className="flex justify-end pt-1">
                    <button type="submit" disabled={pwLoading} className="btn-primary">
                      {pwLoading ? <Loader2 size={14} className="animate-spin" /> : <Key size={14} />}
                      {pwLoading ? "Updating…" : "Update password"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ── EMAIL ── */}
          {section === "email" && (
            <div>
              <h3 className="mb-1 text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>Email settings</h3>
              <p className="mb-4 text-[12px]" style={{ color: "var(--text-muted)" }}>
                Control what emails PriceGuard sends to you.
              </p>
              <Toast msg={emailMsg.msg} type={emailMsg.type} />
              <SettingsRow icon={Mail} title="Price-drop alerts" desc="Get an email when a product drops below your target price">
                <Toggle checked={emailAlerts} onChange={setEmailAlerts} />
              </SettingsRow>
              <SettingsRow icon={PackageCheck} title="Weekly digest" desc="A summary of all tracked products every Monday" last>
                <Toggle checked={weeklyDigest} onChange={setWeeklyDigest} />
              </SettingsRow>

              <div className="mt-5 rounded-xl p-4"
                style={{ backgroundColor: "var(--violet-tint)", border: "1px solid rgba(129,140,248,0.2)" }}>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--violet-tint)" }}>
                    <Mail size={14} style={{ color: "var(--indigo-light)" }} />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>Delivery address</p>
                    <p className="mt-0.5 text-[12px]" style={{ color: "var(--text-muted)" }}>
                      All alerts are sent to your registered email:
                    </p>
                    <p className="mt-0.5 text-[12.5px] font-medium" style={{ color: "var(--indigo-light)" }}>{user?.email}</p>
                    <p className="mt-1.5 text-[11.5px]" style={{ color: "var(--text-muted)" }}>
                      SMTP credentials are configured in{" "}
                      <code className="rounded px-1 py-0.5" style={{ backgroundColor: "var(--code-bg)" }}>backend/.env</code>.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <button onClick={saveEmailPrefs} className="btn-primary px-6">
                  <Check size={14} /> Save preferences
                </button>
              </div>
            </div>
          )}

          {/* ── APPEARANCE ── */}
          {section === "appearance" && (
            <div>
              <h3 className="mb-1 text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>Appearance</h3>
              <p className="mb-4 text-[12px]" style={{ color: "var(--text-muted)" }}>
                Customize how PriceGuard looks and behaves in your browser.
              </p>
              <Toast msg={appearMsg.msg} type={appearMsg.type} />

              <SettingsRow icon={darkMode ? Moon : Sun} title="Dark mode" desc="Switch between dark and light theme">
                <Toggle checked={darkMode} onChange={setDarkMode} />
              </SettingsRow>

              <SettingsRow icon={Bell} title="Browser push notifications"
                desc={
                  pushStatus === "denied" ? "Blocked by browser — allow in site settings" :
                  pushStatus === "granted" ? "Permission granted ✓" :
                  "Get instant browser alerts when a price drops"
                } last>
                <Toggle checked={pushEnabled && pushStatus === "granted"} onChange={handlePushToggle} disabled={pushStatus === "denied"} />
              </SettingsRow>

              {pushStatus === "denied" && (
                <p className="mt-3 rounded-xl px-3 py-2.5 text-[12px]"
                  style={{ backgroundColor: "var(--rose-tint)", color: "var(--rose)" }}>
                  Push notifications are blocked. Click the lock icon in your browser address bar to allow them.
                </p>
              )}

              <div className="mt-5 flex justify-end">
                <button onClick={saveAppearance} className="btn-primary px-6">
                  <Check size={14} /> Save preferences
                </button>
              </div>
            </div>
          )}

        </GlassCard>
      </div>
    </div>
  );
}
