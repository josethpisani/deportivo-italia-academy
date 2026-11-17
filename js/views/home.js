import { state } from "../state.js";
import { CATEGORIES } from "../constants.js";
import { ic } from "../icons.js";
import { statPill, badge } from "../render-helpers.js";
import { escapeHtml, computeTorneoTeamStats, staffYearAthletes, matchesStaffYear } from "../utils.js";

export function renderHome(){
  const yearAthletes = staffYearAthletes(state.athletes, state.staffYear);
  const yearTorneos = state.torneos.filter(t => matchesStaffYear(t.fecha || t.anio || t.year, state.staffYear));
  const totalAthletes = yearAthletes.length;
  const catCards = CATEGORIES.map(cat=>{
    const count = yearAthletes.filter(a=>a.categoria===cat).length;
    return `<button class="cat-card" data-goto-cat="${cat}">
      <div class="eyebrow">CATEGORÍA</div>
      <div class="big dia-title">${cat}</div>
      <div class="sub">${count} atletas registrados</div>
    </button>`;
  }).join("");

  const sumResults = { ganados:0, empatados:0, perdidos:0, gf:0, gc:0, partidos:0 };
  let torneosResumen = "";
  if(yearTorneos.length){
    const torCards = yearTorneos.map(t=>{
      const team = computeTorneoTeamStats(t, state.staffYear);
      sumResults.ganados += team.ganados;
      sumResults.empatados += team.empatados;
      sumResults.perdidos += team.perdidos;
      sumResults.gf += team.gf;
      sumResults.gc += team.gc;
      sumResults.partidos += team.partidos;
      const inscritos = yearAthletes.filter(a=>a.torneos.some(at=>at.torneoId===t.id)).length;
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
    <p class="page-sub">Deportivo Italia Academy — temporada ${state.staffYear}</p>
    <div class="stats-row">
      ${statPill(ic.users,"Atletas activos",totalAthletes,"var(--pitch)")}
    </div>
    <section aria-labelledby="home-trials-title">
      <h2 id="home-trials-title" class="dia-title home-trials-title">
        <span class="home-trials-icon" aria-hidden="true">${ic.clipboard}</span>
        <span>PRUEBAS DE INGRESO PENDIENTES Y CONFIRMADAS</span>
      </h2>
      <div id="home-trials" aria-live="polite"><p class="empty-msg">Cargando pruebas…</p></div>
    </section>
    <h2 class="dia-title" style="font-size:16px;margin:26px 0 12px;">Atletas por categoría</h2>
    <div class="cat-grid">${catCards}</div>

    <h2 class="dia-title" style="font-size:16px;margin:26px 0 12px;">Indicadores generales</h2>
    <div class="charts-row">
      <div class="chart-card"><h4>Atletas por categoría</h4><div class="chart-wrap"><canvas id="chartHomeCat"></canvas></div></div>
      <div class="chart-card small"><h4>Asistencia promedio (entrenamientos)</h4><div class="chart-wrap"><canvas id="chartHomeAsistencia"></canvas></div></div>
    </div>
    ${torneosResumen}
  `;
}

const trialDateFormat = new Intl.DateTimeFormat("es-PA", {
  day: "numeric", month: "short", year: "numeric", timeZone: "UTC"
});

export async function loadHomeTrials(container, year) {
  try {
    const response = await fetch(`/api/data?key=trial_summary&year=${year}`);
    if (!response.ok) throw new Error("No se pudieron cargar las pruebas.");
    const trials = await response.json();
    if (!container.isConnected) return;
    if (!trials.length) {
      container.innerHTML = '<p class="empty-msg">No hay pruebas pendientes ni confirmadas para este año.</p>';
      return;
    }

    const rows = trials.map(trial => `
      <tr>
        <td>${escapeHtml(trial.athlete_name)}</td>
        <td>${escapeHtml(trial.category || "—")}</td>
        <td>${trialDateFormat.format(new Date(trial.date))}</td>
        <td>${escapeHtml(trial.time || "—")}</td>
        <td>${trial.status === "confirmada" ? badge("Confirmada", "good") : badge("Pendiente", "warn")}</td>
      </tr>`).join("");

    container.innerHTML = `
      <div class="table-wrap"><table aria-labelledby="home-trials-title">
        <thead><tr><th>Atleta</th><th>Categoría</th><th>Fecha</th><th>Hora</th><th>Estado</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>`;
  } catch {
    if (container.isConnected) container.innerHTML = '<p class="empty-msg">No se pudieron cargar las pruebas. Vuelve a abrir el Resumen para reintentar.</p>';
  }
}
