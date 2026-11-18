import { gameAttendanceKey } from "./game-attendance.js";

export function tournamentStats(athlete, tournament) {
  const totals = { goles: 0, asistencias: 0, tarjetasAmarillas: 0, tarjetasRojas: 0,
    partidosJugados: 0, ...athlete.estadisticas?.[tournament.id] };
  const gameStats = athlete.juegosStats?.[tournament.id];
  const attendance = athlete.asistenciaJuegos || {};
  const games = tournament.juegos || [];
  const hasAttendance = games.some(game => gameAttendanceKey(tournament.id, game.id) in attendance);
  if (gameStats || hasAttendance) {
    totals.partidosJugados = games.filter(game => {
      const record = attendance[gameAttendanceKey(tournament.id, game.id)];
      const status = record?.estado || record;
      if (status) return status === "presente";
      const stats = gameStats?.[game.id] || {};
      return ["goles", "asistencias", "tarjetasAmarillas", "tarjetasRojas"]
        .some(field => Number(stats[field] || 0) > 0);
    }).length;
  }
  return totals;
}
