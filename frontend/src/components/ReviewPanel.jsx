/**
 * Panel de validation par le superviseur (approve/reject + feedback).
 */

import { useState } from "react";

const STATUS_LABELS = {
  pending: "En attente",
  approved: "Approuvé",
  rejected: "Refusé",
};

export default function ReviewPanel({
  submission,
  review,
  isSupervisor,
  onRefresh,
}) {
  const [status, setStatus] = useState(review?.status || "pending");
  const [feedback, setFeedback] = useState(review?.feedback || "");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isSupervisor) return;
    setSubmitting(true);
    try {
      const api = (await import("../api/axios.js")).default;
      await api.post(`/api/submissions/${submission.id}/review/`, {
        status,
        feedback,
      });
      onRefresh?.();
    } finally {
      setSubmitting(false);
    }
  }

  if (!review && !isSupervisor) return null;

  if (review && !isSupervisor) {
    return (
      <div className="rounded bg-white border border-sand-200 p-2">
        <p className="text-xs font-medium text-graphite-600">Revue</p>
        <p
          className={`text-sm font-medium mt-0.5 ${
            review.status === "approved"
              ? "text-sage-700"
              : review.status === "rejected"
              ? "text-red-600"
              : "text-graphite-600"
          }`}
        >
          {STATUS_LABELS[review.status]}
        </p>
        {review.feedback && (
          <p className="text-sm text-graphite-600 mt-1">{review.feedback}</p>
        )}
        <p className="text-xs text-graphite-500 mt-1">
          {review.reviewer_email} ·{" "}
          {new Date(review.reviewed_at).toLocaleDateString("fr-FR")}
        </p>
      </div>
    );
  }

  if (isSupervisor) {
    return (
      <form onSubmit={handleSubmit} className="space-y-2">
        <p className="text-xs font-medium text-graphite-600">Validation</p>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded border border-sand-300 px-2 py-1 text-sm"
        >
          <option value="pending">En attente</option>
          <option value="approved">Approuvé</option>
          <option value="rejected">Refusé</option>
        </select>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Feedback (optionnel)"
          rows={2}
          className="w-full rounded border border-sand-300 px-2 py-1 text-sm resize-none"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-sage-500 px-3 py-1 text-sm text-white hover:bg-sage-600 disabled:opacity-60"
        >
          {submitting ? "Envoi..." : "Envoyer la revue"}
        </button>
      </form>
    );
  }

  return null;
}
