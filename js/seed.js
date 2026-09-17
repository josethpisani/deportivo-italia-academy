import { CATEGORIES, FIRST_NAMES, LAST_NAMES } from './constants.js';
import { uid, todayISO } from './utils.js';

export function makeAthlete(category, idx){
  const fn = FIRST_NAMES[(idx*3+category.length) % FIRST_NAMES.length];
  const ln = LAST_NAMES[(idx*5+2) % LAST_NAMES.length];
  const ageBase = {U4:3,U6:5,U8:7,U10:9,U12:11}[category];
  return {
    id: uid("ath"),
    nombre: fn, apellido: ln, categoria: category,
    edad: ageBase + (idx%2),
    fechaNacimiento: `${2026-(ageBase+(idx%2))}-0${(idx%9)+1}-1${idx%9}`,
    posicion: ["Portero","Defensa","Mediocampo","Delantero"][idx%4],
    representante: `${LAST_NAMES[(idx+7)%LAST_NAMES.length]}, familia`,
    telefono: `+58 412-${(1000000+idx*137).toString().slice(0,7)}`,
    direccion: "Caracas, Venezuela",
    fechaIngreso: `2025-0${(idx%9)+1}-0${(idx%8)+1}`,
    matricula: { estado: idx%4===0 ? "pendiente":"pagado", monto:35, fecha:"2026-06-01" },
    mensualidades: {},
    torneos: [],
    asistenciaEntrenamiento: {},
    asistenciaJuegos: {},
    observaciones: "",
    estadisticas: {},
    statsGenerales: { goles:0, asistencias:0, tarjetasAmarillas:0, tarjetasRojas:0, partidosJugados:0, entrenamientosAsistidos:0, entrenamientosTotales:0 },
    evaluaciones: [],
  };
}

let _seedData = null;

async function loadSeedData(){
  if(_seedData) return _seedData;
  try{
    const res = await fetch('/data/athletes.json');
    _seedData = await res.json();
  }catch(e){
    console.warn('Could not load seed data, using generated athletes');
    _seedData = Array.from({length:47}, (_,i)=>{
      const cats = ["U6","U8","U10","U12"];
      const cat = cats[i % 4];
      return makeAthlete(cat, i);
    });
  }
  return _seedData;
}

export async function seedAthletes(){
  return await loadSeedData();
}

export function seedTorneos(){
  return [];
}
