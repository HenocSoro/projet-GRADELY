/**
 * Liste des commentaires + formulaire d'ajout.
 */

import { useState } from "react";
import Card from "./Card.jsx";
import EmptyStateCard from "./ui/EmptyStateCard.jsx";
import { desola } from "../assets/images/index.js";

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getAuthorRole(authorId, ownerId, supervisorId) {
  if (authorId == null) return null;
  const a = Number(authorId);
  if (ownerId != null && a === Number(ownerId)) return "Étudiant";
  if (supervisorId != null && a === Number(supervisorId)) return "Superviseur";
  return null;
}

export default function CommentList({
  projectId,
  items = [],
  loading,
  onAdd,
  onRefresh,
  ownerId,
  supervisorId,
}) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      await onAdd(content.trim());
      setContent("");
      onRefresh?.();
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="text-graphite-500 text-sm py-4">Chargement...</div>
    );
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Ajouter un commentaire..."
          rows={3}
          className="w-full rounded-lg border border-sand-300 px-4 py-3 text-graphite-800 placeholder-graphite-500 focus:border-sage-500 focus:outline-none focus:ring-1 focus:ring-sage-500 resize-none"
        />
        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="mt-2 rounded-lg bg-sage-500 px-4 py-2 text-sm font-medium text-white hover:bg-sage-600 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? "Envoi..." : "Publier"}
        </button>
      </form>

      <div className="space-y-3">
        {items.length === 0 ? (
          <EmptyStateCard
            image={desola}
            title="Aucun commentaire"
            description="Soyez le premier à commenter."
          />
        ) : (
          items.map((c) => {
            const role = getAuthorRole(c.author, ownerId, supervisorId);
            return (
              <Card key={c.id} className="p-4">
                <p className="text-sm text-graphite-800 whitespace-pre-wrap">
                  {c.content}
                </p>
                <p className="text-xs text-graphite-500 mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                  <span>{c.author_email}</span>
                  {role && (
                    <span
                      className={
                        role === "Superviseur"
                          ? "px-1.5 py-0.5 rounded text-sage-700 bg-sage-100 font-medium"
                          : "px-1.5 py-0.5 rounded text-graphite-700 bg-sand-200 font-medium"
                      }
                    >
                      {role}
                    </span>
                  )}
                  <span>·</span>
                  <span>{formatDate(c.created_at)}</span>
                </p>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
