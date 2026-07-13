import { state } from '../state.js';
import { CATEGORIES, TRAINING_DAYS } from '../constants.js';
import { ic } from '../icons.js';
import { escapeHtml, attendanceRate, lastNDates } from '../utils.js';
import { statPill, badge, initials } from '../render-helpers.js';

function attendGrid(sessions, record, athleteId, type){
  return `<div class="attend-grid">${sessions.map(s=>{
    const [date,day] = s.split("|");
    const status = record[s];
    return `<div class="attend-cell ${status||""}">
      <div class="day">${day}</div><div class="date">${date}</div>
      <div class="btns">
        <button class="ok ${status==="presente"?"on":""}" data-attend="${athleteId}|${type}|${s}|presente">${ic.check}</button>
        <button class="no ${status==="ausente"?"on":""}" data-attend="${athleteId}|${type}|${s}|ausente">${ic.x}</button>
      </div>
    </div>`;
  }).join("")}</div>`;
}

export function renderAthleteList(){
  const filtered = state.athletes.filter(a=>{
    const matchCat = state.activeCategory==="Todos" || a.categoria===state.activeCategory;
    const matchSearch = (a.nombre+" "+a.apellido).toLowerCase().includes(state.search.toLowerCase());
    return matchCat && matchSearch;
  });
  const chips = ["Todos",...CATEGORIES].map(cat=>
    `<button class="chip ${state.activeCategory===cat?"active":""}" data-cat="${cat}">${cat}</button>`
  ).join("");

  let athleteHtml = "";
  if(filtered.length === 0){
    athleteHtml = `<p class="empty-msg">No se encontraron atletas.</p>`;
  } else if(state.athViewMode === "grid"){
    athleteHtml = `<div class="ath-grid">${filtered.map(a=>{
      const rate = attendanceRate(a.asistenciaEntrenamiento);
      return `<button class="ath-card" data-open="${a.id}">
        <div class="top">
          <div class="avatar">${initials(a)}</div>
          ${badge(a.matricula.estado, a.matricula.estado==="pagado"?"good":"bad")}
        </div>
        <div class="name">${escapeHtml(a.nombre)} ${escapeHtml(a.apellido)}</div>
        <div class="meta">${a.categoria} · ${a.posicion} · ${a.edad} años</div>
        <div class="attend">${ic.activity} Asistencia: ${rate}%</div>
      </button>`;
    }).join("")}</div>`;
  } else {
    const header = `<div class="list-header">
      <div style="width:32px;flex-shrink:0;"></div>
      <div class="lh-info">Atleta</div>
      <div class="lh-stats">
        <div style="min-width:46px;text-align:center;">Edad</div>
        <div style="min-width:80px;text-align:center;">Posición</div>
        <div style="min-width:70px;text-align:center;">Asist. %</div>
        <div style="min-width:72px;text-align:center;">Matrícula</div>
        <div style="width:20px;"></div>
      </div>
    </div>`;
    const rows = filtered.map(a=>{
      const rate = attendanceRate(a.asistenciaEntrenamiento);
      return `<button class="ath-list-row" data-open="${a.id}">
        <div class="avatar" style="width:34px;height:34px;font-size:12px;flex-shrink:0;">${initials(a)}</div>
        <div class="info">
          <div class="name">${escapeHtml(a.nombre)} ${escapeHtml(a.apellido)}</div>
          <div class="meta">${a.categoria} · Representante: ${escapeHtml(a.representante)}</div>
        </div>
        <div class="stats">
          <div class="stat-item"><div class="sv">${a.edad}</div><div class="sl">Años</div></div>
          <div class="stat-item"><div class="sv" style="font-size:11px;font-weight:700;">${a.posicion}</div><div class="sl">Posición</div></div>
          <div class="stat-item"><div class="sv" style="color:${rate>=70?"var(--green)":rate>=40?"var(--pitch)":"var(--red)"}">${rate}%</div><div class="sl">Asistencia</div></div>
          <div class="stat-item">${badge(a.matricula.estado, a.matricula.estado==="pagado"?"good":"bad")}</div>
          <div class="arr">${ic.arr}</div>
        </div>
      </button>`;
    }).join("");
    athleteHtml = `<div class="ath-list">${header}${rows}</div>`;
  }

  return `
    <div class="toolbar">
      <h1 class="page-title dia-title" style="margin:0;">Atletas</h1>
      <div style="display:flex;gap:10px;align-items:center;">
        <div class="view-toggle">
          <button class="${state.athViewMode==="grid"?"active":""}" id="btnViewGrid" title="Cuadrícula">${ic.grid}</button>
          <button class="${state.athViewMode==="list"?"active":""}" id="btnViewList" title="Lista">${ic.list}</button>
        </div>
        <button class="btn-primary" id="btnAddAthlete">${ic.plus} Nuevo atleta</button>
      </div>
    </div>
    <div class="filters">
      ${chips}
      <div class="search-wrap"><span class="si">${ic.search}</span>
        <input id="searchInput" placeholder="Buscar atleta..." value="${escapeHtml(state.search)}">
      </div>
    </div>
    <div class="chart-card" style="margin-bottom:18px;">
      <h4>Asistencia a entrenamientos por categoría</h4>
      <div class="chart-wrap short"><canvas id="chartAthListAttend"></canvas></div>
    </div>
    ${athleteHtml}
  `;
}

export function renderAthleteDetail(){
  const a = state.athletes.find(x=>x.id===state.selectedId);
  if(!a) return `<p>Atleta no encontrado.</p>`;
  let trainingSessions = [];
  TRAINING_DAYS.forEach(day => { trainingSessions = trainingSessions.concat(lastNDates(3, day)); });
  trainingSessions.sort();
  const gameSessions = lastNDates(6, "weekend");

  const trainRate = attendanceRate(a.asistenciaEntrenamiento);
  const gameRate = attendanceRate(a.asistenciaJuegos);
  const trainPresent = Object.values(a.asistenciaEntrenamiento).filter(v=>v==="presente").length;
  const trainTotal = Object.keys(a.asistenciaEntrenamiento).length;
  const gamePresent = Object.values(a.asistenciaJuegos).filter(v=>v==="presente").length;
  const gameTotal = Object.keys(a.asistenciaJuegos).length;
  window.__athDetailData = {
    trainPresent, trainAusente: trainTotal - trainPresent,
    gamePresent, gameAusente: gameTotal - gamePresent,
  };

  const torneosCat = state.torneos.filter(t=>t.categoria===a.categoria);
  const torneosHtml = torneosCat.length ? torneosCat.map(t=>{
    const pagado = a.torneos.some(at=>at.torneoId===t.id);
    return `<div class="tor-row"><div><div class="tname">${escapeHtml(t.nombre)}</div><div class="tmeta">${t.fecha} · $${t.monto}</div></div>${badge(pagado?"Pagado":"Pendiente", pagado?"good":"bad")}</div>`;
  }).join("") : `<p class="empty-msg">Sin torneos para esta categoría.</p>`;

  return `
    <button class="back-btn" id="btnBack">${ic.back} Volver a atletas</button>
    <div class="profile-head">
      <div class="avatar big">${initials(a)}</div>
      <div>
        <h1 class="dia-title">${escapeHtml(a.nombre)} ${escapeHtml(a.apellido)}</h1>
        <div class="badges-row">
          ${badge(a.categoria,"neutral")}${badge(a.posicion,"neutral")}
          ${badge("Matrícula "+a.matricula.estado, a.matricula.estado==="pagado"?"good":"bad")}
          <button class="btn-outline" id="btnEditAthlete">${ic.pencil} Editar</button>
        </div>
      </div>
    </div>
    <div class="stats-row">
      ${statPill(ic.trend,"Asist. entrenamiento", trainRate+"%","var(--pitch)")}
      ${statPill(ic.trophy,"Asist. juegos", gameRate+"%","var(--green)")}
      ${statPill(ic.check,"Entren. presentes", trainPresent+"/"+trainTotal,"var(--pitch)")}
      ${statPill(ic.check,"Juegos presentes", gamePresent+"/"+gameTotal,"var(--green)")}
    </div>

    <div class="section"><h3 class="dia-title">Estadísticas</h3>
      <div class="chart-card"><h4>Entrenamientos vs. juegos</h4><div class="chart-wrap short"><canvas id="chartAthDetail"></canvas></div></div>
    </div>

    <div class="section"><h3 class="dia-title">Datos personales</h3>
      <div class="field-grid">
        <div class="field"><div class="lbl">Fecha de nacimiento</div><div class="val">${a.fechaNacimiento}</div></div>
        <div class="field"><div class="lbl">Edad</div><div class="val">${a.edad} años</div></div>
        <div class="field"><div class="lbl">Representante</div><div class="val">${escapeHtml(a.representante)}</div></div>
        <div class="field"><div class="lbl">Teléfono</div><div class="val">${escapeHtml(a.telefono)}</div></div>
        <div class="field"><div class="lbl">Dirección</div><div class="val">${escapeHtml(a.direccion)}</div></div>
        <div class="field"><div class="lbl">Fecha de ingreso</div><div class="val">${a.fechaIngreso}</div></div>
      </div>
    </div>

    <div class="section"><h3 class="dia-title">Asistencia a entrenamientos (Lun · Mié · Vie)</h3>
      ${attendGrid(trainingSessions, a.asistenciaEntrenamiento, a.id, "training")}
    </div>

    <div class="section"><h3 class="dia-title">Asistencia a juegos (fin de semana)</h3>
      ${attendGrid(gameSessions, a.asistenciaJuegos, a.id, "game")}
    </div>

    <div class="section"><h3 class="dia-title">Torneos</h3>${torneosHtml}</div>
  `;
}
