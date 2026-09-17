export function uid(prefix){ return prefix + "_" + Math.random().toString(36).slice(2,9); }
export function todayISO(){ return new Date().toISOString().slice(0,10); }
export function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c])); }
export function attendanceRate(obj){
  const vals = Object.values(obj);
  if(vals.length===0) return 0;
  const present = vals.filter(v=>v==="presente").length;
  return Math.round((present/vals.length)*100);
}
export function lastNDates(n, weekday){
  const dayMap = {Domingo:0,Lunes:1,Martes:2,"Miércoles":3,Jueves:4,Viernes:5,"Sábado":6};
  const results = [];
  let d = new Date();
  let guard = 0;
  while(results.length < n && guard < 200){
    guard++;
    const dow = d.getDay();
    let match = false;
    if(weekday==="weekend") match = dow===0 || dow===6;
    else match = dayMap[weekday]===dow;
    if(match){
      results.push(d.toISOString().slice(0,10) + "|" + (weekday==="weekend" ? (dow===0?"Domingo":"Sábado") : weekday));
    }
    d = new Date(d.getTime() - 86400000);
  }
  return results.reverse();
}
export function dayNameFromDate(iso){
  const names = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
  const d = new Date(iso + "T12:00:00");
  return names[d.getDay()];
}
export function computeTorneoTeamStats(t){
  const juegos = (t.juegos||[]).filter(j=>j.estado==="jugado");
  let ganados=0, empatados=0, perdidos=0, gf=0, gc=0;
  juegos.forEach(j=>{
    const f=Number(j.marcadorF||0), c=Number(j.marcadorC||0);
    gf+=f; gc+=c;
    if(f>c) ganados++;
    else if(f===c) empatados++;
    else perdidos++;
  });
  return { partidos:juegos.length, ganados, empatados, perdidos, gf, gc };
}
export function sumTorneoStats(a){
  const acc = { goles:0, asistencias:0, tarjetasAmarillas:0, tarjetasRojas:0, partidosJugados:0 };
  Object.keys(a.estadisticas||{}).forEach(torId=>{
    const st = a.estadisticas[torId]||{};
    acc.goles += st.goles||0;
    acc.asistencias += st.asistencias||0;
    acc.tarjetasAmarillas += st.tarjetasAmarillas||0;
    acc.tarjetasRojas += st.tarjetasRojas||0;
    acc.partidosJugados += st.partidosJugados||0;
  });
  return acc;
}
