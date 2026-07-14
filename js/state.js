import { todayISO } from './utils.js';
import { CATEGORIES } from './constants.js';

const defaultConfig = {};
CATEGORIES.forEach(c => {
  defaultConfig[c] = { matricula: 35, mensualidad: 20 };
});

export const state = {
  athletes: [],
  torneos: [],
  config: JSON.parse(JSON.stringify(defaultConfig)),
  loaded: false,
  saveError: false,
  view: "home",
  activeCategory: "Todos",
  selectedId: null,
  search: "",
  adminTab: "config",
  regTipo: "training",
  regDate: new Date().toISOString().slice(0,10),
  regCategory: "Todos",
  athViewMode: "grid",
  editingTorneo: null,
  statsTorneo: null,
  mensualMonth: new Date().toISOString().slice(0,7),
  adminAuth: false,
};
