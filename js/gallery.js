import { escapeHtml } from "./utils.js";

export const galleryCategories = ["Entrenamientos", "Partidos", "Torneos", "Eventos", "Jugadores", "Sedes"];

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
