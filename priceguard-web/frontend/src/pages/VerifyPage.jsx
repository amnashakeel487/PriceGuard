import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import { api, ApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function VerifyPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const email = location.state?.email;

  useEffect(() => { if (!email) navigate("/register", { replace: true }); }, [email, navigate]);

  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [serverError, setServerError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(evt) {
    evt.preventDefault(); setServerError(""); setSuccessMsg("");
    if (!/^\d{6}$/.test(otp)) { setOtpError("Please enter the 6-digit code from your email."); return; }
    setOtpError(""); setLoading(true);
    try {
      await api.auth.verify(email, otp);
      const me = await api.auth.me();
      login(me); navigate("/dashboard", { replace: true });
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "Verification failed. Please try again.");
    } finally { setLoading(false); }
  }

  async function handleResend() {
    setServerError(""); setSuccessMsg(""); setLoading(true);
    try {
      await api.auth.resendOtp(email);
      setSuccessMsg("A new verification code has been sent to your email.");
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "Could not resend code. Please try again.");
    } finally { setLoading(false); }
  }

  if (!email) return null;

  return (
    <AuthLayout title="Check your email" subtitle={`We sent a 6-digit code to ${email}`}>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-[12.5px] font-medium" style={{ color: "var(--text-secondary)" }}>
            Verification code
          </label>
          <input type="text" inputMode="numeric" maxLength={6} autoComplete="one-time-code"
            className="input-field text-center text-lg tracking-[0.35em]" placeholder="000000"
            value={otp}
            onChange={(e) => { setOtp(e.target.value.replace(/\D/g,"").slice(0,6)); setOtpError(""); }} />
          {otpError && <p className="mt-1 text-[11.5px]" style={{ color: "var(--rose)" }}>{otpError}</p>}
        </div>

        {successMsg && (
          <p className="rounded-lg px-3 py-2.5 text-[12.5px]" style={{ backgroundColor: "var(--teal-tint)", color: "var(--teal-light)" }}>
            {successMsg}
          </p>
        )}
        {!successMsg && serverError && (
          <p className="rounded-lg px-3 py-2.5 text-[12.5px]" style={{ backgroundColor: "var(--rose-tint)", color: "var(--rose)" }}>
            {serverError}
          </p>
        )}

        <button type="submit" className="btn-primary mt-1 w-full" disabled={loading}>
          {loading && <Loader2 size={15} className="animate-spin" />}
          {loading ? "Verifying…" : "Verify email"}
        </button>
      </form>

      <p className="mt-5 text-center text-[12.5px]" style={{ color: "var(--text-muted)" }}>
        Didn't get a code?{" "}
        <button type="button" disabled={loading} onClick={handleResend}
          className="font-medium disabled:opacity-50"
          style={{ color: "var(--indigo-light)", background: "none", border: "none", cursor: "pointer" }}>
          Resend code
        </button>
      </p>
    </AuthLayout>
  );
}
