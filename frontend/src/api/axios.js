/**
 * Instance Axios configurée pour l'API backend.
 * - En dev : baseURL vide → requêtes via le proxy Vite (évite CORS)
 * - En prod : VITE_API_URL ou http://127.0.0.1:8000
 * - Sur 401 : tente un refresh du token puis relance la requête ; si échec → déconnexion et /login
 */

import axios from "axios";

const baseURL = import.meta.env.DEV
  ? ""
  : (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000");

const ACCESS_KEY = "access";
const REFRESH_KEY = "refresh";

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Intercepteur : ajoute le token JWT à chaque requête si présent
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // FormData : ne pas fixer Content-Type pour que le navigateur envoie multipart/form-data + boundary
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

// Une seule promesse de refresh à la fois pour éviter plusieurs appels /api/token/refresh/
let refreshPromise = null;

function clearTokensAndRedirect() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  refreshPromise = null;
  window.location.href = "/login";
}

// Intercepteur : sur 401, tenter refresh puis relancer la requête
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }
    // Ne pas tenter de refresh pour l’endpoint de refresh ni pour le login
    if (
      originalRequest.url?.includes("/api/token/refresh/") ||
      originalRequest.url?.includes("/api/token/")
    ) {
      clearTokensAndRedirect();
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (!refreshToken) {
      clearTokensAndRedirect();
      return Promise.reject(error);
    }

    if (!refreshPromise) {
      refreshPromise = api
        .post("/api/token/refresh/", { refresh: refreshToken })
        .then((res) => {
          const access = res.data?.access;
          if (access) localStorage.setItem(ACCESS_KEY, access);
          refreshPromise = null;
          return access;
        })
        .catch(() => {
          refreshPromise = null;
          clearTokensAndRedirect();
          return null;
        });
    }

    const newAccess = await refreshPromise;
    if (!newAccess) return Promise.reject(error);

    originalRequest.headers.Authorization = `Bearer ${newAccess}`;
    originalRequest._retry = true;
    return api(originalRequest);
  }
);

export default api;
