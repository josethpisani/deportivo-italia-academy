import { state } from "./state.js";
import { ic } from "./icons.js";
import { toggleAttendance, setMatricula, setTorneoPago, saveObservaciones, setMensualidad, markAllMensualidades, saveStatsGenerales, saveObservacionesStats, saveEvaluacion, deleteEvaluacion, deleteAthlete, toggleTorneoAtleta, setTorneoEnrollAll, deleteJuego, deleteTorneo } from "./mutations.js";
import { openAddAthleteModal, openAddTorneoModal, openEditAthleteModal, openEditTorneoModal, openTorneoStatsModal, openConfigModal, openEditAthleteCostsModal, openJuegoModal, openJuegoStatsModal, openAddSedeModal, openEditSedeModal, openAddGaleriaModal } from "./modals.js";
import { dayNameFromDate } from "./utils.js";
import { saveSede, updateSede, saveSiteContent, createTrialRequest, getTrialRequests } from "./api.js";

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
        
        const dateStr = date.toISOString().split('T')[0];
        html += `<div class="${classes}" data-date="${dateStr}" ${isMondayOrWednesday && !isPast ? 'tabindex="0"' : ''}>${d}</div>`;
      }
      
      html += '</div></div>';
    }
    
    container.innerHTML = html;
    
    // Add click handlers for calendar days
    container.querySelectorAll('.cal-day:not(.disabled):not(.empty)').forEach(day => {
      day.onclick = () => {
        selectedDate = new Date(day.dataset.date);
        // Remove previous selection
        container.querySelectorAll('.cal-day.selected').forEach(d => d.classList.remove('selected'));
        day.classList.add('selected');
        showTimeSlots();
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
    const container = document.getElementById("timeSlots");
    const slotOptions = document.getElementById("slotOptions");
    if (!container || !slotOptions) return;
    
    if (!selectedDate) {
      container.style.display = 'none';
      return;
    }
    
    const dayOfWeek = selectedDate.getDay();
    const isMonday = selectedDate.getDay() === 1;
    
    let html = '';
    // Both time slots available on Mon/Wed
    html += `
      <button type="button" class="slot-option" data-slot="16:30" data-category="U4_U6">
        <span class="slot-time">${ic.clock} 16:30</span>
        <span class="slot-category">U4 / U6 (hasta 6 años)</span>
      </button>
      <button type="button" class="slot-option" data-slot="17:00" data-category="U8_U12">
        <span class="slot-time">${ic.clock} 17:00 - 18:30</span>
        <span class="slot-category">U8 / U10 / U12 (7+ años)</span>
      </button>
    `;
    
    slotOptions.innerHTML = html;
    container.style.display = 'block';
    
    // Add click handlers for time slots
    slotOptions.querySelectorAll('.slot-option').forEach(btn => {
      btn.onclick = () => {
        selectedTimeSlot = btn.dataset.slot;
        slotOptions.querySelectorAll('.slot-option').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        document.getElementById("btnNextToForm").disabled = false;
      };
    });
  }

  const btnNextToForm = document.getElementById("btnNextToForm");
  if (btnNextToForm) {
    btnNextToForm.onclick = () => {
      if (!selectedDate || !selectedTimeSlot) return;
      document.getElementById("stepCalendar").style.display = 'none';
      document.getElementById("stepForm").style.display = 'block';
      // Auto-fill age category based on time slot
      const timeSlot = selectedTimeSlot;
      const ageCategory = timeSlot === '16:30' ? 'U4_U6' : 'U8_U12';
      // Store for form submission
      document.getElementById("trialForm").dataset.ageCategory = ageCategory;
      document.getElementById("trialForm").dataset.timeSlot = timeSlot;
      document.getElementById("trialForm").dataset.preferredDate = selectedDate.toISOString().split('T')[0];
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
        email: formData.get("email"),
        phone: formData.get("phone"),
        sede_id: formData.get("sede_id"),
        preferred_date: trialForm.dataset.preferredDate,
        preferred_time_slot: trialForm.dataset.timeSlot,
        age_category: trialForm.dataset.ageCategory,
        notes: `Solicitud desde web - Horario: ${trialForm.dataset.timeSlot} - Categoría: ${trialForm.dataset.ageCategory === 'U4_U6' ? 'U4/U6 (hasta 6 años)' : 'U8/U10/U12 (7+ años)'}`
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
      document.getElementById("timeSlots").style.display = 'none';
      document.getElementById("btnNextToForm").disabled = true;
      trialForm?.reset();
      trialForm.dataset.ageCategory = '';
      trialForm.dataset.timeSlot = '';
      trialForm.dataset.preferredDate = '';
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
    const res = await fetch(`/api/data?key=trial_requests${sedeId ? `&sede_id=${encodeURIComponent(sedeId)}` : ''}`);
    const requests = await res.json();
    state.adminTrialRequests = requests || [];
    if (window.__render) window.__render();
  } catch (err) {
    console.error('Error loading trial requests:', err);
  }
}

// Admin Trial Requests Event Handlers
document.addEventListener('click', async (e) => {
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
          body: JSON.stringify({ key: 'trial_requests', itemId, updates: { status: newStatus } })
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
    
    const headers = ['Representante', 'Atleta', 'Fecha', 'Horario', 'Categoría', 'Sede', 'Email', 'Teléfono', 'Estado', 'Fecha Solicitud'];
    const rows = state.adminTrialRequests.map(r => {
      const sede = state.sedes.find(s => s.id === r.sede_id);
      const sedeName = sede ? sede.nombre : 'Desconocida';
      const date = new Date(r.preferred_date).toLocaleDateString('es-ES');
      const timeLabel = r.preferred_time_slot === '16:30' ? '16:30 (U4/U6)' : '17:00-18:30 (U8/U10/U12)';
      const category = r.age_category === 'U4_U6' ? 'U4/U6 (≤6 años)' : 'U8/U10/U12 (7+ años)';
      const createdDate = new Date(r.created_at).toLocaleDateString('es-ES');
      return [r.representative_name, r.athlete_name, date, timeLabel, category, sedeName, r.email, r.phone, r.status, createdDate]
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
  const filterStatus = document.getElementById('filterStatus');
  if (filterStatus && e.target === filterStatus) {
    setTimeout(() => loadAdminTrialRequests(), 0);
  }
  
  const filterSede = document.getElementById('filterSede');
  if (filterSede && e.target === filterSede) {
    setTimeout(() => loadAdminTrialRequests(), 0);
  }
  
  const filterDate = document.getElementById('filterDate');
  if (filterDate && e.target === filterDate) {
    setTimeout(() => loadAdminTrialRequests(), 0);
  }
});
