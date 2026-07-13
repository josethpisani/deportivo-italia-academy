import { todayISO } from './utils.js';

export const state = {
  athletes: [],
  torneos: [],
  loaded: false,
  saveError: false,
  view: "home",
  activeCategory: "Todos",
  selectedId: null,
  search: "",
  adminTab: "atletas",
  regTipo: "training",
  regDate: new Date().toISOString().slice(0,10),
  regCategory: "Todos",
  athViewMode: "grid",
  editingTorneo: null,
  statsTorneo: null,
};
