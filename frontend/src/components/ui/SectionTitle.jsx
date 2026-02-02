/**
 * Titre de section — design system Gradely
 * Hiérarchie visuelle claire
 */

export default function SectionTitle({
  children,
  subtitle,
  className = "",
}) {
  return (
    <div className={className}>
      <h3 className="text-lg font-semibold text-zinc-900 tracking-tight">
        {children}
      </h3>
      {subtitle && (
        <p className="mt-0.5 text-sm text-zinc-500">{subtitle}</p>
      )}
    </div>
  );
}
