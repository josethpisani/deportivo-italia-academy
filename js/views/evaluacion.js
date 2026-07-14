import { state } from '../state.js';
import { CATEGORIES } from '../constants.js';
import { ic } from '../icons.js';
import { escapeHtml } from '../utils.js';
import { statPill, badge, initials } from '../render-helpers.js';
import { todayISO } from '../utils.js';

const DEFAULT_ITEMS = [
  "Técnica individual",
  "Velocidad",
  "Resistencia",
  "Compañerismo",
  "Disciplina",
  "Actitud",
  "Potencia de tiro",
  "Control del balón",
  "Visión de juego",
  "Liderazgo",
];

const ITEM_COLORS = ["#0E4C86","#1FA855","#E8922D","#C23B33","#7B4FD4","#2BA5AD","#4A90D9","#D4A843","#8E44AD","#27AE60"];

function avgScore(items){
  const vals = Object.values(items);
  if(!vals.length) return 0;
  return (vals.reduce((s,v)=>s+v,0)/vals.length).toFixed(1);
}

function evalCardHtml(ev){
  const avg = avgScore(ev.items);
  const avgNum = Number(avg);
  const color = avgNum>=8?"good":avgNum>=6?"neutral":"bad";
  return `<div class="eval-card">
    <div class="eval-head">
      <div><div class="eval-date">${ev.fecha}</div>${ev.descripcion ? `<div class="eval-desc">${escapeHtml(ev.descripcion)}</div>` : ""}</div>
      <div class="eval-avg">${badge("Promedio: "+avg, color)}</div>
    </div>
    <div class="eval-items-grid">
      ${Object.entries(ev.items).map(([k,v])=>{
        const pct = (v/10)*100;
        const barColor = v>=8?"var(--green)":v>=6?"var(--pitch)":"var(--red)";
        return `<div class="eval-item-row">
          <div class="eval-item-name">${k}</div>
          <div class="eval-item-bar"><div class="eval-item-fill" style="width:${pct}%;background:${barColor};"></div></div>
          <div class="eval-item-val">${v}/10</div>
        </div>`;
      }).join("")}
    </div>
    ${ev.observaciones ? `<div class="eval-notes"><strong>Notas:</strong> ${escapeHtml(ev.observaciones)}</div>` : ""}
    <div class="eval-actions">
      <button class="btn-outline" data-edit-eval="${ev.id}">${ic.pencil} Editar</button>
      <button class="btn-outline" data-delete-eval="${ev.id}" style="color:var(--red);border-color:var(--red);">${ic.x} Eliminar</button>
    </div>
  </div>`;
}

function evalFormHtml(a, existingEval){
  const isEdit = !!existingEval;
  const items = isEdit ? existingEval.items : {};
  const evId = isEdit ? existingEval.id : "";
  const evDesc = isEdit ? (existingEval.descripcion||"") : "";
  const evObs = isEdit ? (existingEval.observaciones||"") : "";
  const inputRows = DEFAULT_ITEMS.map((name,idx)=>{
    const val = items[name] != null ? items[name] : 5;
    return `<div class="stat-input-card">
      <div class="stat-input-icon" style="background:${ITEM_COLORS[idx%ITEM_COLORS.length]};">${ic.activity}</div>
      <div class="stat-input-body">
        <label>${name}</label>
        <input type="range" min="1" max="10" class="eval-range" data-item="${name}" value="${val}">
        <div class="eval-range-label"><span>1</span><span class="eval-range-val" id="evalval_${idx}">${val}</span><span>10</span></div>
      </div>
    </div>`;
  }).join("");

  return `<div class="eval-form">
    <input type="hidden" id="evalEditId" value="${evId}">
    <div class="section"><h3 class="dia-title">${isEdit?"Editar evaluación":"Nueva evaluación"}</h3>
      <label style="font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;display:block;margin-bottom:4px;">Descripción (opcional)</label>
      <input type="text" id="evalDescripcion" placeholder="Ej: Evaluación mensual Julio 2026" value="${escapeHtml(evDesc)}" style="width:100%;padding:10px 12px;border:1px solid var(--chalk-dim);border-radius:8px;font-size:13px;margin-bottom:14px;">
      <div class="stats-input-grid">${inputRows}</div>
      <label style="font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;display:block;margin:14px 0 4px;">Observaciones</label>
      <textarea id="evalObservaciones" rows="3" placeholder="Notas sobre la evaluación..." style="width:100%;border:1px solid var(--chalk-dim);border-radius:8px;padding:10px;font-size:13px;font-family:inherit;resize:vertical;">${escapeHtml(evObs)}</textarea>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:12px;">
        ${isEdit ? `<button class="btn-outline" id="btnCancelEval">Cancelar</button>` : ""}
        <button class="btn-primary" id="btnSaveEval">${ic.check} Guardar evaluación</button>
      </div>
    </div>
  </div>`;
}

export function renderEvaluacion(){
  const filtered = state.athletes.filter(a=>{
    return state.evalCategory==="Todos" || a.categoria===state.evalCategory;
  });

  const chips = ["Todos",...CATEGORIES].map(cat=>
    `<button class="chip ${state.evalCategory===cat?"active":""}" data-evalcat="${cat}">${cat}</button>`
  ).join("");

  const selectedAthlete = state.evalAthleteId ? state.athletes.find(a=>a.id===state.evalAthleteId) : null;

  if(!selectedAthlete){
    const playerGrid = filtered.map(a=>{
      const evals = a.evaluaciones || [];
      const lastEval = evals.length ? evals[evals.length-1] : null;
      const avg = lastEval ? avgScore(lastEval.items) : "—";
      return `<button class="ath-card" data-evalplayer="${a.id}">
        <div class="top">
          <div class="avatar">${initials(a)}</div>
          ${badge(a.categoria,"neutral")}
        </div>
        <div class="name">${escapeHtml(a.nombre)} ${escapeHtml(a.apellido)}</div>
        <div class="meta">${a.posicion} · ${evals.length} evaluacion${evals.length!==1?"es":""}</div>
        <div class="attend">${ic.activity} Promedio: ${avg}</div>
      </button>`;
    }).join("");

    return `
      <h1 class="page-title dia-title">Evaluaciones</h1>
      <p class="page-sub">Selecciona un atleta para crear o ver evaluaciones de rendimiento</p>
      <div class="filters">${chips}</div>
      <div class="ath-grid">${playerGrid || '<p class="empty-msg">No hay atletas.</p>'}</div>
    `;
  }

  const a = selectedAthlete;
  if(!a.evaluaciones) a.evaluaciones = [];
  const evalsSorted = [...a.evaluaciones].sort((a,b)=>b.fecha.localeCompare(a.fecha));

  const promedioGeneral = evalsSorted.length ? (evalsSorted.reduce((s,ev)=>s+Number(avgScore(ev.items)),0)/evalsSorted.length).toFixed(1) : "—";
  const ultimaEval = evalsSorted.length ? evalsSorted[0] : null;
  const ultimaAvg = ultimaEval ? avgScore(ultimaEval.items) : "—";

  const editingEval = state.evalEditingId ? (a.evaluaciones||[]).find(e=>e.id===state.evalEditingId) : null;
  if(state.evalEditingId && !editingEval) state.evalEditingId = null;

  window.__evalDetailData = evalsSorted.length ? {
    items: evalsSorted[0].items,
    labels: Object.keys(evalsSorted[0].items),
    values: Object.values(evalsSorted[0].items),
  } : null;

  const evalCardsHtml = evalsSorted.length
    ? evalsSorted.map(ev=>evalCardHtml(ev)).join("")
    : '<p class="empty-msg">No hay evaluaciones registradas. Crea la primera.</p>';

  return `
    <div class="toolbar">
      <h1 class="page-title dia-title" style="margin:0;">Evaluaciones</h1>
      <button class="btn-outline" id="btnBackEval">${ic.back} Volver a selección</button>
    </div>
    <div class="profile-head" style="margin-bottom:16px;">
      <div class="avatar big">${initials(a)}</div>
      <div>
        <h1 class="dia-title" style="font-size:20px;">${escapeHtml(a.nombre)} ${escapeHtml(a.apellido)}</h1>
        <div class="badges-row">
          ${badge(a.categoria,"neutral")}${badge(a.posicion,"neutral")}
        </div>
      </div>
    </div>

    <div class="stats-row">
      ${statPill(ic.trophy,"Evaluaciones",evalsSorted.length,"var(--pitch)")}
      ${statPill(ic.trend,"Promedio general",promedioGeneral,"var(--green)")}
      ${statPill(ic.activity,"Última evaluación",ultimaAvg,"var(--pitch)")}
    </div>

    <div id="evalFormContainer">
      ${evalFormHtml(a, editingEval)}
    </div>

    ${evalsSorted.length ? `
    <div class="section"><h3 class="dia-title">Gráficos — última evaluación</h3>
      <div class="charts-row">
        <div class="chart-card"><h4>Puntajes por ítem</h4><div class="chart-wrap short"><canvas id="chartEvalItems"></canvas></div></div>
      </div>
    </div>` : ""}

    <div class="section"><h3 class="dia-title">Historial de evaluaciones</h3>
      <div class="eval-history">${evalCardsHtml}</div>
    </div>
  `;
}
