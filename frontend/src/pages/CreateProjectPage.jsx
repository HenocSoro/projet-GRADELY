/**
 * Création de projet.
 * Formulaire : title, description.
 * POST /api/projects/ → redirection vers dashboard avec liste rafraîchie.
 */

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios.js";
import { logout } from "../api/auth.js";
import Card from "../components/Card.jsx";

export default function CreateProjectPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/api/projects/", { title, description });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
        navigate("/login", { replace: true });
      } else {
        setError(
          err.response?.data?.detail ||
            "Impossible de créer le projet. Vérifiez les données."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-sand-300/60 bg-white/80 backdrop-blur">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            to="/dashboard"
            className="text-sm text-graphite-600 hover:text-graphite-800"
          >
            ← Retour au dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-semibold text-graphite-800">
          Nouveau projet
        </h2>
        <p className="text-graphite-600 mt-1 text-sm">
          Créez un nouveau projet universitaire
        </p>

        <Card className="mt-6 p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-graphite-700 mb-2"
              >
                Titre
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-sand-300 bg-white px-4 py-3 text-graphite-800 placeholder-graphite-500 focus:border-sage-500 focus:outline-none focus:ring-1 focus:ring-sage-500 transition"
                placeholder="ex: Projet de synthèse 2025"
                required
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-graphite-700 mb-2"
              >
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-sand-300 bg-white px-4 py-3 text-graphite-800 placeholder-graphite-500 focus:border-sage-500 focus:outline-none focus:ring-1 focus:ring-sage-500 transition resize-none"
                placeholder="Décrivez brièvement votre projet..."
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-sage-500 px-5 py-2.5 font-medium text-white hover:bg-sage-600 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {loading ? "Création..." : "Créer le projet"}
              </button>
              <Link
                to="/dashboard"
                className="rounded-lg border border-sand-300 px-5 py-2.5 font-medium text-graphite-700 hover:bg-sand-100 transition"
              >
                Annuler
              </Link>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
}
