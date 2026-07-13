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
