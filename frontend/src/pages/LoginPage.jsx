/**
 * Page de connexion.
 * Formulaire centré, bouton vert sauge.
 * POST /api/token/ → stockage du token → redirection vers /dashboard
 */

import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { login } from "../api/auth.js";
import Card from "../components/Card.jsx";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Identifiants incorrects.");
      } else if (err.code === "ERR_NETWORK" || err.message === "Network Error") {
        setError("Impossible de contacter le serveur.");
      } else {
        setError("Erreur de connexion.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
            Gradely
          </h1>
          <p className="text-zinc-500 mt-1 text-sm">
            Suivi de projets universitaires
          </p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-zinc-700 mb-2"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition"
                placeholder="ex: etudiant@universite.fr"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-zinc-700 mb-2"
              >
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-brand-600 px-4 py-3 font-medium text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}
