import { state } from '../state.js';
import { CATEGORIES, TRAINING_DAYS } from '../constants.js';
import { ic } from '../icons.js';
import { escapeHtml, dayNameFromDate } from '../utils.js';
import { statPill } from '../render-helpers.js';

export function renderAttendanceTab(){
  const dayName = state.regDate ? dayNameFromDate(state.regDate) : "";
  const dateKey = state.regDate ? `${state.regDate}|${dayName}` : "";
  const isTraining = state.regTipo === "training";
  const field = isTraining ? "asistenciaEntrenamiento" : "asistenciaJuegos";
  const validDay = isTraining ? TRAINING_DAYS.includes(dayName) : (dayName==="Sábado" || dayName==="Domingo");

  const filtered = state.athletes.filter(a => state.regCategory==="Todos" || a.categoria===state.regCategory);
  const presentes = filtered.filter(a => a[field][dateKey]==="presente").length;
  const ausentes = filtered.filter(a => a[field][dateKey]==="ausente").length;
  const sinMarcar = filtered.length - presentes - ausentes;

  const catChips = ["Todos",...CATEGORIES].map(cat=>
    `<button class="chip ${state.regCategory===cat?"active":""}" data-regcat="${cat}">${cat}</button>`
  ).join("");

  const rows = filtered.map(a=>{
    const status = a[field][dateKey];
    return `<div class="reg-row">
      <div class="who"><div class="avatar" style="width:32px;height:32px;font-size:12px;">${(a.nombre[0]||"")+(a.apellido[0]||"")}</div>
        <div><div class="name">${escapeHtml(a.nombre)} ${escapeHtml(a.apellido)}</div><div class="sub">${a.categoria} · ${a.posicion}</div></div>
      </div>
      <div class="opts">
        <button class="ok ${status==="presente"?"on":""}" data-regattend="${a.id}|presente">${ic.check} Presente</button>
        <button class="no ${status==="ausente"?"on":""}" data-regattend="${a.id}|ausente">${ic.x} Ausente</button>
      </div>
    </div>`;
  }).join("") || `<p class="empty-msg" style="padding:16px;">No hay atletas en esta categoría.</p>`;

  return `
    <h1 class="page-title dia-title">Registrar Asistencia</h1>
    <p class="page-sub">Marca presente o ausente por fecha, para entrenamientos o juegos</p>

    <div class="reg-controls">
      <div class="reg-field"><label>Tipo</label>
        <select id="regTipoSelect">
          <option value="training" ${isTraining?"selected":""}>Entrenamiento (Lun · Mié · Vie)</option>
          <option value="game" ${!isTraining?"selected":""}>Juego (fin de semana)</option>
        </select>
      </div>
      <div class="reg-field"><label>Fecha</label>
        <input type="date" id="regDateInput" value="${state.regDate}">
      </div>
      ${state.regDate ? `<div class="reg-hint">${validDay? ic.check : ic.alert} ${dayName}${validDay ? "" : (isTraining ? " — no es día de entrenamiento" : " — no es fin de semana")}</div>` : ""}
    </div>

    <div class="filters">${catChips}</div>

    <div class="reg-summary">
      ${statPill(ic.check,"Presentes",presentes,"var(--green)")}
      ${statPill(ic.x,"Ausentes",ausentes,"var(--red)")}
      ${statPill(ic.clock,"Sin marcar",sinMarcar,"var(--pitch)")}
    </div>

    <div class="chart-card" style="margin-bottom:18px;">
      <h4>Asistencia del día por categoría</h4>
      <div class="chart-wrap short"><canvas id="chartRegDay"></canvas></div>
    </div>

    <div class="reg-table">${rows}</div>
  `;
}
