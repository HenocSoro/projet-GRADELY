/**
 * Illustration de section : hero, empty state ou header.
 * Règles : opacity 5–12 %, grayscale(100 %), object-fit: cover, pas de texte sur l'image sans overlay.
 * Une image par vue, usage académique sobre.
 */

const PRESET_IMAGES = {
  hero: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&q=80",
  deliverables: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&q=80",
  planning: "https://images.unsplash.com/photo-1506784365847-bbad939e9335?w=800&q=80",
  comments: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80",
  activity: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80",
};

const OPACITY = {
  hero: 0.07,
  empty: 0.09,
  header: 0.08,
  deliverables: 0.09,
  planning: 0.09,
  comments: 0.09,
  activity: 0.09,
};

export default function SectionIllustration({
  variant = "empty",
  imageUrl,
  opacity,
  title,
  description,
  children,
  className = "",
}) {
  const src = imageUrl || PRESET_IMAGES[variant] || PRESET_IMAGES.deliverables;
  const opacityValue = opacity ?? OPACITY[variant] ?? 0.08;

  const imageStyle = {
    opacity: opacityValue,
    filter: "grayscale(100%)",
    objectFit: "cover",
  };

  if (variant === "hero") {
    return (
      <div
        className={`relative w-full overflow-hidden rounded-xl ${className}`}
        style={{ minHeight: "140px" }}
      >
        <img
          src={src}
          alt=""
          className="absolute inset-0 h-full w-full"
          style={imageStyle}
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-b-xl ${className}`}>
      <div className="relative w-full overflow-hidden" style={{ height: "120px" }}>
        <img
          src={src}
          alt=""
          className="absolute inset-0 h-full w-full"
          style={imageStyle}
          loading="lazy"
        />
      </div>
      {(title || description || children) && (
        <div className="bg-white p-6 text-center">
          {title && <p className="font-medium text-zinc-700">{title}</p>}
          {description && (
            <p className="mt-1 text-sm text-zinc-500">{description}</p>
          )}
          {children && <div className="mt-4">{children}</div>}
        </div>
      )}
    </div>
  );
}

export { PRESET_IMAGES };
