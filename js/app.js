console.log("APP MODULE LOADED");
import { state } from "./state.js";
import { loadNews, renderNews } from "./news.js";
import { loadData, setRenderCallbacks, loadSedes, setCurrentSede, loadSiteContent } from "./api.js";
import { renderSidebar, renderSaveStatus } from "./views/sidebar.js";
import { loadHomeTrials, renderHome } from "./views/home.js";
import { renderAthleteList, renderAthleteDetail } from "./views/athletes.js";
import { renderAttendanceTab } from "./views/attendance.js";
import { renderAdmin } from "./views/admin.js";
import { renderEstadisticas } from "./views/estadisticas.js";
import { renderEvaluacion } from "./views/evaluacion.js";
import { renderTorneos, renderTorneoDetail } from "./views/torneos.js";
import { renderFloatingSocialLinks, renderPublicHome } from "./views/public-home.js";
import { handleAccesoClick, renderAcceso } from "./views/acceso.js";
import { renderParentPortal } from "./views/portal.js";
import { drawHomeCharts, drawAthListChart, drawAthDetailChart, drawRegChart, drawAdminCharts, drawStatsCharts, drawEvalCharts, drawTorneoCharts } from "./charts.js";
import { attachEvents } from "./events.js";
import { ic } from "./icons.js";

// Route handling
function parseRoute() {
  const path = window.location.pathname;
  const hash = window.location.hash.slice(1);
  
  // Public routes
  if (path === '/' || path === '/index.html') return 'public-home';
  if (path === '/acceso' || path === '/acceso/') return 'acceso';
  if (path === '/portal-padres' || path === '/portal-padres/') return 'portal-padres';
  
  // Admin routes (require sede)
  return hash || 'home';
}

function setRoute(view, params = {}) {
  if (view === 'acceso') {
    window.history.pushState({}, '', '/acceso');
  } else if (view === 'sede-login') {
    window.history.pushState({}, '', `/acceso/${params.sedeCode}`);
  } else if (view === 'public-home') {
    window.history.pushState({}, '', '/');
  } else {
    window.history.pushState({}, '', `/staff#${view}`);
  }
}

function render(){
  if(!state.loaded && !['public-home', 'acceso', 'sede-login', 'portal-padres'].includes(state.view)){
    document.getElementById("app").innerHTML = `<div class="loading-screen"><div style="font-size:28px;">&#x1f6e1;&#xfe0f;</div><div style="font-size:13px;opacity:.8;">Cargando datos de la academia&#8230;</div></div>`;
    return;
  }
  
  let mainContent = "";
  const prevView = state.view;
  const mainEl = document.getElementById("main");
  const savedScroll = mainEl ? mainEl.scrollTop : 0;

  // Public views (no branch required)
  if(state.view === "public-home") mainContent = renderPublicHome();
  else if(state.view === "acceso") mainContent = renderAcceso();
  else if(state.view === "portal-padres") mainContent = renderParentPortal();
  else if(state.view === "sede-login") mainContent = renderAcceso();
  
  // Admin views (require branch)
  else if(state.view==="home") mainContent = renderHome();
  else if(state.view==="atleta-list") mainContent = renderAthleteList();
  else if(state.view==="atleta-detail") mainContent = renderAthleteDetail();
  else if(state.view==="asistencia") mainContent = renderAttendanceTab();
  else if(state.view==="admin") mainContent = renderAdmin();
  else if(state.view==="estadisticas") mainContent = renderEstadisticas();
  else if(state.view==="evaluaciones") mainContent = renderEvaluacion();
  else if(state.view==="torneos") mainContent = renderTorneos();
  else if(state.view==="torneo-detail") mainContent = renderTorneoDetail();

  // Render layout based on view type
  const isPublicView = ['public-home', 'acceso', 'sede-login', 'portal-padres'].includes(state.view);
  const appEl = document.getElementById("app");
  
  if (isPublicView) {
    appEl.className = 'public-site';
    appEl.innerHTML = mainContent + renderFloatingSocialLinks();
  } else {
    appEl.className = '';
    const yearViews = ['home','atleta-list','atleta-detail','asistencia','estadisticas','evaluaciones','torneos','torneo-detail','admin'];
    const yearOptions = Array.from({length: Math.max(5, new Date().getFullYear() - 2026 + 1)}, (_, index) => 2026 + index).map(year => `<option value="${year}" ${state.staffYear === year ? 'selected' : ''}>${year}</option>`).join('');
    const yearSelector = yearViews.includes(state.view) ? `<div class="staff-year-floating"><label for="staffYearSelect">Año</label><select id="staffYearSelect">${yearOptions}</select></div>` : '';
    appEl.innerHTML = `${renderSidebar()}<div id="main">${yearSelector}${mainContent}</div>`;
  }
  
  attachEvents();

  // Draw charts for admin views
  if(state.view==="home") {
    drawHomeCharts();
    void loadHomeTrials(document.getElementById("home-trials"), state.staffYear);
  }
  else if(state.view==="atleta-list") drawAthListChart();
  else if(state.view==="atleta-detail") drawAthDetailChart();
  else if(state.view==="asistencia") drawRegChart();
  else if(state.view==="admin") drawAdminCharts();
  else if(state.view==="estadisticas") drawStatsCharts();
  else if(state.view==="evaluaciones") drawEvalCharts();
  else if(state.view==="torneo-detail") drawTorneoCharts();

  if(state.view === prevView && savedScroll > 0){
    const newMain = document.getElementById("main");
    if(newMain) newMain.scrollTop = savedScroll;
  }
}

// Event delegation for dynamic elements
function setupGlobalEvents() {
  document.addEventListener('click', handleAccesoClick);
  // Internal navigation links (SPA routing)
  document.addEventListener('click', async (e) => {
    const link = e.target.closest('a[href^="/"]');
    if (link && !link.target) {
      const href = link.getAttribute('href');
      // Only handle internal routes (not external, not anchor-only)
      if (href && !href.startsWith('//') && !href.startsWith('http') && !href.startsWith('#')) {
        e.preventDefault();
        navigateTo(href);
        return;
      }
    }

    const logout = e.target.closest('[data-staff-logout]');
    if (logout) {
      const feedback = logout.nextElementSibling;
      feedback.textContent = '';
      logout.disabled = true;
      try {
        const response = await fetch('/api/data', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'staff_auth', action: 'logout' })
        });
        if (!response.ok) throw new Error();
        window.location.replace('/acceso');
      } catch {
        feedback.textContent = 'No se pudo cerrar la sesión. Intenta de nuevo.';
        logout.disabled = false;
      }
    }

    // Back to public home
    if (e.target.closest('.btn-back-home')) {
      state.academyRevealed = false;
      state.view = 'public-home';
      setRoute('public-home');
      render();
      void refreshHomeNews();
      return;
    }

  });

  document.addEventListener('submit', async e => {
    const form = e.target;
    if (!form.matches('.sede-login-form')) return;
    e.preventDefault();
    const sede = state.sedes.find(item => item.codigo === form.dataset.sedeCodigo);
    if (!sede || staffLoginPending) return;
    staffLoginPending = true;
    try {
      await handleLogin(form, sede);
    } finally {
      staffLoginPending = false;
    }
  });
}

let homeNewsRequest;
async function refreshHomeNews() {
  if (state.view !== "public-home" || homeNewsRequest) return;
  homeNewsRequest = loadNews(true);
  try {
    await homeNewsRequest;
    if (state.view === "public-home") {
      const section = document.getElementById("noticias");
      if (section) section.outerHTML = renderNews();
    }
  } catch (error) {
    console.warn("No se pudieron cargar las noticias.", error);
  } finally {
    homeNewsRequest = null;
  }
}

// SPA Navigation helper
function navigateTo(href) {
  if (href === '/' || href === '/index.html') {
    state.academyRevealed = false;
    state.view = 'public-home';
    setRoute('public-home');
  } else if (href === '/acceso' || href === '/acceso/') {
    window.location.assign('/acceso');
    return;
  } else if (href === '/portal-padres' || href === '/portal-padres/') {
    // Use a real navigation for the parent portal so the route works even
    // when the public SPA has not finished loading its initial data.
    window.location.assign('/portal-padres');
    return;
  } else {
    // Hash-based admin routes
    const hash = href.startsWith('#') ? href.slice(1) : href;
    state.view = hash || 'home';
    window.location.hash = hash || 'home';
  }
  render();
  void refreshHomeNews();
}

let staffLoginPending = false;

async function handleLogin(form, sede) {
  const email = form.querySelector('[name="email"]').value;
  const password = form.querySelector('[name="password"]').value;
  const btn = form.querySelector('#btnLogin') || form.querySelector('.btn-sede-login');
  
  const buttonLabel = btn.textContent;
  const feedback = form.querySelector(".staff-login-error");
  feedback.textContent = "";
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `${ic.loader} Entrando...`;
  }
  
  try {
    const response = await fetch('/api/data', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      body: JSON.stringify({ key: 'staff_auth', action: 'login', email, password, sede_id: sede.id })
    });
    const result = await response.json();
    if (!response.ok || !['admin', 'staff'].includes(result.role)) {
      throw new Error(result.error || 'No se pudo iniciar sesión.');
    }
    setCurrentSede(sede);
    state.adminAuth = result.role === 'admin';
    await loadData();
    if (state.adminAuth) await loadSiteContent();
    state.view = 'home';
    state.targetSede = null;
    setRoute('home');
    render();
  } catch (error) {
    if (btn) { btn.disabled = false; btn.textContent = buttonLabel; }
    feedback.textContent = error.message;
  }
}

// Initialize
setRenderCallbacks(render, renderSaveStatus);

// Load sedes first, then determine initial view
async function init() {
  const route = parseRoute();
  state.view = route;
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void refreshHomeNews();
  });

  // Show public and parent-portal screens immediately; their private data is
  // loaded only after the initial UI is visible.
  if (['public-home', 'acceso', 'sede-login', 'portal-padres'].includes(route)) {
    render();
    setupGlobalEvents();
    void refreshHomeNews();
    await loadSedes();
    await loadSiteContent();
    if (state.view === route) render();
    window.addEventListener('popstate', () => {
      const nextRoute = parseRoute();
      state.view = nextRoute;
      render();
      void refreshHomeNews();
    });
    return;
  }

  await loadSedes();
  await loadSiteContent();
  
  // If admin view and no sede selected, redirect to acceso
  if (['home', 'atleta-list', 'asistencia', 'torneos', 'estadisticas', 'evaluaciones', 'admin'].includes(state.view)) {
    if (!state.currentSede) {
      state.view = 'acceso';
    } else {
      await loadData();
    }
  }
  
  render();
  setupGlobalEvents();
  
  // Handle browser back/forward
  window.addEventListener('popstate', () => {
    const route = parseRoute();
    state.view = route;
    render();
  });
}

init();
