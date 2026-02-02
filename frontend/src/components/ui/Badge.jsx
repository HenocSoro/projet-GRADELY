/**
 * Badge de statut — design system Gradely
 * variant: pending | approved | rejected | submitted | to_submit | default
 */

const VARIANT_STYLES = {
  to_submit: "bg-amber-100 text-amber-800 ring-amber-200",
  submitted: "bg-brand-100 text-brand-800 ring-brand-200",
  pending: "bg-sky-100 text-sky-800 ring-sky-200",
  approved: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  validated: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  rejected: "bg-rose-100 text-rose-800 ring-rose-200",
  default: "bg-zinc-100 text-zinc-700 ring-zinc-200",
};

export default function Badge({
  children,
  variant = "default",
  className = "",
}) {
  const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset";
  const variantClass = VARIANT_STYLES[variant] ?? VARIANT_STYLES.default;
  return (
    <span className={`${base} ${variantClass} ${className}`}>
      {children}
    </span>
  );
}
