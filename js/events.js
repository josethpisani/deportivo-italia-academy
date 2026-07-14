import { state } from './state.js';
import { ic } from './icons.js';
import { toggleAttendance, setMatricula, setTorneoPago, saveObservaciones, setMensualidad, markAllMensualidades, saveStatsGenerales, saveObservacionesStats, saveEvaluacion, deleteEvaluacion } from './mutations.js';
import { openAddAthleteModal, openAddTorneoModal, openEditAthleteModal, openEditTorneoModal, openTorneoStatsModal, openConfigModal, openEditAthleteCostsModal } from './modals.js';
import { dayNameFromDate } from './utils.js';

export function attachEvents(){
  document.querySelectorAll("[data-nav]").forEach(btn=>{
    btn.onclick = ()=>{ state.view = btn.dataset.nav; if(state.view!=="atleta-detail") state.selectedId=null; if(state.view!=="estadisticas") state.statsAthleteId=null; if(state.view!=="evaluaciones"){ state.evalAthleteId=null; state.evalEditingId=null; } if(window.__render) window.__render(); };
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
  const editConfigBtn = document.getElementById("btnEditConfig");
  if(editConfigBtn) editConfigBtn.onclick = openConfigModal;
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
  document.querySelectorAll("[data-mensualmonth]").forEach(btn=>{
    btn.onclick = ()=>{ state.mensualMonth = btn.dataset.mensualmonth; if(window.__render) window.__render(); };
  });
  document.querySelectorAll("[data-mensualidad]").forEach(btn=>{
    btn.onclick = ()=>{
      const [athleteId, mes, flag] = btn.dataset.mensualidad.split("|");
      setMensualidad(athleteId, mes, flag==="1");
    };
  });
  const btnInitMes = document.getElementById("btnInitMensualidades");
  if(btnInitMes) btnInitMes.onclick = ()=> markAllMensualidades(state.mensualMonth);
  document.querySelectorAll("[data-edit-costs]").forEach(btn=>{
    btn.onclick = ()=> openEditAthleteCostsModal(btn.dataset.editCosts);
  });
  const btnAdminLogin = document.getElementById("btnAdminLogin");
  if(btnAdminLogin) btnAdminLogin.onclick = ()=>{
    const pass = document.getElementById("adminPassword").value;
    if(pass === "admin12345"){
      state.adminAuth = true;
      if(window.__render) window.__render();
    } else {
      document.getElementById("adminPassError").style.display = "block";
      document.getElementById("adminPassword").value = "";
      document.getElementById("adminPassword").focus();
    }
  };
  const adminPassInput = document.getElementById("adminPassword");
  if(adminPassInput) adminPassInput.onkeydown = (e)=>{
    if(e.key==="Enter") document.getElementById("btnAdminLogin").click();
  };
  if(adminPassInput) adminPassInput.oninput = ()=>{
    document.getElementById("adminPassError").style.display = "none";
  };
  document.querySelectorAll("[data-statscat]").forEach(btn=>{
    btn.onclick = ()=>{ state.statsCategory = btn.dataset.statscat; if(window.__render) window.__render(); };
  });
  document.querySelectorAll("[data-statsplayer]").forEach(btn=>{
    btn.onclick = ()=>{ state.statsAthleteId = btn.dataset.statsplayer; if(window.__render) window.__render(); };
  });
  const btnBackStats = document.getElementById("btnBackStats");
  if(btnBackStats) btnBackStats.onclick = ()=>{ state.statsAthleteId = null; if(window.__render) window.__render(); };
  const btnSaveStats = document.getElementById("btnSaveStats");
  if(btnSaveStats) btnSaveStats.onclick = ()=>{
    const stats = {};
    document.querySelectorAll(".sg-input").forEach(inp=>{
      stats[inp.dataset.sgkey] = Number(inp.value)||0;
    });
    saveStatsGenerales(state.statsAthleteId, stats);
    btnSaveStats.textContent = "Guardado!";
    setTimeout(()=>{ btnSaveStats.innerHTML = ic.check + " Guardar estadísticas"; }, 1500);
  };
  const btnSaveStatsObs = document.getElementById("btnSaveStatsObs");
  if(btnSaveStatsObs) btnSaveStatsObs.onclick = ()=>{
    const text = document.getElementById("statsObservacionesText").value;
    saveObservacionesStats(state.statsAthleteId, text);
    btnSaveStatsObs.textContent = "Guardado!";
    setTimeout(()=>{ btnSaveStatsObs.textContent = "Guardar notas"; }, 1500);
  };
  document.querySelectorAll("[data-evalcat]").forEach(btn=>{
    btn.onclick = ()=>{ state.evalCategory = btn.dataset.evalcat; if(window.__render) window.__render(); };
  });
  document.querySelectorAll("[data-evalplayer]").forEach(btn=>{
    btn.onclick = ()=>{ state.evalAthleteId = btn.dataset.evalplayer; if(window.__render) window.__render(); };
  });
  const btnBackEval = document.getElementById("btnBackEval");
  if(btnBackEval) btnBackEval.onclick = ()=>{ state.evalAthleteId = null; if(window.__render) window.__render(); };
  document.querySelectorAll(".eval-range").forEach(inp=>{
    const idx = inp.closest(".stat-input-card")?.querySelector(".eval-range-val");
    if(idx) idx.textContent = inp.value;
    inp.oninput = ()=>{ if(idx) idx.textContent = inp.value; };
  });
  const btnSaveEval = document.getElementById("btnSaveEval");
  if(btnSaveEval) btnSaveEval.onclick = ()=>{
    const items = {};
    document.querySelectorAll(".eval-range").forEach(inp=>{
      items[inp.dataset.item] = Number(inp.value);
    });
    const editId = document.getElementById("evalEditId")?.value || "";
    saveEvaluacion(state.evalAthleteId, {
      id: editId || undefined,
      items,
      descripcion: document.getElementById("evalDescripcion")?.value?.trim() || "",
      observaciones: document.getElementById("evalObservaciones")?.value?.trim() || "",
    });
    state.evalEditingId = null;
  };
  const btnCancelEval = document.getElementById("btnCancelEval");
  if(btnCancelEval) btnCancelEval.onclick = ()=>{ state.evalEditingId = null; if(window.__render) window.__render(); };
  document.querySelectorAll("[data-edit-eval]").forEach(btn=>{
    btn.onclick = ()=>{ state.evalEditingId = btn.dataset.editEval; if(window.__render) window.__render(); };
  });
  document.querySelectorAll("[data-delete-eval]").forEach(btn=>{
    btn.onclick = ()=>{
      if(confirm("¿Eliminar esta evaluación?")){
        deleteEvaluacion(state.evalAthleteId, btn.dataset.deleteEval);
      }
    };
  });
}
