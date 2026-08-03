import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShieldCheck, ArrowRight, TrendingDown, Bell, BarChart3, Zap, Globe,
  Monitor, Tablet, Smartphone, CheckCircle, Target, ExternalLink,
} from "lucide-react";

const FEATURES = [
  { icon: TrendingDown, title: "Price monitoring",      desc: "Real-time tracking across every store you shop, checked around the clock." },
  { icon: Bell,         title: "Email alerts",          desc: "Get notified the instant a price drops below your target." },
  { icon: BarChart3,    title: "Analytics",             desc: "Understand price history and discover the best time to buy." },
  { icon: Zap,          title: "Automation",            desc: "Set it once — PriceGuard watches every product for you, automatically." },
  { icon: Globe,        title: "Multi-website support", desc: "Amazon, eBay, Walmart, Best Buy, and hundreds more, all in one place." },
];

const priceHistory = [34900,34200,33500,32800,31200,30500,29899];

function SparklineCard() {
  const W = 320, H = 120;
  const min = Math.min(...priceHistory) - 10;
  const max = Math.max(...priceHistory) + 10;
  const x = (i) => (i / (priceHistory.length - 1)) * W;
  const y = (v) => H - ((v - min) / (max - min)) * H;
  const pts = priceHistory.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const area = `${x(0)},${H} ${pts} ${x(priceHistory.length-1)},${H}`;

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: "linear-gradient(145deg,#131c2e,#0e1623)", border: "1px solid rgba(99,102,241,0.22)", boxShadow: "0 24px 60px -12px rgba(0,0,0,0.6)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div>
          <p className="text-[13px] font-medium" style={{ color: "var(--text-muted)" }}>Sony WH-1000XM5</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[28px] font-bold text-white">Rs. 29,899</span>
            <span className="text-[13px] line-through" style={{ color: "var(--text-muted)" }}>Rs. 34,999</span>
            <span className="flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold"
              style={{ backgroundColor: "rgba(16,185,129,0.12)", color: "var(--emerald-light)" }}>
              <TrendingDown size={11} /> 14.6%
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-medium"
          style={{ backgroundColor: "rgba(16,185,129,0.10)", color: "var(--emerald-light)" }}>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Monitoring
        </div>
      </div>

      {/* SVG chart */}
      <div className="px-5 pb-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 100 }}>
          <defs>
            <linearGradient id="lgFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={area} fill="url(#lgFill)" />
          <polyline points={pts} fill="none" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="0" y1={y(25000)} x2={W} y2={y(25000)} stroke="#10b981" strokeWidth="1.5" strokeDasharray="6 4" />
          <text x="6" y={y(25000)-5} fontSize="9" fill="#34d399">Target Rs.25,000</text>
        </svg>
      </div>

      {/* Money saved */}
      <div className="mx-5 mb-5 flex items-center justify-between gap-3 rounded-xl px-4 py-3"
        style={{ backgroundColor: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.14)" }}>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: "rgba(16,185,129,0.15)" }}>
            <span style={{ color: "var(--emerald-light)", fontSize: 14 }}>$</span>
          </div>
          <div>
            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Money saved</p>
            <p className="text-[14px] font-bold" style={{ color: "var(--emerald-light)" }}>Rs. 1,28,450</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium"
          style={{ backgroundColor: "rgba(16,185,129,0.10)", color: "var(--teal-light)" }}>
          <Target size={11} /> Rs.25,000 — close! <ArrowRight size={10} />
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden" style={{ backgroundColor: "var(--bg)", color: "var(--text-primary)" }}>
      {/* Fixed ambient glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full"
          style={{ background: "rgba(99,102,241,0.18)", filter: "blur(120px)" }} />
        <div className="absolute top-1/3 right-0 h-96 w-96 rounded-full"
          style={{ background: "rgba(16,185,129,0.10)", filter: "blur(120px)" }} />
      </div>

      {/* ── Navbar ───────────────────────────────────────── */}
      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
        <Link to="/" className="flex items-center gap-2.5" style={{ textDecoration: "none" }}>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl shadow-lg"
            style={{ background: "linear-gradient(135deg,#6366f1,#10b981)", boxShadow: "0 4px 14px -4px rgba(99,102,241,0.5)" }}>
            <ShieldCheck size={17} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="text-[15px] font-bold text-white">PriceGuard</span>
        </Link>

        <nav className="hidden items-center gap-8 text-[13.5px] font-medium md:flex" style={{ color: "var(--text-muted)" }}>
          {["Features","Showcase","Company"].map((l) => (
            <span key={l} className="cursor-default transition hover:text-white">{l}</span>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link to="/login" className="hidden text-[13px] font-medium transition hover:text-white sm:block"
            style={{ color: "var(--text-muted)", textDecoration: "none" }}>Sign in</Link>
          <Link to="/register" className="btn-primary flex items-center gap-1.5 text-[13px]">
            Get started <ArrowRight size={13} />
          </Link>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-14 px-5 pb-20 pt-10 sm:px-8 lg:grid-cols-2 lg:px-10 lg:pt-16">
        {/* Left */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[12px] font-medium"
            style={{ borderColor: "rgba(255,255,255,0.10)", backgroundColor: "rgba(255,255,255,0.05)", color: "var(--text-secondary)" }}>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Automated e-commerce price tracker
          </div>

          <h1 className="mb-5 text-[38px] font-extrabold leading-[1.12] tracking-tight text-white sm:text-[52px] lg:text-[58px]">
            Track prices automatically.
            <br />
            <span style={{ backgroundImage: "linear-gradient(90deg,#818cf8,#34d399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Save money effortlessly.
            </span>
          </h1>

          <p className="mb-8 max-w-lg text-[16px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
            PriceGuard watches thousands of products around the clock and alerts you the moment the price is right — so you never overpay again.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Link to="/register" className="btn-primary flex items-center gap-2 px-6 py-3 text-[15px]">
              Get started <ArrowRight size={16} />
            </Link>
            <Link to="/login" className="btn-ghost px-6 py-3 text-[15px]">
              See how it works
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-6 text-[13px]" style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "1.5rem", color: "var(--text-muted)" }}>
            <div><span className="font-bold text-white">12,400+</span> products tracked</div>
            <div className="h-4 w-px" style={{ backgroundColor: "rgba(255,255,255,0.10)" }} />
            <div><span className="font-bold text-white">Rs. 2.1Cr+</span> saved by users</div>
          </div>
        </motion.div>

        {/* Right — product card */}
        <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.15 }}
          className="relative w-full max-w-md mx-auto lg:mx-0">
          <SparklineCard />
          {/* Floating badge */}
          <motion.div animate={{ y: [0,-8,0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-5 -left-5 hidden rounded-2xl p-4 shadow-xl sm:block"
            style={{ backgroundColor: "rgba(15,22,41,0.92)", border: "1px solid rgba(255,255,255,0.10)", backdropFilter: "blur(20px)" }}>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: "rgba(16,185,129,0.15)" }}>
                <span style={{ color: "var(--emerald-light)" }}>Rs.</span>
              </div>
              <div>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Money saved</p>
                <p className="text-[14px] font-bold text-white">Rs. 1,28,450</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Features ─────────────────────────────────────── */}
      <section id="features" className="relative z-10 mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 lg:px-10">
        <div className="mb-14 text-center">
          <h2 className="text-[30px] font-bold tracking-tight text-white sm:text-[36px]">Everything you need to shop smarter</h2>
          <p className="mt-3 text-[15px]" style={{ color: "var(--text-muted)" }}>A complete toolkit for tracking prices, without the manual work.</p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.07 }}>
              <div className="h-full rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1"
                style={{ backgroundColor: "var(--surface)", border: "1px solid rgba(255,255,255,0.07)" }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.35)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}>
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{ background: "linear-gradient(135deg,rgba(99,102,241,0.2),rgba(16,185,129,0.2))" }}>
                  <f.icon size={18} style={{ color: "var(--indigo-light)" }} />
                </div>
                <h3 className="mb-2 text-[14.5px] font-semibold text-white">{f.title}</h3>
                <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-muted)" }}>{f.desc}</p>
              </div>
            </motion.div>
          ))}

          {/* CTA card */}
          <div className="flex flex-col justify-between rounded-2xl p-6"
            style={{ background: "linear-gradient(135deg,rgba(99,102,241,0.15),rgba(16,185,129,0.10))", border: "1px solid rgba(99,102,241,0.25)" }}>
            <div>
              <h3 className="mb-2 text-[15px] font-semibold text-white">Ready to start saving?</h3>
              <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>Add your first product in under a minute.</p>
            </div>
            <Link to="/register" className="btn-primary mt-5 flex items-center justify-center gap-2 text-[13px]">
              Get started <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Available on every screen ─────────────────────── */}
      <section id="showcase" className="relative z-10 mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 lg:px-10">
        <div className="flex flex-col items-start justify-between gap-8 rounded-2xl p-8 sm:flex-row sm:items-center"
          style={{ backgroundColor: "var(--surface)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="max-w-sm">
            <h2 className="text-[22px] font-bold text-white">Available on every screen</h2>
            <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
              A polished experience whether you're at your desk, on a tablet, or checking prices on the go.
            </p>
          </div>
          <div className="flex items-center gap-8">
            {[{Icon:Monitor,label:"Desktop"},{Icon:Tablet,label:"Tablet"},{Icon:Smartphone,label:"Mobile"}].map(({Icon,label})=>(
              <div key={label} className="flex flex-col items-center gap-2">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }}>
                  <Icon size={22} style={{ color: "var(--text-secondary)" }} />
                </div>
                <span className="text-[11.5px] font-medium" style={{ color: "var(--text-muted)" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────── */}
      <section className="relative z-10 mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 lg:px-10">
        <div className="relative overflow-hidden rounded-2xl px-8 py-16 text-center"
          style={{ background: "linear-gradient(135deg,rgba(99,102,241,0.20),rgba(16,185,129,0.14))", border: "1px solid rgba(99,102,241,0.28)" }}>
          <div className="pointer-events-none absolute -top-20 left-1/3 h-64 w-64 rounded-full"
            style={{ background: "rgba(99,102,241,0.15)", filter: "blur(80px)" }} />
          <h2 className="relative text-[28px] font-bold text-white sm:text-[34px]">Stop watching prices manually.</h2>
          <p className="relative mt-3 text-[15px]" style={{ color: "var(--text-muted)" }}>Join thousands of smart shoppers who never overpay.</p>
          <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/register" className="btn-primary flex items-center gap-2 px-6 py-3 text-[14px]">
              Create free account <ArrowRight size={15} />
            </Link>
            <Link to="/login" className="btn-ghost px-6 py-3 text-[14px]">Sign in</Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer id="footer" className="relative z-10 border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
          <div className="grid gap-10 md:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ background: "linear-gradient(135deg,#6366f1,#10b981)" }}>
                  <ShieldCheck size={14} className="text-white" />
                </div>
                <span className="text-[14px] font-bold text-white">PriceGuard</span>
              </div>
              <p className="text-[12.5px]" style={{ color: "var(--text-muted)" }}>Automated e-commerce price tracker.</p>
              <div className="mt-4 flex items-center gap-3" style={{ color: "var(--text-muted)" }}>
                {[ExternalLink, Globe, ExternalLink].map((Icon, i) => (
                  <Icon key={i} size={15} className="cursor-pointer transition hover:text-white" />
                ))}
              </div>
            </div>
            {[
              { title: "Product", links: ["Features","Pricing","Integrations","Changelog"] },
              { title: "Company", links: ["About","Blog","Careers","Contact"] },
              { title: "Legal",   links: ["Privacy","Terms","Security"] },
            ].map((col) => (
              <div key={col.title}>
                <p className="mb-4 text-[13px] font-semibold text-white">{col.title}</p>
                <ul className="space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l} className="cursor-default text-[12.5px] transition hover:text-white"
                      style={{ color: "var(--text-muted)" }}>{l}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 text-[12px] sm:flex-row"
            style={{ borderColor: "rgba(255,255,255,0.07)", color: "var(--text-muted)" }}>
            <p>© {new Date().getFullYear()} PriceGuard. All rights reserved.</p>
            <div className="flex items-center gap-1.5">
              <CheckCircle size={12} style={{ color: "var(--emerald-light)" }} /> All systems operational
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
