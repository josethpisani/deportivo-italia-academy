import { state } from "./state.js";
import { CONTACT_EMAIL } from "./constants.js";
import { ic } from "./icons.js";
import { toggleAttendance, setMatricula, setTorneoPago, saveObservaciones, setMensualidad, markAllMensualidades, saveStatsGenerales, saveObservacionesStats, saveEvaluacion, deleteEvaluacion, deleteAthlete, toggleTorneoAtleta, setTorneoEnrollAll, deleteJuego, deleteTorneo, updateAthleteCosts, setUniformePago } from "./mutations.js";
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
  const academySection = document.getElementById("nosotros");
  if (academySection) {
    document.querySelectorAll('a[href="#nosotros"]').forEach(link => {
      link.onclick = (event) => {
        event.preventDefault();
        state.academyRevealed = true;
        academySection.hidden = false;
        academySection.scrollIntoView({ block: "start" });
      };
    });
  }
  const contactForm = document.getElementById("contactForm");
  if (contactForm) contactForm.onsubmit = (event) => {
    event.preventDefault();
    const fields = new FormData(contactForm);
    const subject = encodeURIComponent(String(fields.get("asunto")).trim());
    const body = encodeURIComponent(
      `Nombre: ${fields.get("nombre")}\r\nCorreo: ${fields.get("email")}\r\n\r\n${fields.get("mensaje")}`
    );
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  };
  document.querySelectorAll("[data-nav]").forEach(btn=>{
    btn.onclick = ()=>{ state.view = btn.dataset.nav; if(state.view === "admin") state.staffYear = new Date().getFullYear(); if(state.view!=="atleta-detail") state.selectedId=null; if(state.view!=="estadisticas") state.statsAthleteId=null; if(state.view!=="evaluaciones"){ state.evalAthleteId=null; state.evalEditingId=null; } if(state.view!=="torneos" && state.view!=="torneo-detail") state.torneoId=null; if(window.__render) window.__render(); };
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
    btn.onclick = ()=>{ state.selectedId = btn.dataset.open; state.athleteReadOnly = btn.dataset.openAdmin !== "true"; state.view = "atleta-detail"; if(window.__render) window.__render(); };
  });
  const backBtn = document.getElementById("btnBack");
  if(backBtn) backBtn.onclick = ()=>{ state.athleteReadOnly = true; state.view="atleta-list"; if(window.__render) window.__render(); };
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
  document.querySelectorAll('[data-admincat]').forEach(btn=>{
    btn.onclick = () => { state.adminCategory = btn.dataset.admincat; if (window.__render) window.__render(); };
  });
  document.querySelectorAll('[data-adminview]').forEach(btn=>{
    btn.onclick = () => { state.adminViewMode = btn.dataset.adminview; if (window.__render) window.__render(); };
  });
  const staffYearSelect = document.getElementById('staffYearSelect');
  if (staffYearSelect) staffYearSelect.onchange = () => { state.staffYear = Number(staffYearSelect.value); if (state.view === 'asistencia') state.regDate = `${state.staffYear}-01-05`; if (window.__render) window.__render(); };
  const adminSidebar = document.querySelector('.admin-sidebar');
  const adminTabs = document.querySelector('.admin-sidebar .admin-tabs');
  if (adminSidebar && adminTabs && !document.getElementById('adminMenuToggle')) {
    adminSidebar.insertAdjacentHTML('afterbegin', '<button type="button" id="adminMenuToggle" class="admin-menu-toggle" aria-expanded="false" aria-controls="adminSectionTabs">☰ <span>Menú de administración</span></button>');
    adminTabs.id = 'adminSectionTabs';
    document.getElementById('adminMenuToggle').onclick = () => {
      const open = adminSidebar.classList.toggle('menu-open');
      document.getElementById('adminMenuToggle').setAttribute('aria-expanded', String(open));
    };
  }
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
  document.querySelectorAll('[data-staff-view]').forEach(btn=>{
    btn.onclick = () => { state.athViewMode = btn.dataset.staffView; if(window.__render) window.__render(); };
  });

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
  document.querySelectorAll("[data-uniforme]").forEach(btn=>{
    btn.onclick = ()=>{
      const [athleteId, estado] = btn.dataset.uniforme.split("|");
      setUniformePago(athleteId, estado);
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
      periodo: document.getElementById("evalPeriodo")?.value || new Date().toISOString().slice(0,7),
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

  const btnEnrollmentRequest = document.getElementById("btnEnrollmentRequest");
  const enrollmentModal = document.getElementById("enrollmentModal");
  const enrollmentForm = document.getElementById("enrollmentForm");
  const closeEnrollment = () => { if (enrollmentModal) enrollmentModal.style.display = 'none'; document.body.style.overflow = ''; };
  if (btnEnrollmentRequest && enrollmentModal) btnEnrollmentRequest.onclick = () => { enrollmentModal.style.display = 'flex'; document.body.style.overflow = 'hidden'; };
  document.getElementById('closeEnrollmentModal')?.addEventListener('click', closeEnrollment);
  document.getElementById('btnCloseEnrollment')?.addEventListener('click', closeEnrollment);
  enrollmentModal?.addEventListener('click', e => { if (e.target === enrollmentModal) closeEnrollment(); });
  if (enrollmentForm) enrollmentForm.onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(enrollmentForm);
    const data = Object.fromEntries(formData.entries());
    data.athlete_age = Number(data.athlete_age);
    const button = enrollmentForm.querySelector('button[type="submit"]');
    if (button) { button.disabled = true; button.textContent = 'Enviando...'; }
    try {
      const res = await fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'registration_requests', value: data, sede_id: data.sede_id }) });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'No se pudo enviar la solicitud');
      enrollmentForm.style.display = 'none';
      document.getElementById('enrollmentSuccess').style.display = 'block';
      document.getElementById('enrollmentConfirmation').textContent = `Solicitud ${result.id} recibida para ${data.athlete_name}. Te contactaremos pronto.`;
    } catch (err) {
      alert(err.message || 'No se pudo enviar la solicitud. Intenta nuevamente.');
    } finally {
      if (button) { button.disabled = false; button.textContent = 'Enviar solicitud de inscripción'; }
    }
  };

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

  const btnAdminTabInscripciones = document.querySelector('[data-admintab="inscripciones"]');
  if (btnAdminTabInscripciones) {
    btnAdminTabInscripciones.onclick = async () => {
      state.adminTab = 'inscripciones';
      if (window.__render) window.__render();
      await loadAdminRegistrationRequests();
    };
  }

  const btnAdminTabPortal = document.querySelector('[data-admintab="portal"]');
  if (btnAdminTabPortal) {
    btnAdminTabPortal.onclick = async () => { state.adminTab = 'portal'; if (window.__render) window.__render(); await loadParentAccounts(); };
  }
  const parentAccountForm = document.getElementById('parentAccountForm');
  if (parentAccountForm) parentAccountForm.onsubmit = async e => {
    e.preventDefault(); const value = Object.fromEntries(new FormData(parentAccountForm).entries());
    const result = await parentAdminRequest({ action: 'create', ...value });
    const message = document.getElementById('parentAccountMessage');
    if (result.success) { parentAccountForm.reset(); if (message) message.textContent = `Cuenta creada. Código de activación: ${result.activation_code}`; await loadParentAccounts(); }
    else if (message) message.textContent = result.error || 'No se pudo crear la cuenta.';
  };
  document.querySelectorAll('[data-parent-link]').forEach(btn => btn.onclick = async () => {
    const athleteId = document.querySelector(`[data-parent-athlete="${btn.dataset.parentLink}"]`)?.value;
    if (!athleteId) return alert('Selecciona un atleta.');
    const result = await parentAdminRequest({ action: 'link', id: btn.dataset.parentLink, athlete_id: athleteId, sede_id: state.currentSede?.id });
    if (!result.success) alert(result.error || 'No se pudo vincular.'); else await loadParentAccounts();
  });
  document.querySelectorAll('[data-parent-unlink]').forEach(btn => btn.onclick = async () => {
    const [id, athlete_id, sede_id] = btn.dataset.parentUnlink.split('|');
    if (!confirm('¿Desvincular este atleta del representante?')) return;
    const result = await parentAdminRequest({ action: 'unlink', id, athlete_id, sede_id });
    if (!result.success) alert(result.error || 'No se pudo desvincular.'); else await loadParentAccounts();
  });
  document.querySelectorAll('[data-parent-status]').forEach(btn => btn.onclick = async () => { const [id, status] = btn.dataset.parentStatus.split('|'); const result = await parentAdminRequest({ action: 'status', id, status }); if (!result.success) alert(result.error || 'No se pudo cambiar el estado.'); else await loadParentAccounts(); });
  document.querySelectorAll('[data-parent-code]').forEach(btn => btn.onclick = async () => { const result = await parentAdminRequest({ action: 'regenerate_code', id: btn.dataset.parentCode }); if (result.success) alert(`Nuevo código de activación: ${result.activation_code}`); else alert(result.error || 'No se pudo generar el código.'); });
  document.querySelectorAll('[data-registration-accept]').forEach(btn => btn.onclick = async () => {
    if (!confirm('¿Aceptar la inscripción? Se creará el atleta y se vinculará al representante.')) return;
    const result = await registrationAdminRequest({ action: 'accept', request_id: btn.dataset.registrationAccept });
    if (!result.success) alert(result.error || 'No se pudo aceptar la inscripción.');
    else { alert(result.activation_code ? `Inscripción aceptada. Código de activación del representante: ${result.activation_code}` : 'Inscripción aceptada y atleta creado.'); await loadAdminRegistrationRequests(); }
  });
  document.querySelectorAll('[data-registration-decline]').forEach(btn => btn.onclick = async () => {
    if (!confirm('¿Declinar esta inscripción?')) return;
    const result = await registrationAdminRequest({ action: 'decline', request_id: btn.dataset.registrationDecline, reason: 'Declinada por administración' });
    if (!result.success) alert(result.error || 'No se pudo declinar la inscripción.'); else await loadAdminRegistrationRequests();
  });

  const parentLoginForm = document.getElementById('parentLoginForm');
  const parentActivationForm = document.getElementById('parentActivationForm');
  const loginView = document.getElementById('portalLoginView');
  const activationView = document.getElementById('parentActivationView');
  const dashboardView = document.getElementById('parentDashboardView');
  const showPortalMessage = (id, message) => { const el = document.getElementById(id); if (el) el.textContent = message; };
  let parentPortalPayload = null;
  const formatPortalDate = (value) => value ? new Date(`${value}T12:00:00`).toLocaleDateString('es-PA', { day: '2-digit', month: 'long', year: 'numeric' }) : 'No registrada';
  const renderParentAthlete = (athlete) => {
    const fullName = `${athlete.nombre || ''} ${athlete.apellido || ''}`.trim() || 'Atleta';
    if (athlete.becado) athlete = { ...athlete, matricula: { ...(athlete.matricula || {}), estado: 'Becado', monto: 0 } };
    const esc = value => escapeHtml(value === null || value === undefined ? '' : String(value));
    const payments = athlete.becado ? [['Becado', { estado: 'Becado', monto: 0 }]] : (athlete.mensualidades && typeof athlete.mensualidades === 'object' ? Object.entries(athlete.mensualidades) : []);
    const training = Object.entries(athlete.asistenciaEntrenamiento || {});
    const games = Object.entries(athlete.asistenciaJuegos || {});
    const attendance = [...training, ...games];
    const present = attendance.filter(([, value]) => ['presente', 'asistio', 'asistió'].includes(String(value?.estado || value).toLowerCase())).length;
    const absences = attendance.filter(([, value]) => ['ausente', 'no_asistio', 'no asistió'].includes(String(value?.estado || value).toLowerCase())).length;
    const tournaments = Array.isArray(athlete.torneos) ? athlete.torneos : [];
    const torneos = (parentPortalPayload?.torneos || []).map(torneo => ({ ...torneo, monto: athlete.pagosTorneos?.[torneo.id]?.monto ?? torneo.monto }));
    const legacyStats = athlete.statsGenerales || {};
    const tournamentTotals = tournaments.reduce((total, entry) => { const item = athlete.estadisticas?.[entry.torneoId] || {}; total.partidosJugados += Number(item.partidosJugados || 0); total.goles += Number(item.goles || 0); total.asistencias += Number(item.asistencias || 0); total.tarjetasAmarillas += Number(item.tarjetasAmarillas || 0); total.tarjetasRojas += Number(item.tarjetasRojas || 0); return total; }, { partidosJugados: 0, goles: 0, asistencias: 0, tarjetasAmarillas: 0, tarjetasRojas: 0 });
    const hasTournamentStats = tournaments.some(entry => athlete.estadisticas?.[entry.torneoId]);
    const stats = hasTournamentStats ? { ...tournamentTotals, entrenamientosAsistidos: legacyStats.entrenamientosAsistidos || 0, entrenamientosTotales: legacyStats.entrenamientosTotales || 0 } : legacyStats;
    const uniformsSource = athlete.becado ? { Becado: { estado: 'Becado', monto: 0 } } : (athlete.uniformes || athlete.pagosUniformes || athlete.pagoUniforme || {});
    const uniforms = Array.isArray(uniformsSource) ? uniformsSource.map((item, index) => [item.concepto || item.nombre || `Uniforme ${index + 1}`, item]) : Object.entries(uniformsSource || {});
    const attendanceRows = attendance.map(([date, value]) => `<tr><td>${esc(date)}</td><td>${esc(value?.tipo || (training.some(([key]) => key === date) ? 'Entrenamiento' : 'Partido'))}</td><td><span class="portal-status ${String(value?.estado || value).toLowerCase().includes('aus') ? 'negative' : ''}">${esc(value?.estado || value || 'Sin registro')}</span></td></tr>`).join('') || '<tr><td colspan="3">No hay asistencias registradas.</td></tr>';
    const tournamentRows = tournaments.map(entry => { const torneo = torneos.find(item => String(item.id) === String(entry.torneoId)); const tournamentStats = athlete.estadisticas?.[entry.torneoId] || {}; return `<tr><td>${esc(torneo?.nombre || entry.torneoId || 'Torneo')}</td><td>${esc(torneo?.fecha || entry.fecha || '—')}</td><td>${esc(torneo?.monto ? `$${torneo.monto}` : '—')}</td><td>${esc(`${tournamentStats.goles || 0} goles · ${tournamentStats.asistencias || 0} asistencias`)}</td></tr>`; }).join('') || '<tr><td colspan="4">No participa en torneos registrados.</td></tr>';
    const evaluations = (Array.isArray(athlete.evaluaciones) ? athlete.evaluaciones : Object.values(athlete.evaluaciones || {})).map(ev => ({ ...ev, observaciones: ev.observaciones || ev.observacion || ev.notas || '' }));
    const evaluationGroups = evaluations.reduce((groups, ev) => { const period = ev.periodo || String(ev.fecha || 'Sin mes').slice(0,7); (groups[period] ||= []).push(ev); return groups; }, {});
    const evaluationRows = Object.entries(evaluationGroups).sort(([a], [b]) => b.localeCompare(a)).map(([period, entries]) => `<div class="portal-evaluation-month"><h4>${esc(period === 'Sin mes' ? period : new Date(`${period}-15T12:00:00`).toLocaleDateString('es-PA', { month:'long', year:'numeric' }))}</h4>${entries.map(ev => { const values = Object.values(ev.items || {}).map(Number).filter(Number.isFinite); const average = values.length ? (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1) : '—'; const detail = Object.entries(ev.items || {}).map(([name, value]) => `<span>${esc(name)} <b>${esc(value)}/10</b></span>`).join(''); return `<article class="portal-evaluation"><div><strong>${esc(ev.descripcion || 'Evaluación deportiva')}</strong><span>${esc(ev.fecha || period)}</span></div><b>${average}/10</b><div class="portal-evaluation-details">${detail}</div>${ev.observaciones ? `<p>${esc(ev.observaciones)}</p>` : ''}</article>`; }).join('')}</div>`).join('') || '<p class="portal-empty">No hay evaluaciones publicadas.</p>';
    const gallery = (parentPortalPayload?.galeria || []).map(image => `<figure class="portal-gallery-item"><img src="${esc(image.url)}" alt="${esc(image.descripcion || image.categoria || 'Galería Deportivo Italia')}" loading="lazy"><figcaption>${esc(image.descripcion || image.categoria || 'Galería')}<small>${esc(image.fecha)}</small></figcaption></figure>`).join('') || '<p class="portal-empty">No hay fotografías publicadas.</p>';
    const gameRows = tournaments.flatMap(entry => { const torneo = torneos.find(item => String(item.id) === String(entry.torneoId)); return (torneo?.juegos || []).map(game => { const gameStats = athlete.juegosStats?.[entry.torneoId]?.[game.id] || {}; const result = game.estado === 'jugado' ? `${game.marcadorF ?? 0} - ${game.marcadorC ?? 0}` : 'Por jugar'; return `<tr><td>${esc(torneo?.nombre || 'Torneo')}</td><td>${esc(game.fecha || '—')}</td><td>vs. ${esc(game.rival || 'Rival')}</td><td><strong>${esc(result)}</strong></td><td>${esc(`${gameStats.goles || 0} goles · ${gameStats.asistencias || 0} asistencias`)}</td></tr>`; }); }).join('') || '<tr><td colspan="5">No hay juegos registrados para los torneos inscritos.</td></tr>';
    const monthlyRows = payments.map(([month, payment]) => `<tr><td>${esc(month)}</td><td>${esc(payment?.monto ? `$${payment.monto}` : '—')}</td><td><span class="portal-status ${payment?.estado === 'pagado' ? '' : 'negative'}">${esc(payment?.estado || 'pendiente')}</span></td><td>${esc(payment?.fecha || '—')}</td></tr>`).join('') || '<tr><td colspan="4">No hay mensualidades registradas.</td></tr>';
    const uniformRows = uniforms.map(([label, payment]) => `<tr><td>${esc(label)}</td><td>${esc(payment?.monto ? `$${payment.monto}` : '—')}</td><td><span class="portal-status ${payment?.estado === 'pagado' ? '' : 'negative'}">${esc(payment?.estado || 'No registrado')}</span></td><td>${esc(payment?.fecha || '—')}</td></tr>`).join('') || '<tr><td colspan="4">No hay pagos de uniformes registrados.</td></tr>';
    return `<div class="portal-athlete-hero"><div class="portal-athlete-avatar large">${esc(fullName.slice(0, 2).toUpperCase())}</div><div><span class="portal-eyebrow">Perfil del atleta · ${esc(athlete.sede_id === 'sed_brisas' ? 'Brisas' : 'Panamá Viejo')}</span><h2>${esc(fullName)}</h2><p>${esc(athlete.categoria || 'Categoría no registrada')} · ${esc(athlete.posicion || 'Posición no registrada')}</p></div><span class="portal-readonly">Solo consulta</span></div><div class="portal-metric-grid"><article><strong>${esc(athlete.categoria || '—')}</strong><span>Categoría</span></article><article><strong>${esc(athlete.edad || '—')}</strong><span>Edad</span></article><article><strong>${present}</strong><span>Asistencias</span></article><article><strong>${tournaments.length}</strong><span>Torneos</span></article></div><section class="portal-info-section"><h3>Información del atleta</h3><div class="portal-info-grid"><article class="portal-info-card"><dl><div><dt>Fecha de nacimiento</dt><dd>${esc(formatPortalDate(athlete.fechaNacimiento))}</dd></div><div><dt>Ingreso a la academia</dt><dd>${esc(formatPortalDate(athlete.fechaIngreso))}</dd></div><div><dt>Representante</dt><dd>${esc(athlete.representante || 'No registrada')}</dd></div><div><dt>Teléfono</dt><dd>${esc(athlete.telefono || 'No registrado')}</dd></div><div><dt>Dirección</dt><dd>${esc(athlete.direccion || 'No registrada')}</dd></div></dl></article><article class="portal-info-card"><h3>Estadísticas generales</h3><div class="portal-stat-list"><span>Partidos <b>${stats.partidosJugados || 0}</b></span><span>Goles <b>${stats.goles || 0}</b></span><span>Asistencias <b>${stats.asistencias || 0}</b></span><span>Entrenamientos <b>${stats.entrenamientosAsistidos || 0}/${stats.entrenamientosTotales || 0}</b></span><span>Tarjetas <b>${stats.tarjetasAmarillas || 0} amarillas · ${stats.tarjetasRojas || 0} rojas</b></span></div></article></div>${athlete.observaciones ? `<p class="portal-observation"><strong>Observaciones:</strong> ${esc(athlete.observaciones)}</p>` : ''}</section><section class="portal-info-section"><h3>Asistencias</h3><div class="portal-table-wrap"><table class="portal-table"><thead><tr><th>Fecha</th><th>Actividad</th><th>Estado</th></tr></thead><tbody>${attendanceRows}</tbody></table></div></section><section class="portal-info-section"><h3>Calendario de juegos y resultados</h3><div class="portal-table-wrap"><table class="portal-table"><thead><tr><th>Torneo</th><th>Fecha</th><th>Rival</th><th>Resultado</th><th>Estadísticas</th></tr></thead><tbody>${gameRows}</tbody></table></div></section><section class="portal-info-section"><h3>Mensualidades y matrícula</h3><div class="portal-payment-highlight"><span>Matrícula</span><strong>${esc(athlete.matricula?.monto ? `$${athlete.matricula.monto}` : '—')}</strong><b class="portal-status ${athlete.matricula?.estado === 'pagado' ? '' : 'negative'}">${esc(athlete.matricula?.estado || 'No registrada')}</b></div><div class="portal-table-wrap"><table class="portal-table"><thead><tr><th>Mes</th><th>Monto</th><th>Estado</th><th>Fecha</th></tr></thead><tbody>${monthlyRows}</tbody></table></div></section><section class="portal-info-section"><h3>Pagos de torneos</h3><div class="portal-table-wrap"><table class="portal-table"><thead><tr><th>Torneo</th><th>Fecha</th><th>Monto</th><th>Estadísticas</th></tr></thead><tbody>${tournamentRows}</tbody></table></div></section><section class="portal-info-section"><h3>Pagos de uniformes</h3><div class="portal-table-wrap"><table class="portal-table"><thead><tr><th>Concepto</th><th>Monto</th><th>Estado</th><th>Fecha</th></tr></thead><tbody>${uniformRows}</tbody></table></div></section><section class="portal-info-section"><h3>Evaluación mensual del atleta</h3><div class="portal-evaluations">${evaluationRows}</div></section><section class="portal-info-section"><h3>Galería del club</h3><p class="portal-section-note">Fotografías publicadas por el equipo Staff.</p><div class="portal-gallery-grid">${gallery}</div></section><div class="portal-readonly-note">${ic.shield} Esta información es de consulta. Los pagos, la asistencia, las estadísticas, las evaluaciones y la galería son administrados por el personal del club.</div>`;
  };
  const renderParentDashboard = (payload) => {
    if (!dashboardView) return;
    parentPortalPayload = payload;
    loginView.style.display = 'none'; activationView.style.display = 'none'; dashboardView.style.display = 'block';
    const parentSidebar = dashboardView.querySelector('.portal-sidebar');
    const parentNav = dashboardView.querySelector('.portal-nav');
    if (parentSidebar && parentNav && !document.getElementById('parentMenuToggle')) {
      parentNav.id = 'parentPortalNav';
      parentSidebar.insertAdjacentHTML('afterbegin', '<button type="button" id="parentMenuToggle" class="portal-menu-toggle" aria-expanded="false" aria-controls="parentPortalNav">☰ <span>Menú</span></button>');
    }
    document.getElementById('parentWelcome').textContent = `Hola, ${payload.parent.full_name}`;
    document.getElementById('parentRepresentativePanel').innerHTML = `<div><span class="portal-eyebrow">Panel del representante</span><h2>${escapeHtml(payload.parent.full_name || 'Representante')}</h2><p>${escapeHtml(payload.parent.email || '')}</p></div><div class="portal-representative-count"><strong>${payload.athletes.length}</strong><span>atleta${payload.athletes.length === 1 ? '' : 's'} vinculado${payload.athletes.length === 1 ? '' : 's'}</span></div>`;
    const homeRepresentative = document.getElementById('parentHomeRepresentative');
    if (homeRepresentative) homeRepresentative.innerHTML = `<div class="portal-home-rep-copy"><span class="portal-eyebrow">Datos del representante</span><h2>${escapeHtml(payload.parent.full_name || 'Representante')}</h2><p>${escapeHtml(payload.parent.email || '')}</p><span class="portal-home-rep-count">${payload.athletes.length} atleta${payload.athletes.length === 1 ? '' : 's'} vinculado${payload.athletes.length === 1 ? '' : 's'}</span></div>`;
    const selector = document.getElementById('parentAthleteSelector');
    selector.innerHTML = payload.athletes.map((a, index) => `<option value="${index}">${escapeHtml(`${a.nombre || ''} ${a.apellido || ''}`.trim())} · ${escapeHtml(a.categoria || 'Sin categoría')}</option>`).join('');
    const panel = document.getElementById('parentAthletePanel');
    const wireParentMenu = () => {
      const menuToggle = document.getElementById('parentMenuToggle');
      const parentNav = document.getElementById('parentPortalNav');
      const sections = [...panel.querySelectorAll('.portal-info-section')];
      const findSection = (label) => sections.find(section => section.querySelector('h3')?.textContent.toLowerCase().includes(label));
      const hero = panel.querySelector('.portal-athlete-hero');
      const metrics = panel.querySelector('.portal-metric-grid');
      const targets = { ficha: findSection('información del atleta'), asistencia: findSection('asistencias'), pagos: sections.filter(section => ['mensualidades', 'pagos de torneos', 'pagos de uniformes'].some(label => section.querySelector('h3')?.textContent.toLowerCase().includes(label))), torneos: findSection('calendario de juegos'), evaluaciones: findSection('evaluación mensual'), galeria: findSection('galería') };
      const activateSection = sectionName => {
        if (homeRepresentative) homeRepresentative.style.display = sectionName === 'resumen' ? '' : 'none';
        if (hero) hero.style.display = sectionName === 'resumen' ? '' : 'none';
        if (metrics) metrics.style.display = sectionName === 'resumen' ? '' : 'none';
        sections.forEach(section => { section.style.display = 'none'; });
        const selected = sectionName === 'resumen' ? [findSection('información del atleta')] : (Array.isArray(targets[sectionName]) ? targets[sectionName] : [targets[sectionName]]);
        selected.filter(Boolean).forEach(section => { section.style.display = ''; });
        document.querySelectorAll('[data-portal-section]').forEach(item => item.classList.toggle('active', item.dataset.portalSection === sectionName));
        if (parentSidebar) parentSidebar.classList.remove('menu-open');
        if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
      };
      document.querySelectorAll('[data-portal-section]').forEach(button => { button.onclick = () => activateSection(button.dataset.portalSection); });
      if (menuToggle && parentNav) menuToggle.onclick = () => { const open = parentSidebar.classList.toggle('menu-open'); menuToggle.setAttribute('aria-expanded', String(open)); };
      activateSection('resumen');
    };
    const showAthlete = athlete => { panel.innerHTML = athlete ? renderParentAthlete(athlete).replace(/(<p>[^<]*?)\s·\s*[^<]+(<\/p>)/, '$1$2') : '<p class="portal-empty">No hay atletas vinculados a esta cuenta. Contacta a la administración.</p>'; wireParentMenu(); };
    showAthlete(payload.athletes[0]);
    selector.onchange = () => showAthlete(parentPortalPayload.athletes[Number(selector.value)]);
  };
  if (parentLoginForm) parentLoginForm.onsubmit = async (e) => {
    e.preventDefault(); const data = Object.fromEntries(new FormData(parentLoginForm).entries());
    try { const res = await fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ key: 'portal', action: 'login', ...data }) }); const result = await res.json(); if (!res.ok) throw new Error(result.error); renderParentDashboard(result); } catch (err) { showPortalMessage('parentLoginMessage', err.message || 'No se pudo iniciar sesión.'); }
  };
  if (parentActivationForm) parentActivationForm.onsubmit = async (e) => {
    e.preventDefault(); const data = Object.fromEntries(new FormData(parentActivationForm).entries());
    try { const res = await fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'portal', action: 'activate', ...data }) }); const result = await res.json(); if (!res.ok) throw new Error(result.error); showPortalMessage('parentActivationMessage', result.message); parentActivationForm.reset(); } catch (err) { showPortalMessage('parentActivationMessage', err.message || 'No se pudo activar la cuenta.'); }
  };
  document.getElementById('showParentActivation')?.addEventListener('click', () => { loginView.style.display = 'none'; activationView.style.display = 'block'; });
  document.getElementById('showParentLogin')?.addEventListener('click', () => { activationView.style.display = 'none'; loginView.style.display = 'block'; });
  document.getElementById('parentLogout')?.addEventListener('click', async () => { await fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ key: 'portal', action: 'logout' }) }); window.location.reload(); });
}

async function parentAdminRequest(body) {
  try { const res = await fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'parent_admin', ...body }) }); return await res.json(); }
  catch (err) { return { success: false, error: err.message }; }
}

async function registrationAdminRequest(body) {
  try { const res = await fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ key: 'registration_admin', ...body }) }); return await res.json(); }
  catch (err) { return { success: false, error: err.message }; }
}

async function loadParentAccounts() {
  try { const res = await fetch('/api/data?key=parent_admin'); state.parentAccounts = await res.json(); if (!Array.isArray(state.parentAccounts)) state.parentAccounts = []; if (window.__render) window.__render(); }
  catch (err) { console.error('Error loading parent accounts:', err); }
}

async function loadAdminRegistrationRequests() {
  try {
    const sedeId = state.currentSede?.id;
    const res = await fetch(`/api/data?key=registration_requests&sede_id=${encodeURIComponent(sedeId || '')}`);
    const requests = await res.json();
    state.adminRegistrationRequests = Array.isArray(requests) ? requests : [];
    if (window.__render) window.__render();
  } catch (err) {
    console.error('Error loading registration requests:', err);
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
