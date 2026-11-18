import { state } from "./state.js";
import { matchesStaffYear } from "./utils.js";

export function gameAttendanceKey(tournamentId, gameId) {
  return `juego:${encodeURIComponent(tournamentId)}:${encodeURIComponent(gameId)}`;
}

export function calendarGames(tournaments) {
  return tournaments.flatMap(tournament => (tournament.juegos || []).map(game => ({
    tournament, game, key: gameAttendanceKey(tournament.id, game.id)
  })));
}

export function attendanceGamesForYear() {
  return calendarGames(state.torneos)
    .filter(({ tournament }) => matchesStaffYear(tournament.fecha || tournament.anio || tournament.year, state.staffYear))
    .sort((a, b) => (a.game.fecha || "").localeCompare(b.game.fecha || ""));
}

export function isTournamentAthlete(athlete, tournament) {
  return (athlete?.torneos || []).some(link => link.torneoId === tournament.id);
}

export function gameAttendanceHistory(athlete, tournaments) {
  const calendar = new Map(calendarGames(tournaments).map(entry => [entry.key, entry]));
  return Object.entries(athlete.asistenciaJuegos || {}).map(([key, value]) => {
    const entry = calendar.get(key);
    return {
      key,
      date: entry?.game.fecha || value?.fecha || key.split("|")[0],
      label: entry ? `${entry.tournament.nombre} · vs. ${entry.game.rival}` : value?.tipo || "Partido",
      status: value?.estado || value
    };
  });
}
