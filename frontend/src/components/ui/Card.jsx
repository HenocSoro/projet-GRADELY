/**
 * Carte glassmorphism premium — design system Gradely
 * bg-white/80 backdrop-blur rounded-2xl shadow-sm ring-1 ring-zinc-200
 */

export default function Card({ children, className = "", hoverable = false }) {
  return (
    <div
      className={`rounded-2xl bg-white/80 backdrop-blur shadow-sm ring-1 ring-zinc-200/80 transition-all duration-200 ${
        hoverable ? "hover:shadow-md hover:ring-zinc-300/80" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
