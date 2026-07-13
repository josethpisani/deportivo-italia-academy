import { state } from './state.js';
import { toggleAttendance, setMatricula, setTorneoPago } from './mutations.js';
import { openAddAthleteModal, openAddTorneoModal } from './modals.js';
import { dayNameFromDate } from './utils.js';
import { render } from './app.js';

export function attachEvents(){
  document.querySelectorAll("[data-nav]").forEach(btn=>{
    btn.onclick = ()=>{ state.view = btn.dataset.nav; if(state.view!=="atleta-detail") state.selectedId=null; render(); };
  });
  document.querySelectorAll("[data-goto-cat]").forEach(btn=>{
    btn.onclick = ()=>{ state.activeCategory = btn.dataset.gotoCat; state.view="atleta-list"; render(); };
  });
  document.querySelectorAll("[data-cat]").forEach(btn=>{
    btn.onclick = ()=>{ state.activeCategory = btn.dataset.cat; render(); };
  });
  const searchInput = document.getElementById("searchInput");
  if(searchInput){
    searchInput.oninput = (e)=>{ state.search = e.target.value; render(); document.getElementById("searchInput").focus(); document.getElementById("searchInput").selectionStart = document.getElementById("searchInput").selectionEnd = state.search.length; };
  }
  document.querySelectorAll("[data-open]").forEach(btn=>{
    btn.onclick = ()=>{ state.selectedId = btn.dataset.open; state.view = "atleta-detail"; render(); };
  });
  const backBtn = document.getElementById("btnBack");
  if(backBtn) backBtn.onclick = ()=>{ state.view="atleta-list"; render(); };
  const addAthBtn = document.getElementById("btnAddAthlete");
  if(addAthBtn) addAthBtn.onclick = openAddAthleteModal;
  const addTorBtn = document.getElementById("btnAddTorneo");
  if(addTorBtn) addTorBtn.onclick = openAddTorneoModal;
  document.querySelectorAll("[data-attend]").forEach(btn=>{
    btn.onclick = ()=>{
      const [athleteId, type, dateKey, status] = btn.dataset.attend.split("|");
      toggleAttendance(athleteId, type, dateKey, status);
    };
  });
  document.querySelectorAll("[data-admintab]").forEach(btn=>{
    btn.onclick = ()=>{ state.adminTab = btn.dataset.admintab; render(); };
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
  if(btnViewGrid) btnViewGrid.onclick = ()=>{ state.athViewMode="grid"; render(); };
  const btnViewList = document.getElementById("btnViewList");
  if(btnViewList) btnViewList.onclick = ()=>{ state.athViewMode="list"; render(); };

  const regTipoSelect = document.getElementById("regTipoSelect");
  if(regTipoSelect) regTipoSelect.onchange = (e)=>{ state.regTipo = e.target.value; render(); };
  const regDateInput = document.getElementById("regDateInput");
  if(regDateInput) regDateInput.onchange = (e)=>{ state.regDate = e.target.value; render(); };
  document.querySelectorAll("[data-regcat]").forEach(btn=>{
    btn.onclick = ()=>{ state.regCategory = btn.dataset.regcat; render(); };
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
