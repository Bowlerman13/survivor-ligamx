import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Mexico_City", // Horario de Ciudad de México (sin cambio de horario de verano)
  }).format(new Date(date))
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "America/Mexico_City", // Horario de Ciudad de México (sin cambio de horario de verano)
  })
}

export function getCurrentMexicoTime(): string {
  return new Date()
    .toLocaleString("en-CA", {
      timeZone: "America/Mexico_City", // Horario de Ciudad de México (sin cambio de horario de verano)
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
    .replace(", ", "T")
}

export function getMatchResult(
  homeScore: number | null,
  awayScore: number | null,
  teamId: number,
  homeTeamId: number,
): string | null {
  if (homeScore === null || awayScore === null) return null

  const isHomeTeam = teamId === homeTeamId

  if (homeScore === awayScore) return "draw"

  if (isHomeTeam) {
    return homeScore > awayScore ? "win" : "loss"
  } else {
    return awayScore > homeScore ? "win" : "loss"
  }
}
