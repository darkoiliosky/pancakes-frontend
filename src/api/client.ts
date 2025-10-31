import axios from "axios";
import { queryClient } from "../lib/queryClient";

// Support both VITE_ and legacy REACT_APP_ via import.meta.env (configured in vite.config.ts)
const env: any = (typeof import.meta !== "undefined" ? (import.meta as any).env : {}) || {};
const baseURL = env.VITE_API_URL || env.REACT_APP_API_URL || "http://localhost:5000";

const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Global 401 handling: clear auth and redirect to login
let isHandling401 = false;
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      if (!isHandling401) {
        isHandling401 = true;
        try {
          // Clear user and cached queries to prevent stale authorized state
          queryClient.setQueryData(["auth", "me"], null);
          await queryClient.cancelQueries();
          queryClient.clear();
        } finally {
          // Redirect to login
          const loginPath = "/login";
          if (typeof window !== "undefined") {
            try {
              sessionStorage.setItem("sessionExpired", "1");
            } catch {}
            // Avoid redirect loop if already on login
            const current = window.location.pathname;
            if (current !== loginPath) {
              window.location.assign(loginPath);
            }
          }
          // Reset flag shortly after to allow future handling
          setTimeout(() => {
            isHandling401 = false;
          }, 1000);
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
