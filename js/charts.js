import { state } from './state.js';
import { CATEGORIES } from './constants.js';
import { attendanceRate, dayNameFromDate } from './utils.js';

const C = { pitch:"#0E4C86", green:"#1FA855", red:"#C23B33", grayBg:"#E1E8EF", ink:"#162233", orange:"#E8922D", purple:"#7B4FD4", teal:"#2BA5AD" };
const CAT_COLORS = ["#0E4C86","#1FA855","#E8922D","#C23B33","#7B4FD4"];

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

const doughnutOpts = (title) => ({
  responsive:true, maintainAspectRatio:false,
  cutout:"55%",
  plugins:{
    legend:{ position:"bottom", labels:{ font:{ family:"Inter", size:11 }, padding:12 } },
    title:{ display:!!title, text:title||"", font:{ family:"Inter", size:13, weight:"600" } }
  }
});

export function drawHomeCharts(){
  makeChart("chartHomeCat", {
    type:"doughnut",
    data:{ labels:CATEGORIES, datasets:[{ data:CATEGORIES.map(c=>state.athletes.filter(a=>a.categoria===c).length), backgroundColor:CAT_COLORS }] },
    options: doughnutOpts("Atletas por categoría")
  });

  const pagado = state.athletes.filter(a=>a.matricula.estado==="pagado").length;
  const pendiente = state.athletes.length - pagado;
  makeChart("chartHomeMatricula", {
    type:"doughnut",
    data:{ labels:["Pagado","Pendiente"], datasets:[{ data:[pagado,pendiente], backgroundColor:[C.green, C.red] }] },
    options: doughnutOpts("Estado de matrícula")
  });

  const catAttend = CATEGORIES.map(c=>{
    const list = state.athletes.filter(a=>a.categoria===c);
    if(!list.length) return 0;
    return Math.round(list.reduce((s,a)=>s+attendanceRate(a.asistenciaEntrenamiento),0)/list.length);
  });
  makeChart("chartHomeAsistencia", {
    type:"doughnut",
    data:{ labels:CATEGORIES, datasets:[{ data:catAttend.map(v=>v||1), backgroundColor:CAT_COLORS }] },
    options: doughnutOpts("Asistencia entrenamientos (%)")
  });
}

export function drawAthListChart(){
  const catAttend = CATEGORIES.map(c=>{
    const list = state.athletes.filter(a=>a.categoria===c);
    if(!list.length) return 0;
    return Math.round(list.reduce((s,a)=>s+attendanceRate(a.asistenciaEntrenamiento),0)/list.length);
  });
  makeChart("chartAthListAttend", {
    type:"doughnut",
    data:{ labels:CATEGORIES, datasets:[{ data:catAttend.map(v=>v||1), backgroundColor:CAT_COLORS }] },
    options: doughnutOpts("Asistencia por categoría")
  });
}

export function drawAthDetailChart(){
  const d = window.__athDetailData;
  if(!d) return;
  makeChart("chartAthDetail", {
    type:"doughnut",
    data:{ labels:["Entren. presentes","Entren. ausentes","Juegos presentes","Juegos ausentes"],
      datasets:[{ data:[d.trainPresent||0,d.trainAusente||0,d.gamePresent||0,d.gameAusente||0],
        backgroundColor:[C.green, "#95d4a8", C.teal, "#8ecfd6"] }] },
    options: doughnutOpts("Entrenamientos vs. juegos")
  });
}

export function drawAdminCharts(){
  const matCatData = CATEGORIES.map(c=> state.athletes.filter(a=>a.categoria===c && a.matricula.estado==="pagado").length);
  const matCatPend = CATEGORIES.map(c=> state.athletes.filter(a=>a.categoria===c && a.matricula.estado==="pendiente").length);
  const pagado = matCatData.reduce((s,v)=>s+v,0);
  const pendiente = matCatPend.reduce((s,v)=>s+v,0);

  makeChart("chartAdminMatricula", {
    type:"doughnut",
    data:{ labels:["Pagado","Pendiente"], datasets:[{ data:[pagado,pendiente], backgroundColor:[C.green, C.red] }] },
    options: doughnutOpts("Matrículas: pagado vs pendiente")
  });

  const mes = state.mensualMonth || new Date().toISOString().slice(0,7);
  const menPagado = state.athletes.filter(a=>{
    const m = a.mensualidades && a.mensualidades[mes];
    return m && m.estado==="pagado";
  }).length;
  const menPendiente = state.athletes.length - menPagado;
  makeChart("chartAdminMensualidades", {
    type:"doughnut",
    data:{ labels:["Pagado","Pendiente"], datasets:[{ data:[menPagado,menPendiente], backgroundColor:[C.green, C.red] }] },
    options: doughnutOpts("Mensualidades ("+mes+"): pagado vs pendiente")
  });

  const torLabels = state.torneos.map(t=>t.nombre);
  const torData = state.torneos.map(t=>{
    const inscritos = state.athletes.filter(a=>a.torneos.some(at=>at.torneoId===t.id)).length;
    return inscritos * t.monto;
  });
  if(torLabels.length){
    makeChart("chartAdminTorneos", {
      type:"doughnut",
      data:{ labels:torLabels, datasets:[{ data:torData, backgroundColor:CAT_COLORS }] },
      options: doughnutOpts("Recaudación por torneo ($)")
    });
  }

  const catInscritos = CATEGORIES.map(c=>{
    return state.torneos.reduce((sum,t)=>{
      if(t.categoria!==c) return sum;
      return sum + state.athletes.filter(a=>a.categoria===c && a.torneos.some(at=>at.torneoId===t.id)).length;
    },0);
  });
  if(catInscritos.some(v=>v>0)){
    makeChart("chartAdminCatTorneos", {
      type:"doughnut",
      data:{ labels:CATEGORIES, datasets:[{ data:catInscritos, backgroundColor:CAT_COLORS }] },
      options: doughnutOpts("Inscritos a torneos por categoría")
    });
  }
}

export function drawRegChart(){
  const dayName = state.regDate ? dayNameFromDate(state.regDate) : "";
  const dateKey = state.regDate ? `${state.regDate}|${dayName}` : "";
  const field = state.regTipo==="training" ? "asistenciaEntrenamiento" : "asistenciaJuegos";
  const presData = CATEGORIES.map(c=> state.athletes.filter(a=>a.categoria===c && a[field][dateKey]==="presente").length);
  const ausData = CATEGORIES.map(c=> state.athletes.filter(a=>a.categoria===c && a[field][dateKey]==="ausente").length);
  const totalPres = presData.reduce((s,v)=>s+v,0);
  const totalAus = ausData.reduce((s,v)=>s+v,0);
  makeChart("chartRegDay", {
    type:"doughnut",
    data:{ labels:["Presentes","Ausentes"], datasets:[{ data:[totalPres||0,totalAus||0], backgroundColor:[C.green,C.red] }] },
    options: doughnutOpts("Asistencia del día")
  });
}
