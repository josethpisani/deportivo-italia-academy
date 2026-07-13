import { state } from './state.js';
import { CATEGORIES } from './constants.js';
import { attendanceRate, dayNameFromDate } from './utils.js';

const CHART_COLORS = { pitch:"#0E4C86", green:"#1FA855", red:"#C23B33", grayBg:"#E1E8EF", ink:"#162233" };

function destroyChart(id){
  window.__charts = window.__charts || {};
  if(window.__charts[id]){ window.__charts[id].destroy(); delete window.__charts[id]; }
}

function makeChart(id, config){
  window.__charts = window.__charts || {};
  destroyChart(id);
  const ctx = document.getElementById(id);
  if(!ctx || typeof Chart === "undefined") return;
  window.__charts[id] = new Chart(ctx, config);
}

const baseOpts = { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ labels:{ font:{ family:"Inter", size:11 } } } } };

export function drawHomeCharts(){
  const catCounts = CATEGORIES.map(c => state.athletes.filter(a=>a.categoria===c).length);
  makeChart("chartHomeCat", { type:"bar", data:{ labels:CATEGORIES, datasets:[{ label:"Atletas", data:catCounts, backgroundColor:CHART_COLORS.pitch, borderRadius:6 }] },
    options:{ ...baseOpts, plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true, ticks:{ stepSize:1 } } } } });

  const pagado = state.athletes.filter(a=>a.matricula.estado==="pagado").length;
  const pendiente = state.athletes.length - pagado;
  makeChart("chartHomeMatricula", { type:"doughnut", data:{ labels:["Pagado","Pendiente"], datasets:[{ data:[pagado,pendiente], backgroundColor:[CHART_COLORS.green, CHART_COLORS.red] }] },
    options:{ ...baseOpts, cutout:"65%" } });

  const catAttend = CATEGORIES.map(c=>{
    const list = state.athletes.filter(a=>a.categoria===c);
    if(!list.length) return 0;
    const avg = list.reduce((s,a)=>s+attendanceRate(a.asistenciaEntrenamiento),0)/list.length;
    return Math.round(avg);
  });
  makeChart("chartHomeAsistencia", { type:"bar", data:{ labels:CATEGORIES, datasets:[{ label:"% Asistencia", data:catAttend, backgroundColor:CHART_COLORS.green, borderRadius:6 }] },
    options:{ ...baseOpts, plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true, max:100 } } } });
}

export function drawAthListChart(){
  const catAttend = CATEGORIES.map(c=>{
    const list = state.athletes.filter(a=>a.categoria===c);
    if(!list.length) return 0;
    const avg = list.reduce((s,a)=>s+attendanceRate(a.asistenciaEntrenamiento),0)/list.length;
    return Math.round(avg);
  });
  makeChart("chartAthListAttend", { type:"bar", data:{ labels:CATEGORIES, datasets:[{ label:"% Asistencia", data:catAttend, backgroundColor:CHART_COLORS.pitch, borderRadius:6 }] },
    options:{ ...baseOpts, plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true, max:100 } } } });
}

export function drawAthDetailChart(){
  const d = window.__athDetailData;
  if(!d) return;
  makeChart("chartAthDetail", { type:"bar",
    data:{ labels:["Entrenamientos","Juegos"], datasets:[
      { label:"Presente", data:[d.trainPresent, d.gamePresent], backgroundColor:CHART_COLORS.green, borderRadius:6 },
      { label:"Ausente", data:[d.trainAusente, d.gameAusente], backgroundColor:CHART_COLORS.red, borderRadius:6 },
    ]},
    options:{ ...baseOpts, scales:{ y:{ beginAtZero:true, ticks:{ stepSize:1 } } } } });
}

export function drawAdminCharts(){
  const pagado = state.athletes.filter(a=>a.matricula.estado==="pagado").length;
  const pendiente = state.athletes.length - pagado;
  makeChart("chartAdminMatricula", { type:"doughnut", data:{ labels:["Pagado","Pendiente"], datasets:[{ data:[pagado,pendiente], backgroundColor:[CHART_COLORS.green, CHART_COLORS.red] }] },
    options:{ ...baseOpts, cutout:"65%" } });

  const torLabels = state.torneos.map(t=>t.nombre);
  const torData = state.torneos.map(t=>{
    const pagantes = state.athletes.filter(a=>a.torneos.some(at=>at.torneoId===t.id)).length;
    return pagantes * t.monto;
  });
  makeChart("chartAdminTorneos", { type:"bar", data:{ labels:torLabels, datasets:[{ label:"Recaudado ($)", data:torData, backgroundColor:CHART_COLORS.red, borderRadius:6 }] },
    options:{ ...baseOpts, plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true } } } });
}

export function drawRegChart(){
  const dayName = state.regDate ? dayNameFromDate(state.regDate) : "";
  const dateKey = state.regDate ? `${state.regDate}|${dayName}` : "";
  const field = state.regTipo==="training" ? "asistenciaEntrenamiento" : "asistenciaJuegos";
  const presData = CATEGORIES.map(c=> state.athletes.filter(a=>a.categoria===c && a[field][dateKey]==="presente").length);
  const ausData = CATEGORIES.map(c=> state.athletes.filter(a=>a.categoria===c && a[field][dateKey]==="ausente").length);
  makeChart("chartRegDay", { type:"bar",
    data:{ labels:CATEGORIES, datasets:[
      { label:"Presente", data:presData, backgroundColor:CHART_COLORS.green, borderRadius:6 },
      { label:"Ausente", data:ausData, backgroundColor:CHART_COLORS.red, borderRadius:6 },
    ]},
    options:{ ...baseOpts, scales:{ y:{ beginAtZero:true, ticks:{ stepSize:1 } } } } });
}
