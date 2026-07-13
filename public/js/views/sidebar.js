import { state } from '../state.js';
import { ic } from '../icons.js';

const LOGO_SRC = "/img/logo.svg";

export function renderSidebar(){
  const items = [
    {key:"home", label:"Resumen", icon:ic.activity},
    {key:"atleta-list", label:"Atletas", icon:ic.users},
    {key:"asistencia", label:"Asistencia", icon:ic.cal2},
    {key:"admin", label:"Administración", icon:ic.clipboard},
  ];
  const pageLabels = {home:"Resumen","atleta-list":"Atletas","atleta-detail":"Perfil",asistencia:"Asistencia",admin:"Administración"};
  const currentLabel = pageLabels[state.view] || "Academia";

  const isAct = k => state.view===k || (k==="atleta-list" && state.view==="atleta-detail");

  const navHtml = items.map(it =>
    `<button class="nav-btn ${isAct(it.key)?"active":""}" data-nav="${it.key}">${it.icon}${it.label}</button>`
  ).join("");

  const bnavHtml = items.map(it =>
    `<button class="bnav-btn ${isAct(it.key)?"active":""}" data-nav="${it.key}">${it.icon}<span>${it.label}</span></button>`
  ).join("");

  return `
  <div id="sidebar">
    <div class="brand" style="justify-content:center;padding-bottom:18px;border-bottom:1px solid #ffffff22;margin-bottom:14px;">
      <img src="${LOGO_SRC}" alt="Deportivo Italia Academy" style="width:135px;height:auto;display:block;">
    </div>
    ${navHtml}
    <div class="footer">
      <div class="sched">Entrenamientos: Lun · Mié · Vie<br>Juegos: Fin de semana</div>
      <div class="status ${state.saveError?"err":"ok"}" id="saveStatus">${state.saveError? ic.alert+" Error al guardar" : ic.check+" Datos guardados"}</div>
    </div>
  </div>
  <div id="mobile-header">
    <img src="${LOGO_SRC}" alt="DIA" class="mh-logo">
    <div class="mh-title">${currentLabel}</div>
    <div class="mh-status ${state.saveError?"err":"ok"}">${ic.check}</div>
  </div>
  <nav id="bottom-nav">${bnavHtml}</nav>
  `;
}

export function renderSaveStatus(){
  const el = document.getElementById("saveStatus");
  if(!el) return;
  el.className = "status " + (state.saveError?"err":"ok");
  el.innerHTML = state.saveError? ic.alert+" Error al guardar" : ic.check+" Datos guardados";
}
