/**
 * Bouton — design system Gradely
 * variant: primary | secondary | ghost | danger
 */

const VARIANT_STYLES = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 focus:ring-brand-500",
  secondary:
    "bg-white/80 text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50 focus:ring-zinc-400",
  ghost: "text-zinc-600 hover:bg-zinc-100 focus:ring-zinc-300",
  danger: "bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500",
};

export default function Button({
  children,
  variant = "primary",
  type = "button",
  disabled = false,
  className = "",
  ...props
}) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-60 disabled:cursor-not-allowed";
  const variantClass = VARIANT_STYLES[variant] ?? VARIANT_STYLES.primary;
  return (
    <button
      type={type}
      disabled={disabled}
      className={`${base} ${variantClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
