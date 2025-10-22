import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || "";

    // 401 за проверка на сесија е очекувано – не спами конзола
    if (status === 401 && url.includes("/api/users/me")) {
      return Promise.reject(error);
    }

    // Логирај само серверски грешки (500+)
    if (!status || status >= 500) {
      console.error(
        "[API ERROR]",
        status,
        url,
        error.response?.data || error.message
      );
    }

    return Promise.reject(error);
  }
);

export default api;
