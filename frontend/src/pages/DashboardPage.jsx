/**
 * Dashboard : vue pilotage, grille moderne
 * Projets, activité, livrables à venir.
 * Design premium education dashboard.
 */

import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios.js";
import { logout, getAccessToken } from "../api/auth.js";
import Card from "../components/Card.jsx";
import Badge from "../components/ui/Badge.jsx";
import Button from "../components/ui/Button.jsx";
import SectionTitle from "../components/ui/SectionTitle.jsx";
import SectionHero from "../components/ui/SectionHero.jsx";
import { headway } from "../assets/images/index.js";

export default function DashboardPage() {
  const [projects, setProjects] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchQuery = (searchParams.get("q") ?? "").trim().toLowerCase();
  const normalized = (s) =>
    (s ?? "")
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase();
  const filteredProjects = useMemo(
    () =>
      searchQuery
        ? projects.filter(
            (p) =>
              p.title &&
              normalized(String(p.title)).includes(normalized(searchQuery))
          )
        : projects,
    [projects, searchQuery]
  );
  const isSupervisorOnly =
    currentUser?.is_staff && projects.every((p) => p.owner !== currentUser?.id);

  async function fetchCurrentUser() {
    try {
      const { data } = await api.get("/api/me/");
      setCurrentUser(data);
      return data;
    } catch {
      return null;
    }
  }

  async function fetchProjects() {
    try {
      const { data } = await api.get("/api/projects/");
      setProjects(data);
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
        navigate("/login", { replace: true });
      } else {
        setError("Impossible de charger les projets.");
      }
      setProjects([]);
    }
  }

  async function fetchDashboard() {
    try {
      const { data } = await api.get("/api/dashboard/student");
      setDashboard(data);
    } catch {
      setDashboard(null);
    }
  }

  async function loadAll() {
    setLoading(true);
    setError("");
    const user = await fetchCurrentUser();
    if (!user) {
      setLoading(false);
      return;
    }
    await Promise.all([fetchProjects(), fetchDashboard()]);
    setLoading(false);
  }

  useEffect(() => {
    if (getAccessToken()) {
      loadAll();
    }
  }, []);

  function isOwner(p) {
    return currentUser && p.owner === currentUser.id;
  }

  function isSupervisorOf(p) {
    return currentUser && p.supervisor === currentUser.id;
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <SectionTitle>
        {currentUser?.is_staff && projects.length > 0 && !isSupervisorOnly
          ? "Mes projets"
          : currentUser?.is_staff && isSupervisorOnly
            ? "Projets que je supervise"
            : "Mes projets"}
      </SectionTitle>
      <p className="mt-1 text-sm text-zinc-500">
        {currentUser?.is_staff && isSupervisorOnly
          ? "Projets pour lesquels vous êtes superviseur"
          : "Liste de vos projets universitaires"}
      </p>

      {/* Bienvenue / Résumé : hero discret + overlay */}
      {dashboard?.summary && (
        <SectionHero
          className="mt-6"
          image={headway}
          title="Bienvenue"
          subtitle="Vue d'ensemble de vos projets"
        >
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-6">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Projets</p>
              <p className="mt-1 text-2xl font-bold text-brand-600">{dashboard.summary.total_projects}</p>
            </Card>
            <Card className="p-6">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Tâches</p>
              <p className="mt-1 text-2xl font-bold text-zinc-900">{dashboard.summary.total_tasks}</p>
            </Card>
            {dashboard.summary.overdue_tasks > 0 ? (
              <Card className="p-6 border-rose-200/80 bg-rose-50/50">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">En retard</p>
                <p className="mt-1 text-2xl font-bold text-rose-600">{dashboard.summary.overdue_tasks}</p>
              </Card>
            ) : (
              <Card className="p-6">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">En retard</p>
                <p className="mt-1 text-2xl font-bold text-zinc-400">0</p>
              </Card>
            )}
          </div>
        </SectionHero>
      )}

      {dashboard?.nudges && dashboard.nudges.length > 0 && (
        <div className="mt-6 space-y-3">
          {dashboard.nudges.map((n, i) => (
            <div
              key={i}
              className={`rounded-xl px-4 py-3 text-sm ring-1 ${
                n.severity === "danger"
                  ? "bg-rose-50/80 ring-rose-200 text-rose-800"
                  : "bg-amber-50/80 ring-amber-200 text-amber-800"
              }`}
            >
              <strong>{n.title}</strong> — {n.message}
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-2xl bg-rose-50/80 px-6 py-4 text-rose-700 ring-1 ring-rose-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-8 text-zinc-500 text-sm">Chargement...</div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((p) => (
            <Link key={p.id} to={`/projects/${p.id}`}>
              <Card hoverable className="p-6 h-full transition-all duration-200">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-zinc-900 text-lg flex-1 line-clamp-1">
                    {p.title}
                  </h3>
                  <Badge variant={isOwner(p) ? "approved" : "submitted"}>
                    {isOwner(p) ? "Propriétaire" : "Superviseur"}
                  </Badge>
                </div>
                <p className="mt-3 text-sm text-zinc-600 line-clamp-2">
                  {p.description || "Aucune description"}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-500">
                    {p.progress_percent ?? 0}%
                  </span>
                  {p.supervisor && !isSupervisorOf(p) && (
                    <span className="text-xs text-zinc-500">Superviseur assigné</span>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {!loading && projects.length === 0 && !error && (
        <Card className="mt-8 p-12 text-center">
          <p className="text-zinc-600 font-medium">
            {currentUser?.is_staff
              ? "Aucun projet à superviser pour l'instant"
              : "Aucun projet"}
          </p>
          <p className="text-sm text-zinc-500 mt-1">
            {currentUser?.is_staff
              ? "Les projets vous seront assignés par les étudiants."
              : "Créez votre premier projet pour commencer"}
          </p>
          {!currentUser?.is_staff && (
            <Link to="/projects/new" className="mt-6 inline-block">
              <Button variant="primary">Nouveau projet</Button>
            </Link>
          )}
        </Card>
      )}

      {!loading && projects.length > 0 && filteredProjects.length === 0 && !error && (
        <Card className="mt-8 p-12 text-center">
          <p className="text-zinc-600 font-medium">
            Aucun projet ne correspond à « {searchParams.get("q") ?? ""} »
          </p>
          <p className="text-sm text-zinc-500 mt-1">
            Modifiez la recherche dans la barre du haut.
          </p>
        </Card>
      )}
    </div>
  );
}
