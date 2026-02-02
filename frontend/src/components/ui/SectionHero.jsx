/**
 * Bande hero : image en fond discret + overlay.
 * Règles : opacity 0.08–0.15, grayscale, blur-sm, rounded-2xl, overflow-hidden.
 * Z-index : image z-0, overlay z-10, contenu z-20. Conteneur min-h pour que l’image soit visible.
 */

export default function SectionHero({ title, subtitle, image, children, className = "" }) {
  const imageUrl = typeof image === "string" ? image : image?.default ?? null;

  if (!imageUrl) {
    return (
      <div className={`relative overflow-hidden rounded-2xl bg-zinc-100/80 p-6 min-h-[160px] ${className}`}>
        {title && <h2 className="text-xl font-semibold text-zinc-900">{title}</h2>}
        {subtitle && <p className="mt-1 text-sm text-zinc-600">{subtitle}</p>}
        {children}
      </div>
    );
  }

  const bgStyle = {
    backgroundImage: imageUrl ? `url(${imageUrl})` : "none",
    backgroundSize: "cover",
    backgroundPosition: "center",
    opacity: 0.35,
    filter: "grayscale(100%) blur(4px)",
  };

  return (
    <section
      className={`relative min-h-[160px] overflow-hidden rounded-2xl ${className}`}
    >
      <div
        className="absolute inset-0 z-0"
        style={bgStyle}
        aria-hidden
      />
      <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[1px]" aria-hidden />
      <div className="relative z-20 p-6">
        {title && (
          <h2 className="text-xl font-semibold text-zinc-900 tracking-tight">
            {title}
          </h2>
        )}
        {subtitle && (
          <p className="mt-1 text-sm text-zinc-600">{subtitle}</p>
        )}
        {children}
      </div>
    </section>
  );
}
