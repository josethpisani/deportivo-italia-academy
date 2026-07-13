import { state } from '../state.js';
import { toggleAttendance, setMatricula, setTorneoPago, saveObservaciones } from './mutations.js';
import { openAddAthleteModal, openAddTorneoModal, openEditAthleteModal, openEditTorneoModal, openTorneoStatsModal } from './modals.js';
import { dayNameFromDate } from './utils.js';

export function attachEvents(){
  document.querySelectorAll("[data-nav]").forEach(btn=>{
    btn.onclick = ()=>{ state.view = btn.dataset.nav; if(state.view!=="atleta-detail") state.selectedId=null; if(window.__render) window.__render(); };
  });
  document.querySelectorAll("[data-goto-cat]").forEach(btn=>{
    btn.onclick = ()=>{ state.activeCategory = btn.dataset.gotoCat; state.view="atleta-list"; if(window.__render) window.__render(); };
  });
  document.querySelectorAll("[data-cat]").forEach(btn=>{
    btn.onclick = ()=>{ state.activeCategory = btn.dataset.cat; if(window.__render) window.__render(); };
  });
  const searchInput = document.getElementById("searchInput");
  if(searchInput){
    searchInput.oninput = (e)=>{ state.search = e.target.value; if(window.__render) window.__render(); document.getElementById("searchInput").focus(); document.getElementById("searchInput").selectionStart = document.getElementById("searchInput").selectionEnd = state.search.length; };
  }
  document.querySelectorAll("[data-open]").forEach(btn=>{
    btn.onclick = ()=>{ state.selectedId = btn.dataset.open; state.view = "atleta-detail"; if(window.__render) window.__render(); };
  });
  const backBtn = document.getElementById("btnBack");
  if(backBtn) backBtn.onclick = ()=>{ state.view="atleta-list"; if(window.__render) window.__render(); };
  const addAthBtn = document.getElementById("btnAddAthlete");
  if(addAthBtn) addAthBtn.onclick = openAddAthleteModal;
  const editAthBtn = document.getElementById("btnEditAthlete");
  if(editAthBtn) editAthBtn.onclick = ()=> openEditAthleteModal(state.selectedId);
  const addTorBtn = document.getElementById("btnAddTorneo");
  if(addTorBtn) addTorBtn.onclick = openAddTorneoModal;
  document.querySelectorAll("[data-edit-torneo]").forEach(btn=>{
    btn.onclick = ()=> openEditTorneoModal(btn.dataset.editTorneo);
  });
  document.querySelectorAll("[data-stats-torneo]").forEach(btn=>{
    btn.onclick = ()=> openTorneoStatsModal(btn.dataset.statsTorneo);
  });
  document.querySelectorAll("[data-attend]").forEach(btn=>{
    btn.onclick = ()=>{
      const [athleteId, type, dateKey, status] = btn.dataset.attend.split("|");
      toggleAttendance(athleteId, type, dateKey, status);
    };
  });
  document.querySelectorAll("[data-admintab]").forEach(btn=>{
    btn.onclick = ()=>{ state.adminTab = btn.dataset.admintab; if(window.__render) window.__render(); };
  });
  document.querySelectorAll("[data-matricula]").forEach(btn=>{
    btn.onclick = ()=>{
      const [id, estado] = btn.dataset.matricula.split("|");
      setMatricula(id, estado);
    };
  });
  document.querySelectorAll("[data-torneopago]").forEach(btn=>{
    btn.onclick = ()=>{
      const [athleteId, torneoId, flag] = btn.dataset.torneopago.split("|");
      setTorneoPago(athleteId, torneoId, flag==="1");
    };
  });
  const btnViewGrid = document.getElementById("btnViewGrid");
  if(btnViewGrid) btnViewGrid.onclick = ()=>{ state.athViewMode="grid"; if(window.__render) window.__render(); };
  const btnViewList = document.getElementById("btnViewList");
  if(btnViewList) btnViewList.onclick = ()=>{ state.athViewMode="list"; if(window.__render) window.__render(); };

  const btnSaveObs = document.getElementById("btnSaveObs");
  if(btnSaveObs) btnSaveObs.onclick = ()=>{
    const text = document.getElementById("observacionesText").value;
    saveObservaciones(state.selectedId, text);
    btnSaveObs.textContent = "Guardado!";
    setTimeout(()=>{ btnSaveObs.textContent = "Guardar notas"; }, 1500);
  };

  const regTipoSelect = document.getElementById("regTipoSelect");
  if(regTipoSelect) regTipoSelect.onchange = (e)=>{ state.regTipo = e.target.value; if(window.__render) window.__render(); };
  const regDateInput = document.getElementById("regDateInput");
  if(regDateInput) regDateInput.onchange = (e)=>{ state.regDate = e.target.value; if(window.__render) window.__render(); };
  document.querySelectorAll("[data-regcat]").forEach(btn=>{
    btn.onclick = ()=>{ state.regCategory = btn.dataset.regcat; if(window.__render) window.__render(); };
  });
  document.querySelectorAll("[data-regattend]").forEach(btn=>{
    btn.onclick = ()=>{
      const [athleteId, status] = btn.dataset.regattend.split("|");
      const dayName = dayNameFromDate(state.regDate);
      const dateKey = `${state.regDate}|${dayName}`;
      toggleAttendance(athleteId, state.regTipo, dateKey, status);
    };
  });
}
