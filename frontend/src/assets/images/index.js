/**
 * Images Unsplash locales — export centralisé.
 * Fichiers dans src/assets/images/ (chemins relatifs, compatible Vite).
 * Normalisation : Vite ?url peut renvoyer une string ou { default: string }.
 */
function url(m) {
  return typeof m === "string" ? m : m?.default ?? null;
}

import headwayUrl from "./headway-5QgIuuBxKwM-unsplash.jpg?url";
import lucaBravoUrl from "./luca-bravo-XJXWbfSo2f0-unsplash.jpg?url";
import scottGrahamUrl from "./scott-graham-OQMZwNd3ThU-unsplash.jpg?url";
import kobuAgencyUrl from "./kobu-agency-7okkFhxrxNw-unsplash.jpg?url";
import desolaUrl from "./desola-lanre-ologun-IgUR1iX0mqM-unsplash.jpg?url";

export const headway = url(headwayUrl);
export const lucaBravo = url(lucaBravoUrl);
export const scottGraham = url(scottGrahamUrl);
export const kobuAgency = url(kobuAgencyUrl);
export const desola = url(desolaUrl);
