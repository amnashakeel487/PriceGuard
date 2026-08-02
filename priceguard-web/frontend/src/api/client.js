const BASE_URL = "";  // Vite proxy rewrites /api → http://localhost:8000/api

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",   // always send the pg_user session cookie
    ...options,
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {
      /* no JSON body */
    }
    throw new ApiError(detail, res.status);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // ── Auth ──────────────────────────────────────────────────────────────
  auth: {
    register: (email, password) =>
      request("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    verify: (email, otp) =>
      request("/api/auth/verify", {
        method: "POST",
        body: JSON.stringify({ email, otp }),
      }),
    resendOtp: (email) =>
      request("/api/auth/resend-otp", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),
    login: (email, password) =>
      request("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    me: () => request("/api/auth/me"),
    logout: () => request("/api/auth/logout", { method: "POST" }),
    changePassword: (current_password, new_password) =>
      request("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ current_password, new_password }),
      }),
  },

  // ── Products ──────────────────────────────────────────────────────────
  listProducts: () => request("/api/products"),
  addProduct: (url, target_price) =>
    request("/api/products", { method: "POST", body: JSON.stringify({ url, target_price }) }),
  deleteProduct: (url) =>
    request(`/api/products?url=${encodeURIComponent(url)}`, { method: "DELETE" }),
  updateProduct: (url, target_price) =>
    request(`/api/products?url=${encodeURIComponent(url)}`, {
      method: "PATCH",
      body: JSON.stringify({ target_price }),
    }),
  productHistory: (url) => request(`/api/products/history?url=${encodeURIComponent(url)}`),
  checkProductNow: (url) => request(`/api/products/check?url=${encodeURIComponent(url)}`, { method: "POST" }),

  // ── Monitor ───────────────────────────────────────────────────────────
  monitorStatus: () => request("/api/monitor/status"),
  monitorStart: () => request("/api/monitor/start", { method: "POST" }),
  monitorStop: () => request("/api/monitor/stop", { method: "POST" }),
  monitorSetInterval: (seconds) =>
    request("/api/monitor/interval", { method: "POST", body: JSON.stringify({ interval_seconds: seconds }) }),
  monitorCheckNow: () => request("/api/monitor/check-now", { method: "POST" }),

  // ── Stats + Alerts ────────────────────────────────────────────────────
  getStats: () => request("/api/stats"),
  listAlerts: (limit = 50) => request(`/api/alerts?limit=${limit}`),
  unreadAlertCount: () => request("/api/alerts/unread-count"),
  markAlertRead: (id) => request(`/api/alerts/${id}/read`, { method: "PATCH" }),
  markAllAlertsRead: () => request("/api/alerts/mark-all-read", { method: "POST" }),
};

export { ApiError };
