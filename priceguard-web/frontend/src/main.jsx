import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

// Restore theme before first render to avoid flash
try {
  const dark = JSON.parse(localStorage.getItem("pg_darkMode") ?? "true");
  if (!dark) document.documentElement.classList.add("light");
} catch { /* ignore */ }

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
