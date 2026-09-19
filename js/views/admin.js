import { state } from "../state.js";
import { CATEGORIES } from "../constants.js";
import { ic } from "../icons.js";
import { escapeHtml } from "../utils.js";
import { statPill, badge } from "../render-helpers.js";

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
    {key:"sedes",label:"Gestión de sedes"},
    {key:"site",label:"Configuración del sitio"},
    {key:"pruebas",label:"Pruebas de Ingreso"},
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
  } else if(state.adminTab==="torneos"){
    let torneosHtml = state.torneos.map(t=>{
      const elegibles = state.athletes;
      const inscritos = elegibles.filter(a=>a.torneos.some(at=>at.torneoId===t.id));

      const chips = elegibles.map(a=>{
        const inscrito = a.torneos.some(at=>at.torneoId===t.id);
        return `<button class="pay-chip ${inscrito?"paid":""}" data-torneopago="${a.id}|${t.id}|${inscrito?0:1}">
          ${inscrito?ic.check:ic.clock} ${escapeHtml(a.nombre)} ${escapeHtml(a.apellido)} <span class="pay-cat">${a.categoria}</span></button>`;
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
        <div class="pay-chips-label">Atletas (toca para marcar pago):</div>
        <div class="pay-chips">${chips}</div>
      </div>`;
    }).join("");
    if(!state.torneos.length){
      torneosHtml = `<p class="empty-msg">No hay torneos creados. Crea uno para comenzar.</p>`;
    }
    body = `<div style="display:flex;justify-content:flex-end;margin-bottom:12px;">
      <button class="btn-primary" id="btnAddTorneo">${ic.plus} Nuevo torneo</button>
    </div>${torneosHtml}`;
  } else if(state.adminTab==="sedes"){
    const sedeCards = state.sedes.map(s=>{
      const atletasCount = state.athletes.filter(a=>a.sede_id===s.id).length;
      const torneosCount = state.torneos.filter(t=>t.sede_id===s.id).length;
      return `
        <div class="sede-admin-card">
          <div class="sede-admin-header">
            <div>
              <h3>${escapeHtml(s.nombre)}</h3>
              <span class="sede-code-badge">${escapeHtml(s.codigo)}</span>
            </div>
            <span class="sede-status ${s.estado==='activa'?'active':'inactive'}">${s.estado==='activa'?ic.check:ic.x} ${s.estado}</span>
          </div>
          <div class="sede-admin-meta">
            <p>${ic.mapPin} ${escapeHtml(s.direccion||"Sin dirección")}</p>
            <p>${ic.phone} ${escapeHtml(s.telefono||"Sin teléfono")}</p>
            <p>${ic.mail} ${escapeHtml(s.email||"Sin email")}</p>
          </div>
          <div class="sede-admin-stats">
            <span>${ic.users} ${atletasCount} atletas</span>
            <span>${ic.shield} ${torneosCount} torneos</span>
          </div>
          <div class="sede-admin-actions">
            <button class="btn-outline" data-edit-sede="${s.id}">${ic.pencil} Editar</button>
            ${state.sedes.length > 1 ? `<button class="btn-outline red" data-delete-sede="${s.id}">${ic.x} Eliminar</button>` : ''}
          </div>
        </div>
      `;
    }).join("");
    body = `
      <div style="display:flex;justify-content:flex-end;margin-bottom:12px;">
        <button class="btn-primary" id="btnAddSede">${ic.plus} Nueva sede</button>
      </div>
      <div class="sede-admin-grid">${sedeCards}</div>
      <div class="config-info" style="margin-top:24px;">
        <p>${ic.alert} Cada sede tiene su propia base de datos aislada. Los atletas, torneos y pagos pertenecen a una sede específica.</p>
      </div>
    `;
  } else if(state.adminTab==="site") {
    // Site content management
    const sc = state.siteContent;
    body = `
      <div class="site-config-section">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
          <h3 class="dia-title" style="margin:0;">Hero Principal</h3>
        </div>
        <div class="config-fields-grid">
          <div class="config-field-full">
            <label>Título Principal</label>
            <input type="text" id="siteHeroTitle" value="${escapeHtml(sc.hero?.title || "")}" placeholder="DEPORTIVO ITALIA ACADEMY">
          </div>
          <div class="config-field-full">
            <label>Subtítulo</label>
            <textarea id="siteHeroSubtitle" rows="2" placeholder="Formando futbolistas, desarrollando talentos y construyendo valores.">${escapeHtml(sc.hero?.subtitle || "")}</textarea>
          </div>
          <div class="config-field-half">
            <label>Botón Principal</label>
            <input type="text" id="siteHeroCtaPrimary" value="${escapeHtml(sc.hero?.ctaPrimary || "")}" placeholder="Conoce nuestra academia">
          </div>
          <div class="config-field-half">
            <label>Botón Secundario</label>
            <input type="text" id="siteHeroCtaSecondary" value="${escapeHtml(sc.hero?.ctaSecondary || "")}" placeholder="Acceder al sistema">
          </div>
        </div>

        <h3 class="dia-title" style="margin:32px 0 16px;">¿Quiénes Somos?</h3>
        <div class="config-fields-grid">
          <div class="config-field-full">
            <label>Historia</label>
            <textarea id="siteHistoria" rows="3" placeholder="Historia de la academia...">${escapeHtml(sc.nosotros?.historia || "")}</textarea>
          </div>
          <div class="config-field-half">
            <label>Misión</label>
            <textarea id="siteMision" rows="3" placeholder="Misión de la academia...">${escapeHtml(sc.nosotros?.mision || "")}</textarea>
          </div>
          <div class="config-field-half">
            <label>Visión</label>
            <textarea id="siteVision" rows="3" placeholder="Visión de la academia...">${escapeHtml(sc.nosotros?.vision || "")}</textarea>
          </div>
          <div class="config-field-half">
            <label>Valores</label>
            <textarea id="siteValores" rows="3" placeholder="Valores separados por comas...">${escapeHtml(sc.nosotros?.valores || "")}</textarea>
          </div>
          <div class="config-field-half">
            <label>Filosofía</label>
            <textarea id="siteFilosofia" rows="3" placeholder="Filosofía deportiva...">${escapeHtml(sc.nosotros?.filosofia || "")}</textarea>
          </div>
          <div class="config-field-half">
            <label>Metodología</label>
            <textarea id="siteMetodologia" rows="3" placeholder="Metodología de entrenamiento...">${escapeHtml(sc.nosotros?.metodologia || "")}</textarea>
          </div>
        </div>

        <h3 class="dia-title" style="margin:32px 0 16px;">Información de Contacto</h3>
        <div class="config-fields-grid">
          <div class="config-field-half">
            <label>Teléfono</label>
            <input type="text" id="siteTelefono" value="${escapeHtml(sc.contacto?.telefono || "")}" placeholder="+507 000-0000">
          </div>
          <div class="config-field-half">
            <label>WhatsApp</label>
            <input type="text" id="siteWhatsapp" value="${escapeHtml(sc.contacto?.whatsapp || "")}" placeholder="+507 000-0000">
          </div>
          <div class="config-field-half">
            <label>Email</label>
            <input type="email" id="siteEmail" value="${escapeHtml(sc.contacto?.email || "")}" placeholder="info@deportivoitalia.com">
          </div>
        </div>

        <div style="margin-top:24px;">
          <button class="btn-primary" id="btnSaveSiteContent">${ic.save} Guardar cambios</button>
        </div>
      </div>

      <div class="site-config-section" style="margin-top:32px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <h3 class="dia-title" style="margin:0;">Galería de Imágenes</h3>
          <button class="btn-primary" id="btnAddGaleria">${ic.plus} Agregar imagen</button>
        </div>
        ${renderGaleriaAdmin()}
      </div>
    `;
  } else if(state.adminTab==="pruebas"){
    const requests = state.adminTrialRequests || [];
    const pendingCount = requests.filter(r => r.status === 'pendiente').length;
    const confirmedCount = requests.filter(r => r.status === 'confirmada').length;
    const completedCount = requests.filter(r => r.status === 'realizada').length;
    const noShowCount = requests.filter(r => r.status === 'no_asistio').length;
    const cancelledCount = requests.filter(r => r.status === 'cancelada').length;
    const todayKey = new Date().toISOString().slice(0, 10);
    const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    const weekKey = weekStart.toISOString().slice(0, 10);
    const todayCount = requests.filter(r => (r.test_date || r.preferred_date) === todayKey).length;
    const weekCount = requests.filter(r => (r.test_date || r.preferred_date) >= weekKey && (r.test_date || r.preferred_date) <= todayKey).length;
    const categoryCounts = ['U4','U6','U8','U10','U12'].map(category => `${category}: ${requests.filter(r => (r.category || '').toUpperCase() === category).length}`).join(' · ');
    const calendarGroups = {};
    requests.forEach(r => { const date = r.test_date || r.preferred_date; if (date) (calendarGroups[date] ||= []).push(r); });
    const calendarHtml = Object.keys(calendarGroups).sort().map(date => `<div class="trial-calendar-day"><strong>${new Date(`${date}T12:00:00`).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</strong>${calendarGroups[date].sort((a,b) => String(a.test_time || a.preferred_time_slot).localeCompare(String(b.test_time || b.preferred_time_slot))).map(r => `<span>${r.test_time || r.preferred_time_slot} — ${escapeHtml(r.athlete_name)} — ${escapeHtml(r.category || '')}</span>`).join('')}</div>`).join('') || '<p class="empty-msg">No hay pruebas programadas.</p>';
    
    const rows = requests.map(r => {
      const sede = state.sedes.find(s => s.id === r.sede_id);
      const sedeName = sede ? sede.nombre : 'Desconocida';
       const dateValue = r.test_date || r.preferred_date;
       const date = new Date(`${dateValue}T12:00:00`).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
       const timeValue = r.test_time || r.preferred_time_slot;
       const timeLabel = timeValue === '16:30' ? '4:30 PM' : '5:00 PM';
       const category = r.category || (r.age_category === 'U4_U6' ? 'U4/U6' : 'U8/U10/U12');
       const statusBadge = badge(r.status === 'no_asistio' ? 'No asistió' : r.status, r.status === 'realizada' ? 'good' : r.status === 'cancelada' || r.status === 'no_asistio' ? 'bad' : 'neutral');
      
      return `<tr>
         <td>${escapeHtml(r.registration_code || r.id || '')}</td>
         <td>${escapeHtml(r.representative_name)}</td>
        <td>${escapeHtml(r.athlete_name)}</td>
        <td>${date}</td>
        <td>${timeLabel}</td>
         <td>${escapeHtml(category)}${r.athlete_age ? ` (${r.athlete_age} años)` : ''}</td>
        <td>${escapeHtml(sedeName)}</td>
        <td>${escapeHtml(r.email)}</td>
        <td>${escapeHtml(r.phone)}</td>
         <td>${statusBadge}</td>
         <td>${escapeHtml(r.notes || '')}</td>
        <td>
          <div class="btn-group">
             ${r.status === 'pendiente' ? `<button class="bp" data-trial-status="${r.id}|confirmada">${ic.check} Confirmar</button>` : ''}
             ${r.status === 'confirmada' ? `<button class="bp" data-trial-status="${r.id}|realizada">${ic.checkCircle} Realizada</button><button class="bd" data-trial-status="${r.id}|no_asistio">No asistió</button>` : ''}
            ${r.status !== 'cancelada' ? `<button class="bd" data-trial-status="${r.id}|cancelada">${ic.x} Cancelar</button>` : ''}
          </div>
        </td>
      </tr>`;
    }).join("");
    
    body = `
      <div class="pruebas-header">
        <div class="pruebas-stats">
          <div class="stat-card total">${ic.clipboard} <span>${requests.length}</span> <span>Total</span></div>
          <div class="stat-card pending">${ic.clock} <span>${pendingCount}</span> <span>Pendientes</span></div>
          <div class="stat-card confirmed">${ic.checkCircle} <span>${confirmedCount}</span> <span>Confirmadas</span></div>
          <div class="stat-card completed">${ic.checkCircle} <span>${completedCount}</span> <span>Realizadas</span></div>
          <div class="stat-card cancelled">${ic.xCircle} <span>${cancelledCount}</span> <span>Canceladas</span></div>
          <div class="stat-card total">${ic.calendar} <span>${todayCount}</span> <span>Hoy</span></div>
          <div class="stat-card total">${ic.calendar} <span>${weekCount}</span> <span>Esta semana</span></div>
        </div>
        <div class="pruebas-filters">
          <select id="filterStatus" class="filter-select">
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendientes</option>
            <option value="confirmada">Confirmadas</option>
            <option value="realizada">Realizadas</option>
            <option value="no_asistio">No asistió</option>
            <option value="cancelada">Canceladas</option>
          </select>
          <select id="filterSede" class="filter-select">
            <option value="">Todas las sedes</option>
            ${state.sedes.map(s => `<option value="${escapeHtml(s.id)}">${escapeHtml(s.nombre)}</option>`).join('')}
          </select>
          <input type="search" id="filterSearch" class="filter-input" placeholder="Buscar atleta, representante o teléfono">
          <select id="filterCategory" class="filter-select"><option value="">Todas las categorías</option>${['U4','U6','U8','U10','U12'].map(c => `<option value="${c}">${c}</option>`).join('')}</select>
          <input type="date" id="filterDate" class="filter-input" title="Fecha exacta">
          <input type="date" id="filterDateFrom" class="filter-input" title="Desde">
          <input type="date" id="filterDateTo" class="filter-input" title="Hasta">
          <button class="btn-secondary" id="btnSearchPruebas">${ic.search} Buscar</button>
          <button class="btn-outline" id="btnClearPruebas">Limpiar</button>
          <button class="btn-secondary" id="btnExportPruebas">${ic.download} Exportar CSV</button>
        </div>
      </div>
      <div class="trial-calendar"><h3 class="dia-title">Calendario de pruebas</h3>${calendarHtml}</div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th><th>Representante</th>
              <th>Atleta</th>
              <th>Fecha</th>
              <th>Horario</th>
              <th>Categoría</th>
              <th>Sede</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Estado</th>
              <th>Observaciones</th><th>Acciones</th>
            </tr>
          </thead>
          <tfoot><tr><td colspan="12" class="trial-category-summary">${escapeHtml(categoryCounts)}</td></tr></tfoot>
          <tbody>${rows || `<tr><td colspan="12" class="empty-msg">No hay solicitudes de prueba registradas</td></tr>`}</tbody>
        </table>
      </div>
    `;
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
    ${state.adminTab!=="config" && state.adminTab!=="sedes" && state.adminTab!=="site" ? `<div class="charts-row">
      <div class="chart-card"><h4>Matrículas: pagado vs pendiente</h4><div class="chart-wrap short"><canvas id="chartAdminMatricula"></canvas></div></div>
      <div class="chart-card"><h4>Mensualidades: pagado vs pendiente</h4><div class="chart-wrap short"><canvas id="chartAdminMensualidades"></canvas></div></div>
      <div class="chart-card"><h4>Recaudación por torneo ($)</h4><div class="chart-wrap short"><canvas id="chartAdminTorneos"></canvas></div></div>
      <div class="chart-card"><h4>Inscritos a torneos por categoría</h4><div class="chart-wrap short"><canvas id="chartAdminCatTorneos"></canvas></div></div>
    </div>` : ""}
    ${body}
  `;
}

function renderGaleriaAdmin() {
  const galeria = state.siteContent.galeria || [];
  if (galeria.length === 0) {
    return `<p class="empty-msg">No hay imágenes en la galería. Agrega la primera.</p>`;
  }
  return `
    <div class="galeria-admin-grid">
      ${galeria.map((img, idx) => `
        <div class="galeria-admin-item">
          <img src="${escapeHtml(img.url)}" alt="${escapeHtml(img.descripcion || "")}" loading="lazy">
          <div class="galeria-admin-overlay">
            <span class="galeria-cat">${escapeHtml(img.categoria || "")}</span>
            <button class="btn-delete-galeria" data-delete-galeria="${idx}" title="Eliminar">${ic.x}</button>
          </div>
          <p class="galeria-desc">${escapeHtml(img.descripcion || "")}</p>
        </div>
      `).join("")}
    </div>
  `;
}
