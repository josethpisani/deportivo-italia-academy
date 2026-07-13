import { state } from './state.js';
import { loadData, setRenderCallbacks } from './api.js';
import { renderSidebar, renderSaveStatus } from './views/sidebar.js';
import { renderHome } from './views/home.js';
import { renderAthleteList, renderAthleteDetail } from './views/athletes.js';
import { renderAttendanceTab } from './views/attendance.js';
import { renderAdmin } from './views/admin.js';
import { drawHomeCharts, drawAthListChart, drawAthDetailChart, drawRegChart, drawAdminCharts } from './charts.js';
import { attachEvents } from './events.js';

function render(){
  if(!state.loaded){
    document.getElementById("app").innerHTML = `<div class="loading-screen"><div style="font-size:28px;">&#x1f6e1;&#xfe0f;</div><div style="font-size:13px;opacity:.8;">Cargando datos de la academia&#8230;</div></div>`;
    return;
  }
  let mainContent = "";
  if(state.view==="home") mainContent = renderHome();
  else if(state.view==="atleta-list") mainContent = renderAthleteList();
  else if(state.view==="atleta-detail") mainContent = renderAthleteDetail();
  else if(state.view==="asistencia") mainContent = renderAttendanceTab();
  else if(state.view==="admin") mainContent = renderAdmin();

  document.getElementById("app").innerHTML = `${renderSidebar()}<div id="main">${mainContent}</div>`;
  attachEvents();

  if(state.view==="home") drawHomeCharts();
  else if(state.view==="atleta-list") drawAthListChart();
  else if(state.view==="atleta-detail") drawAthDetailChart();
  else if(state.view==="asistencia") drawRegChart();
  else if(state.view==="admin") drawAdminCharts();
}

setRenderCallbacks(render, renderSaveStatus);
loadData();
