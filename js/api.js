import { state } from './state.js';
import { seedAthletes, seedTorneos } from './seed.js';

const API = "/api/data";
const HEADERS = {"Content-Type":"application/json"};

export function setRenderCallbacks(renderFn, saveStatusFn){
  window.__render = renderFn;
  window.__renderStatus = saveStatusFn;
}

export async function loadData(){
  try{
    const res = await fetch(API);
    const d = await res.json();

    if(d.athletes && d.athletes.length){ state.athletes = d.athletes; }
    else {
      state.athletes = await seedAthletes();
      fetch(API,{method:"POST",headers:HEADERS,body:JSON.stringify({key:"athletes",value:state.athletes})}).catch(()=>{});
    }
    if(d.torneos && d.torneos.length){ state.torneos = d.torneos; }
    else {
      state.torneos = seedTorneos();
      fetch(API,{method:"POST",headers:HEADERS,body:JSON.stringify({key:"torneos",value:state.torneos})}).catch(()=>{});
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
    const res = await fetch(API,{method:"POST",headers:HEADERS,body:JSON.stringify({key:"athletes",value:state.athletes})});
    const d = await res.json();
    state.saveError = !d.success;
  }catch(e){ state.saveError = true; }
  if(window.__renderStatus) window.__renderStatus();
}

export async function saveTorneos(){
  try{
    const res = await fetch(API,{method:"POST",headers:HEADERS,body:JSON.stringify({key:"torneos",value:state.torneos})});
    const d = await res.json();
    state.saveError = !d.success;
  }catch(e){ state.saveError = true; }
  if(window.__renderStatus) window.__renderStatus();
}

export async function saveConfig(){
  try{
    const res = await fetch(API,{method:"POST",headers:HEADERS,body:JSON.stringify({key:"config",value:state.config})});
    const d = await res.json();
    state.saveError = !d.success;
  }catch(e){ state.saveError = true; }
  if(window.__renderStatus) window.__renderStatus();
}
