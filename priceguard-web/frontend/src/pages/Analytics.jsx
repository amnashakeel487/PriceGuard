import { useEffect, useState } from "react";
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { DollarSign, TrendingDown, TrendingUp, ArrowDownRight } from "lucide-react";
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

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [range, setRange] = useState("weekly");

  useEffect(() => {
    Promise.all([api.getStats(), api.listProducts()]).then(([s, p]) => { setStats(s); setProducts(p); });
  }, []);

  const monitored  = products.filter((p) => p.last_price > 0);
  const avgPrice   = monitored.length ? monitored.reduce((s, p) => s + p.last_price, 0) / monitored.length : 0;
  const lowest     = monitored.length ? Math.min(...monitored.map((p) => p.last_price)) : 0;
  const highest    = monitored.length ? Math.max(...monitored.map((p) => p.last_price)) : 0;
  const avgDrop    = monitored.length ? monitored.reduce((s, p) => s + p.drop_percentage, 0) / monitored.length : 0;

  const summaryStats = [
    { label: "Average Price",  value: `Rs. ${avgPrice.toLocaleString(undefined,{maximumFractionDigits:0})}`, icon: DollarSign,   grad: "linear-gradient(135deg,#6366f1,#3b82f6)" },
    { label: "Lowest Price",   value: `Rs. ${lowest.toLocaleString()}`,                                       icon: TrendingDown,  grad: "linear-gradient(135deg,#10b981,#0d9488)" },
    { label: "Highest Price",  value: `Rs. ${highest.toLocaleString()}`,                                      icon: TrendingUp,    grad: "linear-gradient(135deg,#f87171,#f59e0b)" },
    { label: "Avg. Drop",      value: `${avgDrop.toFixed(1)}%`,                                               icon: ArrowDownRight,grad: "linear-gradient(135deg,#3b82f6,#6366f1)" },
  ];

  const websiteData  = stats ? Object.entries(stats.website_distribution).map(([name, value]) => ({ name, value })) : [];
  const discountData = stats?.top_discounts.map((d) => ({ name: d.name.slice(0, 18), drop: d.drop })) ?? [];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Range toggle */}
      <div className="mb-6 flex items-center justify-between border-b pb-5" style={{ borderColor: "var(--border)" }}>
        <div>
          <p className="text-[22px] font-bold" style={{ color: "var(--text-primary)" }}>
            {range === "weekly" ? "This week's" : "This month's"} report
          </p>
          <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>Insights across all tracked products</p>
        </div>
        <div className="flex rounded-xl p-1" style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface-subtle)" }}>
          {["weekly","monthly"].map((r) => (
            <button key={r} onClick={() => setRange(r)}
              className="rounded-lg px-3.5 py-1.5 text-[12px] font-semibold capitalize transition"
              style={range === r
                ? { background: "linear-gradient(135deg,#6366f1,#3b82f6)", color: "white", border: "none", cursor: "pointer" }
                : { color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        {summaryStats.map(({ label, value, icon: Icon, grad }) => (
          <GlassCard key={label} animate hoverable className="p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: grad }}>
              <Icon size={17} className="text-white" />
            </div>
            <p className="mt-4 text-[22px] font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>{value}</p>
            <p className="mt-1 text-[12px]" style={{ color: "var(--text-muted)" }}>{label}</p>
          </GlassCard>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <GlassCard className="p-5">
            <p className="text-[13.5px] font-semibold" style={{ color: "var(--text-primary)" }}>Price trend</p>
            <p className="mb-4 text-[11.5px]" style={{ color: "var(--text-muted)" }}>Current price across all tracked products</p>
            <div className="h-64">
              {monitored.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monitored.slice(0,8).map((p) => ({ name: p.name.slice(0,12), price: p.last_price }))}>
                    <defs>
                      <linearGradient id="aFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="price" name="Price (Rs.)" stroke="#818cf8" strokeWidth={3} fill="url(#aFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <Empty text="No products tracked yet." />}
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <p className="text-[13.5px] font-semibold" style={{ color: "var(--text-primary)" }}>Top discounts by product</p>
            <p className="mb-4 text-[11.5px]" style={{ color: "var(--text-muted)" }}>% drop from highest recorded price</p>
            <div className="h-60">
              {discountData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={discountData} margin={{ top: 5, right: 10, left: -18, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} interval={0} angle={-20} textAnchor="end" height={50} />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--row-hover)" }} />
                    <Bar dataKey="drop" name="Discount %" radius={[6,6,0,0]} barSize={32}>
                      {discountData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <Empty text="Run a check on a product that has dropped to see discounts." />}
            </div>
          </GlassCard>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <GlassCard className="p-5">
            <p className="mb-3 text-[13.5px] font-semibold" style={{ color: "var(--text-primary)" }}>Quick stats</p>
            {summaryStats.map(({ label, value, icon: Icon, grad }) => (
              <div key={label} className="flex items-center gap-3 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: grad }}>
                  <Icon size={15} className="text-white" />
                </div>
                <div>
                  <p className="text-[11.5px]" style={{ color: "var(--text-muted)" }}>{label}</p>
                  <p className="text-[13.5px] font-bold" style={{ color: "var(--text-primary)" }}>{value}</p>
                </div>
              </div>
            ))}
          </GlassCard>

          <GlassCard className="p-5">
            <p className="mb-3 text-[13.5px] font-semibold" style={{ color: "var(--text-primary)" }}>Website distribution</p>
            <div className="h-44">
              {websiteData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={websiteData} dataKey="value" nameKey="name" innerRadius={42} outerRadius={66} paddingAngle={3}>
                      {websiteData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="none" />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <Empty text="No data yet." />}
            </div>
            <div className="mt-3 space-y-1.5">
              {websiteData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2 text-[11.5px]" style={{ color: "var(--text-muted)" }}>
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                  {d.name} <span className="ml-auto font-medium" style={{ color: "var(--text-primary)" }}>{d.value}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

function Empty({ text }) {
  return <div className="flex h-full items-center justify-center text-center text-[12.5px]" style={{ color: "var(--text-muted)" }}>{text}</div>;
}
