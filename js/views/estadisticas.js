import { state } from '../state.js';
import { CATEGORIES } from '../constants.js';
import { ic } from '../icons.js';
import { escapeHtml, attendanceRate } from '../utils.js';
import { statPill, badge, initials } from '../render-helpers.js';

export function renderEstadisticas(){
  const filtered = state.athletes.filter(a=>{
    const matchCat = state.statsCategory==="Todos" || a.categoria===state.statsCategory;
    return matchCat;
  });

  const chips = ["Todos",...CATEGORIES].map(cat=>
    `<button class="chip ${state.statsCategory===cat?"active":""}" data-statscat="${cat}">${cat}</button>`
  ).join("");

  const selectedAthlete = state.statsAthleteId ? state.athletes.find(a=>a.id===state.statsAthleteId) : null;

  let playerGrid = filtered.map(a=>{
    const sg = a.statsGenerales || {};
    const totalGoles = sg.goles||0;
    return `<button class="ath-card ${state.statsAthleteId===a.id?"selected":""}" data-statsplayer="${a.id}">
      <div class="top">
        <div class="avatar">${initials(a)}</div>
        ${badge(a.categoria,"neutral")}
      </div>
      <div class="name">${escapeHtml(a.nombre)} ${escapeHtml(a.apellido)}</div>
      <div class="meta">${a.posicion} · ${a.edad} años</div>
      <div class="attend">${ic.activity} ${totalGoles} goles · ${sg.asistencias||0} asist.</div>
    </button>`;
  }).join("");

  if(!selectedAthlete){
    return `
      <h1 class="page-title dia-title">Estadísticas</h1>
      <p class="page-sub">Selecciona un jugador para ver y editar sus estadísticas</p>
      <div class="filters">${chips}</div>
      <div class="ath-grid">${playerGrid || '<p class="empty-msg">No hay atletas.</p>'}</div>
    `;
  }

  const a = selectedAthlete;
  if(!a.statsGenerales) a.statsGenerales = { goles:0, asistencias:0, tarjetasAmarillas:0, tarjetasRojas:0, partidosJugados:0, entrenamientosAsistidos:0, entrenamientosTotales:0 };
  const sg = a.statsGenerales;

  const trainTotal = Object.keys(a.asistenciaEntrenamiento).length || 1;
  const trainPresent = Object.values(a.asistenciaEntrenamiento).filter(v=>v==="presente").length;
  const gameTotal = Object.keys(a.asistenciaJuegos).length || 1;
  const gamePresent = Object.values(a.asistenciaJuegos).filter(v=>v==="presente").length;

  const statsFields = [
    {key:"goles",label:"Goles",icon:ic.trophy,color:"var(--pitch)"},
    {key:"asistencias",label:"Asistencias",icon:ic.check,color:"var(--green)"},
    {key:"tarjetasAmarillas",label:"Tarjetas amarillas",icon:ic.alert,color:"var(--orange,#E8922D)"},
    {key:"tarjetasRojas",label:"Tarjetas rojas",icon:ic.x,color:"var(--red)"},
    {key:"partidosJugados",label:"Partidos jugados",icon:ic.activity,color:"var(--pitch)"},
    {key:"entrenamientosAsistidos",label:"Entren. asistidos",icon:ic.check,color:"var(--green)"},
    {key:"entrenamientosTotales",label:"Entren. totales",icon:ic.clipboard,color:"var(--ink)"},
  ];

  const statsInputs = statsFields.map(f=>
    `<div class="stat-input-card">
      <div class="stat-input-icon" style="background:${f.color};">${f.icon}</div>
      <div class="stat-input-body">
        <label>${f.label}</label>
        <input type="number" min="0" class="sg-input" data-sgkey="${f.key}" value="${sg[f.key]||0}">
      </div>
    </div>`
  ).join("");

  const torneosInscritos = state.torneos.filter(t=> a.torneos.some(at=>at.torneoId===t.id));
  let torneosStatsHtml = "";
  if(torneosInscritos.length){
    const rows = torneosInscritos.map(t=>{
      const st = (a.estadisticas && a.estadisticas[t.id]) || {goles:0,asistencias:0,tarjetasAmarillas:0,tarjetasRojas:0,partidosJugados:0};
      return `<tr>
        <td style="font-weight:600;">${escapeHtml(t.nombre)}</td>
        <td style="text-align:center;">${t.fecha}</td>
        <td style="text-align:center;font-weight:700;">${st.goles}</td>
        <td style="text-align:center;">${st.asistencias}</td>
        <td style="text-align:center;color:var(--orange);">${st.tarjetasAmarillas}</td>
        <td style="text-align:center;color:var(--red);">${st.tarjetasRojas}</td>
        <td style="text-align:center;">${st.partidosJugados}</td>
      </tr>`;
    }).join("");
    torneosStatsHtml = `
      <div class="section"><h3 class="dia-title">Estadísticas por torneo</h3>
        <div class="table-wrap"><table><thead><tr>
          <th>Torneo</th><th>Fecha</th><th style="text-align:center;">Goles</th><th style="text-align:center;">Asist.</th><th style="text-align:center;">TA</th><th style="text-align:center;">TR</th><th style="text-align:center;">Partidos</th>
        </tr></thead><tbody>${rows}</tbody></table></div>
      </div>`;
  }

  const observaciones = a.observaciones || "";

  window.__statsDetailData = {
    goles: sg.goles||0, asistencias: sg.asistencias||0,
    ta: sg.tarjetasAmarillas||0, tr: sg.tarjetasRojas||0,
    trainPresent, trainAusente: Math.max(0,trainTotal-trainPresent),
    gamePresent, gameAusente: Math.max(0,gameTotal-gamePresent),
  };

  return `
    <div class="toolbar">
      <h1 class="page-title dia-title" style="margin:0;">Estadísticas</h1>
      <button class="btn-outline" id="btnBackStats">${ic.back} Volver a selección</button>
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

    <div class="section"><h3 class="dia-title">Registro general</h3>
      <div class="stats-input-grid">${statsInputs}</div>
      <div style="display:flex;justify-content:flex-end;margin-top:12px;">
        <button class="btn-primary" id="btnSaveStats">${ic.check} Guardar estadísticas</button>
      </div>
    </div>

    <div class="section"><h3 class="dia-title">Gráficos de rendimiento</h3>
      <div class="charts-row">
        <div class="chart-card small"><h4>Goles vs Asistencias</h4><div class="chart-wrap short"><canvas id="chartStatsGoalsAst"></canvas></div></div>
        <div class="chart-card small"><h4>Tarjetas</h4><div class="chart-wrap short"><canvas id="chartStatsCards"></canvas></div></div>
        <div class="chart-card small"><h4>Asistencia entrenamientos</h4><div class="chart-wrap short"><canvas id="chartStatsTrain"></canvas></div></div>
        <div class="chart-card small"><h4>Asistencia juegos</h4><div class="chart-wrap short"><canvas id="chartStatsGames"></canvas></div></div>
      </div>
    </div>

    ${torneosStatsHtml}

    <div class="section"><h3 class="dia-title">Asistencia a entrenamientos</h3>
      <div class="stats-row">
        ${statPill(ic.check,"Presentes",trainPresent+"/"+Object.keys(a.asistenciaEntrenamiento).length,"var(--green)")}
        ${statPill(ic.trend,"Tasa",attendanceRate(a.asistenciaEntrenamiento)+"%","var(--pitch)")}
      </div>
    </div>

    <div class="section"><h3 class="dia-title">Asistencia a juegos</h3>
      <div class="stats-row">
        ${statPill(ic.check,"Presentes",gamePresent+"/"+Object.keys(a.asistenciaJuegos).length,"var(--green)")}
        ${statPill(ic.trend,"Tasa",attendanceRate(a.asistenciaJuegos)+"%","var(--pitch)")}
      </div>
    </div>

    <div class="section"><h3 class="dia-title">Observaciones / Notas de evolución</h3>
      <div class="notes-box">
        <textarea id="statsObservacionesText" rows="5" placeholder="Escribe notas sobre la evolución de este jugador...">${escapeHtml(observaciones)}</textarea>
        <div class="notes-actions">
          <button class="save-btn" id="btnSaveStatsObs">Guardar notas</button>
        </div>
      </div>
    </div>
  `;
}
