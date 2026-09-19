import { state } from "../state.js";
import { ic } from "../icons.js";

const LOGO_SRC = "/img/logo-deportivoitalia.png";

export function renderSidebar(){
  const items = [
    {key:"home", label:"Resumen", icon:ic.activity},
    {key:"atleta-list", label:"Atletas", icon:ic.users},
    {key:"asistencia", label:"Asistencia", icon:ic.cal2},
    {key:"torneos", label:"Torneos", icon:ic.shield},
    {key:"estadisticas", label:"Estadísticas", icon:ic.trophy},
    {key:"evaluaciones", label:"Evaluaciones", icon:ic.trend},
    {key:"admin", label:"Administración", icon:ic.clipboard},
  ];
  const pageLabels = {home:"Resumen","atleta-list":"Atletas","atleta-detail":"Perfil",asistencia:"Asistencia",torneos:"Torneos","torneo-detail":"Torneo",estadisticas:"Estadísticas",evaluaciones:"Evaluaciones",admin:"Administración"};
  const currentLabel = pageLabels[state.view] || "Academia";

  const isAct = k => state.view===k || (k==="atleta-list" && state.view==="atleta-detail") || (k==="torneos" && state.view==="torneo-detail");

  const navHtml = items.map(it =>
    `<button class="nav-btn ${isAct(it.key)?"active":""}" data-nav="${it.key}">${it.icon}${it.label}</button>`
  ).join("");

  const bnavHtml = items.map(it =>
    `<button class="bnav-btn ${isAct(it.key)?"active":""}" data-nav="${it.key}">${it.icon}<span>${it.label}</span></button>`
  ).join("");

  // Branch selector HTML - only shows current sede + logout (no switching without re-login)
  const sedeHtml = state.currentSede ? `
    <div class="sede-selector">
      <div class="sede-current">
        <span class="sede-icon">${ic.mapPin}</span>
        <span class="sede-name">${state.currentSede.nombre}</span>
        <span class="sede-code">${state.currentSede.codigo}</span>
        <button class="btn-sede-switch" id="btnSedeSwitch" title="Opciones de sede">${ic.moreHorizontal}</button>
      </div>
      <div class="sede-dropdown" id="sedeDropdown" style="display:none;">
        <div class="sede-dropdown-header">
          <span class="sede-opt-name">${state.currentSede.nombre}</span>
          <span class="sede-opt-code">${state.currentSede.codigo}</span>
        </div>
        <div class="sede-divider"></div>
        <button class="sede-option sede-manage" data-sede-id="manage">
          ${ic.settings} Gestionar sedes
        </button>
        <div class="sede-divider"></div>
        <button class="sede-option sede-logout" data-action="logout">
          ${ic.logOut} Cerrar sesión
        </button>
      </div>
    </div>
  ` : '';

  const sedeIndicator = state.currentSede ? `
    <div class="sede-indicator-header">
      <span class="sede-badge">${ic.mapPin} ${state.currentSede.nombre}</span>
      <span class="sede-badge-code">${state.currentSede.codigo}</span>
    </div>
  ` : '';

  return `
  <div id="sidebar">
    <div class="brand" style="justify-content:center;padding-bottom:18px;border-bottom:1px solid #ffffff22;margin-bottom:14px;">
      <img src="${LOGO_SRC}" alt="Deportivo Italia Academy" style="width:135px;height:auto;display:block;">
    </div>
    ${sedeIndicator}
    ${sedeHtml}
    ${navHtml}
    <div class="footer">
      <div class="sched">Entrenamientos: Lun · Mié · Vie<br>Juegos: Fin de semana</div>
      <div class="status ${state.saveError?"err":"ok"}" id="saveStatus">${state.saveError? ic.alert+" Error al guardar" : ic.check+" Datos guardados"}</div>
    </div>
  </div>
  <div id="mobile-header">
    <img src="${LOGO_SRC}" alt="DIA" class="mh-logo">
    <div class="mh-title">${currentLabel} ${state.currentSede ? `· ${state.currentSede.codigo}` : ''}</div>
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
