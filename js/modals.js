import { state } from './state.js';
import { CATEGORIES, POSITIONS } from './constants.js';
import { ic } from './icons.js';
import { addAthlete, addTorneo, updateAthlete, updateTorneo, deleteTorneo, saveEstadistica } from './mutations.js';
import { escapeHtml } from './utils.js';

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

export function openAddTorneoModal(){
  closeModal();
  const html = `
    <div class="modal-overlay" id="modalOverlay">
      <div class="modal">
        <div class="mh"><h3 class="dia-title">Nuevo torneo</h3><button id="modalClose">${ic.x}</button></div>
        <label>Nombre del torneo</label><input id="t_nombre">
        <label>Fecha</label><input id="t_fecha" type="date">
        <div class="row2">
          <div><label>Categoría</label><select id="t_categoria">${CATEGORIES.map(c=>`<option>${c}</option>`).join("")}</select></div>
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
          <div><label>Categoría</label><select id="et_categoria">${CATEGORIES.map(c=>`<option ${c===t.categoria?"selected":""}>${c}</option>`).join("")}</select></div>
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
  const elegibles = state.athletes.filter(a=>a.categoria===t.categoria && a.torneos.some(x=>x.torneoId===torneoId));

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
        <p style="font-size:12px;color:var(--muted);margin-bottom:12px;">Categoría ${t.categoria} · ${elegibles.length} atletas inscritos</p>
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
      elegibles.forEach(a=>{
        const stats = { goles:0, asistencias:0, tarjetasAmarillas:0, tarjetasRojas:0, partidosJugados:0 };
        Object.keys(stats).forEach(key=>{
          const inp = document.querySelector(`[data-st="${a.id}|${key}"]`);
          if(inp) stats[key] = Number(inp.value)||0;
        });
        saveEstadistica(a.id, torneoId, stats);
      });
      closeModal();
    };
  }
}
