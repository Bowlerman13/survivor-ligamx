"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Plus, Save, Calendar, AlertTriangle, Pause, Play, MapPin } from "lucide-react"

interface Team {
  id: number
  name: string
  short_name: string
  logo_url: string
  city: string
  stadium: string
}

interface Matchweek {
  id: number
  week_number: number
  start_date: string
  end_date: string
  is_active: boolean
  season: string
}

interface Match {
  id?: string
  homeTeamId: number
  awayTeamId: number
  matchDate: string
  homeTeamName?: string
  awayTeamName?: string
  homeShortName?: string
  awayShortName?: string
  homeLogo?: string
  awayLogo?: string
}

interface ExistingMatch {
  id: string
  week_number: number
  home_team_name: string
  away_team_name: string
  home_short_name: string
  away_short_name: string
  home_logo: string
  away_logo: string
  home_stadium: string
  away_stadium: string
  match_date: string
  home_score: number | null
  away_score: number | null
  status: string
  is_active: boolean
}

interface MatchGeneratorProps {
  token: string
}

export function MatchGenerator({ token }: MatchGeneratorProps) {
  const [teams, setTeams] = useState<Team[]>([])
  const [matchweeks, setMatchweeks] = useState<Matchweek[]>([])
  const [selectedWeek, setSelectedWeek] = useState<string>("")
  const [matches, setMatches] = useState<Match[]>([])
  const [existingMatches, setExistingMatches] = useState<ExistingMatch[]>([])
  const [selectedMatches, setSelectedMatches] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (selectedWeek) {
      loadExistingMatches()
    }
  }, [selectedWeek])

  const loadInitialData = async () => {
    try {
      // Cargar equipos
      const teamsResponse = await fetch("/api/teams/available", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (teamsResponse.ok) {
        const teamsData = await teamsResponse.json()
        setTeams(teamsData)
      }

      // Cargar jornadas
      const matchweeksResponse = await fetch("/api/admin/matchweeks", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (matchweeksResponse.ok) {
        const matchweeksData = await matchweeksResponse.json()
        setMatchweeks(matchweeksData)
      }
    } catch (err) {
      setError("Error cargando datos iniciales")
    } finally {
      setLoading(false)
    }
  }

  const loadExistingMatches = async () => {
    try {
      const response = await fetch(`/api/admin/matches/by-week?week=${selectedWeek}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setExistingMatches(data)
      }
    } catch (err) {
      console.error("Error cargando partidos existentes:", err)
    }
  }

  const toggleMatchSelection = (matchId: string) => {
    setSelectedMatches((prev) => (prev.includes(matchId) ? prev.filter((id) => id !== matchId) : [...prev, matchId]))
  }

  const toggleSelectedMatchesActive = async (isActive: boolean) => {
    if (selectedMatches.length === 0) {
      setError("Selecciona al menos un partido")
      return
    }

    setSubmitting(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/admin/matches/toggle-active", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          matchIds: selectedMatches,
          isActive,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(data.message)
        setSelectedMatches([])
        loadExistingMatches()
      } else {
        throw new Error(data.error)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const addMatch = () => {
    const newMatch: Match = {
      homeTeamId: 0,
      awayTeamId: 0,
      matchDate: "",
    }
    setMatches([...matches, newMatch])
  }

  const removeMatch = (index: number) => {
    setMatches(matches.filter((_, i) => i !== index))
  }

  const updateMatch = (index: number, field: keyof Match, value: any) => {
    const updatedMatches = [...matches]
    updatedMatches[index] = { ...updatedMatches[index], [field]: value }
    setMatches(updatedMatches)
  }

  const generateRandomMatches = () => {
    if (teams.length < 2) return

    const shuffledTeams = [...teams].sort(() => Math.random() - 0.5)
    const newMatches: Match[] = []
    const selectedMatchweek = matchweeks.find((mw) => mw.id.toString() === selectedWeek)

    if (!selectedMatchweek) return

    // Generar 9 partidos (18 equipos / 2)
    for (let i = 0; i < Math.min(9, Math.floor(shuffledTeams.length / 2)); i++) {
      const homeTeam = shuffledTeams[i * 2]
      const awayTeam = shuffledTeams[i * 2 + 1]

      if (homeTeam && awayTeam) {
        // Generar fecha aleatoria dentro del rango de la jornada
        const startDate = new Date(selectedMatchweek.start_date)
        const endDate = new Date(selectedMatchweek.end_date)
        const randomTime = startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())
        const matchDate = new Date(randomTime)

        // Ajustar a horarios típicos de fútbol (17:00, 19:00, 21:00)
        const hours = [17, 19, 21]
        matchDate.setHours(hours[Math.floor(Math.random() * hours.length)], 0, 0, 0)

        newMatches.push({
          homeTeamId: homeTeam.id,
          awayTeamId: awayTeam.id,
          matchDate: matchDate.toISOString().slice(0, 16), // Format for datetime-local input
        })
      }
    }

    setMatches(newMatches)
  }

  const saveMatches = async () => {
    if (!selectedWeek || matches.length === 0) {
      setError("Selecciona una jornada y agrega al menos un partido")
      return
    }

    // Validar que todos los partidos tengan equipos y fechas
    const invalidMatches = matches.filter(
      (match) => !match.homeTeamId || !match.awayTeamId || !match.matchDate || match.homeTeamId === match.awayTeamId,
    )

    if (invalidMatches.length > 0) {
      setError("Todos los partidos deben tener equipos diferentes y fecha válida")
      return
    }

    setSubmitting(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/admin/matches/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          matchweekId: Number.parseInt(selectedWeek),
          matches: matches,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(data.message)
        setMatches([])
        loadExistingMatches()
      } else {
        throw new Error(data.error)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const getTeamName = (teamId: number) => {
    const team = teams.find((t) => t.id === teamId)
    return team ? team.name : "Seleccionar equipo"
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Mexico_City", // Horario de Ciudad de México
    })
  }

  const getStatusBadge = (match: ExistingMatch) => {
    if (!match.is_active) {
      return (
        <Badge variant="destructive" className="text-xs">
          <Pause className="h-3 w-3 mr-1" />
          Inactivo
        </Badge>
      )
    }

    switch (match.status) {
      case "Programado":
        return (
          <Badge variant="secondary" className="text-xs">
            <Play className="h-3 w-3 mr-1" />
            Programado
          </Badge>
        )
      case "live":
        return <Badge className="bg-green-500 text-xs">En Vivo</Badge>
      case "finished":
        return <Badge className="bg-blue-500 text-xs">Finalizado</Badge>
      default:
        return (
          <Badge variant="secondary" className="text-xs">
            {match.status}
          </Badge>
        )
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Generador de Partidos
          </CardTitle>
          <CardDescription>Crea y gestiona los partidos para cada jornada de la temporada</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {/* Selector de Jornada */}
          <div className="space-y-2">
            <Label htmlFor="matchweek">Seleccionar Jornada</Label>
            <Select value={selectedWeek} onValueChange={setSelectedWeek}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una jornada" />
              </SelectTrigger>
              <SelectContent>
                {matchweeks.map((mw) => (
                  <SelectItem key={mw.id} value={mw.id.toString()}>
                    Jornada {mw.week_number} - {mw.season}
                    {mw.is_active && <Badge className="ml-2 text-xs">Activa</Badge>}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedWeek && (
            <>
              {/* Partidos Existentes */}
              {existingMatches.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Partidos Existentes</h3>
                    <div className="flex gap-2">
                      {selectedMatches.length > 0 && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleSelectedMatchesActive(false)}
                            disabled={submitting}
                          >
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Pause className="mr-2 h-4 w-4" />
                            Desactivar ({selectedMatches.length})
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleSelectedMatchesActive(true)}
                            disabled={submitting}
                          >
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Play className="mr-2 h-4 w-4" />
                            Activar ({selectedMatches.length})
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-3">
                    {existingMatches.map((match) => (
                      <div
                        key={match.id}
                        className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedMatches.includes(match.id)
                            ? "bg-blue-50 border-blue-300"
                            : match.is_active
                              ? "bg-gray-50"
                              : "bg-red-50 border-red-200"
                        }`}
                        onClick={() => toggleMatchSelection(match.id)}
                      >
                        <div className="flex items-center gap-4">
                          <input
                            type="checkbox"
                            checked={selectedMatches.includes(match.id)}
                            onChange={() => toggleMatchSelection(match.id)}
                            className="w-4 h-4"
                          />

                          <div className="flex items-center gap-2">
                            <img
                              src={match.home_logo || "/placeholder.svg?height=32&width=32&query=team+logo"}
                              alt={match.home_team_name}
                              className="w-8 h-8 object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = "/placeholder.svg?height=32&width=32"
                              }}
                            />
                            <span className="font-medium">{match.home_short_name}</span>
                          </div>

                          <span className="text-gray-500">vs</span>

                          <div className="flex items-center gap-2">
                            <img
                              src={match.away_logo || "/placeholder.svg?height=32&width=32&query=team+logo"}
                              alt={match.away_team_name}
                              className="w-8 h-8 object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = "/placeholder.svg?height=32&width=32"
                              }}
                            />
                            <span className="font-medium">{match.away_short_name}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-sm font-medium">{formatDateTime(match.match_date)} (CDMX)</div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <MapPin className="h-3 w-3" />
                              {match.home_stadium}
                            </div>
                            {getStatusBadge(match)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedMatches.length > 0 && (
                    <Alert className="border-blue-200 bg-blue-50">
                      <AlertDescription className="text-blue-800">
                        <strong>Partidos seleccionados:</strong> {selectedMatches.length}
                        <br />
                        <strong>Nota:</strong> Los partidos desactivados no estarán disponibles para selección de
                        usuarios y sus equipos no aparecerán como opciones en la jornada activa.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {/* Crear Nuevos Partidos */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Crear Nuevos Partidos</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={generateRandomMatches} disabled={teams.length < 2}>
                      <Calendar className="mr-2 h-4 w-4" />
                      Generar Automático
                    </Button>
                    <Button onClick={addMatch}>
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar Partido
                    </Button>
                  </div>
                </div>

                {matches.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No hay partidos programados</p>
                    <p className="text-sm">Agrega partidos manualmente o genera automáticamente</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {matches.map((match, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                        <div className="space-y-2">
                          <Label>Equipo Local</Label>
                          <Select
                            value={match.homeTeamId.toString()}
                            onValueChange={(value) => updateMatch(index, "homeTeamId", Number.parseInt(value))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar equipo" />
                            </SelectTrigger>
                            <SelectContent>
                              {teams.map((team) => (
                                <SelectItem key={team.id} value={team.id.toString()}>
                                  <div className="flex items-center gap-2">
                                    <span>{team.name}</span>
                                    <span className="text-xs text-gray-500">({team.stadium})</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Equipo Visitante</Label>
                          <Select
                            value={match.awayTeamId.toString()}
                            onValueChange={(value) => updateMatch(index, "awayTeamId", Number.parseInt(value))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar equipo" />
                            </SelectTrigger>
                            <SelectContent>
                              {teams
                                .filter((team) => team.id !== match.homeTeamId)
                                .map((team) => (
                                  <SelectItem key={team.id} value={team.id.toString()}>
                                    {team.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Fecha y Hora (CDMX)</Label>
                          <Input
                            type="datetime-local"
                            value={match.matchDate}
                            onChange={(e) => updateMatch(index, "matchDate", e.target.value)}
                          />
                        </div>

                        <div className="flex items-end">
                          <Button variant="destructive" size="sm" onClick={() => removeMatch(index)}>
                            <span className="text-xs">Eliminar</span>
                          </Button>
                        </div>
                      </div>
                    ))}

                    <div className="flex justify-end">
                      <Button onClick={saveMatches} disabled={submitting || matches.length === 0}>
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Save className="mr-2 h-4 w-4" />
                        Guardar Partidos ({matches.length})
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Información */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Información importante:
                </h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Los partidos se crean en horario de Ciudad de México (sin cambio de horario de verano)</li>
                  <li>• Cada equipo debe jugar solo una vez por jornada</li>
                  <li>• Al guardar se eliminan los partidos existentes de la jornada</li>
                  <li>• La generación automática crea 9 partidos aleatorios</li>
                  <li>• Los horarios sugeridos son 17:00, 19:00 y 21:00</li>
                  <li>
                    • <strong>Partidos inactivos:</strong> Los equipos de partidos desactivados no estarán disponibles
                    para selección
                  </li>
                  <li>• Usa la función de desactivar para partidos reprogramados o suspendidos</li>
                </ul>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
