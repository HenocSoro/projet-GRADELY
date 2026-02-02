/**
 * Vue timeline : jalons et sprints sur un axe temporel.
 */

import { Flag, Zap } from "lucide-react";
import EmptyStateCard from "./ui/EmptyStateCard.jsx";
import { kobuAgency } from "../assets/images/index.js";

export default function TimelineView({ milestones = [], sprints = [] }) {
  const allItems = [
    ...milestones.map((m) => ({
      ...m,
      type: "milestone",
      date: m.due_date,
      label: m.title,
    })),
    ...sprints.map((s) => ({
      ...s,
      type: "sprint",
      date: s.start_date,
      endDate: s.end_date,
      label: s.title,
    })),
  ].filter((i) => i.date).sort((a, b) => (a.date || "").localeCompare(b.date || ""));

  if (allItems.length === 0) {
    return (
      <EmptyStateCard
        image={kobuAgency}
        title="Aucun élément à afficher"
        description="Ajoutez des jalons ou des sprints avec des dates pour voir la timeline."
      />
    );
  }

  return (
    <div className="space-y-2">
      {allItems.map((item) => (
        <div
          key={`${item.type}-${item.id}`}
          className="flex items-center gap-3 rounded-lg border border-sand-300/60 bg-white p-3"
        >
          <div
            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              item.type === "milestone"
                ? "bg-sage-100 text-sage-600"
                : "bg-sand-200 text-graphite-600"
            }`}
          >
            {item.type === "milestone" ? (
              <Flag className="w-4 h-4" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-graphite-800 text-sm">{item.label}</p>
            <p className="text-xs text-graphite-500">
              {item.type === "milestone" ? "Jalon" : "Sprint"}
              {item.type === "sprint" && item.endDate
                ? ` · ${item.date} → ${item.endDate}`
                : ` · ${item.date}`}
            </p>
          </div>
          {item.type === "milestone" && (
            <span
              className={`text-xs px-2 py-0.5 rounded capitalize ${
                item.status === "done"
                  ? "bg-sage-200 text-sage-800"
                  : "bg-sand-200 text-graphite-600"
              }`}
            >
              {item.status}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
