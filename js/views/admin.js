import { state } from '../state.js';
import { CATEGORIES } from '../constants.js';
import { ic } from '../icons.js';
import { escapeHtml } from '../utils.js';
import { statPill, badge } from '../render-helpers.js';

export function renderAdmin(){
  if(!state.adminAuth){
    return `
      <h1 class="page-title dia-title">Panel Administrativo</h1>
      <p class="page-sub">Acceso restringido</p>
      <div class="admin-login">
        <div class="admin-login-card">
          <div style="text-align:center;margin-bottom:16px;">${ic.shield}</div>
          <h3 class="dia-title" style="text-align:center;margin:0 0 6px;">Contraseña requerida</h3>
          <p style="text-align:center;font-size:12px;color:var(--muted);margin:0 0 16px;">Ingresa la contraseña para acceder al panel.</p>
          <input type="password" id="adminPassword" placeholder="Contraseña..." style="width:100%;padding:10px 12px;border:1px solid var(--chalk-dim);border-radius:8px;font-size:14px;margin-bottom:12px;">
          <p id="adminPassError" style="color:var(--red);font-size:12px;margin:0 0 10px;display:none;">Contraseña incorrecta</p>
          <button class="btn-primary" id="btnAdminLogin" style="width:100%;justify-content:center;">Entrar</button>
        </div>
      </div>`;
  }
  const totalMensualidadesMes = state.athletes.filter(a=>{
    const m = a.mensualidades && a.mensualidades[state.mensualMonth];
    return m && m.estado==="pagado";
  }).reduce((s,a)=>s+((a.mensualidades[state.mensualMonth]||{}).monto||0),0);
  const totalIngresos = state.athletes.filter(a=>a.matricula.estado==="pagado").reduce((s,a)=>s+a.matricula.monto,0) + totalMensualidadesMes;
  const torneoIngresos = state.torneos.reduce((sum,t)=>{
    const pagantes = state.athletes.filter(a=>a.torneos.some(at=>at.torneoId===t.id)).length;
    return sum + pagantes*t.monto;
  },0);
  const pendientes = state.athletes.filter(a=>a.matricula.estado==="pendiente").length;

  const tabs = [
    {key:"config",label:"Configuración"},
    {key:"atletas",label:"Todos los atletas"},
    {key:"matriculas",label:"Pagos de matrícula"},
    {key:"mensualidades",label:"Mensualidades"},
    {key:"torneos",label:"Torneos y pagos"},
  ].map(t=>`<button class="admin-tab ${state.adminTab===t.key?"active":""}" data-admintab="${t.key}">${t.label}</button>`).join("");

  let body = "";
  if(state.adminTab==="config"){
    const configRows = CATEGORIES.map(c=>{
      const cfg = state.config[c] || {matricula:35, mensualidad:20};
      const count = state.athletes.filter(a=>a.categoria===c).length;
      return `<tr>
        <td style="font-weight:700;font-size:15px;">${c}</td>
        <td style="text-align:center;">${count}</td>
        <td style="text-align:center;font-weight:700;">$${cfg.matricula}</td>
        <td style="text-align:center;font-weight:700;">$${cfg.mensualidad}</td>
      </tr>`;
    }).join("");
    body = `
      <div class="config-section">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
          <h3 class="dia-title" style="margin:0;">Costos por categoría</h3>
          <button class="btn-primary" id="btnEditConfig">${ic.pencil} Editar costos</button>
        </div>
        <div class="table-wrap">
          <table><thead><tr>
            <th>Categoría</th><th style="text-align:center;">Atletas</th><th style="text-align:center;">Matrícula ($)</th><th style="text-align:center;">Mensualidad ($)</th>
          </tr></thead><tbody>${configRows}</tbody></table>
        </div>
        <div class="config-info">
          <p>${ic.alert} Los costos se aplican al crear nuevos atletas y al generar cobros de mensualidad.</p>
        </div>
      </div>`;
  } else if(state.adminTab==="atletas"){
    const rows = state.athletes.map(a=>`<tr>
      <td style="font-weight:600;">${escapeHtml(a.nombre)} ${escapeHtml(a.apellido)}</td>
      <td>${a.categoria}</td><td>${a.edad}</td><td>${escapeHtml(a.representante)}</td><td>${escapeHtml(a.telefono)}</td>
      <td>${badge(a.matricula.estado, a.matricula.estado==="pagado"?"good":"bad")}</td>
      <td><button class="link-btn" data-open="${a.id}">Ver perfil</button></td>
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
  } else if(state.adminTab==="mensualidades"){
    const mesActual = state.mensualMonth;
    const meses = [];
    for(let m=1;m<=12;m++){
      const key = `2026-${String(m).padStart(2,"0")}`;
      const label = ["","Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"][m];
      meses.push({key,label:label+" 2026"});
    }
    const monthBtns = meses.map(m=>
      `<button class="chip ${state.mensualMonth===m.key?"active":""}" data-mensualmonth="${m.key}">${m.label}</button>`
    ).join("");
    const totalMensualidades = state.athletes.filter(a=>{
      const m = a.mensualidades && a.mensualidades[mesActual];
      return m && m.estado==="pagado";
    }).reduce((s,a)=>{
      const m = a.mensualidades[mesActual];
      return s + (m ? m.monto : 0);
    },0);
    const pendientesMes = state.athletes.filter(a=>{
      const m = a.mensualidades && a.mensualidades[mesActual];
      return !m || m.estado!=="pagado";
    }).length;
    const cards = state.athletes.map(a=>{
      if(!a.mensualidades) a.mensualidades = {};
      const m = a.mensualidades[mesActual];
      const estado = m ? m.estado : "pendiente";
      const monto = m ? m.monto : ((state.config[a.categoria] && state.config[a.categoria].mensualidad) || 20);
      const fecha = m ? m.fecha : "—";
      return `<div class="mat-card">
        <div class="row1"><div class="name">${escapeHtml(a.nombre)} ${escapeHtml(a.apellido)}</div>${badge(a.categoria,"neutral")}</div>
        <div class="info">Monto: $${monto} · Última fecha: ${fecha}</div>
        <div class="btns">
          <button class="bp ${estado==="pagado"?"on":""}" data-mensualidad="${a.id}|${mesActual}|1">Pagado</button>
          <button class="bd ${estado==="pendiente"?"on":""}" data-mensualidad="${a.id}|${mesActual}|0">Pendiente</button>
        </div></div>`;
    }).join("");
    body = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px;">
        <div class="stats-row" style="margin:0;flex:1;">
          ${statPill(ic.dollar,"Recaudado mes","$"+totalMensualidades,"var(--green)")}
          ${statPill(ic.alert,"Pendientes",pendientesMes,"var(--red)")}
        </div>
        <button class="btn-primary green" id="btnInitMensualidades">${ic.plus} Iniciar mes</button>
      </div>
      <div class="filters" style="margin-bottom:14px;">${monthBtns}</div>
      <div class="mat-grid">${cards}</div>`;
  } else {
    let torneosHtml = state.torneos.map(t=>{
      const elegibles = state.athletes.filter(a=>a.categoria===t.categoria);
      const inscritos = elegibles.filter(a=>a.torneos.some(at=>at.torneoId===t.id));

      const chips = elegibles.map(a=>{
        const inscrito = a.torneos.some(at=>at.torneoId===t.id);
        return `<button class="pay-chip ${inscrito?"paid":""}" data-torneopago="${a.id}|${t.id}|${inscrito?0:1}">
          ${inscrito?ic.check:ic.clock} ${escapeHtml(a.nombre)} ${escapeHtml(a.apellido)}</button>`;
      }).join("");

      const statsSummary = inscritos.length > 0 ? (() => {
        let totalGoles = 0, totalAsist = 0;
        inscritos.forEach(a => {
          const st = a.estadisticas && a.estadisticas[t.id];
          if(st){ totalGoles += st.goles||0; totalAsist += st.asistencias||0; }
        });
        return `<div class="tor-stats-mini">${ic.activity} ${totalGoles} goles · ${totalAsist} asistencias</div>`;
      })() : "";

      return `<div class="torneo-card">
        <div class="head">
          <div>
            <div class="tname">${escapeHtml(t.nombre)}</div>
            <div class="tmeta"><span>${ic.cal} ${t.fecha}</span><span>Categoría ${t.categoria}</span><span>$${t.monto} por atleta</span></div>
            ${t.descripcion ? `<div class="tor-desc">${escapeHtml(t.descripcion)}</div>` : ""}
          </div>
          <div class="tor-actions-top">
            ${badge(inscritos.length+"/"+elegibles.length+" inscritos","warn")}
            <button class="btn-icon" data-edit-torneo="${t.id}" title="Editar torneo">${ic.pencil}</button>
            <button class="btn-icon green" data-stats-torneo="${t.id}" title="Cargar estadísticas">${ic.activity}</button>
          </div>
        </div>
        ${statsSummary}
        <div class="pay-chips-label">Atletas de ${t.categoria}:</div>
        <div class="pay-chips">${chips}</div>
      </div>`;
    }).join("");
    if(!state.torneos.length){
      torneosHtml = `<p class="empty-msg">No hay torneos creados. Crea uno para comenzar.</p>`;
    }
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
    ${state.adminTab!=="config" ? `<div class="charts-row">
      <div class="chart-card"><h4>Matrículas: pagado vs pendiente</h4><div class="chart-wrap short"><canvas id="chartAdminMatricula"></canvas></div></div>
      <div class="chart-card"><h4>Mensualidades: pagado vs pendiente</h4><div class="chart-wrap short"><canvas id="chartAdminMensualidades"></canvas></div></div>
      <div class="chart-card"><h4>Recaudación por torneo ($)</h4><div class="chart-wrap short"><canvas id="chartAdminTorneos"></canvas></div></div>
      <div class="chart-card"><h4>Inscritos a torneos por categoría</h4><div class="chart-wrap short"><canvas id="chartAdminCatTorneos"></canvas></div></div>
    </div>` : ""}
    ${body}
  `;
}
