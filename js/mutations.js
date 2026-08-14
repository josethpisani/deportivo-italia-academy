import { state } from './state.js';
import { uid, todayISO } from './utils.js';
import { makeAthlete } from './seed.js';
import { saveAthletes, saveTorneos, saveConfig } from './api.js';
import { closeModal } from './modals.js';

export function updateAthlete(id, patch){
  const a = state.athletes.find(x=>x.id===id);
  Object.assign(a, patch);
  saveAthletes();
}

export function toggleAttendance(athleteId, type, dateKey, status){
  const a = state.athletes.find(x=>x.id===athleteId);
  const field = type==="training" ? "asistenciaEntrenamiento" : "asistenciaJuegos";
  if(a[field][dateKey]===status) delete a[field][dateKey];
  else a[field][dateKey] = status;
  if(!a.statsGenerales) a.statsGenerales = { goles:0, asistencias:0, tarjetasAmarillas:0, tarjetasRojas:0, partidosJugados:0, entrenamientosAsistidos:0, entrenamientosTotales:0 };
  const trainEntries = Object.entries(a.asistenciaEntrenamiento);
  a.statsGenerales.entrenamientosTotales = trainEntries.length;
  a.statsGenerales.entrenamientosAsistidos = trainEntries.filter(([,v])=>v==="presente").length;
  saveAthletes();
  if(window.__render) window.__render();
}

export function addAthlete(data){
  const costoMatricula = (state.config[data.categoria] && state.config[data.categoria].matricula) || 35;
  const newA = makeAthlete(data.categoria, state.athletes.length+1);
  Object.assign(newA, {
    nombre:data.nombre, apellido:data.apellido, edad:Number(data.edad),
    categoria:data.categoria, posicion:data.posicion, representante:data.representante,
    telefono:data.telefono, fechaNacimiento:data.fechaNacimiento,
    direccion:data.direccion||"",
    matricula:{ estado:"pendiente", monto:costoMatricula, fecha:todayISO() },
  });
  state.athletes.push(newA);
  saveAthletes();
  closeModal();
  if(window.__render) window.__render();
}

export function addTorneo(data){
  state.torneos.push({ id: uid("tor"), nombre:data.nombre, fecha:data.fecha, categoria:data.categoria, monto:Number(data.monto), descripcion:data.descripcion||"", juegos:[] });
  saveTorneos();
  closeModal();
  if(window.__render) window.__render();
}

export function updateTorneo(id, patch){
  const t = state.torneos.find(x=>x.id===id);
  Object.assign(t, patch);
  saveTorneos();
  closeModal();
  if(window.__render) window.__render();
}

export function deleteTorneo(id){
  state.torneos = state.torneos.filter(t=>t.id!==id);
  state.athletes.forEach(a=>{
    a.torneos = a.torneos.filter(t=>t.torneoId!==id);
    if(a.estadisticas) delete a.estadisticas[id];
    if(a.juegosStats) delete a.juegosStats[id];
  });
  saveTorneos();
  saveAthletes();
  if(window.__render) window.__render();
}

export function setMatricula(athleteId, estado){
  const a = state.athletes.find(x=>x.id===athleteId);
  a.matricula = { ...a.matricula, estado, fecha: todayISO() };
  saveAthletes();
  if(window.__render) window.__render();
}

export function setTorneoPago(athleteId, torneoId, pagado){
  const a = state.athletes.find(x=>x.id===athleteId);
  a.torneos = a.torneos.filter(t=>t.torneoId!==torneoId);
  if(pagado) a.torneos.push({ torneoId, fecha: todayISO() });
  saveAthletes();
  if(window.__render) window.__render();
}

export function toggleTorneoAtleta(athleteId, torneoId){
  const a = state.athletes.find(x=>x.id===athleteId);
  const exists = a.torneos.some(t=>t.torneoId===torneoId);
  if(exists) a.torneos = a.torneos.filter(t=>t.torneoId!==torneoId);
  else a.torneos.push({ torneoId, fecha: todayISO() });
  saveAthletes();
  if(window.__render) window.__render();
}

export function saveObservaciones(athleteId, text){
  const a = state.athletes.find(x=>x.id===athleteId);
  a.observaciones = text;
  saveAthletes();
}

export function saveEstadisticas(entries){
  entries.forEach(({athleteId, torneoId, stats})=>{
    const a = state.athletes.find(x=>x.id===athleteId);
    if(!a) return;
    if(!a.estadisticas) a.estadisticas = {};
    a.estadisticas[torneoId] = { ...stats };
  });
  saveAthletes();
  if(window.__render) window.__render();
}

export function saveEstadistica(athleteId, torneoId, stats){
  const a = state.athletes.find(x=>x.id===athleteId);
  if(!a.estadisticas) a.estadisticas = {};
  a.estadisticas[torneoId] = { ...stats };
  saveAthletes();
  if(window.__render) window.__render();
}

export function addJuego(torneoId, data){
  const t = state.torneos.find(x=>x.id===torneoId);
  if(!t) return;
  if(!t.juegos) t.juegos = [];
  t.juegos.push({ id: uid("jue"), rival:data.rival, fecha:data.fecha, marcadorF:Number(data.marcadorF)||0, marcadorC:Number(data.marcadorC)||0, estado:data.estado });
  saveTorneos();
  closeModal();
  if(window.__render) window.__render();
}

export function updateJuego(torneoId, juegoId, patch){
  const t = state.torneos.find(x=>x.id===torneoId);
  if(!t) return;
  const j = (t.juegos||[]).find(x=>x.id===juegoId);
  if(!j) return;
  Object.assign(j, patch);
  if(patch.marcadorF != null) j.marcadorF = Number(patch.marcadorF)||0;
  if(patch.marcadorC != null) j.marcadorC = Number(patch.marcadorC)||0;
  saveTorneos();
  closeModal();
  if(window.__render) window.__render();
}

export function recomputeTorneoStats(torneoId){
  state.athletes.forEach(a=>{
    const games = a.juegosStats && a.juegosStats[torneoId];
    if(!games) return;
    const totals = { goles:0, asistencias:0, tarjetasAmarillas:0, tarjetasRojas:0, partidosJugados:0 };
    const played = Object.keys(games).filter(gid=>{
      const s = games[gid];
      return (s.goles||0)+(s.asistencias||0)+(s.tarjetasAmarillas||0)+(s.tarjetasRojas||0) > 0;
    });
    totals.partidosJugados = played.length;
    Object.values(games).forEach(s=>{
      totals.goles += s.goles||0;
      totals.asistencias += s.asistencias||0;
      totals.tarjetasAmarillas += s.tarjetasAmarillas||0;
      totals.tarjetasRojas += s.tarjetasRojas||0;
    });
    if(!a.estadisticas) a.estadisticas = {};
    a.estadisticas[torneoId] = totals;
  });
}

export function saveJuegoStats(torneoId, juegoId, entries){
  entries.forEach(({athleteId, stats})=>{
    const a = state.athletes.find(x=>x.id===athleteId);
    if(!a) return;
    if(!a.juegosStats) a.juegosStats = {};
    if(!a.juegosStats[torneoId]) a.juegosStats[torneoId] = {};
    a.juegosStats[torneoId][juegoId] = { ...stats };
  });
  recomputeTorneoStats(torneoId);
  saveAthletes();
  if(window.__render) window.__render();
}

export function deleteJuego(torneoId, juegoId){
  const t = state.torneos.find(x=>x.id===torneoId);
  if(!t) return;
  t.juegos = (t.juegos||[]).filter(j=>j.id!==juegoId);
  state.athletes.forEach(a=>{
    if(a.juegosStats && a.juegosStats[torneoId]) delete a.juegosStats[torneoId][juegoId];
  });
  recomputeTorneoStats(torneoId);
  saveTorneos();
  saveAthletes();
  if(window.__render) window.__render();
}

export function saveConfigData(newConfig){
  Object.assign(state.config, newConfig);
  state.athletes.forEach(a=>{
    if(!a.mensualidades) a.mensualidades = {};
    const catCfg = newConfig[a.categoria] || {};
    if(a.matricula.estado==="pendiente" && catCfg.matricula != null){
      a.matricula.monto = Number(catCfg.matricula);
    }
    Object.keys(a.mensualidades).forEach(mes=>{
      const m = a.mensualidades[mes];
      if(m.estado==="pendiente" && catCfg.mensualidad != null){
        m.monto = Number(catCfg.mensualidad);
      }
    });
  });
  saveConfig();
  saveAthletes();
  if(window.__render) window.__render();
}

export function setMensualidad(athleteId, mes, estado){
  const a = state.athletes.find(x=>x.id===athleteId);
  if(!a) return;
  if(!a.mensualidades) a.mensualidades = {};
  const costo = (state.config[a.categoria] && state.config[a.categoria].mensualidad) || 20;
  if(estado){
    a.mensualidades[mes] = { estado:"pagado", monto: a.mensualidades[mes]?.monto || costo, fecha: todayISO() };
  } else {
    a.mensualidades[mes] = { estado:"pendiente", monto: a.mensualidades[mes]?.monto || costo, fecha: todayISO() };
  }
  saveAthletes();
  if(window.__render) window.__render();
}

export function markAllMensualidades(mes){
  state.athletes.forEach(a=>{
    if(!a.mensualidades) a.mensualidades = {};
    if(!a.mensualidades[mes]){
      const costo = (state.config[a.categoria] && state.config[a.categoria].mensualidad) || 20;
      a.mensualidades[mes] = { estado:"pendiente", monto:costo, fecha:todayISO() };
    }
  });
  saveAthletes();
  if(window.__render) window.__render();
}

export function updateAthleteCosts(athleteId, matriculaMonto, mensualidadMonto){
  const a = state.athletes.find(x=>x.id===athleteId);
  if(!a) return;
  if(a.matricula.estado==="pendiente") a.matricula.monto = Number(matriculaMonto);
  if(!a.mensualidades) a.mensualidades = {};
  Object.keys(a.mensualidades).forEach(mes=>{
    if(a.mensualidades[mes].estado==="pendiente"){
      a.mensualidades[mes].monto = Number(mensualidadMonto);
    }
  });
  a._mensualidadMonto = Number(mensualidadMonto);
  saveAthletes();
  if(window.__render) window.__render();
}

export function saveStatsGenerales(athleteId, stats){
  const a = state.athletes.find(x=>x.id===athleteId);
  if(!a) return;
  if(!a.statsGenerales) a.statsGenerales = {};
  Object.assign(a.statsGenerales, stats);
  saveAthletes();
}

export function saveObservacionesStats(athleteId, text){
  const a = state.athletes.find(x=>x.id===athleteId);
  if(!a) return;
  a.observaciones = text;
  saveAthletes();
}

export function saveEvaluacion(athleteId, evalData){
  const a = state.athletes.find(x=>x.id===athleteId);
  if(!a) return;
  if(!a.evaluaciones) a.evaluaciones = {};
  if(evalData.id){
    const idx = a.evaluaciones.findIndex(e=>e.id===evalData.id);
    if(idx>=0) a.evaluaciones[idx] = evalData;
    else a.evaluaciones.push(evalData);
  } else {
    evalData.id = uid("eval");
    evalData.fecha = todayISO();
    a.evaluaciones.push(evalData);
  }
  saveAthletes();
  if(window.__render) window.__render();
}

export function deleteAthlete(athleteId){
  if(!confirm("¿Seguro que deseas eliminar este atleta? Esta acción no se puede deshacer.")) return;
  state.athletes = state.athletes.filter(a=>a.id!==athleteId);
  state.selectedId = null;
  state.view = "atleta-list";
  saveAthletes();
  if(window.__render) window.__render();
}

export function deleteEvaluacion(athleteId, evalId){
  const a = state.athletes.find(x=>x.id===athleteId);
  if(!a) return;
  a.evaluaciones = (a.evaluaciones||[]).filter(e=>e.id!==evalId);
  saveAthletes();
  if(window.__render) window.__render();
}
