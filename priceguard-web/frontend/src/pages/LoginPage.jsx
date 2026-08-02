import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import { api, ApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  function validate() {
    const e = {};
    if (!email.trim()) e.email = "Email is required.";
    if (!password) e.password = "Password is required.";
    return e;
  }

  async function handleSubmit(evt) {
    evt.preventDefault(); setServerError("");
    const fe = validate();
    if (Object.keys(fe).length) { setErrors(fe); return; }
    setErrors({}); setLoading(true);
    try {
      await api.auth.login(email.trim(), password);
      const me = await api.auth.me();
      login(me); navigate("/dashboard");
    } catch (err) {
      setServerError(err instanceof ApiError && err.status === 401 ? err.message : "Login failed. Please try again.");
    } finally { setLoading(false); }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your PriceGuard account.">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-[12.5px] font-medium" style={{ color: "var(--text-secondary)" }}>Email</label>
          <input type="email" autoComplete="email" className="input-field" placeholder="you@example.com"
            value={email} onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: "" })); }} />
          {errors.email && <p className="mt-1 text-[11.5px]" style={{ color: "var(--rose)" }}>{errors.email}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-[12.5px] font-medium" style={{ color: "var(--text-secondary)" }}>Password</label>
          <input type="password" autoComplete="current-password" className="input-field" placeholder="••••••••"
            value={password} onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: "" })); }} />
          {errors.password && <p className="mt-1 text-[11.5px]" style={{ color: "var(--rose)" }}>{errors.password}</p>}
        </div>
        {serverError && (
          <p className="rounded-lg px-3 py-2.5 text-[12.5px]" style={{ backgroundColor: "var(--rose-tint)", color: "var(--rose)" }}>
            {serverError}
          </p>
        )}
        <button type="submit" className="btn-primary mt-1 w-full" disabled={loading}>
          {loading && <Loader2 size={15} className="animate-spin" />}
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="mt-5 text-center text-[12.5px]" style={{ color: "var(--text-muted)" }}>
        Don't have an account?{" "}
        <Link to="/register" className="font-medium" style={{ color: "var(--indigo-light)" }}>Create one</Link>
      </p>
    </AuthLayout>
  );
}
