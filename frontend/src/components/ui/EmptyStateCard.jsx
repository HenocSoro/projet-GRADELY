/**
 * Empty state : bloc propre avec image (petite à droite).
 * Props : title, description, image, action (bouton optionnel).
 * Image : w-40 h-40, object-cover, min-h pour garantir le rendu.
 */

import Card from "../Card.jsx";

export default function EmptyStateCard({ title, description, image, action, className = "" }) {
  const imageUrl = typeof image === "string" ? image : image?.default ?? null;

  return (
    <Card className={`overflow-hidden ${className}`}>
      <div className="flex flex-col sm:flex-row items-center gap-6 p-6">
        <div className="flex-1 text-center sm:text-left min-w-0">
          {title && (
            <p className="font-medium text-zinc-700">{title}</p>
          )}
          {description && (
            <p className="mt-1 text-sm text-zinc-500">{description}</p>
          )}
          {action && <div className="mt-4">{action}</div>}
        </div>
        {imageUrl && (
          <div
            className="flex-shrink-0 w-40 h-40 min-h-[10rem] rounded-xl overflow-hidden bg-zinc-100/80"
            aria-hidden
          >
            <img
              src={imageUrl}
              alt=""
              className="w-full h-full object-cover"
              style={{
                opacity: 0.35,
                filter: "grayscale(100%)",
              }}
              loading="lazy"
            />
          </div>
        )}
      </div>
    </Card>
  );
}
