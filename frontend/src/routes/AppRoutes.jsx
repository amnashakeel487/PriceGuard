import { Routes, Route, Navigate, Link } from "react-router-dom";
import PrivateRoute from "./PrivateRoute";
import useAuth from "../hooks/useAuth";

// Inline Page Stubs to verify scaffolding works without creating fully-fledged files yet
const Layout = ({ children }) => {
  const { logout } = useAuth();
  return (
    <div className="flex h-screen w-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between">
        <div>
          <h1 className="text-xl font-bold text-brand-600 dark:text-brand-400 mb-8">PriceGuard</h1>
          <nav className="space-y-2">
            <Link to="/" className="block p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-medium">Dashboard</Link>
            <Link to="/products" className="block p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-medium">Products</Link>
            <Link to="/alerts" className="block p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-medium">Alerts</Link>
            <Link to="/settings" className="block p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-medium">Settings</Link>
          </nav>
        </div>
        <button onClick={logout} className="w-full p-3 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/20 dark:hover:bg-red-950/40 rounded-lg font-semibold transition-colors">
          Logout
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
};

const DashboardPage = () => (
  <Layout>
    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Dashboard</h2>
    <p className="text-slate-600 dark:text-slate-400 mt-2">Welcome to PriceGuard dashboard skeleton.</p>
  </Layout>
);

const ProductsPage = () => (
  <Layout>
    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Tracked Products</h2>
    <p className="text-slate-600 dark:text-slate-400 mt-2">View and add products to track.</p>
  </Layout>
);

const AlertsPage = () => (
  <Layout>
    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Alert Triggers</h2>
    <p className="text-slate-600 dark:text-slate-400 mt-2">Configure target price conditions.</p>
  </Layout>
);

const SettingsPage = () => (
  <Layout>
    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Settings</h2>
    <p className="text-slate-600 dark:text-slate-400 mt-2">Manage configurations and keys.</p>
  </Layout>
);

const LoginPage = () => {
  const { login } = useAuth();
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-100 dark:bg-slate-950 p-6">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 p-8">
        <h2 className="text-2xl font-bold text-center text-slate-800 dark:text-slate-100">Login to PriceGuard</h2>
        <button onClick={() => login("user@example.com", "password")} className="w-full mt-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-semibold transition-colors shadow-md shadow-brand-500/20">
          Sign In (Demo Auth)
        </button>
      </div>
    </div>
  );
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<div>Register Screen Stub</div>} />

      {/* Protected Routes */}
      <Route element={<PrivateRoute />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Fallback Redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
