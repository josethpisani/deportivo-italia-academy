import { todayISO } from "./utils.js";
import { CATEGORIES } from "./constants.js";

const defaultConfig = {};
CATEGORIES.forEach(c => {
  defaultConfig[c] = { matricula: 35, mensualidad: 20 };
});

export const state = {
  // Branch context
  currentSede: null,
  sedes: [],
  
  // Data (filtered by currentSede)
  athletes: [],
  torneos: [],
  config: JSON.parse(JSON.stringify(defaultConfig)),
  
  // App state
  loaded: false,
  saveError: false,
  view: "public-home", // New: public home page
  activeCategory: "Todos",
  selectedId: null,
  athleteReadOnly: true,
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
  adminTrialRequests: [],
  trialFilters: { search: "", category: "", status: "", date: "", date_from: "", date_to: "" },
  statsAthleteId: null,
  statsCategory: "Todos",
  evalAthleteId: null,
  evalCategory: "Todos",
  evalEditingId: null,
  torneoId: null,
  
  // Public site content
  siteContent: {
    hero: {
      title: "DEPORTIVO ITALIA ACADEMY",
      subtitle: "Formando futbolistas, desarrollando talentos y construyendo valores.",
      ctaPrimary: "Conoce nuestra academia",
      ctaSecondary: "Acceder al sistema"
    },
    nosotros: {
      historia: "",
      mision: "",
      vision: "",
      valores: "",
      filosofia: "",
      metodologia: ""
    },
    sedes: {},
    galeria: [],
    contacto: {
      telefono: "",
      whatsapp: "",
      email: "",
      redes: {}
    }
  }
};
