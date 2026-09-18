import { state } from "/js/state.js";
import { CATEGORIES, POSITIONS } from "/js/constants.js";
import { ic } from "/js/icons.js";
import { addAthlete, addTorneo, updateAthlete, updateTorneo, deleteTorneo, saveEstadisticas, saveConfigData, updateAthleteCosts, addJuego, updateJuego, saveJuegoStats } from "/js/mutations.js";
import { escapeHtml } from "/js/utils.js";
import { saveSede, updateSede, saveSiteContent } from "/js/api.js";

export function closeModal(){
  const ov = document.getElementById("modalOverlay");
  if(ov) ov.remove();
}

export function openAddAthleteModal(){
  closeModal();
  const html = `
    <div class="modal-overlay" id="modalOverlay">
      <div class="modal">
        <div class="mh"><h3 class="dia-title">Registrar nuevo atleta</h3><button id="modalClose">${ic.x}</button></div>
        <label>Nombre</label><input id="f_nombre">
        <label>Apellido</label><input id="f_apellido">
        <div class="row2">
          <div><label>Categoría</label><select id="f_categoria">${CATEGORIES.map(c=>`<option>${c}</option>`).join("")}</select></div>
          <div><label>Edad</label><input id="f_edad" type="number" value="6"></div>
        </div>
        <label>Posición</label>
        <select id="f_posicion">${POSITIONS.map(p=>`<option>${p}</option>`).join("")}</select>
        <label>Fecha de nacimiento</label><input id="f_fnac" type="date">
        <label>Representante</label><input id="f_rep">
        <label>Teléfono</label><input id="f_tel">
        <label>Dirección</label><input id="f_dir">
        <button class="save-btn" id="f_save" disabled>Guardar atleta</button>
      </div>
    </div>`;
  document.getElementById("app").insertAdjacentHTML("beforeend", html);
  document.getElementById("modalClose").onclick = closeModal;
  document.getElementById("modalOverlay").addEventListener("click", e=>{ if(e.target.id==="modalOverlay") closeModal(); });
  const checkValid = ()=>{
    const ok = document.getElementById("f_nombre").value.trim() && document.getElementById("f_apellido").value.trim();
    document.getElementById("f_save").disabled = !ok;
  };
  ["f_nombre","f_apellido"].forEach(id=> document.getElementById(id).addEventListener("input", checkValid));
  document.getElementById("f_save").onclick = ()=>{
    addAthlete({
      nombre: document.getElementById("f_nombre").value.trim(),
      apellido: document.getElementById("f_apellido").value.trim(),
      categoria: document.getElementById("f_categoria").value,
      edad: document.getElementById("f_edad").value,
      posicion: document.getElementById("f_posicion").value,
      fechaNacimiento: document.getElementById("f_fnac").value,
      representante: document.getElementById("f_rep").value.trim(),
      telefono: document.getElementById("f_tel").value.trim(),
      direccion: document.getElementById("f_dir").value.trim(),
    });
  };
}

export function openEditAthleteModal(athleteId){
  closeModal();
  const a = state.athletes.find(x=>x.id===athleteId);
  if(!a) return;
  const html = `
    <div class="modal-overlay" id="modalOverlay">
      <div class="modal">
        <div class="mh"><h3 class="dia-title">Editar atleta</h3><button id="modalClose">${ic.x}</button></div>
        <label>Nombre</label><input id="e_nombre" value="${escapeHtml(a.nombre)}">
        <label>Apellido</label><input id="e_apellido" value="${escapeHtml(a.apellido)}">
        <div class="row2">
          <div><label>Categoría</label><select id="e_categoria">${CATEGORIES.map(c=>`<option ${c===a.categoria?"selected":""}>${c}</option>`).join("")}</select></div>
          <div><label>Edad</label><input id="e_edad" type="number" value="${a.edad}"></div>
        </div>
        <label>Posición</label>
        <select id="e_posicion">${POSITIONS.map(p=>`<option ${p===a.posicion?"selected":""}>${p}</option>`).join("")}</select>
        <label>Fecha de nacimiento</label><input id="e_fnac" type="date" value="${a.fechaNacimiento||""}">
        <label>Representante</label><input id="e_rep" value="${escapeHtml(a.representante||"")}">
        <label>Teléfono</label><input id="e_tel" value="${escapeHtml(a.telefono||"")}">
        <label>Dirección</label><input id="e_dir" value="${escapeHtml(a.direccion||"")}">
        <label>Fecha de ingreso</label><input id="e_fing" type="date" value="${a.fechaIngreso||""}">
        <button class="save-btn" id="e_save" disabled>Guardar cambios</button>
      </div>
    </div>`;
  document.getElementById("app").insertAdjacentHTML("beforeend", html);
  document.getElementById("modalClose").onclick = closeModal;
  document.getElementById("modalOverlay").addEventListener("click", e=>{ if(e.target.id==="modalOverlay") closeModal(); });
  const checkValid = ()=>{
    const ok = document.getElementById("e_nombre").value.trim() && document.getElementById("e_apellido").value.trim();
    document.getElementById("e_save").disabled = !ok;
  };
  ["e_nombre","e_apellido"].forEach(id=> document.getElementById(id).addEventListener("input", checkValid));
  checkValid();
  document.getElementById("e_save").onclick = ()=>{
    updateAthlete(athleteId, {
      nombre: document.getElementById("e_nombre").value.trim(),
      apellido: document.getElementById("e_apellido").value.trim(),
      categoria: document.getElementById("e_categoria").value,
      edad: Number(document.getElementById("e_edad").value),
      posicion: document.getElementById("e_posicion").value,
      fechaNacimiento: document.getElementById("e_fnac").value,
      representante: document.getElementById("e_rep").value.trim(),
      telefono: document.getElementById("e_tel").value.trim(),
      direccion: document.getElementById("e_dir").value.trim(),
      fechaIngreso: document.getElementById("e_fing").value,
    });
    closeModal();
    if(window.__render) window.__render();
  };
}

export function openConfigModal(){
  closeModal();
  const rows = CATEGORIES.map(c=>{
    const cfg = state.config[c] || {matricula:35, mensualidad:20};
    return `<div class="config-row">
      <div class="config-cat">${c}</div>
      <div class="config-fields">
        <div><label>Matrícula ($)</label><input type="number" min="0" class="cfg-input" data-cfg="${c}|matricula" value="${cfg.matricula}"></div>
        <div><label>Mensualidad ($)</label><input type="number" min="0" class="cfg-input" data-cfg="${c}|mensualidad" value="${cfg.mensualidad}"></div>
      </div>
    </div>`;
  }).join("");
  const html = `
    <div class="modal-overlay" id="modalOverlay">
      <div class="modal">
        <div class="mh"><h3 class="dia-title">Editar costos</h3><button id="modalClose">${ic.x}</button></div>
        <p style="font-size:12px;color:var(--muted);margin-bottom:14px;">Configura el costo de matrícula y mensualidad para cada categoría.</p>
        ${rows}
        <button class="save-btn" id="cfg_save">Guardar costos</button>
      </div>
    </div>`;
  document.getElementById("app").insertAdjacentHTML("beforeend", html);
  document.getElementById("modalClose").onclick = closeModal;
  document.getElementById("modalOverlay").addEventListener("click", e=>{ if(e.target.id==="modalOverlay") closeModal(); });
  document.getElementById("cfg_save").onclick = ()=>{
    const newConfig = {};
    CATEGORIES.forEach(c=>{
      const mat = document.querySelector(`[data-cfg="${c}|matricula"]`);
      const men = document.querySelector(`[data-cfg="${c}|mensualidad"]`);
      newConfig[c] = { matricula: Number(mat?mat.value:35), mensualidad: Number(men?men.value:20) };
    });
    saveConfigData(newConfig);
    closeModal();
  };
}

export function openAddTorneoModal(){
  closeModal();
  const html = `
    <div class="modal-overlay" id="modalOverlay">
      <div class="modal">
        <div class="mh"><h3 class="dia-title">Nuevo torneo</h3><button id="modalClose">${ic.x}</button></div>
        <label>Nombre del torneo</label><input id="t_nombre">
        <label>Fecha</label><input id="t_fecha" type="date">
        <div class="row2">
          <div><label>Categoría</label><select id="t_categoria"><option>Mixto</option>${CATEGORIES.map(c=>`<option>${c}</option>`).join("")}</select></div>
          <div><label>Monto ($)</label><input id="t_monto" type="number" value="20"></div>
        </div>
        <label>Descripción</label><textarea id="t_desc" rows="2" placeholder="Detalles del torneo..."></textarea>
        <button class="save-btn" id="t_save" disabled>Crear torneo</button>
      </div>
    </div>`;
  document.getElementById("app").insertAdjacentHTML("beforeend", html);
  document.getElementById("modalClose").onclick = closeModal;
  document.getElementById("modalOverlay").addEventListener("click", e=>{ if(e.target.id==="modalOverlay") closeModal(); });
  const checkValid = ()=>{
    const ok = document.getElementById("t_nombre").value.trim() && document.getElementById("t_fecha").value;
    document.getElementById("t_save").disabled = !ok;
  };
  ["t_nombre","t_fecha"].forEach(id=> document.getElementById(id).addEventListener("input", checkValid));
  document.getElementById("t_save").onclick = ()=>{
    addTorneo({
      nombre: document.getElementById("t_nombre").value.trim(),
      fecha: document.getElementById("t_fecha").value,
      categoria: document.getElementById("t_categoria").value,
      monto: document.getElementById("t_monto").value,
      descripcion: document.getElementById("t_desc").value.trim(),
    });
  };
}

export function openEditTorneoModal(torneoId){
  closeModal();
  const t = state.torneos.find(x=>x.id===torneoId);
  if(!t) return;
  const html = `
    <div class="modal-overlay" id="modalOverlay">
      <div class="modal">
        <div class="mh"><h3 class="dia-title">Editar torneo</h3><button id="modalClose">${ic.x}</button></div>
        <label>Nombre del torneo</label><input id="et_nombre" value="${escapeHtml(t.nombre)}">
        <label>Fecha</label><input id="et_fecha" type="date" value="${t.fecha}">
        <div class="row2">
          <div><label>Categoría</label><select id="et_categoria"><option ${!CATEGORIES.includes(t.categoria)?"selected":""}>Mixto</option>${CATEGORIES.map(c=>`<option ${c===t.categoria?"selected":""}>${c}</option>`).join("")}</select></div>
          <div><label>Monto ($)</label><input id="et_monto" type="number" value="${t.monto}"></div>
        </div>
        <label>Descripción</label><textarea id="et_desc" rows="2">${escapeHtml(t.descripcion||"")}</textarea>
        <button class="save-btn" id="et_save" disabled>Guardar cambios</button>
        <button class="save-btn red" id="et_delete" style="margin-top:8px;">Eliminar torneo</button>
      </div>
    </div>`;
  document.getElementById("app").insertAdjacentHTML("beforeend", html);
  document.getElementById("modalClose").onclick = closeModal;
  document.getElementById("modalOverlay").addEventListener("click", e=>{ if(e.target.id==="modalOverlay") closeModal(); });
  const checkValid = ()=>{
    const ok = document.getElementById("et_nombre").value.trim() && document.getElementById("et_fecha").value;
    document.getElementById("et_save").disabled = !ok;
  };
  ["et_nombre","et_fecha"].forEach(id=> document.getElementById(id).addEventListener("input", checkValid));
  checkValid();
  document.getElementById("et_save").onclick = ()=>{
    updateTorneo(torneoId, {
      nombre: document.getElementById("et_nombre").value.trim(),
      fecha: document.getElementById("et_fecha").value,
      categoria: document.getElementById("et_categoria").value,
      monto: Number(document.getElementById("et_monto").value),
      descripcion: document.getElementById("et_desc").value.trim(),
    });
  };
  document.getElementById("et_delete").onclick = ()=>{
    if(confirm("¿Eliminar este torneo? Se desasociará de todos los atletas.")){
      deleteTorneo(torneoId);
      closeModal();
    }
  };
}

export function openTorneoStatsModal(torneoId){
  closeModal();
  const t = state.torneos.find(x=>x.id===torneoId);
  if(!t) return;
  const elegibles = state.athletes.filter(a=>a.torneos.some(x=>x.torneoId===torneoId));

  const rows = elegibles.map(a=>{
    const stats = (a.estadisticas && a.estadisticas[torneoId]) || {goles:0,asistencias:0,tarjetasAmarillas:0,tarjetasRojas:0,partidosJugados:0};
    return `<tr>
      <td style="font-weight:600;">${escapeHtml(a.nombre)} ${escapeHtml(a.apellido)}</td>
      <td><input type="number" min="0" class="st-input" data-st="${a.id}|goles" value="${stats.goles}"></td>
      <td><input type="number" min="0" class="st-input" data-st="${a.id}|asistencias" value="${stats.asistencias}"></td>
      <td><input type="number" min="0" class="st-input" data-st="${a.id}|tarjetasAmarillas" value="${stats.tarjetasAmarillas}"></td>
      <td><input type="number" min="0" class="st-input" data-st="${a.id}|tarjetasRojas" value="${stats.tarjetasRojas}"></td>
      <td><input type="number" min="0" class="st-input" data-st="${a.id}|partidosJugados" value="${stats.partidosJugados}"></td>
    </tr>`;
  }).join("");

  const html = `
    <div class="modal-overlay" id="modalOverlay">
      <div class="modal" style="max-width:600px;">
        <div class="mh"><h3 class="dia-title">Estadísticas — ${escapeHtml(t.nombre)}</h3><button id="modalClose">${ic.x}</button></div>
        <p style="font-size:12px;color:var(--muted);margin-bottom:12px;">${elegibles.length} atletas inscritos</p>
        ${elegibles.length === 0 ? '<p class="empty-msg">No hay atletas inscritos en este torneo.</p>' : `
        <div style="overflow-x:auto;">
        <table><thead><tr><th>Atleta</th><th>Goles</th><th>Asist.</th><th>TA</th><th>TR</th><th>Partidos</th></tr></thead>
        <tbody>${rows}</tbody></table></div>
        <button class="save-btn" id="st_save">Guardar estadísticas</button>`}
      </div>
    </div>`;
  document.getElementById("app").insertAdjacentHTML("beforeend", html);
  document.getElementById("modalClose").onclick = closeModal;
  document.getElementById("modalOverlay").addEventListener("click", e=>{ if(e.target.id==="modalOverlay") closeModal(); });
  const saveBtn = document.getElementById("st_save");
  if(saveBtn){
    saveBtn.onclick = ()=>{
      const entries = elegibles.map(a=>{
        const stats = { goles:0, asistencias:0, tarjetasAmarillas:0, tarjetasRojas:0, partidosJugados:0 };
        Object.keys(stats).forEach(key=>{
          const inp = document.querySelector(`[data-st="${a.id}|${key}"]`);
          if(inp) stats[key] = Number(inp.value)||0;
        });
        return { athleteId:a.id, torneoId, stats };
      });
      saveEstadisticas(entries);
      closeModal();
    };
  }
}

export function openEditAthleteCostsModal(athleteId){
  closeModal();
  const a = state.athletes.find(x=>x.id===athleteId);
  if(!a) return;
  const catCfg = state.config[a.categoria] || {matricula:35, mensualidad:20};
  const html = `
    <div class="modal-overlay" id="modalOverlay">
      <div class="modal">
        <div class="mh"><h3 class="dia-title">Costos — ${escapeHtml(a.nombre)} ${escapeHtml(a.apellido)}</h3><button id="modalClose">${ic.x}</button></div>
        <p style="font-size:12px;color:var(--muted);margin-bottom:14px;">Edita los costos individuales de este atleta (solo aplica a montos pendientes).</p>
        <div class="config-row">
          <div class="config-cat">${a.categoria}</div>
          <div class="config-fields">
            <div><label>Matrícula ($)</label><input type="number" min="0" id="ac_matricula" value="${a.matricula.monto}"></div>
            <div><label>Mensualidad ($)</label><input type="number" min="0" id="ac_mensualidad" value="${a._mensualidadMonto || catCfg.mensualidad}"></div>
          </div>
        </div>
        <div class="config-info">
          <p>${ic.alert} La mensualidad se aplica a todos los meses pendientes del atleta.</p>
        </div>
        <button class="save-btn" id="ac_save">Guardar costos</button>
      </div>
    </div>`;
  document.getElementById("app").insertAdjacentHTML("beforeend", html);
  document.getElementById("modalClose").onclick = closeModal;
  document.getElementById("modalOverlay").addEventListener("click", e=>{ if(e.target.id==="modalOverlay") closeModal(); });
  document.getElementById("ac_save").onclick = ()=>{
    updateAthleteCosts(athleteId, document.getElementById("ac_matricula").value, document.getElementById("ac_mensualidad").value);
  };
}

export function openJuegoModal(torneoId, juegoId){
  closeModal();
  const t = state.torneos.find(x=>x.id===torneoId);
  if(!t) return;
  const j = juegoId ? (t.juegos||[]).find(x=>x.id===juegoId) : null;
  const html = `
    <div class="modal-overlay" id="modalOverlay">
      <div class="modal">
        <div class="mh"><h3 class="dia-title">${j?"Editar juego":"Nuevo juego"} — ${escapeHtml(t.nombre)}</h3><button id="modalClose">${ic.x}</button></div>
        <label>Rival (¿contra quién jugamos?)</label><input id="j_rival" value="${j?escapeHtml(j.rival):""}">
        <label>Fecha del juego</label><input id="j_fecha" type="date" value="${j?j.fecha:""}">
        <div class="row2">
          <div><label>Nuestros goles</label><input id="j_gf" type="number" min="0" value="${j?j.marcadorF:0}"></div>
          <div><label>Goles rival</label><input id="j_gc" type="number" min="0" value="${j?j.marcadorC:0}"></div>
        </div>
        <label>Estado</label>
        <div class="row2" style="gap:10px;">
          <label class="radio-pill"><input type="radio" name="j_estado" value="pendiente" ${!j||j.estado!=="jugado"?"checked":""}> Pendiente</label>
          <label class="radio-pill"><input type="radio" name="j_estado" value="jugado" ${j&&j.estado==="jugado"?"checked":""}> Jugado</label>
        </div>
        <button class="save-btn" id="j_save" disabled>${j?"Guardar cambios":"Agregar juego"}</button>
      </div>
    </div>`;
  document.getElementById("app").insertAdjacentHTML("beforeend", html);
  document.getElementById("modalClose").onclick = closeModal;
  document.getElementById("modalOverlay").addEventListener("click", e=>{ if(e.target.id==="modalOverlay") closeModal(); });
  const checkValid = ()=>{
    const ok = document.getElementById("j_rival").value.trim() && document.getElementById("j_fecha").value;
    document.getElementById("j_save").disabled = !ok;
  };
  ["j_rival","j_fecha"].forEach(id=> document.getElementById(id).addEventListener("input", checkValid));
  checkValid();
  document.getElementById("j_save").onclick = ()=>{
    const estado = document.querySelector('input[name="j_estado"]:checked')?.value || "pendiente";
    if(j){
      updateJuego(torneoId, juegoId, {
        rival: document.getElementById("j_rival").value.trim(),
        fecha: document.getElementById("j_fecha").value,
        marcadorF: Number(document.getElementById("j_gf").value)||0,
        marcadorC: Number(document.getElementById("j_gc").value)||0,
        estado,
      });
    } else {
      addJuego(torneoId, {
        rival: document.getElementById("j_rival").value.trim(),
        fecha: document.getElementById("j_fecha").value,
        marcadorF: Number(document.getElementById("j_gf").value)||0,
        marcadorC: Number(document.getElementById("j_gc").value)||0,
        estado,
      });
    }
  };
}

export function openJuegoStatsModal(torneoId, juegoId){
  closeModal();
  const t = state.torneos.find(x=>x.id===torneoId);
  if(!t) return;
  const j = (t.juegos||[]).find(x=>x.id===juegoId);
  if(!j) return;
  const inscritos = state.athletes.filter(a=>a.torneos.some(at=>at.torneoId===torneoId));
  const rows = inscritos.map(a=>{
    const s = (a.juegosStats && a.juegosStats[torneoId] && a.juegosStats[torneoId][juegoId]) || {};
    return `<tr>
      <td style="font-weight:600;">${escapeHtml(a.nombre)} ${escapeHtml(a.apellido)}</td>
      <td><input type="number" min="0" class="st-input js-input" data-js="${a.id}|goles" value="${s.goles||0}"></td>
      <td><input type="number" min="0" class="st-input js-input" data-js="${a.id}|asistencias" value="${s.asistencias||0}"></td>
      <td><input type="number" min="0" class="st-input js-input" data-js="${a.id}|tarjetasAmarillas" value="${s.tarjetasAmarillas||0}"></td>
      <td><input type="number" min="0" class="st-input js-input" data-js="${a.id}|tarjetasRojas" value="${s.tarjetasRojas||0}"></td>
    </tr>`;
  }).join("");
  const html = `
    <div class="modal-overlay" id="modalOverlay">
      <div class="modal" style="max-width:620px;">
        <div class="mh"><h3 class="dia-title">Estadísticas del juego — vs ${escapeHtml(j.rival)}</h3><button id="modalClose">${ic.x}</button></div>
        <p style="font-size:12px;color:var(--muted);margin-bottom:12px;">${escapeHtml(t.nombre)} · ${j.fecha} · ${inscritos.length} atletas inscritos</p>
        ${inscritos.length === 0 ? '<p class="empty-msg">No hay atletas inscritos en este torneo.</p>' : `
        <div style="overflow-x:auto;">
        <table><thead><tr><th>Atleta</th><th>Goles</th><th>Asist.</th><th>TA</th><th>TR</th></tr></thead>
        <tbody>${rows}</tbody></table></div>
        <button class="save-btn" id="js_save">Guardar estadísticas del juego</button>`}
      </div>
    </div>`;
  document.getElementById("app").insertAdjacentHTML("beforeend", html);
  document.getElementById("modalClose").onclick = closeModal;
  document.getElementById("modalOverlay").addEventListener("click", e=>{ if(e.target.id==="modalOverlay") closeModal(); });
  const saveBtn = document.getElementById("js_save");
  if(saveBtn){
    saveBtn.onclick = ()=>{
      const entries = inscritos.map(a=>{
        const stats = { goles:0, asistencias:0, tarjetasAmarillas:0, tarjetasRojas:0 };
        Object.keys(stats).forEach(key=>{
          const inp = document.querySelector(`[data-js="${a.id}|${key}"]`);
          if(inp) stats[key] = Number(inp.value)||0;
        });
        return { athleteId:a.id, stats };
      });
      saveJuegoStats(torneoId, juegoId, entries);
      closeModal();
    };
  }
}

export function openAddSedeModal(){
  closeModal();
  const html = `
    <div class="modal-overlay" id="modalOverlay">
      <div class="modal">
        <div class="mh"><h3 class="dia-title">Nueva sede</h3><button id="modalClose">${ic.x}</button></div>
        <label>Nombre</label><input id="s_nombre" placeholder="Ej: Brisas del Golf">
        <label>Código</label><input id="s_codigo" placeholder="Ej: BR" maxlength="4" style="text-transform:uppercase;">
        <label>Dirección</label><input id="s_direccion" placeholder="Dirección completa">
        <label>Teléfono</label><input id="s_telefono" placeholder="+507 000-0000">
        <label>Email</label><input id="s_email" type="email" placeholder="sede@deportivoitalia.com">
        <label>Descripción</label><textarea id="s_descripcion" rows="2" placeholder="Descripción de la sede..."></textarea>
        <label>Imagen principal (URL)</label><input id="s_imagen" placeholder="https://...">
        <label>Logo (URL)</label><input id="s_logo" placeholder="https://...">
        <button class="save-btn" id="s_save" disabled>Crear sede</button>
      </div>
    </div>`;
  document.getElementById("app").insertAdjacentHTML("beforeend", html);
  document.getElementById("modalClose").onclick = closeModal;
  document.getElementById("modalOverlay").addEventListener("click", e=>{ if(e.target.id==="modalOverlay") closeModal(); });
  const checkValid = ()=>{
    const ok = document.getElementById("s_nombre").value.trim() && document.getElementById("s_codigo").value.trim();
    document.getElementById("s_save").disabled = !ok;
  };
  ["s_nombre","s_codigo"].forEach(id=> document.getElementById(id).addEventListener("input", checkValid));
  document.getElementById("s_save").onclick = async ()=>{
    const sedeData = {
      id: "sed_" + Date.now().toString(36),
      nombre: document.getElementById("s_nombre").value.trim(),
      codigo: document.getElementById("s_codigo").value.trim().toUpperCase(),
      estado: "activa",
      direccion: document.getElementById("s_direccion").value.trim(),
      telefono: document.getElementById("s_telefono").value.trim(),
      email: document.getElementById("s_email").value.trim(),
      descripcion: document.getElementById("s_descripcion").value.trim(),
      imagen_principal: document.getElementById("s_imagen").value.trim(),
      logo: document.getElementById("s_logo").value.trim(),
    };
    await saveSede(sedeData);
    state.sedes.push(sedeData);
    closeModal();
    if(window.__render) window.__render();
  };
}

export function openEditSedeModal(sedeId){
  closeModal();
  const s = state.sedes.find(x=>x.id===sedeId);
  if(!s) return;
  const html = `
    <div class="modal-overlay" id="modalOverlay">
      <div class="modal">
        <div class="mh"><h3 class="dia-title">Editar sede: ${escapeHtml(s.nombre)}</h3><button id="modalClose">${ic.x}</button></div>
        <label>Nombre</label><input id="es_nombre" value="${escapeHtml(s.nombre)}">
        <label>Código</label><input id="es_codigo" value="${escapeHtml(s.codigo)}" maxlength="4" style="text-transform:uppercase;" disabled>
        <label>Estado</label>
        <select id="es_estado">
          <option value="activa" ${s.estado==="activa"?"selected":""}>Activa</option>
          <option value="inactiva" ${s.estado==="inactiva"?"selected":""}>Inactiva</option>
        </select>
        <label>Dirección</label><input id="es_direccion" value="${escapeHtml(s.direccion||"")}">
        <label>Teléfono</label><input id="es_telefono" value="${escapeHtml(s.telefono||"")}">
        <label>Email</label><input id="es_email" type="email" value="${escapeHtml(s.email||"")}">
        <label>Descripción</label><textarea id="es_descripcion" rows="2">${escapeHtml(s.descripcion||"")}</textarea>
        <label>Imagen principal (URL)</label><input id="es_imagen" value="${escapeHtml(s.imagen_principal||"")}">
        <label>Logo (URL)</label><input id="es_logo" value="${escapeHtml(s.logo||"")}">
        <button class="save-btn" id="es_save">Guardar cambios</button>
        <button class="save-btn red" id="es_delete" style="margin-top:8px;">Eliminar sede</button>
      </div>
    </div>`;
  document.getElementById("app").insertAdjacentHTML("beforeend", html);
  document.getElementById("modalClose").onclick = closeModal;
  document.getElementById("modalOverlay").addEventListener("click", e=>{ if(e.target.id==="modalOverlay") closeModal(); });
  document.getElementById("es_save").onclick = async ()=>{
    const updates = {
      nombre: document.getElementById("es_nombre").value.trim(),
      estado: document.getElementById("es_estado").value,
      direccion: document.getElementById("es_direccion").value.trim(),
      telefono: document.getElementById("es_telefono").value.trim(),
      email: document.getElementById("es_email").value.trim(),
      descripcion: document.getElementById("es_descripcion").value.trim(),
      imagen_principal: document.getElementById("es_imagen").value.trim(),
      logo: document.getElementById("es_logo").value.trim(),
    };
    await updateSede(sedeId, updates);
    Object.assign(s, updates);
    closeModal();
    if(window.__render) window.__render();
  };
  document.getElementById("es_delete").onclick = ()=>{
    if(confirm("¿Eliminar esta sede? Esta acción no se puede deshacer.")){
      fetch("/api/data", {
        method: "DELETE",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ key: "sedes", itemId: sedeId })
      }).then(r=>r.json()).then(d=>{
        if(d.success){
          state.sedes = state.sedes.filter(x=>x.id!==sedeId);
          closeModal();
          if(window.__render) window.__render();
        }
      });
    }
  };
}

export function openAddGaleriaModal(){
  closeModal();
  const html = `
    <div class="modal-overlay" id="modalOverlay">
      <div class="modal">
        <div class="mh"><h3 class="dia-title">Agregar imagen a galería</h3><button id="modalClose">${ic.x}</button></div>
        <label>URL de la imagen</label><input id="g_url" placeholder="https://...">
        <label>Descripción</label><input id="g_desc" placeholder="Descripción de la imagen">
        <label>Categoría</label>
        <select id="g_categoria">
          <option value="Entrenamientos">Entrenamientos</option>
          <option value="Partidos">Partidos</option>
          <option value="Torneos">Torneos</option>
          <option value="Eventos">Eventos</option>
          <option value="Jugadores">Jugadores</option>
          <option value="Sedes">Sedes</option>
        </select>
        <button class="save-btn" id="g_save" disabled>Agregar imagen</button>
      </div>
    </div>`;
  document.getElementById("app").insertAdjacentHTML("beforeend", html);
  document.getElementById("modalClose").onclick = closeModal;
  document.getElementById("modalOverlay").addEventListener("click", e=>{ if(e.target.id==="modalOverlay") closeModal(); });
  const checkValid = ()=>{
    const ok = document.getElementById("g_url").value.trim();
    document.getElementById("g_save").disabled = !ok;
  };
  document.getElementById("g_url").addEventListener("input", checkValid);
  document.getElementById("g_save").onclick = async ()=>{
    const newImage = {
      url: document.getElementById("g_url").value.trim(),
      descripcion: document.getElementById("g_desc").value.trim(),
      categoria: document.getElementById("g_categoria").value,
      fecha: new Date().toISOString().slice(0,10)
    };
    if (!state.siteContent.galeria) state.siteContent.galeria = [];
    state.siteContent.galeria.unshift(newImage);
    await saveSiteContent(state.siteContent);
    closeModal();
    if(window.__render) window.__render();
  };
}
