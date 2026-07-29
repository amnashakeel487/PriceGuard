import axios from "axios";

// Create Axios client pointing to versioned API prefix
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor injecting Bearer JWT token automatically
api.interceptors.request.use(
  (config) => {
    const storedUser = localStorage.getItem("pg_user");
    if (storedUser) {
      try {
        const { token } = JSON.parse(storedUser);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (e) {
        // Bad JSON
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor checking for token expiries or security errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Unauthorized API request. Cleaning user context.");

      localStorage.removeItem("pg_user");
      // Optionally redirect to login
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
