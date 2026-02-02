/**
 * Gestion de l'authentification JWT.
 * - Login : POST /api/token/ → stockage access + refresh
 * - Logout : suppression des tokens du localStorage
 * - SimpleJWT attend "username" (valeur = email pour notre User model)
 */

import api from "./axios.js";

const ACCESS_KEY = "access";
const REFRESH_KEY = "refresh";

/**
 * Connexion : envoie email + password, stocke les tokens.
 * SimpleJWT avec USERNAME_FIELD=email attend { email, password }.
 */
export async function login(email, password) {
  const { data } = await api.post("/api/token/", { email, password });
  localStorage.setItem(ACCESS_KEY, data.access);
  localStorage.setItem(REFRESH_KEY, data.refresh);
  return data;
}

/**
 * Déconnexion : supprime les tokens.
 */
export function logout() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

/**
 * Retourne le token d'accès (ou null si non connecté).
 */
export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY);
}
