import { state } from '../state.js';
import { CATEGORIES } from '../constants.js';
import { ic } from '../icons.js';
import { statPill } from '../render-helpers.js';

export function renderHome(){
  const totalAthletes = state.athletes.length;
  const matriculasPendientes = state.athletes.filter(a=>a.matricula.estado==="pendiente").length;
  const ingresos = state.athletes.filter(a=>a.matricula.estado==="pagado").reduce((s,a)=>s+a.matricula.monto,0);
  const torneoIngresos = state.torneos.reduce((sum,t)=>{
    const pagantes = state.athletes.filter(a=>a.torneos.some(at=>at.torneoId===t.id)).length;
    return sum + pagantes*t.monto;
  },0);
  const mesActual = new Date().toISOString().slice(0,7);
  const mensualidadIngresos = state.athletes.filter(a=>{
    const m = a.mensualidades && a.mensualidades[mesActual];
    return m && m.estado==="pagado";
  }).reduce((s,a)=>s+((a.mensualidades[mesActual]||{}).monto||0),0);

  const catCards = CATEGORIES.map(cat=>{
    const count = state.athletes.filter(a=>a.categoria===cat).length;
    return `<button class="cat-card" data-goto-cat="${cat}">
      <div class="eyebrow">CATEGORÍA</div>
      <div class="big dia-title">${cat}</div>
      <div class="sub">${count} atletas registrados</div>
    </button>`;
  }).join("");

  return `
    <h1 class="page-title dia-title">Resumen de la Academia</h1>
    <p class="page-sub">Deportivo Italia Academy — temporada 2026</p>
    <div class="stats-row">
      ${statPill(ic.users,"Atletas activos",totalAthletes,"var(--pitch)")}
      ${statPill(ic.alert,"Matrículas pendientes",matriculasPendientes,"var(--red)")}
      ${statPill(ic.dollar,"Ingresos matrícula","$"+ingresos,"var(--green)")}
      ${statPill(ic.dollar,"Ingresos mensualidad","$"+mensualidadIngresos,"var(--pitch)")}
      ${statPill(ic.trophy,"Ingresos torneos","$"+torneoIngresos,"var(--red)")}
    </div>
    <h2 class="dia-title" style="font-size:16px;margin:0 0 12px;">Atletas por categoría</h2>
    <div class="cat-grid">${catCards}</div>

    <h2 class="dia-title" style="font-size:16px;margin:26px 0 12px;">Indicadores generales</h2>
    <div class="charts-row">
      <div class="chart-card"><h4>Atletas por categoría</h4><div class="chart-wrap"><canvas id="chartHomeCat"></canvas></div></div>
      <div class="chart-card small"><h4>Estado de matrícula</h4><div class="chart-wrap"><canvas id="chartHomeMatricula"></canvas></div></div>
      <div class="chart-card small"><h4>Asistencia promedio (entrenamientos)</h4><div class="chart-wrap"><canvas id="chartHomeAsistencia"></canvas></div></div>
    </div>
  `;
}
