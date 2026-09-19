import { state } from "./state.js";
import { ic } from "./icons.js";
import { toggleAttendance, setMatricula, setTorneoPago, saveObservaciones, setMensualidad, markAllMensualidades, saveStatsGenerales, saveObservacionesStats, saveEvaluacion, deleteEvaluacion, deleteAthlete, toggleTorneoAtleta, setTorneoEnrollAll, deleteJuego, deleteTorneo } from "./mutations.js";
import { openAddAthleteModal, openAddTorneoModal, openEditAthleteModal, openEditTorneoModal, openTorneoStatsModal, openConfigModal, openEditAthleteCostsModal, openJuegoModal, openJuegoStatsModal, openAddSedeModal, openEditSedeModal, openAddGaleriaModal } from "./modals.js";
import { dayNameFromDate, escapeHtml } from "./utils.js";
import { saveSede, updateSede, saveSiteContent, createTrialRequest, getTrialRequests } from "./api.js";

// Estado local del flujo público de práctica de prueba.
let trialModalOpen = false;
let selectedDate = null;
let selectedTimeSlot = null;

function parseLocalDate(dateString) {
  const [year, month, day] = String(dateString).split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function attachEvents(){
  document.querySelectorAll("[data-nav]").forEach(btn=>{
    btn.onclick = ()=>{ state.view = btn.dataset.nav; if(state.view!=="atleta-detail") state.selectedId=null; if(state.view!=="estadisticas") state.statsAthleteId=null; if(state.view!=="evaluaciones"){ state.evalAthleteId=null; state.evalEditingId=null; } if(state.view!=="torneos" && state.view!=="torneo-detail") state.torneoId=null; if(window.__render) window.__render(); };
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
  const deleteAthBtn = document.getElementById("btnDeleteAthlete");
  if(deleteAthBtn) deleteAthBtn.onclick = ()=> deleteAthlete(state.selectedId);
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

  document.querySelectorAll("[data-torcard]").forEach(btn=>{
    btn.onclick = ()=>{ state.torneoId = btn.dataset.torcard; state.view = "torneo-detail"; if(window.__render) window.__render(); };
  });
  const btnBackTorneo = document.getElementById("btnBackTorneo");
  if(btnBackTorneo) btnBackTorneo.onclick = ()=>{ state.view="torneos"; state.torneoId=null; if(window.__render) window.__render(); };
  const btnEditTorneo = document.getElementById("btnEditTorneo");
  if(btnEditTorneo) btnEditTorneo.onclick = ()=> openEditTorneoModal(state.torneoId);
  const btnDeleteTorneo = document.getElementById("btnDeleteTorneo");
  if(btnDeleteTorneo) btnDeleteTorneo.onclick = ()=>{
    if(confirm("¿Eliminar este torneo? Se desasociará de todos los atletas.")){
      const id = state.torneoId;
      state.view = "torneos";
      state.torneoId = null;
      deleteTorneo(id);
    }
  };
  const btnAddJuego = document.getElementById("btnAddJuego");
  if(btnAddJuego) btnAddJuego.onclick = ()=> openJuegoModal(state.torneoId);
  document.querySelectorAll("[data-edit-juego]").forEach(btn=>{
    btn.onclick = ()=> openJuegoModal(state.torneoId, btn.dataset.editJuego);
  });
  document.querySelectorAll("[data-del-juego]").forEach(btn=>{
    btn.onclick = ()=>{
      if(confirm("¿Eliminar este juego? Se quitarán sus estadísticas de los atletas.")){
        deleteJuego(state.torneoId, btn.dataset.delJuego);
      }
    };
  });
  document.querySelectorAll("[data-juego-stats]").forEach(btn=>{
    btn.onclick = ()=> openJuegoStatsModal(state.torneoId, btn.dataset.juegoStats);
  });
  document.querySelectorAll("[data-tor-enroll]").forEach(btn=>{
    btn.onclick = ()=> toggleTorneoAtleta(btn.dataset.torEnroll, state.torneoId);
  });
  document.querySelectorAll("[data-tor-enrollall]").forEach(btn=>{
    btn.onclick = ()=> setTorneoEnrollAll(state.torneoId, btn.dataset.torEnrollall, btn.dataset.all!=="1");
  });
  document.querySelectorAll("[data-torstats]").forEach(btn=>{
    btn.onclick = ()=> openTorneoStatsModal(state.torneoId);
  });

  // --- New: Admin - Sedes & Site Content Management ---
  const btnAddSede = document.getElementById("btnAddSede");
  if (btnAddSede) btnAddSede.onclick = openAddSedeModal;

  document.querySelectorAll("[data-edit-sede]").forEach(btn=>{
    btn.onclick = ()=> openEditSedeModal(btn.dataset.editSede);
  });

  document.querySelectorAll("[data-delete-sede]").forEach(btn=>{
    btn.onclick = async ()=>{
      if(confirm("¿Eliminar esta sede? Esta acción no se puede deshacer.")){
        const res = await fetch("/api/data", {
          method: "DELETE",
          headers: {"Content-Type":"application/json"},
          body: JSON.stringify({ key: "sedes", itemId: btn.dataset.deleteSede })
        });
        const d = await res.json();
        if (d.success) {
          state.sedes = state.sedes.filter(s => s.id !== btn.dataset.deleteSede);
          if (window.__render) window.__render();
        }
      }
    };
  });

  const btnSaveSiteContent = document.getElementById("btnSaveSiteContent");
  if (btnSaveSiteContent) {
    btnSaveSiteContent.onclick = async () => {
      const content = {
        hero: {
          title: document.getElementById("siteHeroTitle")?.value || "",
          subtitle: document.getElementById("siteHeroSubtitle")?.value || "",
          ctaPrimary: document.getElementById("siteHeroCtaPrimary")?.value || "",
          ctaSecondary: document.getElementById("siteHeroCtaSecondary")?.value || ""
        },
        nosotros: {
          historia: document.getElementById("siteHistoria")?.value || "",
          mision: document.getElementById("siteMision")?.value || "",
          vision: document.getElementById("siteVision")?.value || "",
          valores: document.getElementById("siteValores")?.value || "",
          filosofia: document.getElementById("siteFilosofia")?.value || "",
          metodologia: document.getElementById("siteMetodologia")?.value || ""
        },
        contacto: {
          telefono: document.getElementById("siteTelefono")?.value || "",
          whatsapp: document.getElementById("siteWhatsapp")?.value || "",
          email: document.getElementById("siteEmail")?.value || ""
        }
      };
      await saveSiteContent(content);
      state.siteContent = { ...state.siteContent, ...content };
      btnSaveSiteContent.textContent = "¡Guardado!";
      setTimeout(() => btnSaveSiteContent.textContent = "Guardar cambios", 1500);
    };
  }

  // Galery management
  const btnAddGaleria = document.getElementById("btnAddGaleria");
  if (btnAddGaleria) btnAddGaleria.onclick = openAddGaleriaModal;

  document.querySelectorAll("[data-delete-galeria]").forEach(btn=>{
    btn.onclick = async ()=>{
      if(confirm("¿Eliminar esta imagen?")){
        const idx = parseInt(btn.dataset.deleteGaleria);
        state.siteContent.galeria.splice(idx, 1);
        await saveSiteContent(state.siteContent);
        if (window.__render) window.__render();
      }
    };
  });

  // --- Trial Request Modal Events ---
  const btnTrialRequest = document.getElementById("btnTrialRequest");
  if (btnTrialRequest) {
    btnTrialRequest.onclick = () => {
      trialModalOpen = true;
      openTrialModal();
    };
  }

  const closeTrialModalBtn = document.getElementById("closeTrialModal");
  if (closeTrialModalBtn) {
    closeTrialModalBtn.onclick = closeTrialModal;
  }

  const trialModalOverlay = document.getElementById("trialModal");
  if (trialModalOverlay) {
    trialModalOverlay.onclick = (e) => {
      if (e.target === trialModalOverlay) closeTrialModal();
    };
  }

  // Calendar generation
  const categoryTime = { U4: '16:30', U6: '16:30', U8: '17:00', U10: '17:00', U12: '17:00' };
  const trialCategory = document.getElementById('trialCategory');
  const trialSede = document.getElementById('trialSede');
  const trialSchedule = document.getElementById('selectedSchedule');
  function updateTrialSchedule() {
    const category = trialCategory?.value;
    const time = categoryTime[category];
    if (trialSchedule) trialSchedule.textContent = category && time ? `Categoría ${category}: ${time === '16:30' ? '4:30 PM' : '5:00 PM'} · Selecciona lunes o miércoles` : 'Selecciona una categoría y un día';
    const next = document.getElementById('btnNextToForm');
    if (next) next.disabled = !(selectedDate && category && trialSede?.value);
  }
  if (trialCategory) trialCategory.onchange = updateTrialSchedule;
  if (trialSede) trialSede.onchange = updateTrialSchedule;
  function generateCalendar() {
    const container = document.getElementById("calendarContainer");
    if (!container) return;
    
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    // Generate current month and next 2 months
    let html = '';
    for (let m = 0; m < 3; m++) {
      const currentMonth = (month + m) % 12;
      const currentYear = year + Math.floor((month + m) / 12);
      const monthName = new Date(currentYear, currentMonth, 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
      const firstDay = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sunday
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      
      html += `<div class="calendar-month">
        <h4>${monthName.charAt(0).toUpperCase() + monthName.slice(1)}</h4>
        <div class="calendar-grid">
          <div class="cal-header">L</div><div class="cal-header">M</div><div class="cal-header">X</div><div class="cal-header">J</div><div class="cal-header">V</div><div class="cal-header">S</div><div class="cal-header">D</div>`;
      
      // Add empty cells for days before first day of month
      for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) {
        html += '<div class="cal-day empty"></div>';
      }
      
      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(currentYear, currentMonth, d);
        const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon, 3=Wed
        const isMondayOrWednesday = dayOfWeek === 1 || dayOfWeek === 3;
        const isPast = date < new Date(new Date().setHours(0,0,0,0));
        const isSelected = selectedDate && selectedDate.getTime() === date.getTime();
        
        let classes = 'cal-day';
        if (!isMondayOrWednesday || isPast) {
          classes += ' disabled';
        } else if (isSelected) {
          classes += ' selected';
        }
        
        const dateStr = formatDateInput(date);
        html += `<div class="${classes}" data-date="${dateStr}" ${isMondayOrWednesday && !isPast ? 'tabindex="0"' : ''}>${d}</div>`;
      }
      
      html += '</div></div>';
    }
    
    container.innerHTML = html;
    
    // Add click handlers for calendar days
    container.querySelectorAll('.cal-day:not(.disabled):not(.empty)').forEach(day => {
      day.onclick = () => {
        selectedDate = parseLocalDate(day.dataset.date);
        // Remove previous selection
        container.querySelectorAll('.cal-day.selected').forEach(d => d.classList.remove('selected'));
        day.classList.add('selected');
        updateTrialSchedule();
      };
      // Keyboard support
      day.onkeydown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          day.click();
        }
      };
    });
  }

  function showTimeSlots() {
    selectedTimeSlot = categoryTime[trialCategory?.value];
    updateTrialSchedule();
  }

  const btnNextToForm = document.getElementById("btnNextToForm");
  if (btnNextToForm) {
    btnNextToForm.onclick = () => {
      if (!selectedDate || !trialCategory?.value || !trialSede?.value) return;
      selectedTimeSlot = categoryTime[trialCategory.value];
      document.getElementById("stepCalendar").style.display = 'none';
      document.getElementById("stepForm").style.display = 'block';
      const timeSlot = selectedTimeSlot;
      document.getElementById("trialForm").dataset.category = trialCategory.value;
      document.getElementById("trialForm").dataset.timeSlot = timeSlot;
      document.getElementById("trialForm").dataset.preferredDate = formatDateInput(selectedDate);
      const summary = document.getElementById('trialSummary');
      if (summary) summary.textContent = `Sede: ${trialSede.options[trialSede.selectedIndex].text} · ${trialCategory.value} · ${selectedDate.toLocaleDateString('es-PA')} · ${timeSlot === '16:30' ? '4:30 PM' : '5:00 PM'}`;
    };
  }

  const trialForm = document.getElementById("trialForm");
  if (trialForm) {
    trialForm.onsubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData(trialForm);
      const data = {
        representative_name: formData.get("repName"),
        athlete_name: formData.get("athleteName"),
        athlete_age: Number(formData.get("athlete_age")),
        category: trialForm.dataset.category,
        email: formData.get("email"),
        phone: formData.get("phone"),
        sede_id: formData.get("sede_id"),
        preferred_date: trialForm.dataset.preferredDate,
        preferred_time_slot: trialForm.dataset.timeSlot,
        test_date: trialForm.dataset.preferredDate,
        test_time: trialForm.dataset.timeSlot,
        notes: formData.get('notes') || ''
      };
      
      const submitBtn = trialForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';
      }
      
      try {
        const res = await fetch('/api/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'trial_requests', value: data })
        });
        
        const result = await res.json();
        if (result.success) {
          const confirmation = document.getElementById('trialConfirmation');
          if (confirmation) confirmation.textContent = `Código: ${result.registration_code} · Atleta: ${data.athlete_name} · ${data.category} · Sede: ${trialSede?.options[trialSede.selectedIndex]?.text || data.sede_id} · Fecha: ${data.test_date} · Hora: ${data.test_time === '16:30' ? '4:30 PM' : '5:00 PM'} · Representante: ${data.representative_name} · Teléfono: ${data.phone} · Correo: ${data.email}`;
          document.getElementById("stepForm").style.display = 'none';
          document.getElementById("modalSuccess").style.display = 'block';
        } else {
          alert('Error: ' + (result.error || 'Error al enviar solicitud'));
        }
      } catch (err) {
        console.error(err);
        alert('Error de conexión. Intenta nuevamente.');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Enviar Solicitud';
        }
      }
    };
  }

  const btnCloseSuccess = document.getElementById("btnCloseSuccess");
  if (btnCloseSuccess) {
    btnCloseSuccess.onclick = closeTrialModal;
  }

  function openTrialModal() {
    const modal = document.getElementById("trialModal");
    if (modal) {
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      // Reset state
      selectedDate = null;
      selectedTimeSlot = null;
      document.getElementById("stepCalendar").style.display = 'block';
      document.getElementById("stepForm").style.display = 'none';
      document.getElementById("modalSuccess").style.display = 'none';
      document.getElementById("btnNextToForm").disabled = true;
      if (trialCategory) trialCategory.value = '';
      if (trialSede) trialSede.value = '';
      trialForm?.reset();
      trialForm.dataset.category = '';
      trialForm.dataset.timeSlot = '';
      trialForm.dataset.preferredDate = '';
      updateTrialSchedule();
      generateCalendar();
    }
  }

  function closeTrialModal() {
    const modal = document.getElementById("trialModal");
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = '';
      trialModalOpen = false;
    }
  }

  // Admin Trial Requests Panel
  const btnAdminTabPruebas = document.querySelector('[data-admintab="pruebas"]');
  if (btnAdminTabPruebas) {
    btnAdminTabPruebas.onclick = async () => {
      state.adminTab = 'pruebas';
      if (window.__render) window.__render();
      // Load trial requests for admin view
      loadAdminTrialRequests();
    };
  }
}

async function loadAdminTrialRequests() {
  try {
    const sedeId = state.currentSede?.id;
    const filters = state.trialFilters || {};
    const params = new URLSearchParams({ key: 'trial_requests' });
    if (sedeId) params.set('sede_id', sedeId);
    if (filters.status) params.set('status', filters.status);
    if (filters.date) { params.set('date_from', filters.date); params.set('date_to', filters.date); }
    if (filters.date_from) params.set('date_from', filters.date_from);
    if (filters.date_to) params.set('date_to', filters.date_to);
    const res = await fetch(`/api/data?${params}`);
    const requests = await res.json();
    const search = String(filters.search || '').trim().toLowerCase();
    state.adminTrialRequests = (Array.isArray(requests) ? requests : []).filter(r => {
      const haystack = [r.athlete_name, r.representative_name, r.phone].join(' ').toLowerCase();
      return (!search || haystack.includes(search)) && (!filters.category || String(r.category || '').toUpperCase() === filters.category);
    });
    if (window.__render) window.__render();
  } catch (err) {
    console.error('Error loading trial requests:', err);
  }
}

// Admin Trial Requests Event Handlers
document.addEventListener('click', async (e) => {
  const editTrialBtn = e.target.closest('[data-trial-edit]');
  if (editTrialBtn) {
    e.preventDefault();
    const request = (state.adminTrialRequests || []).find(item => String(item.id) === String(editTrialBtn.dataset.trialEdit));
    if (request) openTrialEditModal(request);
    return;
  }

  const deleteTrialBtn = e.target.closest('[data-trial-delete]');
  if (deleteTrialBtn) {
    e.preventDefault();
    const request = (state.adminTrialRequests || []).find(item => String(item.id) === String(deleteTrialBtn.dataset.trialDelete));
    if (!request || !confirm(`¿Eliminar el registro de ${request.athlete_name || 'este atleta'}? Esta acción no se puede deshacer.`)) return;
    try {
      const res = await fetch('/api/data', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'trial_requests', itemId: request.id, sede_id: state.currentSede?.id }) });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'No se pudo eliminar');
      await loadAdminTrialRequests();
    } catch (err) {
      console.error('Error deleting trial request:', err);
      alert('No se pudo eliminar el registro. Intenta nuevamente.');
    }
    return;
  }

  // Trial request status changes
  const statusBtn = e.target.closest('[data-trial-status]');
  if (statusBtn) {
    e.preventDefault();
    const [itemId, newStatus] = statusBtn.dataset.trialStatus.split('|');
    if (itemId && newStatus) {
      try {
        const res = await fetch('/api/data', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'trial_requests', itemId, sede_id: state.currentSede?.id, updates: { status: newStatus } })
        });
        const result = await res.json();
        if (result.success) {
          loadAdminTrialRequests();
        }
      } catch (err) {
        console.error('Error updating trial request:', err);
      }
    }
    return;
  }

  // Export trial requests to CSV
  const exportBtn = document.getElementById('btnExportPruebas');
  if (e.target.closest('#btnExportPruebas')) {
    e.preventDefault();
    const requests = state.adminTrialRequests || [];
    if (requests.length === 0) {
      alert('No hay solicitudes para exportar');
      return;
    }
    
    const headers = ['Código', 'Atleta', 'Edad', 'Categoría', 'Fecha', 'Hora', 'Representante', 'Teléfono', 'Email', 'Sede', 'Estado', 'Observaciones', 'Fecha Solicitud'];
    const rows = state.adminTrialRequests.map(r => {
      const sede = state.sedes.find(s => s.id === r.sede_id);
      const sedeName = sede ? sede.nombre : 'Desconocida';
      const date = new Date(`${r.test_date || r.preferred_date}T12:00:00`).toLocaleDateString('es-ES');
      const timeLabel = r.test_time || r.preferred_time_slot;
      const category = r.category || r.age_category;
      const createdDate = new Date(r.created_at).toLocaleDateString('es-ES');
      return [r.registration_code || r.id, r.athlete_name, r.athlete_age || '', category, date, timeLabel, r.representative_name, r.phone, r.email, sedeName, r.status, r.notes || '', createdDate]
        .map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
    });
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `solicitudes_pruebas_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    return;
  }

  // Filter trial requests
  if (e.target.closest('#btnSearchPruebas')) {
    state.trialFilters = {
      search: document.getElementById('filterSearch')?.value || '',
      category: document.getElementById('filterCategory')?.value || '',
      status: document.getElementById('filterStatus')?.value || '',
      date: document.getElementById('filterDate')?.value || '',
      date_from: document.getElementById('filterDateFrom')?.value || '',
      date_to: document.getElementById('filterDateTo')?.value || ''
    };
    loadAdminTrialRequests();
  }
  if (e.target.closest('#btnClearPruebas')) {
    state.trialFilters = { search: '', category: '', status: '', date: '', date_from: '', date_to: '' };
    loadAdminTrialRequests();
  }
});

function openTrialEditModal(request) {
  document.getElementById('trialEditModal')?.remove();
  const date = request.test_date || request.preferred_date || '';
  const time = request.test_time || request.preferred_time_slot || '17:00';
  const category = String(request.category || '').toUpperCase();
  const modal = document.createElement('div');
  modal.id = 'trialEditModal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="trialEditTitle">
    <button type="button" class="modal-close" id="closeTrialEdit" aria-label="Cerrar">${ic.x}</button>
    <div class="modal-header"><h2 id="trialEditTitle">${ic.pencil} Editar práctica de prueba</h2><p class="modal-subtitle">Código: ${escapeHtml(request.registration_code || request.id)}</p></div>
    <form id="trialEditForm" class="modal-body">
      <div class="form-row"><div class="form-group"><label>Atleta *</label><input name="athlete_name" required value="${escapeHtml(request.athlete_name || '')}"></div><div class="form-group"><label>Edad *</label><input name="athlete_age" type="number" min="3" max="12" required value="${escapeHtml(request.athlete_age || '')}"></div></div>
      <div class="form-group"><label>Representante *</label><input name="representative_name" required value="${escapeHtml(request.representative_name || '')}"></div>
      <div class="form-row"><div class="form-group"><label>Categoría *</label><select name="category" required>${['U4','U6','U8','U10','U12'].map(item => `<option value="${item}" ${item === category ? 'selected' : ''}>${item}</option>`).join('')}</select></div><div class="form-group"><label>Fecha *</label><input name="test_date" type="date" required value="${escapeHtml(String(date).slice(0,10))}"></div></div>
      <div class="form-row"><div class="form-group"><label>Horario *</label><select name="test_time" required><option value="16:30" ${time === '16:30' ? 'selected' : ''}>4:30 PM</option><option value="17:00" ${time !== '16:30' ? 'selected' : ''}>5:00 PM</option></select></div><div class="form-group"><label>Teléfono *</label><input name="phone" required value="${escapeHtml(request.phone || '')}"></div></div>
      <div class="form-group"><label>Correo *</label><input name="email" type="email" required value="${escapeHtml(request.email || '')}"></div>
      <div class="form-group"><label>Observaciones</label><textarea name="notes" rows="3">${escapeHtml(request.notes || '')}</textarea></div>
      <div class="modal-actions"><button type="button" class="btn-outline" id="cancelTrialEdit">Cancelar</button><button type="submit" class="btn-primary">${ic.check} Guardar cambios</button></div>
    </form>
  </div>`;
  document.body.appendChild(modal);
  const close = () => modal.remove();
  modal.querySelector('#closeTrialEdit').onclick = close;
  modal.querySelector('#cancelTrialEdit').onclick = close;
  modal.onclick = event => { if (event.target === modal) close(); };
  modal.querySelector('#trialEditForm').onsubmit = async event => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const updates = Object.fromEntries(formData.entries());
    updates.athlete_age = Number(updates.athlete_age);
    try {
      const res = await fetch('/api/data', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'trial_requests', itemId: request.id, sede_id: state.currentSede?.id, updates }) });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'No se pudo actualizar');
      close();
      await loadAdminTrialRequests();
    } catch (err) {
      alert(err.message || 'No se pudo actualizar el registro.');
    }
  };
}
