import { state } from './state.js';
import { uid, todayISO } from './utils.js';
import { makeAthlete } from './seed.js';
import { saveAthletes, saveTorneos } from './api.js';
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
  saveAthletes();
  if(window.__render) window.__render();
}

export function addAthlete(data){
  const newA = makeAthlete(data.categoria, state.athletes.length+1);
  Object.assign(newA, {
    nombre:data.nombre, apellido:data.apellido, edad:Number(data.edad),
    categoria:data.categoria, posicion:data.posicion, representante:data.representante,
    telefono:data.telefono, fechaNacimiento:data.fechaNacimiento,
    matricula:{ estado:"pendiente", monto:35, fecha:todayISO() },
  });
  state.athletes.push(newA);
  saveAthletes();
  closeModal();
  if(window.__render) window.__render();
}

export function addTorneo(data){
  state.torneos.push({ id: uid("tor"), nombre:data.nombre, fecha:data.fecha, categoria:data.categoria, monto:Number(data.monto) });
  saveTorneos();
  closeModal();
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
