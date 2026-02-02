/**
 * Liste du journal d'activité d'un projet.
 */

import { Activity } from "lucide-react";
import Card from "./Card.jsx";
import EmptyStateCard from "./ui/EmptyStateCard.jsx";

const ACTION_LABELS = {
  project_created: "Projet créé",
  project_updated: "Projet modifié",
  task_created: "Tâche créée",
  task_updated: "Tâche modifiée",
  comment_added: "Commentaire ajouté",
  milestone_created: "Jalon créé",
  milestone_updated: "Jalon modifié",
  sprint_created: "Sprint créé",
  sprint_updated: "Sprint modifié",
  deliverable_created: "Livrable créé",
  submission_created: "Dépôt créé",
  review_submitted: "Revue envoyée",
};

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getActorRole(actorId, ownerId, supervisorId) {
  if (actorId == null) return null;
  const a = Number(actorId);
  if (ownerId != null && a === Number(ownerId)) return "Étudiant";
  if (supervisorId != null && a === Number(supervisorId)) return "Superviseur";
  return null;
}

export default function ActivityFeed({ items, loading, ownerId, supervisorId }) {
  if (loading) {
    return (
      <div className="text-graphite-500 text-sm py-4">Chargement...</div>
    );
  }

  if (!items?.length) {
    return (
      <EmptyStateCard
        title="Aucune activité"
        description="Les actions sur le projet apparaîtront ici."
      />
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const role = getActorRole(item.actor, ownerId, supervisorId);
        return (
          <div
            key={item.id}
            className="flex gap-3 rounded-lg border border-sand-300/60 bg-white p-3"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-sage-100 flex items-center justify-center">
              <Activity className="w-4 h-4 text-sage-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-graphite-800">{item.description}</p>
              <p className="text-xs text-graphite-500 mt-0.5 flex flex-wrap items-center gap-x-1 gap-y-0.5">
                <span>{ACTION_LABELS[item.action_type] || item.action_type}</span>
                <span>·</span>
                <span>{item.actor_email}</span>
                {role && (
                  <>
                    <span>·</span>
                    <span
                      className={
                        role === "Superviseur"
                          ? "text-sage-600 font-medium"
                          : "text-graphite-600 font-medium"
                      }
                    >
                      {role}
                    </span>
                  </>
                )}
                <span>·</span>
                <span>{formatDate(item.created_at)}</span>
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
