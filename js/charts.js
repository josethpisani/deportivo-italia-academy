import { state } from './state.js';
import { CATEGORIES } from './constants.js';
import { attendanceRate, dayNameFromDate, computeTorneoTeamStats } from './utils.js';

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

function doughnutData(labels, values, colors, emptyLabel){
  const vals = values.map(v=>Number(v)||0);
  const total = vals.reduce((s,v)=>s+v,0);
  if(total===0){
    return { labels:[emptyLabel||"Sin datos"], datasets:[{ data:[1], backgroundColor:["#E1E8EF"] }] };
  }
  return { labels, datasets:[{ data:vals, backgroundColor:colors }] };
}

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
    data: doughnutData(CATEGORIES, catAttend, CAT_COLORS, "Sin registros"),
    options: doughnutOpts("Asistencia entrenamientos (%)")
  });

  if(state.torneos.length){
    const torAgg = { ganados:0, empatados:0, perdidos:0, gf:0, gc:0 };
    state.torneos.forEach(t=>{
      const team = computeTorneoTeamStats(t);
      torAgg.ganados += team.ganados;
      torAgg.empatados += team.empatados;
      torAgg.perdidos += team.perdidos;
      torAgg.gf += team.gf;
      torAgg.gc += team.gc;
    });
    makeChart("chartHomeTorResultados", {
      type:"doughnut",
      data: doughnutData(["Ganados","Empatados","Perdidos"], [torAgg.ganados,torAgg.empatados,torAgg.perdidos], [C.green,C.orange,C.red], "Sin partidos jugados"),
      options: doughnutOpts("Resultados del equipo")
    });
    makeChart("chartHomeTorGoles", {
      type:"doughnut",
      data: doughnutData(["Goles a favor","Goles en contra"], [torAgg.gf,torAgg.gc], [C.pitch,C.red], "Sin goles registrados"),
      options: doughnutOpts("Goles: a favor vs en contra")
    });
  }
}

export function drawAthListChart(){
  const catAttend = CATEGORIES.map(c=>{
    const list = state.athletes.filter(a=>a.categoria===c);
    if(!list.length) return 0;
    return Math.round(list.reduce((s,a)=>s+attendanceRate(a.asistenciaEntrenamiento),0)/list.length);
  });
  makeChart("chartAthListAttend", {
    type:"doughnut",
    data: doughnutData(CATEGORIES, catAttend, CAT_COLORS, "Sin registros"),
    options: doughnutOpts("Asistencia por categoría")
  });
}

export function drawAthDetailChart(){
  const d = window.__athDetailData;
  if(!d) return;
  makeChart("chartAthDetail", {
    type:"doughnut",
    data: doughnutData(
      ["Entren. presentes","Entren. ausentes","Juegos presentes","Juegos ausentes"],
      [d.trainPresent||0,d.trainAusente||0,d.gamePresent||0,d.gameAusente||0],
      [C.green, "#95d4a8", C.teal, "#8ecfd6"],
      "Sin registros"
    ),
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
      data: doughnutData(torLabels, torData, CAT_COLORS, "Sin inscritos"),
      options: doughnutOpts("Recaudación por torneo ($)")
    });
  }

  const catInscritos = CATEGORIES.map(c=> state.athletes.filter(a=>a.categoria===c && a.torneos.length>0).length);
  if(catInscritos.some(v=>v>0)){
    makeChart("chartAdminCatTorneos", {
      type:"doughnut",
      data: doughnutData(CATEGORIES, catInscritos, CAT_COLORS, "Sin inscritos"),
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
    data: doughnutData(["Presentes","Ausentes"], [totalPres,totalAus], [C.green,C.red], "Sin registros del día"),
    options: doughnutOpts("Asistencia del día")
  });
}

export function drawStatsCharts(){
  const d = window.__statsDetailData;
  if(!d) return;

  makeChart("chartStatsGoalsAst", {
    type:"doughnut",
    data: doughnutData(["Goles","Asistencias"], [d.goles,d.asistencias], [C.pitch, C.green], "Sin registros"),
    options: doughnutOpts("Goles vs Asistencias")
  });

  makeChart("chartStatsCards", {
    type:"doughnut",
    data: doughnutData(["Amarillas","Rojas"], [d.ta,d.tr], [C.orange, C.red], "Sin tarjetas"),
    options: doughnutOpts("Tarjetas")
  });

  makeChart("chartStatsTrain", {
    type:"doughnut",
    data: doughnutData(["Presente","Ausente"], [d.trainPresent,d.trainAusente], [C.green, "#95d4a8"], "Sin registros"),
    options: doughnutOpts("Entrenamientos")
  });

  makeChart("chartStatsGames", {
    type:"doughnut",
    data: doughnutData(["Presente","Ausente"], [d.gamePresent,d.gameAusente], [C.teal, "#8ecfd6"], "Sin registros"),
    options: doughnutOpts("Juegos")
  });
}

export function drawTorneoCharts(){
  const d = window.__torneoDetailData;
  if(!d) return;
  makeChart("chartTorneoResultados", {
    type:"doughnut",
    data: doughnutData(["Ganados","Empatados","Perdidos"], [d.ganados,d.empatados,d.perdidos], [C.green,C.orange,C.red], "Sin partidos jugados"),
    options: doughnutOpts("Resultados del equipo")
  });
  makeChart("chartTorneoGoals", {
    type:"doughnut",
    data: doughnutData(["Goles a favor","Goles en contra"], [d.gf,d.gc], [C.pitch,C.red], "Sin goles registrados"),
    options: doughnutOpts("Goles: a favor vs en contra")
  });
}

export function drawEvalCharts(){
  const d = window.__evalDetailData;
  if(!d) return;
  makeChart("chartEvalItems", {
    type:"doughnut",
      data:{ labels:d.labels, datasets:[{ data:d.values, backgroundColor:CAT_COLORS.concat([C.teal,C.orange,C.purple,C.red,C.green,"#E67E22","#16A085","#2980B9","#6C3483"]) }] },
    options: doughnutOpts("Puntajes última evaluación")
  });
}
