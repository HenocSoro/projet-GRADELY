/**
 * Liste des jalons avec formulaire d'ajout, modification et suppression.
 */

import { useState } from "react";
import { Flag } from "lucide-react";
import Card from "./Card.jsx";

const STATUS_LABELS = {
  planned: "Planifié",
  in_progress: "En cours",
  done: "Terminé",
};

const STATUS_COLORS = {
  planned: "bg-sand-200 text-graphite-600",
  in_progress: "bg-sage-100 text-sage-700",
  done: "bg-sage-200 text-sage-800",
};

export default function MilestoneList({
  projectId,
  items = [],
  loading,
  onAdd,
  onUpdate,
  onDelete,
  onRefresh,
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editStatus, setEditStatus] = useState("planned");
  const [savingEdit, setSavingEdit] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      await onAdd({
        title: title.trim(),
        description: description.trim() || "",
        due_date: dueDate || null,
      });
      setTitle("");
      setDescription("");
      setDueDate("");
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

  async function handleStatusChange(milestone, newStatus) {
    try {
      await onUpdate(milestone.id, { status: newStatus });
      onRefresh?.();
    } catch {
      // ignore
    }
  }

  function startEdit(m) {
    setEditingId(m.id);
    setEditTitle(m.title);
    setEditDescription(m.description || "");
    setEditDueDate(m.due_date || "");
    setEditStatus(m.status || "planned");
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit() {
    if (!editingId || !editTitle.trim()) return;
    setSavingEdit(true);
    try {
      await onUpdate(editingId, {
        title: editTitle.trim(),
        description: editDescription.trim() || "",
        due_date: editDueDate || null,
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

  async function handleDelete(m) {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce jalon ? Cette action est irréversible.")) return;
    try {
      await onDelete?.(m.id);
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
        <h4 className="font-medium text-graphite-800 text-sm">Nouveau jalon</h4>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titre du jalon"
          className="w-full rounded-lg border border-sand-300 px-4 py-2 text-sm text-graphite-800 placeholder-graphite-500 focus:border-sage-500 focus:outline-none focus:ring-1 focus:ring-sage-500"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optionnel)"
          rows={2}
          className="w-full rounded-lg border border-sand-300 px-4 py-2 text-sm text-graphite-800 placeholder-graphite-500 focus:border-sage-500 focus:outline-none focus:ring-1 focus:ring-sage-500 resize-none"
        />
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="flex gap-3 items-center">
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="rounded-lg border border-sand-300 px-4 py-2 text-sm text-graphite-800 focus:border-sage-500 focus:outline-none focus:ring-1 focus:ring-sage-500"
          />
          <button
            type="submit"
            disabled={submitting || !title.trim()}
            className="rounded-lg bg-sage-500 px-4 py-2 text-sm font-medium text-white hover:bg-sage-600 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Ajout..." : "Ajouter"}
          </button>
        </div>
      </form>

      <div className="space-y-3">
        <h4 className="font-medium text-graphite-800 text-sm">Jalons</h4>
        {items.length === 0 ? (
          <Card className="p-6 text-center">
            <Flag className="w-8 h-8 mx-auto text-graphite-400" />
            <p className="mt-2 text-graphite-600 text-sm">Aucun jalon</p>
          </Card>
        ) : (
          items.map((m) => (
            <Card key={m.id} className="p-4">
              {editingId === m.id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Titre"
                    className="w-full rounded-lg border border-sand-300 px-3 py-2 text-sm"
                  />
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Description (optionnel)"
                    rows={2}
                    className="w-full rounded-lg border border-sand-300 px-3 py-2 text-sm resize-none"
                  />
                  <div className="flex flex-wrap gap-2 items-center">
                    <input
                      type="date"
                      value={editDueDate}
                      onChange={(e) => setEditDueDate(e.target.value)}
                      className="rounded-lg border border-sand-300 px-3 py-2 text-sm"
                    />
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
                      disabled={savingEdit || !editTitle.trim()}
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
                    <p className="font-medium text-graphite-800">{m.title}</p>
                    {m.description && (
                      <p className="text-sm text-graphite-600 mt-1 line-clamp-2">{m.description}</p>
                    )}
                    {m.due_date && (
                      <p className="text-xs text-graphite-500 mt-1">Échéance : {m.due_date}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <select
                      value={m.status}
                      onChange={(e) => handleStatusChange(m, e.target.value)}
                      className={`text-xs px-2 py-1 rounded border-0 ${STATUS_COLORS[m.status] || STATUS_COLORS.planned}`}
                    >
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => startEdit(m)}
                      className="text-xs text-sage-600 hover:text-sage-700"
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(m)}
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
