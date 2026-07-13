import { state } from './state.js';
import { CATEGORIES } from './constants.js';
import { ic } from './icons.js';
import { addAthlete, addTorneo } from './mutations.js';

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
        <select id="f_posicion">${["Portero","Defensa","Mediocampo","Delantero"].map(p=>`<option>${p}</option>`).join("")}</select>
        <label>Fecha de nacimiento</label><input id="f_fnac" type="date">
        <label>Representante</label><input id="f_rep">
        <label>Teléfono</label><input id="f_tel">
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
    });
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
