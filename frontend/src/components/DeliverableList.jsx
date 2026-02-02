/**
 * Liste des livrables avec formulaire d'ajout, modification et suppression.
 * Design premium : lecture prioritaire, cartes académiques avec statut.
 * Statuts : À soumettre / Soumis / Validé / Refusé
 */

import { useState, useEffect, useRef } from "react";
import { FileText, Upload, ChevronDown, ChevronUp, Calendar } from "lucide-react";
import Card from "./Card.jsx";
import Badge from "./ui/Badge.jsx";
import Button from "./ui/Button.jsx";
import SectionTitle from "./ui/SectionTitle.jsx";
import ReviewPanel from "./ReviewPanel.jsx";
import EmptyStateCard from "./ui/EmptyStateCard.jsx";
import { scottGraham } from "../assets/images/index.js";

/** Calcule le statut du livrable à partir des submissions */
function getDeliverableStatus(submissions) {
  const subs = Array.isArray(submissions) ? submissions : [];
  const submitted = subs.filter((s) => s.status === "submitted" && s.document_url);
  if (submitted.length === 0) return { status: "to_submit", label: "À soumettre" };

  const approved = subs.find((s) => s.review?.status === "approved");
  if (approved) return { status: "validated", label: "Validé" };

  const rejected = subs.find((s) => s.review?.status === "rejected");
  if (rejected) return { status: "rejected", label: "Refusé" };

  return { status: "submitted", label: "Soumis" };
}

export default function DeliverableList({
  projectId,
  items,
  loading,
  onAdd,
  onUpdate,
  onDelete,
  onRefresh,
  isSupervisor,
  onReviewSuccess,
}) {
  const safeItems = (Array.isArray(items) ? items : []).filter(
    (d) => d != null && d.id != null
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [submissionsByDeliverable, setSubmissionsByDeliverable] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (!projectId || !safeItems.length) return;
    let cancelled = false;
    (async () => {
      const api = (await import("../api/axios.js")).default;
      const byId = {};
      await Promise.all(
        safeItems.map(async (d) => {
          try {
            const { data } = await api.get(
              `/api/projects/${projectId}/deliverables/${d.id}/submissions/`
            );
            if (!cancelled) byId[d.id] = Array.isArray(data) ? data : [];
          } catch {
            if (!cancelled) byId[d.id] = [];
          }
        })
      );
      if (!cancelled) setSubmissionsByDeliverable((prev) => ({ ...prev, ...byId }));
    })();
    return () => { cancelled = true; };
  }, [projectId, safeItems]);

  function handleSubmissionsChange(deliverableId, submissions) {
    setSubmissionsByDeliverable((prev) => ({ ...prev, [deliverableId]: submissions }));
  }

  async function handleAddDeliverable(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const payload = { title: title.trim(), description: description.trim() };
      if (isSupervisor) payload.due_date = dueDate || null;
      await onAdd(payload);
      setTitle("");
      setDescription("");
      setDueDate("");
      setShowAddForm(false);
      onRefresh?.();
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        (typeof err.response?.data === "object"
          ? Object.values(err.response?.data || {}).flat().join(" ")
          : err.response?.data) ||
        err.message ||
        "Erreur lors de l'ajout du livrable.";
      setError(String(msg));
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(d) {
    setEditingId(d.id);
    setEditTitle(d.title);
    setEditDescription(d.description || "");
    setEditDueDate(d.due_date || "");
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit() {
    if (!editingId || !editTitle.trim()) return;
    setSavingEdit(true);
    try {
      const payload = { title: editTitle.trim(), description: editDescription.trim() || "" };
      if (isSupervisor) payload.due_date = editDueDate || null;
      await onUpdate?.(editingId, payload);
      onRefresh?.();
      setEditingId(null);
    } catch {
      // ignore
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDelete(d) {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce livrable ? Les dépôts associés seront également supprimés. Cette action est irréversible.")) return;
    try {
      await onDelete?.(d.id);
      onRefresh?.();
      if (expandedId === d.id) setExpandedId(null);
      if (editingId === d.id) setEditingId(null);
    } catch {
      // ignore
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-zinc-500 text-sm">Chargement...</div>
      </div>
    );
  }

  if (projectId == null || projectId === "") {
    return (
      <div className="rounded-2xl bg-rose-50/80 p-6 text-sm text-rose-700 ring-1 ring-rose-200">
        Erreur : identifiant du projet manquant. Rechargez la page.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Priorité lecture : grille des livrables */}
      <section>
        <SectionTitle>Livrables</SectionTitle>
        <p className="mt-1 text-sm text-zinc-500">
          Consultez et déposez vos livrables. Les statuts indiquent l'avancement de la validation.
        </p>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {safeItems.length === 0 ? (
            <EmptyStateCard
              className="col-span-full"
              image={scottGraham}
              title="Aucun livrable"
              description="Ajoutez un livrable pour commencer."
              action={
                <Button
                  variant="primary"
                  onClick={() => setShowAddForm(true)}
                >
                  Ajouter un livrable
                </Button>
              }
            />
          ) : (
            safeItems.map((d) => {
              const subs = submissionsByDeliverable[d.id] || [];
              const { status, label } = getDeliverableStatus(subs);
              const badgeVariant = status === "validated" ? "approved" : status === "rejected" ? "rejected" : status === "submitted" ? "submitted" : "to_submit";

              return (
                <Card key={d.id} hoverable className="overflow-hidden">
                  {editingId === d.id ? (
                    <div className="p-6 space-y-4">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Titre"
                        className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                      />
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Description (optionnel)"
                        rows={2}
                        className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none"
                      />
                      {isSupervisor && (
                        <input
                          type="date"
                          value={editDueDate}
                          onChange={(e) => setEditDueDate(e.target.value)}
                          className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                        />
                      )}
                      <div className="flex gap-2">
                        <Button variant="primary" onClick={saveEdit} disabled={savingEdit || !editTitle.trim()}>
                          Enregistrer
                        </Button>
                        <Button variant="secondary" onClick={cancelEdit}>
                          Annuler
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="p-6">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <Badge variant={badgeVariant} className="mb-3">
                              {label}
                            </Badge>
                            <h4 className="font-semibold text-zinc-900 truncate">{d.title}</h4>
                            {d.due_date && (
                              <p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500">
                                <Calendar className="h-3.5 w-3.5" />
                                Échéance : {d.due_date}
                              </p>
                            )}
                          </div>
                          <div className="flex shrink-0 gap-1">
                            <button
                              type="button"
                              onClick={() => startEdit(d)}
                              className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
                              title="Modifier"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(d)}
                              className="rounded-lg p-1.5 text-zinc-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                              title="Supprimer"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </div>
                        {d.description && (
                          <p className="mt-3 text-sm text-zinc-600 line-clamp-2">{d.description}</p>
                        )}
                        {(subs.filter((s) => s.document_url).length > 0) && (
                          <p className="mt-3 text-xs text-zinc-500">
                            📎 {subs.filter((s) => s.document_url).length} fichier(s) déposé(s)
                          </p>
                        )}
                        {!isSupervisor && (
                          <Button
                            variant="secondary"
                            type="button"
                            className="mt-4 w-full"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setExpandedId(expandedId === d.id ? null : d.id);
                            }}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {expandedId === d.id ? "Masquer" : "Déposer un fichier"}
                          </Button>
                        )}
                        {isSupervisor && (
                          <Button
                            variant="secondary"
                            type="button"
                            className="mt-4 w-full"
                            onClick={(e) => {
                              e.preventDefault();
                              setExpandedId(expandedId === d.id ? null : d.id);
                            }}
                          >
                            {expandedId === d.id ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
                            {expandedId === d.id ? "Masquer" : "Voir détails"}
                          </Button>
                        )}
                      </div>
                      {expandedId === d.id && d?.id != null && (
                        <div className="border-t border-zinc-200/80 bg-zinc-50/50 p-6">
                          {d.description && (
                            <p className="text-sm text-zinc-600 mb-4">{d.description}</p>
                          )}
                          <DeliverableDetail
                            projectId={projectId}
                            deliverable={d}
                            isSupervisor={isSupervisor}
                            onRefresh={onRefresh}
                            onSubmissionsChange={(subs) => handleSubmissionsChange(d.id, subs)}
                            onReviewSuccess={onReviewSuccess}
                          />
                        </div>
                      )}
                    </>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </section>

      {/* Formulaire secondaire : ajouter un livrable */}
      <section>
        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 text-sm font-medium text-zinc-700 hover:text-zinc-900 transition-colors"
        >
          {showAddForm ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {showAddForm ? "Masquer le formulaire" : "Ajouter un livrable"}
        </button>
        {showAddForm && (
          <Card className="mt-4 p-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddDeliverable(e);
              }}
              className="space-y-4"
            >
              <h4 className="font-medium text-zinc-900">Nouveau livrable</h4>
              {error && (
                <p className="text-sm text-rose-600 bg-rose-50 rounded-xl px-4 py-2 ring-1 ring-rose-200">
                  {error}
                </p>
              )}
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Titre</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Ex: Rapport final, Code source..."
                  className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Description (optionnel)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez le livrable attendu..."
                  rows={2}
                  className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none"
                />
              </div>
              {isSupervisor && (
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">Date d'échéance (optionnel)</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              )}
              <Button
                type="submit"
                variant="primary"
                disabled={submitting || !title.trim()}
              >
                {submitting ? "Ajout..." : "Ajouter le livrable"}
              </Button>
            </form>
          </Card>
        )}
      </section>
    </div>
  );
}

function DeliverableDetail({ projectId, deliverable, isSupervisor, onRefresh, onSubmissionsChange, onReviewSuccess }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);

  const hasValidIds = projectId != null && projectId !== "" && deliverable?.id != null;

  async function loadSubmissions() {
    setLoading(true);
    try {
      const api = (await import("../api/axios.js")).default;
      const { data } = await api.get(
        `/api/projects/${projectId}/deliverables/${deliverable.id}/submissions/`
      );
      const list = Array.isArray(data) ? data : [];
      setSubmissions(list);
      onSubmissionsChange?.(deliverable.id, list);
    } catch {
      setSubmissions([]);
      onSubmissionsChange?.(deliverable.id, []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (projectId != null && deliverable?.id != null) loadSubmissions();
  }, [projectId, deliverable?.id]);

  if (!hasValidIds) {
    return (
      <div className="rounded-xl bg-rose-50/80 p-4 text-sm text-rose-700 ring-1 ring-rose-200">
        Erreur : données du livrable manquantes. Rechargez la page.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!isSupervisor && (
        <div className="rounded-xl bg-white/80 p-4 ring-1 ring-zinc-200/80">
          <p className="text-sm font-medium text-zinc-800 mb-3">
            📎 Charger un fichier depuis votre ordinateur
          </p>
          <SubmissionForm
            projectId={projectId}
            deliverable={deliverable}
            onSuccess={() => {
              loadSubmissions();
              onRefresh?.();
            }}
            onCancel={null}
          />
        </div>
      )}

      <p className="text-xs font-medium text-zinc-600">Dépôts envoyés</p>
      {loading ? (
        <p className="text-sm text-zinc-500">Chargement...</p>
      ) : submissions.length === 0 ? (
        <p className="text-sm text-zinc-500">Aucun dépôt pour l'instant.</p>
      ) : (
        <div className="space-y-3">
          {submissions.map((s) => (
            <div
              key={s.id}
              className="rounded-xl bg-white/80 p-4 ring-1 ring-zinc-200/80 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  {s.content && <p className="text-sm text-zinc-800">{s.content}</p>}
                  {s.document_url && (
                    <p className="text-sm">
                      <span className="font-medium text-zinc-800">📎 {s.document_name || "Fichier déposé"}</span>
                      {" — "}
                      <a
                        href={s.document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-600 hover:text-brand-700 underline"
                      >
                        Télécharger
                      </a>
                    </p>
                  )}
                  {!s.content && !s.document_url && (
                    <p className="text-sm text-zinc-500">(Sans contenu ni fichier)</p>
                  )}
                  <p className="text-xs text-zinc-500 mt-1">
                    {s.submitted_by_email} · {SUBMISSION_STATUS_LABELS[s.status] ?? s.status} ·{" "}
                    {s.submitted_at ? new Date(s.submitted_at).toLocaleDateString("fr-FR") : "—"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce dépôt ? Cette action est irréversible.")) return;
                    try {
                      const api = (await import("../api/axios.js")).default;
                      await api.delete(
                        `/api/projects/${projectId}/deliverables/${deliverable.id}/submissions/${s.id}/`
                      );
                      loadSubmissions();
                      onRefresh?.();
                    } catch {
                      // ignore
                    }
                  }}
                  className="text-xs text-rose-600 hover:text-rose-700 shrink-0"
                >
                  Supprimer
                </button>
              </div>
              {s.review && (
                <div className="mt-2 pt-2 border-t border-zinc-200/80">
                  <ReviewPanel
                    submission={s}
                    review={s.review}
                    isSupervisor={isSupervisor}
                    onRefresh={() => {
                      onRefresh?.();
                      loadSubmissions();
                      onReviewSuccess?.();
                    }}
                  />
                </div>
              )}
              {isSupervisor && !s.review && (
                <div className="mt-2 pt-2 border-t border-zinc-200/80">
                  <ReviewPanel
                    submission={s}
                    review={null}
                    isSupervisor={isSupervisor}
                    onRefresh={() => {
                      onRefresh?.();
                      loadSubmissions();
                      onReviewSuccess?.();
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const SUBMISSION_STATUS_LABELS = { submitted: "soumis", draft: "brouillon" };

function SubmissionForm({ projectId, deliverable, onSuccess, onCancel }) {
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const canSubmit =
    projectId != null && projectId !== "" && deliverable != null && deliverable.id != null;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  async function handleSubmit(e) {
    if (!canSubmit || (!content.trim() && !file)) return;
    setSubmitting(true);
    setError("");
    setSuccessMessage("");
    try {
      const api = (await import("../api/axios.js")).default;
      const formData = new FormData();
      formData.append("content", content.trim() || "");
      formData.append("status", "submitted");
      if (file) formData.append("document", file);
      await api.post(
        `/api/projects/${projectId}/deliverables/${deliverable.id}/submissions/`,
        formData
      );
      setContent("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setSuccessMessage("Dépôt soumis.");
      setTimeout(() => setSuccessMessage(""), 4000);
      onSuccess?.();
    } catch (err) {
      let msg = "Erreur lors du dépôt.";
      if (err.response?.data) {
        const d = err.response.data;
        if (typeof d === "string") msg = d;
        else if (d.detail) msg = d.detail;
        else if (typeof d === "object")
          msg = Object.entries(d)
            .map(([k, v]) => (Array.isArray(v) ? v.join(" ") : v))
            .join(" — ");
      } else if (err.message) msg = err.message;
      if (err.response?.status === 413) msg = "Fichier trop volumineux (max ~10 Mo).";
      setError(String(msg));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit(e);
      }}
      className="space-y-4"
    >
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Commentaire ou description (optionnel)"
        rows={2}
        className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none"
      />
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer?.files?.[0];
          if (f) setFile(f);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }}
        className={`rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors ${
          dragOver ? "border-brand-400 bg-brand-50/50" : "border-zinc-200 bg-zinc-50/50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.zip,.png,.jpg,.jpeg,.txt,.md,.xls,.xlsx"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-zinc-700 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white file:hover:bg-brand-700"
        />
        <p className="mt-2 text-xs text-zinc-500">ou glissez un fichier ici (PDF, Word, ZIP… max 10 Mo)</p>
        {file && (
          <p className="mt-2 text-sm text-zinc-700">
            Fichier : <strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} Ko)
            {" "}
            <button
              type="button"
              onClick={() => {
                setFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="text-xs text-rose-600 hover:text-rose-700"
            >
              Retirer
            </button>
          </p>
        )}
      </div>
      {successMessage && (
        <p className="text-sm text-emerald-700 font-medium rounded-xl bg-emerald-50 px-4 py-2 ring-1 ring-emerald-200">
          ✓ {successMessage}
        </p>
      )}
      {error && (
        <p className="text-sm text-rose-600 rounded-xl bg-rose-50 px-4 py-2 ring-1 ring-rose-200">{error}</p>
      )}
      {!canSubmit && (
        <p className="text-sm text-rose-600">Erreur : identifiants manquants. Rechargez la page.</p>
      )}
      <div className="flex gap-2">
        <Button
          type="submit"
          variant="primary"
          disabled={!canSubmit || submitting || (!content.trim() && !file)}
        >
          {submitting ? "Envoi en cours..." : "Soumettre le dépôt"}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Annuler
          </Button>
        )}
      </div>
    </form>
  );
}
