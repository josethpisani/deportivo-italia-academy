import { state } from "./state.js";
import { seedAthletes, seedTorneos } from "./seed.js";

const API = "/api/data";
const HEADERS = {"Content-Type":"application/json"};

export function setRenderCallbacks(renderFn, saveStatusFn){
  window.__render = renderFn;
  window.__renderStatus = saveStatusFn;
}

function getSedeId() {
  return state.currentSede?.id || null;
}

async function fetchWithSede(endpoint, options = {}) {
  const sedeId = getSedeId();
  const url = sedeId ? `${API}?sede_id=${sedeId}` : API;
  return fetch(url, { ...options, headers: HEADERS });
}

export async function loadSedes() {
  try {
    const res = await fetch(`${API}?key=sedes`);
    const sedes = await res.json();
    state.sedes = sedes || [];
    
    // Set default sede if not set
    if (!state.currentSede && state.sedes.length > 0) {
      state.currentSede = state.sedes[0];
    }
  } catch (e) {
    console.warn("Could not load sedes:", e);
    state.sedes = [];
  }
}

export async function loadData(){
  try {
    const res = await fetchWithSede(API);
    const d = await res.json();

    if(d.athletes && d.athletes.length){ state.athletes = d.athletes; }
    else {
      state.athletes = await seedAthletes();
      // Don't auto-save seed data for new branches
    }
    
    if(d.torneos && d.torneos.length){ state.torneos = d.torneos; }
    else {
      state.torneos = seedTorneos();
    }
    
    if(d.config && Object.keys(d.config).length){ state.config = d.config; }
  }catch(e){
    console.warn("No se pudo conectar al servidor, usando datos locales.");
    state.athletes = await seedAthletes();
    state.torneos = seedTorneos();
  }finally{
    state.loaded = true;
    if(window.__render) window.__render();
  }
}

export async function saveAthletes(){
  try{
    const sedeId = getSedeId();
    if (!sedeId) throw new Error("No sede selected");
    
    const res = await fetch(`${API}?sede_id=${sedeId}`,{
      method:"POST",
      headers:HEADERS,
      body:JSON.stringify({key:"athletes", value:state.athletes, sede_id: sedeId})
    });
    const d = await res.json();
    state.saveError = !d.success;
  }catch(e){ state.saveError = true; }
  if(window.__renderStatus) window.__renderStatus();
}

export async function saveTorneos(){
  try{
    const sedeId = getSedeId();
    if (!sedeId) throw new Error("No sede selected");
    
    const res = await fetch(`${API}?sede_id=${sedeId}`,{
      method:"POST",
      headers:HEADERS,
      body:JSON.stringify({key:"torneos", value:state.torneos, sede_id: sedeId})
    });
    const d = await res.json();
    state.saveError = !d.success;
  }catch(e){ state.saveError = true; }
  if(window.__renderStatus) window.__renderStatus();
}

export async function saveConfig(){
  try{
    const sedeId = getSedeId();
    if (!sedeId) throw new Error("No sede selected");
    const res = await fetch(`${API}?sede_id=${encodeURIComponent(sedeId)}`,{
      method:"POST",
      headers:HEADERS,
      body:JSON.stringify({key:"config", value:state.config, sede_id:sedeId})
    });
    const d = await res.json();
    state.saveError = !d.success;
  }catch(e){ state.saveError = true; }
  if(window.__renderStatus) window.__renderStatus();
}

export async function saveSede(sedeData) {
  try {
    const res = await fetch(API, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({ key: "sedes", value: sedeData })
    });
    const d = await res.json();
    return d.success;
  } catch (e) {
    return false;
  }
}

export async function updateSede(sedeId, updates) {
  try {
    const res = await fetch(API, {
      method: "PUT",
      headers: HEADERS,
      body: JSON.stringify({ key: "sede", itemId: sedeId, updates })
    });
    const d = await res.json();
    return d.success;
  } catch (e) {
    return false;
  }
}

export async function loadSiteContent() {
  try {
    const res = await fetch(`${API}?key=siteContent`);
    const content = await res.json();
    if (content) state.siteContent = { ...state.siteContent, ...content };
  } catch (e) {
    console.warn("Could not load site content");
  }
}

export async function saveSiteContent(content) {
  try {
    const res = await fetch(API, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({ key: "siteContent", value: content })
    });
    const d = await res.json();
    return d.success;
  } catch (e) {
    return false;
  }
}

export function setCurrentSede(sede) {
  state.currentSede = sede;
  // Reset data when switching branches
  state.athletes = [];
  state.torneos = [];
  state.adminAuth = false;
  state.view = "home";
  state.selectedId = null;
  state.statsAthleteId = null;
  state.evalAthleteId = null;
  state.torneoId = null;
}

export async function createTrialRequest(data) {
  try {
    const res = await fetch(API, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({ key: "trial_requests", value: data })
    });
    return await res.json();
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function getTrialRequests(filters = {}) {
  try {
    const params = new URLSearchParams();
    params.set('key', 'trial_requests');
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null) params.set(k, v);
    });
    const res = await fetch(`${API}?${params.toString()}`);
    return await res.json();
  } catch (e) {
    return [];
  }
}
