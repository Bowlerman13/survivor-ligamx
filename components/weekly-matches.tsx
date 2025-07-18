"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw, CalendarDays, MapPin, Clock } from "lucide-react"
import Image from "next/image"

interface Team {
  id: string
  name: string
  shortName: string
  logoUrl: string
}

interface Match {
  id: string
  homeTeam: Team
  awayTeam: Team
  matchDate: string
  stadium: string
  homeScore: number | null
  awayScore: number | null
  isFinished: boolean
  isActive: boolean
  status: string // "Programado", "En Vivo", "Finalizado"
}

interface MatchweekData {
  matchweek: {
    id: string
    name: string
    weekNumber: number
    startDate: string
    endDate: string
    isActive: boolean
  }
  matches: Match[]
}

export function WeeklyMatches() {
  const [data, setData] = useState<MatchweekData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchWeeklyMatches = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      console.log("Client Component: Fetching weekly matches from API...")
      const response = await fetch("/api/matches/current-week", {
        cache: "no-store", // Ensure fresh data
      })
      console.log("Client Component: API response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Client Component: API Error response:", errorData)
        throw new Error(errorData.error || "Error desconocido al cargar los partidos.")
      }
      const result: MatchweekData = await response.json()
      console.log("Client Component: API result data received:", result)
      setData(result)
    } catch (err: any) {
      console.error("Client Component: Failed to fetch weekly matches:", err)
      setError(err.message || "Error al cargar los partidos.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWeeklyMatches()
  }, [fetchWeeklyMatches])

  const formatMatchDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return "Fecha no disponible"
      const options: Intl.DateTimeFormatOptions = {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "America/Mexico_City", // Ensure correct timezone
      }
      return date.toLocaleString("es-MX", options)
    } catch (e) {
      console.error("Error formatting date:", e)
      return "Fecha inválida"
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Finalizado":
        return "bg-green-500 text-white"
      case "En Vivo":
        return "bg-red-500 text-white animate-pulse"
      case "Programado":
      default:
        return "bg-gray-500 text-white"
    }
  }

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6 flex flex-col items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-green-600 mb-4" />
          <p className="text-gray-600">Cargando partidos de la jornada...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6 flex flex-col items-center justify-center min-h-[300px]">
          <div className="text-red-500 text-center mb-4">
            <p className="font-bold text-lg">Error al cargar los partidos:</p>
            <p className="text-sm">{error}</p>
          </div>
          <Button onClick={fetchWeeklyMatches}>
            <RefreshCw className="h-4 w-4 mr-2" /> Reintentar
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!data || !data.matchweek || data.matches.length === 0) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6 text-center min-h-[300px] flex flex-col justify-center items-center">
          <CalendarDays className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-xl font-bold text-gray-700 mb-2">No hay partidos disponibles para la jornada actual.</h3>
          <p className="text-gray-500">Por favor, verifica que haya una jornada activa y partidos configurados.</p>
          <Button onClick={fetchWeeklyMatches} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" /> Reintentar
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-center text-2xl font-bold text-green-700">
            Jornada {data.matchweek.weekNumber}: {data.matchweek.name}
          </CardTitle>
          <p className="text-center text-sm text-gray-600">
            Del {new Date(data.matchweek.startDate).toLocaleDateString("es-MX", { day: "numeric", month: "long" })} al{" "}
            {new Date(data.matchweek.endDate).toLocaleDateString("es-MX", { day: "numeric", month: "long" })}
          </p>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {data.matches.map((match) => {
          console.log(
            `Client Component: Rendering match ${match.id}. isFinished: ${match.isFinished}, homeScore: ${match.homeScore}, awayScore: ${match.awayScore}, status: ${match.status}`,
          )
          return (
            <Card key={match.id} className="flex flex-col">
              <CardContent className="p-4 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(match.status)}`}>
                    {match.status}
                  </span>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{formatMatchDate(match.matchDate)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-lg font-bold">
                  <div className="flex items-center gap-2">
                    <Image
                      src={match.homeTeam.logoUrl || "/placeholder.svg"}
                      alt={match.homeTeam.name}
                      width={32}
                      height={32}
                      className="rounded-full"
                      onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                    />
                    <span>{match.homeTeam.shortName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* MODIFICACIÓN: Mostrar marcador solo si el partido está FINALIZADO */}
                    {match.isFinished ? (
                      <span className="text-2xl font-extrabold">
                        {match.homeScore} - {match.awayScore}
                      </span>
                    ) : (
                      <span className="text-xl text-gray-500">vs</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{match.awayTeam.shortName}</span>
                    <Image
                      src={match.awayTeam.logoUrl || "/placeholder.svg"}
                      alt={match.awayTeam.name}
                      width={32}
                      height={32}
                      className="rounded-full"
                      onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                    />
                  </div>
                </div>
                <div className="text-center text-sm text-gray-500">
                  <MapPin className="h-4 w-4 inline-block mr-1" />
                  {match.stadium}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
