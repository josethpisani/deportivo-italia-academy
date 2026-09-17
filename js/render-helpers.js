import { escapeHtml } from './utils.js';

export function statPill(icon, label, value, accent){
  return `<div class="stat-pill"><div class="icon" style="background:${accent}">${icon}</div>
    <div><div class="val">${value}</div><div class="lbl">${label}</div></div></div>`;
}
export function badge(text, tone){ return `<span class="badge ${tone}">${escapeHtml(text)}</span>`; }
export function initials(a){ return (a.nombre[0]||"") + (a.apellido[0]||""); }
