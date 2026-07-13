import { state } from './state.js';
import { CATEGORIES, POSITIONS } from './constants.js';
import { ic } from './icons.js';
import { addAthlete, addTorneo, updateAthlete } from './mutations.js';
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
        <button class="save-btn red" id="t_save" disabled>Crear torneo</button>
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
    });
  };
}
