import { escapeHtml } from "./utils.js";

export function athletePhoto(athlete, sedeId) {
  const initials = [athlete.nombre, athlete.apellido].map(name => name?.trim()[0] || "").join("").toUpperCase();
  const query = new URLSearchParams({ key: "athlete_photo", id: athlete.id, sede_id: sedeId || "" });
  const name = [athlete.nombre, athlete.apellido].filter(Boolean).join(" ");
  return `<span aria-hidden="true">${escapeHtml(initials)}</span><img class="athlete-photo" src="/api/data?${escapeHtml(query.toString())}" alt="${escapeHtml(name)}" loading="lazy">`;
}
