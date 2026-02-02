/**
 * Logo Gradely — identité visuelle.
 * Import unique, pas de blur/opacité/filtre, ratio préservé (width: auto).
 * Variants : navbar (48px), auth (96px).
 */

import gradelyLogo from "@/assets/logo/gradely-logo.png";

const HEIGHTS = {
  navbar: "h-40",  // 160px — bien lisible
  auth: "h-32",   // 128px
};

export default function Logo({ variant = "navbar", className = "" }) {
  const heightClass = HEIGHTS[variant] ?? HEIGHTS.navbar;

  return (
    <img
      src={gradelyLogo}
      alt="Gradely"
      className={`${heightClass} w-auto object-contain object-center ${className}`}
      width="auto"
      height={variant === "navbar" ? 160 : 128}
      draggable={false}
    />
  );
}
