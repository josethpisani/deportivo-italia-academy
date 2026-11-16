import { escapeHtml } from "./utils.js";

export const galleryCategories = ["Entrenamientos", "Partidos", "Torneos", "Eventos", "Jugadores", "Sedes"];
// A 3.3 MB video uses 4.4 MB in Base64, leaving room for JSON metadata.
export const galleryVideoMaxBytes = 3_300_000;
export const galleryVideoMaxLabel = "3,3 MB";

export function galleryGroups(items) {
  const groups = new Map(galleryCategories.map(category => [category, []]));
  items.forEach((item, index) => {
    const category = item.categoria || "General";
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category).push({ item, index });
  });
  return [...groups].filter(([, entries]) => entries.length);
}

export function galleryMedia(item) {
  const url = escapeHtml(item.url || "");
  const label = escapeHtml(item.descripcion || item.categoria || "Galería Deportivo Italia");
  return item.tipo === "video"
    ? `<video class="gallery-video" src="${url}" aria-label="${label}" controls playsinline preload="none"></video>`
    : `<img src="${url}" alt="${label}" loading="lazy">`;
}
