import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/client";

const AuthContext = createContext(null);

/**
 * Wraps the whole app. Calls GET /api/auth/me once on mount to restore
 * session state, then exposes { user, loading, login, logout, logoutError }.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // null = not logged in
  const [loading, setLoading] = useState(true); // true while /me is in-flight
  const [logoutError, setLogoutError] = useState("");

  useEffect(() => {
    api.auth.me()
      .then((data) => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(userData) {
    setUser(userData);
  }

  async function logout() {
    setLogoutError("");
    try {
      await api.auth.logout();
      setUser(null);
    } catch (err) {
      setLogoutError("Logout failed. Please try again.");
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, logoutError, setLogoutError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
