import { state } from '../state.js';
import { ic } from '../icons.js';
import { escapeHtml, computeTorneoTeamStats } from '../utils.js';
import { statPill, badge } from '../render-helpers.js';

export function renderTorneos(){
  const cards = state.torneos.map(t=>{
    const inscritos = state.athletes.filter(a=>a.torneos.some(at=>at.torneoId===t.id));
    const team = computeTorneoTeamStats(t);
    const totalJuegos = (t.juegos||[]).length;
    return `<button class="torneo-card tor-btn" data-torcard="${t.id}">
      <div class="head">
        <div>
          <div class="tname dia-title">${escapeHtml(t.nombre)}</div>
          <div class="tmeta"><span>${ic.cal} ${t.fecha}</span><span>Categoría ${t.categoria}</span><span>$${t.monto} por atleta</span></div>
        </div>
        ${badge(inscritos.length+" inscritos", inscritos.length?"good":"bad")}
      </div>
      <div class="stats-row" style="margin:0 0 8px;">
        ${statPill(ic.activity,"Partidos",team.partidos,"var(--pitch)")}
        ${statPill(ic.check,"Ganados",team.ganados,"var(--green)")}
        ${statPill(ic.clipboard,"Empatados",team.empatados,"var(--orange)")}
        ${statPill(ic.x,"Perdidos",team.perdidos,"var(--red)")}
      </div>
      <div class="tor-team-line">${ic.trophy} Goles a favor: ${team.gf} · ${ic.alert} En contra: ${team.gc} · ${ic.cal2} Juegos: ${totalJuegos}</div>
    </button>`;
  }).join("");

  return `
    <div class="toolbar">
      <h1 class="page-title dia-title" style="margin:0;">Torneos</h1>
      <button class="btn-primary" id="btnAddTorneo">${ic.plus} Nuevo torneo</button>
    </div>
    <p class="page-sub">Crea torneos, registra los juegos contra cada rival y lleva las estadísticas del equipo y de cada atleta.</p>
    ${cards || '<p class="empty-msg">No hay torneos creados. Crea uno para comenzar.</p>'}
  `;
}

export function renderTorneoDetail(){
  const t = state.torneos.find(x=>x.id===state.torneoId);
  if(!t) return `<p>Torneo no encontrado.</p>`;
  const inscritos = state.athletes.filter(a=>a.torneos.some(at=>at.torneoId===t.id));
  const elegibles = state.athletes.filter(a=>a.categoria===t.categoria);
  const team = computeTorneoTeamStats(t);

  window.__torneoDetailData = { ganados: team.ganados, empatados: team.empatados, perdidos: team.perdidos, gf: team.gf, gc: team.gc };

  const juegosHtml = (t.juegos||[]).map(j=>{
    const marcador = j.estado==="jugado" ? `<span class="juego-marcador">${j.marcadorF} - ${j.marcadorC}</span>` : badge("Por jugar","warn");
    return `<div class="juego-row">
      <div class="juego-info">
        <div class="juego-rival">${ic.shield} vs ${escapeHtml(j.rival)}</div>
        <div class="juego-meta">${ic.cal} ${j.fecha} · ${j.estado==="jugado"?"Jugado":"Pendiente"}</div>
      </div>
      ${marcador}
      <div class="juego-actions">
        <button class="btn-outline" data-juego-stats="${j.id}">${ic.activity} Estadísticas</button>
        <button class="btn-icon" data-edit-juego="${j.id}" title="Editar juego">${ic.pencil}</button>
        <button class="btn-icon red" data-del-juego="${j.id}" title="Eliminar juego">${ic.x}</button>
      </div>
    </div>`;
  }).join("") || '<p class="empty-msg">Aún no hay juegos registrados. Agrega el primer juego con el botón superior.</p>';

  const enrollChips = elegibles.map(a=>{
    const insc = a.torneos.some(at=>at.torneoId===t.id);
    return `<button class="enroll-chip ${insc?"on":""}" data-tor-enroll="${a.id}">
      ${insc?ic.check:ic.plus} ${escapeHtml(a.nombre)} ${escapeHtml(a.apellido)}</button>`;
  }).join("");

  const statRows = inscritos.map(a=>{
    const st = (a.estadisticas && a.estadisticas[t.id]) || {goles:0,asistencias:0,tarjetasAmarillas:0,tarjetasRojas:0,partidosJugados:0};
    return `<tr>
      <td style="font-weight:600;">${escapeHtml(a.nombre)} ${escapeHtml(a.apellido)}</td>
      <td style="text-align:center;">${st.partidosJugados||0}</td>
      <td style="text-align:center;font-weight:700;">${st.goles||0}</td>
      <td style="text-align:center;">${st.asistencias||0}</td>
      <td style="text-align:center;color:var(--orange);">${st.tarjetasAmarillas||0}</td>
      <td style="text-align:center;color:var(--red);">${st.tarjetasRojas||0}</td>
    </tr>`;
  }).join("");

  return `
    <button class="back-btn" id="btnBackTorneo">${ic.back} Volver a torneos</button>
    <div class="profile-head">
      <div>
        <h1 class="dia-title">${escapeHtml(t.nombre)}</h1>
        <div class="badges-row">
          ${badge(t.categoria,"neutral")}${badge(t.fecha,"neutral")}${badge("$"+t.monto+" por atleta","warn")}
          <button class="btn-outline" id="btnEditTorneo">${ic.pencil} Editar</button>
          <button class="btn-outline" id="btnDeleteTorneo" style="color:var(--red);border-color:var(--red);">${ic.x} Eliminar</button>
          <button class="btn-outline" data-torstats="${t.id}">${ic.activity} Stats del torneo</button>
        </div>
        ${t.descripcion ? `<p class="page-sub" style="margin:8px 0 0;">${escapeHtml(t.descripcion)}</p>` : ""}
      </div>
    </div>

    <div class="stats-row">
      ${statPill(ic.activity,"Partidos jugados",team.partidos,"var(--pitch)")}
      ${statPill(ic.check,"Ganados",team.ganados,"var(--green)")}
      ${statPill(ic.clipboard,"Empatados",team.empatados,"var(--orange)")}
      ${statPill(ic.x,"Perdidos",team.perdidos,"var(--red)")}
    </div>
    <div class="stats-row" style="margin-top:-8px;">
      ${statPill(ic.trophy,"Goles a favor",team.gf,"var(--pitch)")}
      ${statPill(ic.alert,"Goles en contra",team.gc,"var(--red)")}
    </div>

    <div class="section"><h3 class="dia-title">Gráficos del equipo</h3>
      <div class="charts-row">
        <div class="chart-card small"><h4>Ganados / Empatados / Perdidos</h4><div class="chart-wrap short"><canvas id="chartTorneoResultados"></canvas></div></div>
        <div class="chart-card small"><h4>Goles a favor vs en contra</h4><div class="chart-wrap short"><canvas id="chartTorneoGoals"></canvas></div></div>
      </div>
    </div>

    <div class="section">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px;">
        <h3 class="dia-title" style="margin:0;">Juegos del torneo</h3>
        <button class="btn-primary" id="btnAddJuego">${ic.plus} Agregar juego</button>
      </div>
      ${juegosHtml}
    </div>

    <div class="section">
      <h3 class="dia-title">Atletas inscritos (${inscritos.length}/${elegibles.length})</h3>
      <p class="page-sub" style="margin:0 0 10px;">Toca cada atleta para inscribirlo o quitarlo del torneo.</p>
      <div class="enroll-grid">${enrollChips || '<p class="empty-msg">No hay atletas en la categoría '+escapeHtml(t.categoria)+'.</p>'}</div>
    </div>

    <div class="section">
      <h3 class="dia-title">Estadísticas personales — ${escapeHtml(t.nombre)}</h3>
      <div class="table-wrap"><table><thead><tr>
        <th>Atleta</th><th style="text-align:center;">Partidos</th><th style="text-align:center;">Goles</th><th style="text-align:center;">Asist.</th><th style="text-align:center;">TA</th><th style="text-align:center;">TR</th>
      </tr></thead><tbody>${statRows || '<tr><td colspan="6" style="text-align:center;color:#999;">No hay atletas inscritos.</td></tr>'}</tbody></table></div>
      <p class="page-sub" style="margin:8px 0 0;">${ic.activity} Entra al botón "Estadísticas" de cada juego para cargar las estadísticas personales por partido. Los totales se suman automáticamente aquí y también se acumulan en el panel de Estadísticas de cada atleta.</p>
    </div>
  `;
}
