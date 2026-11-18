import { state } from "../state.js";
import { CATEGORIES, TRAINING_DAYS } from "../constants.js";
import { ic } from "../icons.js";
import { escapeHtml, dayNameFromDate, staffYearAthletes } from "../utils.js";
import { statPill } from "../render-helpers.js";
import { attendanceGamesForYear, isTournamentAthlete } from "../game-attendance.js";

export function renderAttendanceTab(){
  const dayName = state.regDate ? dayNameFromDate(state.regDate) : "";
  const isTraining = state.regTipo === "training";
  const calendar = isTraining ? [] : attendanceGamesForYear();
  const categoryOf = tournament => tournament.categoria?.trim() || "Sin categoría";
  const categories = [...new Set(calendar.map(({ tournament }) => categoryOf(tournament)))]
    .sort((a, b) => a.localeCompare(b, "es", { numeric: true }));
  const category = categories.includes(state.regTournamentCategory) ? state.regTournamentCategory : "";
  const games = category ? calendar.filter(({ tournament }) => categoryOf(tournament) === category) : calendar;
  const selected = games.find(({ key }) => key === state.regGameKey);
  const roster = isTraining ? staffYearAthletes(state.athletes, state.staffYear) :
    selected ? state.athletes.filter(a => isTournamentAthlete(a, selected.tournament)) : [];
  const filtered = roster.filter(a => state.regCategory==="Todos" || a.categoria===state.regCategory);
  const statusFor = a => isTraining ? a.asistenciaEntrenamiento?.[`${state.regDate}|${dayName}`] :
    a.asistenciaJuegos?.[selected.key]?.estado;
  const presentes = filtered.filter(a => statusFor(a)==="presente").length;
  const ausentes = filtered.filter(a => statusFor(a)==="ausente").length;
  const sinMarcar = filtered.length - presentes - ausentes;

  const catChips = ["Todos",...CATEGORIES].map(cat=>
    `<button class="chip ${state.regCategory===cat?"active":""}" data-regcat="${cat}">${cat}</button>`
  ).join("");

  const rows = filtered.map(a=>{
    const status = statusFor(a);
    return `<div class="reg-row">
      <div class="who"><div class="avatar" style="width:32px;height:32px;font-size:12px;">${(a.nombre[0]||"")+(a.apellido[0]||"")}</div>
        <div><div class="name">${escapeHtml(a.nombre)} ${escapeHtml(a.apellido)}</div><div class="sub">${a.categoria}</div></div>
      </div>
      <div class="opts">
        <button class="ok ${status==="presente"?"on":""}" data-regattend="${a.id}|presente">${ic.check} Presente</button>
        <button class="no ${status==="ausente"?"on":""}" data-regattend="${a.id}|ausente">${ic.x} Ausente</button>
      </div>
    </div>`;
  }).join("") || `<p class="empty-msg" style="padding:16px;">${isTraining ? "No hay atletas en esta categoría." : "No hay atletas inscritos para mostrar."}</p>`;

  return `
    <div class="toolbar"><h1 class="page-title dia-title" style="margin:0;">Registrar Asistencia</h1><div class="view-toggle"><button class="${state.athViewMode==="grid"?"active":""}" data-staff-view="grid" title="Cuadrícula">${ic.grid}</button><button class="${state.athViewMode==="list"?"active":""}" data-staff-view="list" title="Lista">${ic.list}</button></div></div>

    <div class="reg-controls">
      <div class="reg-field"><label>Tipo</label>
        <select id="regTipoSelect">
          <option value="training" ${isTraining?"selected":""}>Entrenamiento (Lun · Mié · Vie)</option>
          <option value="game" ${!isTraining?"selected":""}>Juego de torneo</option>
        </select>
      </div>
      ${isTraining ? `<div class="reg-field"><label for="regDateInput">Fecha</label>
        <input type="date" id="regDateInput" value="${state.regDate}">
      </div>
      ${state.regDate ? `<div class="reg-hint">${TRAINING_DAYS.includes(dayName) ? ic.check + " " + dayName : ic.alert + " " + dayName + " · No es día de entrenamiento"}</div>` : ""}` :
      `<div class="reg-field"><label for="regTournamentCategory">Categoría del torneo</label>
        <select id="regTournamentCategory" ${categories.length ? "" : "disabled"}>
          <option value="">Todas las categorías</option>
          ${categories.map(item => `<option value="${escapeHtml(item)}" ${item === category ? "selected" : ""}>${escapeHtml(item)}</option>`).join("")}
        </select>
      </div>
      <div class="reg-field"><label for="regGameSelect">Juego del calendario</label>
        <select id="regGameSelect" ${games.length ? "" : "disabled"}>
          <option value="">Seleccionar juego</option>
          ${games.map(({ tournament, game, key }) => `<option value="${escapeHtml(key)}" ${key === selected?.key ? "selected" : ""}>${escapeHtml(categoryOf(tournament))} · ${escapeHtml(game.fecha || "Sin fecha")} · ${escapeHtml(tournament.nombre)} · vs. ${escapeHtml(game.rival)}</option>`).join("")}
        </select>
      </div>`}
    </div>

    ${!isTraining && !selected ? `<p class="empty-msg">${games.length ? "Selecciona un juego para registrar la asistencia." : "No hay juegos en el calendario de este año."}</p>` : `
    <div class="filters" role="group" aria-label="Categoría del atleta">${catChips}</div>

    <div class="reg-summary">
      ${statPill(ic.check,"Presentes",presentes,"var(--green)")}
      ${statPill(ic.x,"Ausentes",ausentes,"var(--red)")}
      ${statPill(ic.clock,"Sin marcar",sinMarcar,"var(--pitch)")}
    </div>

    <div class="chart-card" style="margin-bottom:18px;">
      <h4>Asistencia ${isTraining ? "del entrenamiento" : "del juego"}</h4>
      <div class="chart-wrap short"><canvas id="chartRegDay" data-presentes="${presentes}" data-ausentes="${ausentes}"></canvas></div>
    </div>

    <div class="reg-table ${state.athViewMode==="grid"?"athlete-grid-mode":""}">${rows}</div>`}
  `;
}
