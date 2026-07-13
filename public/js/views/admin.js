import { state } from '../state.js';
import { ic } from '../icons.js';
import { escapeHtml } from '../utils.js';
import { statPill, badge } from '../render-helpers.js';

export function renderAdmin(){
  const totalIngresos = state.athletes.filter(a=>a.matricula.estado==="pagado").reduce((s,a)=>s+a.matricula.monto,0);
  const torneoIngresos = state.torneos.reduce((sum,t)=>{
    const pagantes = state.athletes.filter(a=>a.torneos.some(at=>at.torneoId===t.id)).length;
    return sum + pagantes*t.monto;
  },0);
  const pendientes = state.athletes.filter(a=>a.matricula.estado==="pendiente").length;

  const tabs = [
    {key:"atletas",label:"Todos los atletas"},
    {key:"matriculas",label:"Pagos de matrícula"},
    {key:"torneos",label:"Torneos y pagos"},
  ].map(t=>`<button class="admin-tab ${state.adminTab===t.key?"active":""}" data-admintab="${t.key}">${t.label}</button>`).join("");

  let body = "";
  if(state.adminTab==="atletas"){
    const rows = state.athletes.map(a=>`<tr>
      <td style="font-weight:600;">${escapeHtml(a.nombre)} ${escapeHtml(a.apellido)}</td>
      <td>${a.categoria}</td><td>${a.edad}</td><td>${escapeHtml(a.representante)}</td><td>${escapeHtml(a.telefono)}</td>
      <td>${badge(a.matricula.estado, a.matricula.estado==="pagado"?"good":"bad")}</td>
      <td><button class="link-btn" data-open="${a.id}">Ver perfil →</button></td>
    </tr>`).join("");
    body = `<div class="table-wrap">
      <table><thead><tr><th>Atleta</th><th>Categoría</th><th>Edad</th><th>Representante</th><th>Teléfono</th><th>Matrícula</th><th></th></tr></thead>
      <tbody>${rows}</tbody></table></div>`;
  } else if(state.adminTab==="matriculas"){
    const cards = state.athletes.map(a=>`<div class="mat-card">
      <div class="row1"><div class="name">${escapeHtml(a.nombre)} ${escapeHtml(a.apellido)}</div>${badge(a.categoria,"neutral")}</div>
      <div class="info">Monto: $${a.matricula.monto} · Última fecha: ${a.matricula.fecha}</div>
      <div class="btns">
        <button class="bp ${a.matricula.estado==="pagado"?"on":""}" data-matricula="${a.id}|pagado">Pagado</button>
        <button class="bd ${a.matricula.estado==="pendiente"?"on":""}" data-matricula="${a.id}|pendiente">Pendiente</button>
      </div></div>`).join("");
    body = `<div class="mat-grid">${cards}</div>`;
  } else {
    const torneosHtml = state.torneos.map(t=>{
      const elegibles = state.athletes.filter(a=>a.categoria===t.categoria);
      const pagantes = elegibles.filter(a=>a.torneos.some(at=>at.torneoId===t.id));
      const chips = elegibles.map(a=>{
        const pagado = a.torneos.some(at=>at.torneoId===t.id);
        return `<button class="pay-chip ${pagado?"paid":""}" data-torneopago="${a.id}|${t.id}|${pagado?0:1}">
          ${pagado?ic.check:ic.clock} ${escapeHtml(a.nombre)} ${escapeHtml(a.apellido)}</button>`;
      }).join("");
      return `<div class="torneo-card">
        <div class="head">
          <div><div class="tname">${escapeHtml(t.nombre)}</div>
            <div class="tmeta"><span>${ic.cal} ${t.fecha}</span><span>Categoría ${t.categoria}</span><span>$${t.monto} por atleta</span></div>
          </div>
          ${badge(pagantes.length+"/"+elegibles.length+" pagado","warn")}
        </div>
        <div class="pay-chips">${chips}</div>
      </div>`;
    }).join("");
    body = `<div style="display:flex;justify-content:flex-end;margin-bottom:12px;">
      <button class="btn-primary" id="btnAddTorneo">${ic.plus} Nuevo torneo</button>
    </div>${torneosHtml}`;
  }

  return `
    <h1 class="page-title dia-title">Panel Administrativo</h1>
    <p class="page-sub">Control de atletas, matrículas y torneos</p>
    <div class="stats-row">
      ${statPill(ic.users,"Total atletas", state.athletes.length,"var(--pitch)")}
      ${statPill(ic.card,"Ingresos matrícula", "$"+totalIngresos,"var(--green)")}
      ${statPill(ic.trophy,"Ingresos torneos", "$"+torneoIngresos,"var(--red)")}
      ${statPill(ic.alert,"Matrículas pendientes", pendientes,"var(--red)")}
    </div>
    <div class="admin-tabs">${tabs}</div>
    <div class="charts-row">
      <div class="chart-card small"><h4>Matrículas: pagado vs. pendiente</h4><div class="chart-wrap short"><canvas id="chartAdminMatricula"></canvas></div></div>
      <div class="chart-card"><h4>Recaudación por torneo ($)</h4><div class="chart-wrap short"><canvas id="chartAdminTorneos"></canvas></div></div>
    </div>
    ${body}
  `;
}
