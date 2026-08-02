import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { Package, Bell, DollarSign, TrendingDown, TrendingUp, ShoppingBag, Target } from "lucide-react";
import { api } from "../api/client";
import GlassCard from "../components/GlassCard";

const PIE_COLORS = ["#6366f1", "#3b82f6", "#10b981", "#f59e0b", "#64748b"];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 text-[11.5px] shadow-xl"
      style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border-strong)" }}>
      <p style={{ color: "var(--text-muted)" }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-semibold" style={{ color: "var(--text-primary)" }}>
          {p.name}: {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  );
};

function StatCard({ label, value, icon: Icon, grad, loading }) {
  if (loading) return (
    <div className="glass-card animate-pulse p-5">
      <div className="mb-4 h-10 w-10 rounded-xl" style={{ backgroundColor: "var(--surface-subtle)" }} />
      <div className="mb-2 h-3 w-24 rounded" style={{ backgroundColor: "var(--surface-subtle)" }} />
      <div className="h-7 w-20 rounded" style={{ backgroundColor: "var(--surface-subtle)" }} />
    </div>
  );
  return (
    <GlassCard animate hoverable className="p-5">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: grad }}>
        <Icon size={18} className="text-white" strokeWidth={2} />
      </div>
      <p className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>{label}</p>
      <p className="mt-1 text-[26px] font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>{value}</p>
    </GlassCard>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const [s, p, a] = await Promise.all([api.getStats(), api.listProducts(), api.listAlerts(6)]);
      setStats(s); setProducts(p); setAlerts(a); setError("");
      if (p.length > 0) setHistory(await api.productHistory(p[0].url));
    } catch { setError("Couldn't reach the PriceGuard API. Is the backend running on port 8000?"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, []);

  const websiteData = stats ? Object.entries(stats.website_distribution).map(([name, value]) => ({ name, value })) : [];

  if (error) return (
    <div className="p-6">
      <GlassCard className="p-6 text-center">
        <p className="text-[14px] font-medium" style={{ color: "var(--rose)" }}>{error}</p>
        <p className="mt-2 text-[12.5px]" style={{ color: "var(--text-muted)" }}>
          Run: <code className="rounded px-1.5 py-0.5" style={{ backgroundColor: "var(--code-bg)" }}>uvicorn app.main:app --reload</code> in /backend
        </p>
      </GlassCard>
    </div>
  );

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Welcome banner */}
      <GlassCard className="flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center"
        style={{ background: "linear-gradient(90deg, var(--violet-tint) 0%, transparent 60%, var(--teal-tint) 100%)" }}>
        <div>
          <p className="text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>Welcome back 👋</p>
          <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
            {stats?.monitored_products ?? 0} products are being monitored right now.
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-[11.5px] font-medium"
          style={{ backgroundColor: "var(--emerald-tint)", color: "var(--emerald-light)" }}>
          <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: "var(--emerald-light)" }} />
          Monitoring live
        </span>
      </GlassCard>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard loading={loading} icon={Package}    label="Total Products"    value={stats?.total_products ?? "–"}   grad="linear-gradient(135deg,#6366f1,#3b82f6)" />
        <StatCard loading={loading} icon={ShoppingBag}label="Being Monitored"   value={stats?.monitored_products ?? "–"} grad="linear-gradient(135deg,#3b82f6,#6366f1)" />
        <StatCard loading={loading} icon={Bell}       label="Alerts Sent"       value={stats?.alerts_sent ?? "–"}       grad="linear-gradient(135deg,#10b981,#0d9488)" />
        <StatCard loading={loading} icon={DollarSign} label="Money Saved"
          value={stats ? `Rs. ${stats.money_saved.toLocaleString()}` : "–"} grad="linear-gradient(135deg,#10b981,#16a34a)" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <GlassCard className="p-5 lg:col-span-2">
          <div className="mb-1 flex items-center justify-between">
            <div>
              <p className="text-[13.5px] font-semibold" style={{ color: "var(--text-primary)" }}>Price History</p>
              <p className="text-[11.5px]" style={{ color: "var(--text-muted)" }}>
                {products[0] ? products[0].name.slice(0, 35) : "Add a product to see history"}
              </p>
            </div>
            <span className="rounded-lg px-2.5 py-1 text-[11.5px]"
              style={{ backgroundColor: "var(--surface-subtle)", color: "var(--text-muted)" }}>Weekly</span>
          </div>
          <div className="mt-4 h-64">
            {history.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history} margin={{ top: 5, right: 10, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="timestamp" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} hide={history.length > 8} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="price" name="Price" stroke="#818cf8" strokeWidth={3} dot={{ fill: "#818cf8", r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <EmptyChart text="Add a product and run a check to see its price history here." />}
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <p className="text-[13.5px] font-semibold" style={{ color: "var(--text-primary)" }}>Website Distribution</p>
          <div className="mt-4 h-44">
            {websiteData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={websiteData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={72} paddingAngle={3}>
                    {websiteData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="none" />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : <EmptyChart text="No products yet." />}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {websiteData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--text-muted)" }}>
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                {d.name} <span className="ml-auto font-medium" style={{ color: "var(--text-primary)" }}>{d.value}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Bottom */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <GlassCard className="p-5">
          <p className="mb-4 text-[13.5px] font-semibold" style={{ color: "var(--text-primary)" }}>Tracked Products</p>
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {products.slice(0, 5).map((p) => (
              <div key={p.url} className="flex items-center justify-between py-3">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>{p.name}</p>
                  <p className="text-[11.5px]" style={{ color: "var(--text-muted)" }}>{p.site}</p>
                </div>
                <div className="text-right">
                  <p className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>Rs. {p.last_price.toLocaleString()}</p>
                  <p className="flex items-center justify-end gap-0.5 text-[11px] font-medium"
                    style={{ color: p.below_target ? "var(--emerald-light)" : "var(--text-muted)" }}>
                    {p.below_target ? <TrendingDown size={10} /> : <TrendingUp size={10} />}
                    Target Rs. {p.target_price.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
            {!loading && products.length === 0 && (
              <p className="py-8 text-center text-[12.5px]" style={{ color: "var(--text-muted)" }}>
                No products yet — add one from the Products page.
              </p>
            )}
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <p className="mb-4 text-[13.5px] font-semibold" style={{ color: "var(--text-primary)" }}>Recent Alerts</p>
          <div className="space-y-1">
            {alerts.map((a) => (
              <div key={a.id} className="flex items-start gap-3 rounded-xl px-2 py-2.5 transition"
                style={{ cursor: "default" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--row-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: a.success ? "var(--emerald-tint)" : "var(--rose-tint)", color: a.success ? "var(--emerald-light)" : "var(--rose)" }}>
                  {a.success ? <Target size={13} /> : <Bell size={13} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>{a.product_name}</p>
                  <p className="truncate text-[11.5px]" style={{ color: "var(--text-muted)" }}>{a.message}</p>
                </div>
                <span className="shrink-0 text-[10.5px]" style={{ color: "var(--text-muted)" }}>{a.timestamp.split(" ")[1]}</span>
              </div>
            ))}
            {!loading && alerts.length === 0 && (
              <p className="py-8 text-center text-[12.5px]" style={{ color: "var(--text-muted)" }}>
                No alerts yet.
              </p>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function EmptyChart({ text }) {
  return <div className="flex h-full items-center justify-center text-center text-[12.5px]" style={{ color: "var(--text-muted)" }}>{text}</div>;
}
