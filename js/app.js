import { state } from './state.js';
import { loadData, setRenderCallbacks, loadSedes, setCurrentSede, loadSiteContent } from './api.js';
import { renderSidebar, renderSaveStatus } from './views/sidebar.js';
import { renderHome } from './views/home.js';
import { renderAthleteList, renderAthleteDetail } from './views/athletes.js';
import { renderAttendanceTab } from './views/attendance.js';
import { renderAdmin } from './views/admin.js';
import { renderEstadisticas } from './views/estadisticas.js';
import { renderEvaluacion } from './views/evaluacion.js';
import { renderTorneos, renderTorneoDetail } from './views/torneos.js';
import { renderPublicHome } from './views/public-home.js';
import { renderAcceso } from './views/acceso.js';
import { drawHomeCharts, drawAthListChart, drawAthDetailChart, drawRegChart, drawAdminCharts, drawStatsCharts, drawEvalCharts, drawTorneoCharts } from './charts.js';
import { attachEvents } from './events.js';
import { ic } from './icons.js';

// Route handling
function parseRoute() {
  const path = window.location.pathname;
  const hash = window.location.hash.slice(1);
  
  // Public routes
  if (path === '/' || path === '/index.html') return 'public-home';
  if (path === '/acceso' || path === '/acceso/') return 'acceso';
  
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
    window.location.hash = view;
  }
}

function render(){
  if(!state.loaded && state.view !== 'public-home' && state.view !== 'acceso' && state.view !== 'sede-login'){
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
  else if(state.view === "sede-login") mainContent = renderSedeLogin(state.targetSede);
  
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
  const isPublicView = ['public-home', 'acceso', 'sede-login'].includes(state.view);
  const appEl = document.getElementById("app");
  
  if (isPublicView) {
    appEl.className = 'public-site';
    appEl.innerHTML = mainContent;
  } else {
    appEl.className = '';
    appEl.innerHTML = `${renderSidebar()}<div id="main">${mainContent}</div>`;
  }
  
  attachEvents();

  // Draw charts for admin views
  if(state.view==="home") drawHomeCharts();
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
  // Internal navigation links (SPA routing)
  document.addEventListener('click', (e) => {
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

    // Branch selector toggle
    const switchBtn = e.target.closest('#btnSedeSwitch');
    if (switchBtn) {
      const dropdown = document.getElementById('sedeDropdown');
      if (dropdown) dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
      return;
    }

    // Branch option selection (only logout allowed - no sede switching without re-login)
    const option = e.target.closest('.sede-option');
    if (option) {
      const action = option.dataset.action;
      if (action === 'logout') {
        // Logout: clear auth, go back to sede selection
        state.adminAuth = false;
        state.currentSede = null;
        state.targetSede = null;
        state.view = 'acceso';
        setRoute('acceso');
        render();
        const dropdown = document.getElementById('sedeDropdown');
        if (dropdown) dropdown.style.display = 'none';
        return;
      }
      // Ignore other sede-option clicks (no switching without re-login)
      const dropdown = document.getElementById('sedeDropdown');
      if (dropdown) dropdown.style.display = 'none';
      return;
    }

    // Close dropdown on outside click
    if (!e.target.closest('.sede-selector')) {
      const dropdown = document.getElementById('sedeDropdown');
      if (dropdown) dropdown.style.display = 'none';
    }

    // Inline sede login form submission
    const loginForm = e.target.closest('.sede-login-form');
    if (loginForm) {
      e.preventDefault();
      const sedeCode = loginForm.dataset.sedeCodigo;
      const sede = state.sedes.find(s => s.codigo === sedeCode);
      if (sede) {
        // Set targetSede so handleLogin can validate credentials
        state.targetSede = sede;
        const email = loginForm.querySelector('[name="email"]').value;
        const password = loginForm.querySelector('[name="password"]').value;
        const btn = loginForm.querySelector('.btn-sede-login');
        if (btn) {
          btn.disabled = true;
          btn.innerHTML = `${ic.loader} Entrando...`;
        }
        setTimeout(() => handleLogin({ 
          querySelector: (sel) => loginForm.querySelector(sel),
          closest: (sel) => loginForm.closest(sel)
        }), 0);
      }
      return;
    }

    // Back to public home
    if (e.target.closest('.btn-back-home')) {
      state.view = 'public-home';
      setRoute('public-home');
      render();
      return;
    }

    // Login form submission (click on button)
    if (e.target.closest('#loginForm')) {
      e.preventDefault();
      handleLogin(e.target.closest('#loginForm'));
      return;
    }
  });

  // Login form submission (Enter key / form submit)
  document.addEventListener('submit', (e) => {
    if (e.target.id === 'loginForm') {
      e.preventDefault();
      handleLogin(e.target);
      return;
    }
  });
}

// SPA Navigation helper
function navigateTo(href) {
  if (href === '/' || href === '/index.html') {
    state.view = 'public-home';
    setRoute('public-home');
  } else if (href === '/acceso' || href === '/acceso/') {
    state.view = 'acceso';
    setRoute('acceso');
  } else {
    // Hash-based admin routes
    const hash = href.startsWith('#') ? href.slice(1) : href;
    state.view = hash || 'home';
    window.location.hash = hash || 'home';
  }
  render();
}

async function handleLogin(form) {
  const email = form.querySelector('[name="email"]').value;
  const password = form.querySelector('[name="password"]').value;
  const btn = form.querySelector('#btnLogin');
  
  btn.disabled = true;
  btn.innerHTML = 'Entrando...';
  
  // Credenciales por sede
  const sede = state.targetSede;
  let valid = false;
  
  if (sede?.codigo === 'PV') {
    valid = email === 'acceso pv' && password === 'pv12345';
  } else if (sede?.codigo === 'BR') {
    valid = email === 'acceso br' && password === 'br12345';
  }
  
  if (valid) {
    // Set current sede and load data
    setCurrentSede(sede);
    await loadData();
    state.adminAuth = true;
    state.view = 'home';
    state.targetSede = null;
    setRoute('home');
    render();
  } else {
    btn.disabled = false;
    btn.innerHTML = `${ic.logIn} Ingresar al sistema`;
    alert('Credenciales incorrectas');
  }
}

async function switchSede(sede) {
  // Save current data before switching
  if (state.currentSede) {
    await saveCurrentBranchData();
  }
  
  setCurrentSede(sede);
  await loadData();
  state.view = 'home';
  state.adminAuth = false;
  setRoute('home');
  render();
}

async function saveCurrentBranchData() {
  // Data is auto-saved on each mutation, but we can force save here
  if (state.athletes.length) await saveAthletes();
  if (state.torneos.length) await saveTorneos();
}

// Initialize
setRenderCallbacks(render, renderSaveStatus);

// Load sedes first, then determine initial view
async function init() {
  await loadSedes();
  await loadSiteContent();
  
  const route = parseRoute();
  state.view = route;
  
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