import { useEffect, useState, useCallback } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";

// Pages
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Analytics from "./pages/Analytics";
import Alerts from "./pages/Alerts";
import Settings from "./pages/Settings";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import VerifyPage from "./pages/VerifyPage";

import { useAuth } from "./context/AuthContext";
import { api } from "./api/client";

// ── Page metadata for the Topbar ──────────────────────────────────────────
const PAGE_META = {
  "/dashboard": { title: "Dashboard", subtitle: "Welcome back, here's what's happening today." },
  "/products": { title: "Products", subtitle: "Manage everything you're tracking." },
  "/analytics": { title: "Analytics", subtitle: "Trends, reports, and insights." },
  "/alerts": { title: "Alerts", subtitle: "Every price change, in one place." },
  "/settings": { title: "Settings", subtitle: "Control the monitoring bot." },
};

// ── Simple page transition wrapper ───────────────────────────────────────
function AnimatedPage({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

// ── Full-screen spinner shown while /me is in-flight ──────────────────────
function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: "var(--bg)" }}>
      <Loader2 size={28} className="animate-spin" style={{ color: "var(--indigo-light)" }} />
    </div>
  );
}

// ── Shell wrapping all dashboard pages ────────────────────────────────────
function DashboardShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [monitorRunning, setMonitorRunning] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const location = useLocation();
  const meta = PAGE_META[location.pathname] || PAGE_META["/dashboard"];

  const refreshAlertCount = useCallback(async () => {
    try {
      const unread = await api.unreadAlertCount();
      setAlertCount(unread.count);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const poll = async () => {
      try {
        const [status, unread] = await Promise.all([
          api.monitorStatus(),
          api.unreadAlertCount(),
        ]);
        setMonitorRunning(status.running);
        setAlertCount(unread.count);
      } catch {
        /* backend not reachable yet */
      }
    };
    poll();
    const t = setInterval(poll, 10000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar
          title={meta.title}
          subtitle={meta.subtitle}
          onMenu={() => setMobileOpen(true)}
          monitorRunning={monitorRunning}
          alertCount={alertCount}
          onAlertCountChange={refreshAlertCount}
        />
        <main className="flex-1">
          <Routes>
            <Route path="dashboard" element={<AnimatedPage><Dashboard /></AnimatedPage>} />
            <Route path="products"  element={<AnimatedPage><Products /></AnimatedPage>} />
            <Route path="analytics" element={<AnimatedPage><Analytics /></AnimatedPage>} />
            <Route path="alerts"    element={<AnimatedPage><Alerts /></AnimatedPage>} />
            <Route path="settings"  element={<AnimatedPage><Settings /></AnimatedPage>} />
            <Route path="*"         element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

// ── Auth guard: protects dashboard routes ─────────────────────────────────
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// ── Public-only guard: redirects already-authenticated users ──────────────
function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

// ── Root App ──────────────────────────────────────────────────────────────
export default function App() {
  const { loading } = useAuth();

  // Hold off rendering any routes until auth state is known.
  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<PublicOnlyRoute><LandingPage /></PublicOnlyRoute>} />
      <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
      <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
      {/* Verify is semi-public: accessible pre-login but requires route state */}
      <Route path="/verify" element={<VerifyPage />} />

      {/* Protected dashboard routes — nested under /* so DashboardShell can use relative <Routes> */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <DashboardShell />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
