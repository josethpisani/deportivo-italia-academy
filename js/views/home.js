import { state } from '../state.js';
import { CATEGORIES } from '../constants.js';
import { ic } from '../icons.js';
import { statPill, badge } from '../render-helpers.js';
import { escapeHtml, computeTorneoTeamStats } from '../utils.js';

export function renderHome(){
  const totalAthletes = state.athletes.length;
  const matriculasPendientes = state.athletes.filter(a=>a.matricula.estado==="pendiente").length;

  const hoy = new Date();
  const cy = hoy.getFullYear();
  const cm = hoy.getMonth()+1;
  const monthsUpToNow = [];
  for(let y=2026;y<=cy;y++){
    const lastM = (y===cy)?cm:12;
    for(let m=1;m<=lastM;m++){
      monthsUpToNow.push(`${y}-${String(m).padStart(2,"0")}`);
    }
  }
  const mensualidadesPendientes = state.athletes.reduce((sum,a)=>{
    const ms = a.mensualidades||{};
    return sum + monthsUpToNow.filter(mes=>!ms[mes] || ms[mes].estado!=="pagado").length;
  },0);

  const catCards = CATEGORIES.map(cat=>{
    const count = state.athletes.filter(a=>a.categoria===cat).length;
    return `<button class="cat-card" data-goto-cat="${cat}">
      <div class="eyebrow">CATEGORÍA</div>
      <div class="big dia-title">${cat}</div>
      <div class="sub">${count} atletas registrados</div>
    </button>`;
  }).join("");

  const sumResults = { ganados:0, empatados:0, perdidos:0, gf:0, gc:0, partidos:0 };
  let torneosResumen = "";
  if(state.torneos.length){
    const torCards = state.torneos.map(t=>{
      const team = computeTorneoTeamStats(t);
      sumResults.ganados += team.ganados;
      sumResults.empatados += team.empatados;
      sumResults.perdidos += team.perdidos;
      sumResults.gf += team.gf;
      sumResults.gc += team.gc;
      sumResults.partidos += team.partidos;
      const inscritos = state.athletes.filter(a=>a.torneos.some(at=>at.torneoId===t.id)).length;
      return `<button class="torneo-card tor-btn" data-torcard="${t.id}">
        <div class="head">
          <div>
            <div class="tname dia-title">${escapeHtml(t.nombre)}</div>
            <div class="tmeta"><span>${ic.cal} ${t.fecha}</span><span>Categoría ${t.categoria}</span></div>
          </div>
          ${badge(inscritos+" inscritos", inscritos?"good":"bad")}
        </div>
        <div class="tor-res-line">
          <span class="tr-g">${team.ganados} G</span><span class="tr-sep">·</span>
          <span class="tr-e">${team.empatados} E</span><span class="tr-sep">·</span>
          <span class="tr-p">${team.perdidos} P</span>
          <span class="tr-gf">GF ${team.gf}</span><span class="tr-gc">GC ${team.gc}</span>
        </div>
      </button>`;
    }).join("");
    torneosResumen = `
      <h2 class="dia-title" style="font-size:16px;margin:26px 0 12px;">Resumen actual de torneos</h2>
      <div class="torneo-summary">${torCards}</div>
      <div class="stats-row">
        ${statPill(ic.activity,"Partidos jugados",sumResults.partidos,"var(--pitch)")}
        ${statPill(ic.check,"Ganados",sumResults.ganados,"var(--green)")}
        ${statPill(ic.clipboard,"Empatados",sumResults.empatados,"var(--orange)")}
        ${statPill(ic.x,"Perdidos",sumResults.perdidos,"var(--red)")}
      </div>
      <div class="charts-row">
        <div class="chart-card"><h4>Resultados del equipo (todos los torneos)</h4><div class="chart-wrap"><canvas id="chartHomeTorResultados"></canvas></div></div>
        <div class="chart-card"><h4>Goles a favor vs en contra</h4><div class="chart-wrap"><canvas id="chartHomeTorGoles"></canvas></div></div>
      </div>`;
  }

  return `
    <h1 class="page-title dia-title">Resumen de la Academia</h1>
    <p class="page-sub">Deportivo Italia Academy — temporada 2026</p>
    <div class="stats-row">
      ${statPill(ic.users,"Atletas activos",totalAthletes,"var(--pitch)")}
      ${statPill(ic.alert,"Matrículas pendientes",matriculasPendientes,"var(--red)")}
      ${statPill(ic.dollar,"Mensualidades pendientes",mensualidadesPendientes,"var(--red)")}
    </div>
    <h2 class="dia-title" style="font-size:16px;margin:0 0 12px;">Atletas por categoría</h2>
    <div class="cat-grid">${catCards}</div>

    <h2 class="dia-title" style="font-size:16px;margin:26px 0 12px;">Indicadores generales</h2>
    <div class="charts-row">
      <div class="chart-card"><h4>Atletas por categoría</h4><div class="chart-wrap"><canvas id="chartHomeCat"></canvas></div></div>
      <div class="chart-card small"><h4>Estado de matrícula</h4><div class="chart-wrap"><canvas id="chartHomeMatricula"></canvas></div></div>
      <div class="chart-card small"><h4>Asistencia promedio (entrenamientos)</h4><div class="chart-wrap"><canvas id="chartHomeAsistencia"></canvas></div></div>
    </div>
    ${torneosResumen}
  `;
}
