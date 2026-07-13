import { state } from './state.js';
import { seedAthletes, seedTorneos } from './seed.js';
import { render, renderSaveStatus } from './app.js';

const API = "/api/data";
const HEADERS = {"Content-Type":"application/json"};

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
  }catch(e){
    console.warn("No se pudo conectar al servidor, usando datos locales.");
    state.athletes = await seedAthletes();
    state.torneos = seedTorneos();
  }finally{
    state.loaded = true;
    render();
  }
}

export async function saveAthletes(){
  try{
    const res = await fetch(API,{method:"POST",headers:HEADERS,body:JSON.stringify({key:"athletes",value:state.athletes})});
    const d = await res.json();
    state.saveError = !d.success;
  }catch(e){ state.saveError = true; }
  renderSaveStatus();
}

export async function saveTorneos(){
  try{
    const res = await fetch(API,{method:"POST",headers:HEADERS,body:JSON.stringify({key:"torneos",value:state.torneos})});
    const d = await res.json();
    state.saveError = !d.success;
  }catch(e){ state.saveError = true; }
  renderSaveStatus();
}
