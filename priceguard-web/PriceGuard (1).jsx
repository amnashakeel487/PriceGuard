import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Package, BarChart3, Bell, Settings, Search, Moon, Sun,
  Plus, TrendingDown, TrendingUp, DollarSign, ShoppingBag, ExternalLink, X,
  ChevronDown, Filter, ArrowUpDown, Mail, Clock, User, Check, AlertCircle,
  Sparkles, ArrowRight, Globe, Zap, Trash2, MoreVertical, Menu, ChevronLeft,
  ChevronRight, Tag, ShieldCheck, LineChart as LineChartIcon, Smartphone,
  Tablet, Monitor, Github, Twitter, Linkedin, CircleDot, Target, PackageCheck,
} from "lucide-react";
import {
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const cn = (...a) => a.filter(Boolean).join(" ");

function useIsDesktop(breakpoint = 900) {
  const [isDesktop, setIsDesktop] = useState(true);
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= breakpoint);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);
  return isDesktop;
}

/* ---------------------------------- DATA ---------------------------------- */

const PRODUCTS = [
  { id: 1, name: "Sony WH-1000XM5 Headphones", site: "Amazon", emoji: "🎧", grad: "from-indigo-500 to-blue-500", price: 298.99, initial: 349.99, target: 250, status: "monitoring" },
  { id: 2, name: "Nike Air Max Pulse", site: "Nike", emoji: "👟", grad: "from-emerald-500 to-teal-500", price: 129.99, initial: 129.99, target: 100, status: "monitoring" },
  { id: 3, name: "Dyson V15 Detect Vacuum", site: "Best Buy", emoji: "🧹", grad: "from-blue-500 to-indigo-500", price: 549.99, initial: 699.99, target: 500, status: "target" },
  { id: 4, name: "Instant Pot Duo 7-in-1", site: "Walmart", emoji: "🍲", grad: "from-amber-500 to-orange-500", price: 79.99, initial: 89.99, target: 65, status: "monitoring" },
  { id: 5, name: "Apple Watch Series 10", site: "Amazon", emoji: "⌚", grad: "from-slate-400 to-slate-600", price: 379.0, initial: 399.0, target: 349, status: "monitoring" },
  { id: 6, name: "Samsung 55\" QLED TV", site: "eBay", emoji: "📺", grad: "from-indigo-500 to-purple-500", price: 649.0, initial: 899.0, target: 600, status: "target" },
  { id: 7, name: "Herman Miller Aeron Chair", site: "Target", emoji: "🪑", grad: "from-rose-500 to-red-500", price: 1195.0, initial: 1195.0, target: 950, status: "increased" },
  { id: 8, name: "Kindle Paperwhite Signature", site: "Amazon", emoji: "📖", grad: "from-emerald-500 to-green-500", price: 159.99, initial: 189.99, target: 140, status: "monitoring" },
];

const priceHistory = [
  { day: "Mon", price: 349 }, { day: "Tue", price: 342 }, { day: "Wed", price: 335 },
  { day: "Thu", price: 328 }, { day: "Fri", price: 312 }, { day: "Sat", price: 305 }, { day: "Sun", price: 298 },
];

const savingsData = [
  { month: "Feb", saved: 84 }, { month: "Mar", saved: 132 }, { month: "Apr", saved: 118 },
  { month: "May", saved: 176 }, { month: "Jun", saved: 210 }, { month: "Jul", saved: 268 },
];

const websiteDistribution = [
  { name: "Amazon", value: 38, color: "#6366f1" },
  { name: "eBay", value: 18, color: "#3b82f6" },
  { name: "Best Buy", value: 16, color: "#10b981" },
  { name: "Walmart", value: 15, color: "#f59e0b" },
  { name: "Other", value: 13, color: "#64748b" },
];

const topDiscounts = [
  { name: "TV", pct: 28 }, { name: "Chair", pct: 21 }, { name: "Vacuum", pct: 19 },
  { name: "Kindle", pct: 16 }, { name: "Headphones", pct: 15 }, { name: "Watch", pct: 5 },
];

const recentAlerts = [
  { id: 1, type: "drop", title: "Price dropped 14%", product: "Samsung 55\" QLED TV", time: "12 min ago", detail: "Now $649.00, was $899.00" },
  { id: 2, type: "target", title: "Target price reached", product: "Dyson V15 Detect Vacuum", time: "2 hours ago", detail: "Hit your target of $500.00" },
  { id: 3, type: "drop", title: "Price dropped 8%", product: "Sony WH-1000XM5 Headphones", time: "5 hours ago", detail: "Now $298.99, was $324.99" },
  { id: 4, type: "increase", title: "Price increased 3%", product: "Herman Miller Aeron Chair", time: "1 day ago", detail: "Now $1,195.00, was $1,159.00" },
  { id: 5, type: "target", title: "Target price reached", product: "Instant Pot Duo 7-in-1", time: "2 days ago", detail: "Hit your target of $65.00 briefly" },
];

const priceChanges = [
  { id: 1, name: "Samsung 55\" QLED TV", from: 899, to: 649, dir: "down" },
  { id: 2, name: "Sony WH-1000XM5", from: 349.99, to: 298.99, dir: "down" },
  { id: 3, name: "Herman Miller Aeron", from: 1159, to: 1195, dir: "up" },
  { id: 4, name: "Dyson V15 Detect", from: 699.99, to: 549.99, dir: "down" },
];

/* ------------------------------- UI ATOMS -------------------------------- */

function GlassCard({ className, children, hover = false, ...rest }) {
  return (
    <motion.div
      whileHover={hover ? { y: -3 } : undefined}
      className={cn(
        "rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl shadow-black/20",
        className
      )}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

function Badge({ status }) {
  const map = {
    monitoring: { label: "Monitoring", cls: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20" },
    target: { label: "Target reached", cls: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" },
    increased: { label: "Price increased", cls: "bg-rose-500/10 text-rose-300 border-rose-500/20" },
  };
  const m = map[status] || map.monitoring;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium", m.cls)}>
      <CircleDot className="h-3 w-3" />
      {m.label}
    </span>
  );
}

function PrimaryButton({ children, className, ...rest }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-400 hover:to-blue-400 active:scale-[0.98]",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

function GhostButton({ children, className, ...rest }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 backdrop-blur transition hover:bg-white/10 active:scale-[0.98]",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

function Skeleton({ className }) {
  return <div className={cn("animate-pulse rounded-xl bg-white/5", className)} />;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/95 px-3 py-2 text-xs text-slate-200 shadow-xl backdrop-blur">
      <p className="mb-1 text-slate-400">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-semibold text-slate-100">
          {p.name}: {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  );
};

/* -------------------------------- SIDEBAR -------------------------------- */

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "products", label: "Products", icon: Package },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "alerts", label: "Alerts", icon: Bell },
  { key: "settings", label: "Settings", icon: Settings },
];

function Sidebar({ view, setView, onLogoClick, mobileOpen, setMobileOpen, isDesktop }) {
  const visible = isDesktop || mobileOpen;
  return (
    <>
      <AnimatePresence>
        {!isDesktop && mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/10 bg-slate-950/95 backdrop-blur-xl transition-transform duration-300",
          visible ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button onClick={onLogoClick} className="flex items-center gap-2.5 px-6 py-6 text-left">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 shadow-lg shadow-indigo-500/30">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-[15px] font-bold leading-tight text-white">PriceGuard</p>
            <p className="text-[11px] leading-tight text-slate-500">Price tracker</p>
          </div>
        </button>

        <nav className="mt-4 flex flex-1 flex-col gap-1 px-3">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = view === item.key;
            return (
              <button
                key={item.key}
                onClick={() => { setView(item.key); setMobileOpen(false); }}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-gradient-to-r from-indigo-500/15 to-blue-500/10 text-white"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                )}
              >
                {active && (
                  <motion.span layoutId="active-pill" className="absolute left-0 h-6 w-1 rounded-r-full bg-gradient-to-b from-indigo-400 to-emerald-400" />
                )}
                <Icon className={cn("h-[18px] w-[18px]", active ? "text-indigo-300" : "")} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="m-3 rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-500/10 to-emerald-500/10 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <p className="text-xs font-semibold text-white">Pro plan</p>
          </div>
          <p className="mb-3 text-[11px] leading-relaxed text-slate-400">Unlock unlimited tracked products and instant alerts.</p>
          <button className="w-full rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/15">Upgrade</button>
        </div>
      </aside>
    </>
  );
}

/* -------------------------------- TOPBAR ---------------------------------- */

function Topbar({ title, subtitle, isDark, setIsDark, setMobileOpen, isDesktop }) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          {!isDesktop && (
            <button onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-slate-400 hover:bg-white/5">
              <Menu className="h-5 w-5" />
            </button>
          )}
          <div>
            <h1 className="text-lg font-bold text-white sm:text-xl">{title}</h1>
            {subtitle && <p className="hidden text-xs text-slate-500 sm:block">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative hidden md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              placeholder="Search products…"
              className="w-56 rounded-xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-500 outline-none transition focus:border-indigo-400/50 focus:bg-white/10 lg:w-72"
            />
          </div>

          <button className="relative rounded-xl border border-white/10 bg-white/5 p-2.5 text-slate-300 transition hover:bg-white/10">
            <Bell className="h-[18px] w-[18px]" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
          </button>

          <button onClick={() => setIsDark((d) => !d)} className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-slate-300 transition hover:bg-white/10">
            {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          </button>

          <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 py-1.5 pl-1.5 pr-3 transition hover:bg-white/10">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-emerald-500 text-xs font-bold text-white">A</div>
            <span className="hidden text-sm font-medium text-slate-200 sm:block">Anna</span>
            <ChevronDown className="hidden h-3.5 w-3.5 text-slate-500 sm:block" />
          </button>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------ STAT CARD --------------------------------- */

function StatCard({ icon: Icon, label, value, delta, deltaUp, grad, loading }) {
  if (loading) {
    return (
      <GlassCard className="p-5">
        <Skeleton className="mb-4 h-10 w-10" />
        <Skeleton className="mb-2 h-3 w-24" />
        <Skeleton className="h-7 w-20" />
      </GlassCard>
    );
  }
  return (
    <GlassCard hover className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br", grad)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        {delta && (
          <span className={cn("flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold", deltaUp ? "bg-emerald-500/10 text-emerald-300" : "bg-rose-500/10 text-rose-300")}>
            {deltaUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {delta}
          </span>
        )}
      </div>
      <p className="mb-1 text-xs font-medium text-slate-400">{label}</p>
      <p className="text-2xl font-bold tracking-tight text-white">{value}</p>
    </GlassCard>
  );
}

/* ------------------------------ EMPTY STATE -------------------------------- */

function EmptyState({ icon: Icon = Package, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5">
        <Icon className="h-7 w-7 text-slate-500" />
      </div>
      <p className="mb-1 text-sm font-semibold text-white">{title}</p>
      <p className="mb-5 max-w-sm text-sm text-slate-500">{subtitle}</p>
      {action}
    </div>
  );
}

/* -------------------------------- LANDING ---------------------------------- */

function Landing({ onEnter }) {
  const features = [
    { icon: LineChartIcon, title: "Price monitoring", desc: "Real-time tracking across every store you shop, checked around the clock." },
    { icon: Mail, title: "Email alerts", desc: "Get notified the instant a price drops below your target." },
    { icon: BarChart3, title: "Analytics", desc: "Understand price history and discover the best time to buy." },
    { icon: Zap, title: "Automation", desc: "Set it once — PriceGuard watches every product for you, automatically." },
    { icon: Globe, title: "Multi-website support", desc: "Amazon, eBay, Walmart, Best Buy, and hundreds more, all in one place." },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute top-1/3 right-0 h-96 w-96 rounded-full bg-emerald-600/10 blur-3xl" />
      </div>

      {/* nav */}
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 shadow-lg shadow-indigo-500/30">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <span className="text-[15px] font-bold text-white">PriceGuard</span>
        </div>
        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-400 md:flex">
          <a href="#features" className="transition hover:text-white">Features</a>
          <a href="#showcase" className="transition hover:text-white">Showcase</a>
          <a href="#footer" className="transition hover:text-white">Company</a>
        </nav>
        <div className="flex items-center gap-3">
          <button className="hidden text-sm font-medium text-slate-400 transition hover:text-white sm:block">Sign in</button>
          <PrimaryButton onClick={onEnter}>Get started <ArrowRight className="h-4 w-4" /></PrimaryButton>
        </div>
      </header>

      {/* hero */}
      <section className="relative z-10 mx-auto grid max-w-7xl items-center gap-14 px-6 pb-24 pt-12 lg:grid-cols-2 lg:px-8 lg:pt-20">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Automated e-commerce price tracker
          </div>
          <h1 className="mb-6 text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Track prices automatically.
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">Save money effortlessly.</span>
          </h1>
          <p className="mb-8 max-w-lg text-base leading-relaxed text-slate-400 sm:text-lg">
            PriceGuard watches thousands of products around the clock and alerts you the moment the price is right — so you never overpay again.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <PrimaryButton onClick={onEnter} className="px-6 py-3 text-base">
              Get started <ArrowRight className="h-4 w-4" />
            </PrimaryButton>
            <GhostButton className="px-6 py-3 text-base">See how it works</GhostButton>
          </div>
          <div className="mt-10 flex items-center gap-6 text-sm text-slate-500">
            <div><span className="font-bold text-white">12,400+</span> products tracked</div>
            <div className="h-4 w-px bg-white/10" />
            <div><span className="font-bold text-white">$2.1M</span> saved by users</div>
          </div>
        </motion.div>

        {/* product mockup illustration */}
        <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.15 }} className="relative">
          <GlassCard className="relative overflow-hidden p-5 shadow-2xl shadow-indigo-950/50">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-white">Sony WH-1000XM5</p>
              <Badge status="monitoring" />
            </div>
            <div className="mb-4 flex items-end gap-2">
              <span className="text-3xl font-bold text-white">$298.99</span>
              <span className="mb-1 text-sm text-slate-500 line-through">$349.99</span>
              <span className="mb-1 flex items-center gap-0.5 text-sm font-semibold text-emerald-400"><TrendingDown className="h-3.5 w-3.5" /> 14.6%</span>
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={priceHistory}>
                <defs>
                  <linearGradient id="heroFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="price" stroke="#818cf8" strokeWidth={2} fill="url(#heroFill)" />
              </AreaChart>
            </ResponsiveContainer>
            <div className="mt-4 flex items-center justify-between rounded-xl bg-emerald-500/10 px-3 py-2.5 text-xs font-medium text-emerald-300">
              <span className="flex items-center gap-1.5"><Target className="h-3.5 w-3.5" /> Target price $250 — close!</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </GlassCard>

          <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-6 -left-6 hidden rounded-2xl border border-white/10 bg-slate-900/90 p-4 shadow-xl backdrop-blur-xl sm:block">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15">
                <DollarSign className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Money saved</p>
                <p className="text-sm font-bold text-white">$1,284.50</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* features */}
      <section id="features" className="relative z-10 mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="mx-auto mb-14 max-w-xl text-center">
          <h2 className="mb-3 text-3xl font-bold tracking-tight text-white">Everything you need to shop smarter</h2>
          <p className="text-slate-400">A complete toolkit for tracking prices, without the manual work.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
              <GlassCard hover className="h-full p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-emerald-500/20">
                  <f.icon className="h-5 w-5 text-indigo-300" />
                </div>
                <h3 className="mb-2 text-base font-semibold text-white">{f.title}</h3>
                <p className="text-sm leading-relaxed text-slate-400">{f.desc}</p>
              </GlassCard>
            </motion.div>
          ))}
          <GlassCard className="flex flex-col justify-between bg-gradient-to-br from-indigo-500/15 to-emerald-500/10 p-6">
            <div>
              <h3 className="mb-2 text-base font-semibold text-white">Ready to start saving?</h3>
              <p className="mb-4 text-sm text-slate-400">Add your first product in under a minute.</p>
            </div>
            <PrimaryButton onClick={onEnter} className="w-fit">Get started <ArrowRight className="h-4 w-4" /></PrimaryButton>
          </GlassCard>
        </div>
      </section>

      {/* responsive showcase */}
      <section id="showcase" className="relative z-10 mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <GlassCard className="grid items-center gap-10 p-10 md:grid-cols-2">
          <div>
            <h2 className="mb-3 text-2xl font-bold text-white sm:text-3xl">Available on every screen</h2>
            <p className="text-slate-400">A polished experience whether you're at your desk, on a tablet, or checking prices on the go.</p>
          </div>
          <div className="flex items-center justify-center gap-8">
            {[{ Icon: Monitor, label: "Desktop" }, { Icon: Tablet, label: "Tablet" }, { Icon: Smartphone, label: "Mobile" }].map(({ Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                  <Icon className="h-6 w-6 text-slate-300" />
                </div>
                <span className="text-xs font-medium text-slate-500">{label}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </section>

      {/* footer */}
      <footer id="footer" className="relative z-10 border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <div className="grid gap-10 md:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-emerald-500">
                  <ShieldCheck className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-bold text-white">PriceGuard</span>
              </div>
              <p className="text-sm text-slate-500">Automated e-commerce price tracker.</p>
              <div className="mt-4 flex items-center gap-3 text-slate-500">
                <Twitter className="h-4 w-4 transition hover:text-white" />
                <Github className="h-4 w-4 transition hover:text-white" />
                <Linkedin className="h-4 w-4 transition hover:text-white" />
              </div>
            </div>
            {[
              { title: "Product", links: ["Features", "Pricing", "Integrations", "Changelog"] },
              { title: "Company", links: ["About", "Blog", "Careers", "Contact"] },
              { title: "Legal", links: ["Privacy", "Terms", "Security"] },
            ].map((col) => (
              <div key={col.title}>
                <p className="mb-4 text-sm font-semibold text-white">{col.title}</p>
                <ul className="space-y-2.5 text-sm text-slate-500">
                  {col.links.map((l) => <li key={l} className="transition hover:text-slate-300">{l}</li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-xs text-slate-600 sm:flex-row">
            <p>© 2026 PriceGuard. All rights reserved.</p>
            <p>Built for people who hate overpaying.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ------------------------------- DASHBOARD --------------------------------- */

function Dashboard({ loading }) {
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <GlassCard className="flex flex-col items-start justify-between gap-4 bg-gradient-to-r from-indigo-500/10 via-transparent to-emerald-500/10 p-5 sm:flex-row sm:items-center">
        <div>
          <p className="text-base font-semibold text-white">Welcome back, Anna</p>
          <p className="text-sm text-slate-400">21 products are being monitored right now — 2 just hit their target.</p>
        </div>
        <span className="flex shrink-0 items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Monitoring live
        </span>
      </GlassCard>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard loading={loading} icon={Package} label="Total products" value="24" delta="+3 this week" deltaUp grad="from-indigo-500 to-blue-500" />
        <StatCard loading={loading} icon={ShoppingBag} label="Being monitored" value="21" delta="87.5%" deltaUp grad="from-blue-500 to-indigo-500" />
        <StatCard loading={loading} icon={Bell} label="Alerts sent" value="146" delta="+12 today" deltaUp grad="from-emerald-500 to-teal-500" />
        <StatCard loading={loading} icon={DollarSign} label="Money saved" value="$1,284.50" delta="+$268 mo" deltaUp grad="from-emerald-500 to-green-500" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard className="p-5 lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Price history</p>
              <p className="text-xs text-slate-500">Sony WH-1000XM5 — last 7 days</p>
            </div>
            <span className="rounded-lg bg-white/5 px-2.5 py-1 text-xs text-slate-400">Weekly</span>
          </div>
          {loading ? <Skeleton className="h-64 w-full" /> : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={priceHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="day" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} domain={["dataMin - 10", "dataMax + 10"]} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="price" name="Price" stroke="#818cf8" strokeWidth={3} dot={{ fill: "#818cf8", r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </GlassCard>

        <GlassCard className="p-5">
          <p className="mb-1 text-sm font-semibold text-white">Website distribution</p>
          <p className="mb-4 text-xs text-slate-500">Where your products are tracked</p>
          {loading ? <Skeleton className="h-64 w-full" /> : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={websiteDistribution} dataKey="value" nameKey="name" innerRadius={50} outerRadius={78} paddingAngle={3}>
                    {websiteDistribution.map((entry, i) => <Cell key={i} fill={entry.color} stroke="none" />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {websiteDistribution.map((d) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                    {d.name} <span className="ml-auto font-medium text-slate-300">{d.value}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </GlassCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard className="p-5 lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Savings over time</p>
              <p className="text-xs text-slate-500">Cumulative monthly savings</p>
            </div>
          </div>
          {loading ? <Skeleton className="h-56 w-full" /> : (
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={savingsData}>
                <defs>
                  <linearGradient id="savingsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="saved" name="Saved ($)" stroke="#34d399" strokeWidth={3} fill="url(#savingsFill)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </GlassCard>

        <GlassCard className="p-5">
          <p className="mb-4 text-sm font-semibold text-white">Top discounts</p>
          {loading ? <Skeleton className="h-56 w-full" /> : (
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={topDiscounts} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} width={70} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "#ffffff08" }} />
                <Bar dataKey="pct" name="Discount %" radius={[0, 6, 6, 0]} fill="#6366f1" barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </GlassCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard className="p-5">
          <p className="mb-4 text-sm font-semibold text-white">Latest price changes</p>
          <div className="space-y-1">
            {priceChanges.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl px-2 py-2.5 transition hover:bg-white/5">
                <div className="flex items-center gap-3">
                  <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", p.dir === "down" ? "bg-emerald-500/10" : "bg-rose-500/10")}>
                    {p.dir === "down" ? <TrendingDown className="h-4 w-4 text-emerald-400" /> : <TrendingUp className="h-4 w-4 text-rose-400" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{p.name}</p>
                    <p className="text-xs text-slate-500">${p.from.toLocaleString()} → ${p.to.toLocaleString()}</p>
                  </div>
                </div>
                <span className={cn("text-sm font-semibold", p.dir === "down" ? "text-emerald-400" : "text-rose-400")}>
                  {p.dir === "down" ? "-" : "+"}{Math.abs(Math.round(((p.to - p.from) / p.from) * 100))}%
                </span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-white">Recent alerts</p>
            <span className="text-xs font-medium text-indigo-300">View all</span>
          </div>
          <div className="space-y-1">
            {recentAlerts.slice(0, 4).map((a) => (
              <div key={a.id} className="flex items-start gap-3 rounded-xl px-2 py-2.5 transition hover:bg-white/5">
                <div className={cn(
                  "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                  a.type === "drop" ? "bg-emerald-500/10" : a.type === "target" ? "bg-indigo-500/10" : "bg-rose-500/10"
                )}>
                  {a.type === "drop" ? <TrendingDown className="h-4 w-4 text-emerald-400" /> : a.type === "target" ? <Target className="h-4 w-4 text-indigo-300" /> : <TrendingUp className="h-4 w-4 text-rose-400" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{a.title}</p>
                  <p className="truncate text-xs text-slate-500">{a.product}</p>
                </div>
                <span className="shrink-0 text-xs text-slate-600">{a.time}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

/* ------------------------------- PRODUCTS ---------------------------------- */

function Products({ products, setProducts, openAdd }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const filtered = useMemo(() => {
    let list = products.filter(
      (p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.site.toLowerCase().includes(search.toLowerCase())
    );
    if (sortKey) {
      list = [...list].sort((a, b) => {
        const av = a[sortKey], bv = b[sortKey];
        if (typeof av === "number") return sortDir === "asc" ? av - bv : bv - av;
        return sortDir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
      });
    }
    return list;
  }, [products, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
    setPage(1);
  };

  const removeProduct = (id) => setProducts((prev) => prev.filter((p) => p.id !== id));

  const Th = ({ children, sortk }) => (
    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-slate-500">
      <button onClick={() => sortk && toggleSort(sortk)} className={cn("flex items-center gap-1", sortk && "hover:text-slate-300")}>
        {children} {sortk && <ArrowUpDown className="h-3 w-3" />}
      </button>
    </th>
  );

  const belowTarget = products.filter((p) => p.price <= p.target).length;
  const potentialSavings = products.reduce((sum, p) => sum + Math.max(0, p.price - p.target), 0);

  return (
    <div className="relative pb-24">
      <div className="border-b border-white/10 bg-gradient-to-r from-indigo-500/10 via-slate-900/0 to-emerald-500/10 px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs font-medium text-slate-500">Tracked items</p>
            <p className="mt-1 text-2xl font-bold text-white">{products.length}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">At or below target</p>
            <p className="mt-1 text-2xl font-bold text-emerald-400">{belowTarget}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Potential savings</p>
            <p className="mt-1 text-2xl font-bold text-white">${potentialSavings.toFixed(0)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Avg. discount tracked</p>
            <p className="mt-1 text-2xl font-bold text-indigo-300">17.4%</p>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search products or sites…"
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-500 outline-none transition focus:border-indigo-400/50 focus:bg-white/10"
          />
        </div>
        <div className="flex items-center gap-2">
          <GhostButton className="px-3.5 py-2.5"><Filter className="h-4 w-4" /> Filters</GhostButton>
          <span className="text-xs text-slate-500">{filtered.length} products</span>
        </div>
      </div>

      <GlassCard className="overflow-hidden border-slate-800 bg-slate-900/60">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No products found"
            subtitle="Try a different search, or add a new product to start tracking its price."
            action={<PrimaryButton onClick={openAdd}><Plus className="h-4 w-4" /> Add product</PrimaryButton>}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-white/10">
                  <tr>
                    <Th sortk="name">Product</Th>
                    <Th sortk="site">Website</Th>
                    <Th sortk="price">Current price</Th>
                    <Th sortk="target">Target price</Th>
                    <Th>Difference</Th>
                    <Th>Status</Th>
                    <Th>Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((p) => {
                    const diff = p.price - p.target;
                    return (
                      <tr key={p.id} className="border-b border-white/5 transition hover:bg-white/[0.03]">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-lg", p.grad)}>{p.emoji}</div>
                            <p className="max-w-[180px] truncate text-sm font-medium text-white sm:max-w-xs">{p.name}</p>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-400">{p.site}</td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-sm font-semibold text-white">${p.price.toFixed(2)}</td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-400">${p.target.toFixed(2)}</td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-sm font-medium">
                          <span className={diff <= 0 ? "text-emerald-400" : "text-amber-400"}>{diff <= 0 ? "Reached" : `$${diff.toFixed(2)} away`}</span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5"><Badge status={p.status} /></td>
                        <td className="whitespace-nowrap px-4 py-3.5">
                          <div className="flex items-center gap-1">
                            <button className="rounded-lg p-2 text-slate-500 transition hover:bg-white/10 hover:text-slate-200"><ExternalLink className="h-4 w-4" /></button>
                            <button onClick={() => removeProduct(p.id)} className="rounded-lg p-2 text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-400"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-white/10 px-4 py-3">
              <p className="text-xs text-slate-500">Page {page} of {totalPages}</p>
              <div className="flex items-center gap-1.5">
                <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-white/10 p-1.5 text-slate-400 transition hover:bg-white/10 disabled:opacity-30">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-white/10 p-1.5 text-slate-400 transition hover:bg-white/10 disabled:opacity-30">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </GlassCard>
      </div>

      <motion.button
        whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.96 }}
        onClick={openAdd}
        className="fixed bottom-6 right-6 z-20 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-emerald-500 text-white shadow-2xl shadow-indigo-500/40 lg:bottom-8 lg:right-8"
      >
        <Plus className="h-6 w-6" />
      </motion.button>
    </div>
  );
}

/* ------------------------------ ADD PRODUCT MODAL --------------------------------- */

function AddProductModal({ open, onClose, onSave }) {
  const [url, setUrl] = useState("");
  const [target, setTarget] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  const reset = () => { setUrl(""); setTarget(""); setEmail(""); setNotes(""); };

  const handleSave = () => {
    if (!url) return;
    onSave({ url, target, email, notes });
    reset();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Add product</h3>
              <button onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">Product URL</label>
                <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.amazon.com/product…"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-indigo-400/50" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">Target price</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-500">$</span>
                  <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="250.00" type="number"
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-7 pr-3.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-indigo-400/50" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">Notify email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" type="email"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-indigo-400/50" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">Notes <span className="text-slate-600">(optional)</span></label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Watching for holiday sale…"
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-indigo-400/50" />
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <GhostButton onClick={onClose} className="flex-1">Cancel</GhostButton>
              <PrimaryButton onClick={handleSave} className="flex-1"><Check className="h-4 w-4" /> Save</PrimaryButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------- ANALYTICS ---------------------------------- */

function Analytics({ loading }) {
  const [range, setRange] = useState("weekly");
  const stats = [
    { label: "Average price", value: "$412.30", icon: DollarSign, grad: "from-indigo-500 to-blue-500" },
    { label: "Lowest price", value: "$79.99", icon: TrendingDown, grad: "from-emerald-500 to-teal-500" },
    { label: "Highest price", value: "$1,195.00", icon: TrendingUp, grad: "from-rose-500 to-orange-500" },
    { label: "Avg. drop", value: "17.4%", icon: Tag, grad: "from-blue-500 to-indigo-500" },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-5">
        <div>
          <p className="text-2xl font-bold tracking-tight text-white">{range === "weekly" ? "This week's" : "This month's"} report</p>
          <p className="text-sm text-slate-500">Insights across all tracked products</p>
        </div>
        <div className="flex rounded-xl border border-white/10 bg-white/5 p-1">
          {["weekly", "monthly"].map((r) => (
            <button key={r} onClick={() => setRange(r)}
              className={cn("rounded-lg px-3.5 py-1.5 text-xs font-semibold capitalize transition", range === r ? "bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow" : "text-slate-400 hover:text-slate-200")}>
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <GlassCard className="p-5">
            <p className="mb-1 text-sm font-semibold text-white">Price trend</p>
            <p className="mb-4 text-xs text-slate-500">{range === "weekly" ? "Last 7 days" : "Last 6 months"} · all products avg.</p>
            {loading ? <Skeleton className="h-64 w-full" /> : (
              <ResponsiveContainer width="100%" height={280}>
                {range === "weekly" ? (
                  <LineChart data={priceHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="day" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="price" name="Price" stroke="#818cf8" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                ) : (
                  <AreaChart data={savingsData}>
                    <defs>
                      <linearGradient id="analyticsFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="saved" name="Saved" stroke="#818cf8" strokeWidth={3} fill="url(#analyticsFill)" />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            )}
          </GlassCard>

          <GlassCard className="p-5">
            <p className="mb-4 text-sm font-semibold text-white">Top discounts by product</p>
            {loading ? <Skeleton className="h-64 w-full" /> : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={topDiscounts}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "#ffffff08" }} />
                  <Bar dataKey="pct" name="Discount %" radius={[6, 6, 0, 0]} fill="#10b981" barSize={36} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </GlassCard>
        </div>

        <div className="space-y-4">
          <GlassCard className="divide-y divide-white/5 p-5">
            {stats.map((s) => (
              <div key={s.label} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br", s.grad)}>
                  <s.icon className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">{s.label}</p>
                  {loading ? <Skeleton className="mt-1 h-4 w-16" /> : <p className="text-sm font-bold text-white">{s.value}</p>}
                </div>
              </div>
            ))}
          </GlassCard>

          <GlassCard className="p-5">
            <p className="mb-4 text-sm font-semibold text-white">Website distribution</p>
            {loading ? <Skeleton className="h-48 w-full" /> : (
              <>
                <ResponsiveContainer width="100%" height={170}>
                  <PieChart>
                    <Pie data={websiteDistribution} dataKey="value" nameKey="name" innerRadius={42} outerRadius={68} paddingAngle={3}>
                      {websiteDistribution.map((entry, i) => <Cell key={i} fill={entry.color} stroke="none" />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-3 space-y-1.5">
                  {websiteDistribution.map((d) => (
                    <div key={d.name} className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                      {d.name} <span className="ml-auto font-medium text-slate-300">{d.value}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- ALERTS ----------------------------------- */

function Alerts({ loading }) {
  const [filter, setFilter] = useState("all");
  const filtered = recentAlerts.filter((a) => filter === "all" || a.type === filter);
  const tabs = [
    { key: "all", label: "All" },
    { key: "drop", label: "Price drops" },
    { key: "target", label: "Target reached" },
    { key: "increase", label: "Price increases" },
  ];

  return (
    <div className="space-y-5 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setFilter(t.key)}
            className={cn("rounded-xl border px-3.5 py-2 text-xs font-semibold transition",
              filter === t.key ? "border-indigo-400/30 bg-indigo-500/15 text-indigo-300" : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10")}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Bell} title="No alerts yet" subtitle="You'll see price-drop and target alerts here as soon as they happen." />
      ) : (
        <div className="relative pl-9">
          <div className="absolute bottom-2 left-[15px] top-2 w-px bg-gradient-to-b from-indigo-500/40 via-white/10 to-transparent" />
          <div className="space-y-6">
            {filtered.map((a) => (
              <div key={a.id} className="relative">
                <div className={cn(
                  "absolute -left-9 top-0.5 flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-slate-950",
                  a.type === "drop" ? "bg-emerald-500/15" : a.type === "target" ? "bg-indigo-500/15" : "bg-rose-500/15"
                )}>
                  {a.type === "drop" ? <TrendingDown className="h-4 w-4 text-emerald-400" /> : a.type === "target" ? <Target className="h-4 w-4 text-indigo-300" /> : <TrendingUp className="h-4 w-4 text-rose-400" />}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-white">{a.title}</p>
                  <span className="flex items-center gap-1 text-xs text-slate-500"><Clock className="h-3 w-3" /> {a.time}</span>
                </div>
                <p className="text-sm text-slate-400">{a.product}</p>
                <p className="mt-1 text-xs text-slate-500">{a.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------- SETTINGS ----------------------------------- */

function Toggle({ checked, onChange }) {
  return (
    <button onClick={() => onChange(!checked)}
      className={cn("relative h-6 w-11 shrink-0 rounded-full transition", checked ? "bg-gradient-to-r from-indigo-500 to-blue-500" : "bg-white/10")}>
      <motion.span layout transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow", checked ? "left-[22px]" : "left-0.5")} />
    </button>
  );
}

function SettingsRow({ icon: Icon, title, desc, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5"><Icon className="h-4 w-4 text-slate-400" /></div>
        <div>
          <p className="text-sm font-medium text-white">{title}</p>
          {desc && <p className="text-xs text-slate-500">{desc}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function SettingsPage({ isDark, setIsDark }) {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [interval_, setInterval_] = useState("1 hour");
  const [section, setSection] = useState("profile");

  const sections = [
    { key: "profile", label: "Profile", icon: User },
    { key: "email", label: "Email settings", icon: Mail },
    { key: "monitoring", label: "Monitoring", icon: Clock },
    { key: "appearance", label: "Appearance", icon: isDark ? Moon : Sun },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="flex gap-1.5 overflow-x-auto lg:flex-col lg:overflow-visible">
          {sections.map((s) => (
            <button
              key={s.key}
              onClick={() => setSection(s.key)}
              className={cn(
                "flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition lg:shrink",
                section === s.key ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              )}
            >
              <s.icon className="h-4 w-4" /> {s.label}
            </button>
          ))}
        </nav>

        <GlassCard className="max-w-2xl p-6">
          {section === "profile" && (
            <>
              <p className="mb-5 text-sm font-semibold text-white">Profile</p>
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-emerald-500 text-xl font-bold text-white">A</div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">Anna</p>
                  <p className="text-xs text-slate-500">Student · app design & development</p>
                </div>
                <GhostButton className="px-3.5 py-2 text-xs">Edit</GhostButton>
              </div>
            </>
          )}

          {section === "email" && (
            <div className="divide-y divide-white/5">
              <p className="pb-2 text-sm font-semibold text-white">Email settings</p>
              <SettingsRow icon={Mail} title="Email alerts" desc="Get notified by email on price drops">
                <Toggle checked={emailAlerts} onChange={setEmailAlerts} />
              </SettingsRow>
              <SettingsRow icon={PackageCheck} title="Weekly digest" desc="A summary of tracked products every Monday">
                <Toggle checked={weeklyDigest} onChange={setWeeklyDigest} />
              </SettingsRow>
            </div>
          )}

          {section === "monitoring" && (
            <div className="divide-y divide-white/5">
              <p className="pb-2 text-sm font-semibold text-white">Monitoring</p>
              <SettingsRow icon={Clock} title="Check interval" desc="How often PriceGuard checks for price changes">
                <select value={interval_} onChange={(e) => setInterval_(e.target.value)}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 outline-none focus:border-indigo-400/50">
                  {["15 minutes", "1 hour", "6 hours", "24 hours"].map((o) => <option key={o} value={o} className="bg-slate-900">{o}</option>)}
                </select>
              </SettingsRow>
              <SettingsRow icon={Bell} title="Push notifications" desc="Browser push notifications for instant alerts">
                <Toggle checked={pushAlerts} onChange={setPushAlerts} />
              </SettingsRow>
            </div>
          )}

          {section === "appearance" && (
            <div className="divide-y divide-white/5">
              <p className="pb-2 text-sm font-semibold text-white">Appearance</p>
              <SettingsRow icon={isDark ? Moon : Sun} title="Dark mode" desc="Switch between light and dark theme">
                <Toggle checked={isDark} onChange={setIsDark} />
              </SettingsRow>
            </div>
          )}

          <div className="mt-6 flex justify-end border-t border-white/5 pt-5">
            <PrimaryButton className="px-6"><Check className="h-4 w-4" /> Save changes</PrimaryButton>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

/* ---------------------------------- APP ------------------------------------ */

export default function App() {
  const [entered, setEntered] = useState(false);
  const [view, setView] = useState("dashboard");
  const [isDark, setIsDark] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isDesktop = useIsDesktop();
  const [products, setProducts] = useState(PRODUCTS);
  const [addOpen, setAddOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 550);
    return () => clearTimeout(t);
  }, [view]);

  const handleSaveProduct = (data) => {
    const emojis = ["📦", "🛒", "💻", "🎮", "👜", "📱"];
    const grads = ["from-indigo-500 to-blue-500", "from-emerald-500 to-teal-500", "from-blue-500 to-indigo-500", "from-amber-500 to-orange-500"];
    const price = Math.round((Math.random() * 300 + 50) * 100) / 100;
    setProducts((prev) => [
      {
        id: Date.now(),
        name: data.url.replace(/^https?:\/\/(www\.)?/, "").split("/")[0] || "New product",
        site: "Custom",
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        grad: grads[Math.floor(Math.random() * grads.length)],
        price,
        initial: price,
        target: Number(data.target) || Math.round(price * 0.85),
        status: "monitoring",
      },
      ...prev,
    ]);
    setAddOpen(false);
  };

  if (!entered) return <Landing onEnter={() => setEntered(true)} />;

  const titles = {
    dashboard: ["Dashboard", "Welcome back — here's what's happening"],
    products: ["Products", "Manage everything you're tracking"],
    analytics: ["Analytics", "Deep-dive into your price data"],
    alerts: ["Alerts", "Every notification, in one place"],
    settings: ["Settings", "Manage your account and preferences"],
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
        <Sidebar view={view} setView={setView} onLogoClick={() => setEntered(false)} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} isDesktop={isDesktop} />

        <div className={isDesktop ? "pl-64" : ""}>
          <Topbar title={titles[view][0]} subtitle={titles[view][1]} isDark={isDark} setIsDark={setIsDark} setMobileOpen={setMobileOpen} isDesktop={isDesktop} />

          <AnimatePresence mode="wait">
            <motion.main
              key={view}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {view === "dashboard" && <Dashboard loading={loading} />}
              {view === "products" && <Products products={products} setProducts={setProducts} openAdd={() => setAddOpen(true)} />}
              {view === "analytics" && <Analytics loading={loading} />}
              {view === "alerts" && <Alerts loading={loading} />}
              {view === "settings" && <SettingsPage isDark={isDark} setIsDark={setIsDark} />}
            </motion.main>
          </AnimatePresence>
        </div>

        <AddProductModal open={addOpen} onClose={() => setAddOpen(false)} onSave={handleSaveProduct} />
    </div>
  );
}
