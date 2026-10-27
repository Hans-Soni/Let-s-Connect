import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL
    ? `${import.meta.env.VITE_BACKEND_URL}/api`
    : (import.meta.env.MODE === "development" ? "http://localhost:5002/api" : "/api"),
  withCredentials: true,
});

// Attach the session-storage token to every request.
axiosInstance.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("jwt");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Silent-refresh on 401: if the JWT has expired (15-min window), request a new one
// using the httpOnly cookie that the server still holds. If refresh also fails,
// clear the session so the user is taken to the login page gracefully.
let _isRefreshing = false;
let _refreshQueue = []; // { resolve, reject }[]

const processQueue = (error, token = null) => {
  for (const { resolve, reject } of _refreshQueue) {
    if (error) reject(error);
    else resolve(token);
  }
  _refreshQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh on 401, and only once per request (_retry flag).
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Don't try to refresh on the refresh/login/logout/signup endpoints themselves.
    const skipPaths = ["/auth/refresh", "/auth/login", "/auth/signup", "/auth/logout"];
    if (skipPaths.some((p) => originalRequest.url?.includes(p))) {
      return Promise.reject(error);
    }

    if (_isRefreshing) {
      // Queue this request until the in-flight refresh completes.
      return new Promise((resolve, reject) => {
        _refreshQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return axiosInstance(originalRequest);
      });
    }

    originalRequest._retry = true;
    _isRefreshing = true;

    try {
      const { data } = await axiosInstance.post("/auth/refresh");
      const newToken = data.token;
      sessionStorage.setItem("jwt", newToken);
      axiosInstance.defaults.headers.common.Authorization = `Bearer ${newToken}`;
      processQueue(null, newToken);
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return axiosInstance(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      // Refresh failed — clear session and let the auth store redirect to login.
      sessionStorage.removeItem("jwt");
      localStorage.removeItem("jwt");
      // Dispatch a custom event so useAuthStore can react without a circular import.
      window.dispatchEvent(new CustomEvent("auth:session-expired"));
      return Promise.reject(refreshError);
    } finally {
      _isRefreshing = false;
    }
  }
);
