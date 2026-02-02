/**
 * Liste des sprints avec formulaire d'ajout, modification et suppression.
 */

import { useState } from "react";
import { Zap } from "lucide-react";
import Card from "./Card.jsx";

const STATUS_LABELS = {
  planned: "Planifié",
  active: "Actif",
  completed: "Terminé",
};

const STATUS_COLORS = {
  planned: "bg-sand-200 text-graphite-600",
  active: "bg-sage-100 text-sage-700",
  completed: "bg-sage-200 text-sage-800",
};

export default function SprintList({
  projectId,
  items = [],
  loading,
  onAdd,
  onUpdate,
  onDelete,
  onRefresh,
}) {
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [goal, setGoal] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editGoal, setEditGoal] = useState("");
  const [editStatus, setEditStatus] = useState("planned");
  const [savingEdit, setSavingEdit] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !startDate || !endDate) return;
    setSubmitting(true);
    setError("");
    try {
      await onAdd({
        title: title.trim(),
        start_date: startDate,
        end_date: endDate,
        goal: goal.trim() || "",
      });
      setTitle("");
      setStartDate("");
      setEndDate("");
      setGoal("");
      onRefresh?.();
    } catch (err) {
      const msg = err.response?.data?.detail
        || (typeof err.response?.data === "object" ? JSON.stringify(err.response?.data) : null)
        || err.message
        || "Erreur lors de l'ajout.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(sprint, newStatus) {
    try {
      await onUpdate?.(sprint.id, { status: newStatus });
      onRefresh?.();
    } catch {
      // ignore
    }
  }

  function startEdit(s) {
    setEditingId(s.id);
    setEditTitle(s.title);
    setEditStartDate(s.start_date || "");
    setEditEndDate(s.end_date || "");
    setEditGoal(s.goal || "");
    setEditStatus(s.status || "planned");
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit() {
    if (!editingId || !editTitle.trim() || !editStartDate || !editEndDate) return;
    setSavingEdit(true);
    try {
      await onUpdate?.(editingId, {
        title: editTitle.trim(),
        start_date: editStartDate,
        end_date: editEndDate,
        goal: editGoal.trim() || "",
        status: editStatus,
      });
      onRefresh?.();
      setEditingId(null);
    } catch {
      // ignore
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDelete(s) {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce sprint ? Cette action est irréversible.")) return;
    try {
      await onDelete?.(s.id);
      onRefresh?.();
    } catch {
      // ignore
    }
  }

  if (loading) {
    return <div className="text-graphite-500 text-sm py-4">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-3">
        <h4 className="font-medium text-graphite-800 text-sm">Nouveau sprint</h4>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titre du sprint (ex: Sprint 1)"
          className="w-full rounded-lg border border-sand-300 px-4 py-2 text-sm text-graphite-800 placeholder-graphite-500 focus:border-sage-500 focus:outline-none focus:ring-1 focus:ring-sage-500"
        />
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="flex gap-3 flex-wrap">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="Début"
            required
            className="rounded-lg border border-sand-300 px-4 py-2 text-sm text-graphite-800 focus:border-sage-500 focus:outline-none focus:ring-1 focus:ring-sage-500"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="Fin"
            required
            className="rounded-lg border border-sand-300 px-4 py-2 text-sm text-graphite-800 focus:border-sage-500 focus:outline-none focus:ring-1 focus:ring-sage-500"
          />
        </div>
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="Objectif du sprint (optionnel)"
          rows={2}
          className="w-full rounded-lg border border-sand-300 px-4 py-2 text-sm text-graphite-800 placeholder-graphite-500 focus:border-sage-500 focus:outline-none focus:ring-1 focus:ring-sage-500 resize-none"
        />
        <button
          type="submit"
          disabled={submitting || !title.trim() || !startDate || !endDate}
          className="rounded-lg bg-sage-500 px-4 py-2 text-sm font-medium text-white hover:bg-sage-600 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? "Ajout..." : "Ajouter"}
        </button>
      </form>

      <div className="space-y-3">
        <h4 className="font-medium text-graphite-800 text-sm">Sprints</h4>
        {items.length === 0 ? (
          <Card className="p-6 text-center">
            <Zap className="w-8 h-8 mx-auto text-graphite-400" />
            <p className="mt-2 text-graphite-600 text-sm">Aucun sprint</p>
          </Card>
        ) : (
          items.map((s) => (
            <Card key={s.id} className="p-4">
              {editingId === s.id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Titre"
                    className="w-full rounded-lg border border-sand-300 px-3 py-2 text-sm"
                  />
                  <div className="flex gap-2 flex-wrap">
                    <input
                      type="date"
                      value={editStartDate}
                      onChange={(e) => setEditStartDate(e.target.value)}
                      className="rounded-lg border border-sand-300 px-3 py-2 text-sm"
                    />
                    <input
                      type="date"
                      value={editEndDate}
                      onChange={(e) => setEditEndDate(e.target.value)}
                      className="rounded-lg border border-sand-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <textarea
                    value={editGoal}
                    onChange={(e) => setEditGoal(e.target.value)}
                    placeholder="Objectif (optionnel)"
                    rows={2}
                    className="w-full rounded-lg border border-sand-300 px-3 py-2 text-sm resize-none"
                  />
                  <div className="flex flex-wrap gap-2 items-center">
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className={`text-xs px-2 py-1 rounded ${STATUS_COLORS[editStatus] || STATUS_COLORS.planned}`}
                    >
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={saveEdit}
                      disabled={savingEdit || !editTitle.trim() || !editStartDate || !editEndDate}
                      className="rounded-lg bg-sage-500 px-3 py-1.5 text-sm text-white hover:bg-sage-600 disabled:opacity-60"
                    >
                      Enregistrer
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded-lg border border-sand-300 px-3 py-1.5 text-sm text-graphite-700 hover:bg-sand-100"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-graphite-800">{s.title}</p>
                    <p className="text-sm text-graphite-600 mt-1">
                      {s.start_date} → {s.end_date}
                    </p>
                    {s.goal && (
                      <p className="text-sm text-graphite-500 mt-1 line-clamp-2">{s.goal}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <select
                      value={s.status}
                      onChange={(e) => handleStatusChange(s, e.target.value)}
                      className={`text-xs px-2 py-1 rounded border-0 font-medium ${STATUS_COLORS[s.status] || STATUS_COLORS.planned}`}
                    >
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => startEdit(s)}
                      className="text-xs text-sage-600 hover:text-sage-700"
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(s)}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
