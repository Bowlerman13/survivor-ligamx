"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Save, Users, Calendar, BarChart3, Settings, Clock, Trophy, MapPin } from "lucide-react"
import { MatchweekManager } from "./matchweek-manager"
import { formatDateTime } from "@/lib/utils"
import { MatchGenerator } from "./match-generator"
import { DetailedLeaderboard } from "./detailed-leaderboard"
import { SimpleLeaderboard } from "./simple-leaderboard"

interface Match {
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

interface AdminPanelProps {
  token: string
}

export function AdminPanel({ token }: AdminPanelProps) {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    loadMatches()

    // Detectar si es móvil
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const loadMatches = async () => {
    try {
      console.log("🔄 [ADMIN-PANEL] Cargando partidos...")

      // Cache busting para admin panel
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/admin/matches?t=${timestamp}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
        cache: "no-store",
      })

      console.log("📡 [ADMIN-PANEL] Response status:", response.status)

      if (response.ok) {
        const result = await response.json()
        console.log("📊 [ADMIN-PANEL] Response data:", result)

        // Verificar si la respuesta tiene la estructura esperada
        if (result && result.data && Array.isArray(result.data)) {
          console.log(`✅ [ADMIN-PANEL] ${result.data.length} partidos cargados`)
          setMatches(result.data)
        } else if (Array.isArray(result)) {
          // Si la respuesta es directamente un array
          console.log(`✅ [ADMIN-PANEL] ${result.length} partidos cargados (array directo)`)
          setMatches(result)
        } else {
          console.error("❌ [ADMIN-PANEL] Estructura de respuesta inesperada:", result)
          setMatches([])
          setError("Estructura de datos inesperada del servidor")
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error cargando partidos")
      }
    } catch (err: any) {
      console.error("❌ [ADMIN-PANEL] Error cargando partidos:", err)
      setError(err.message)
      setMatches([]) // Asegurar que matches sea un array vacío en caso de error
    } finally {
      setLoading(false)
    }
  }

  const updateMatchResult = async (matchId: string, homeScore: number, awayScore: number) => {
    setSubmitting(matchId)
    setError("")
    setSuccess("")

    try {
      console.log(`🔄 [ADMIN-PANEL] Actualizando resultado: ${matchId} - ${homeScore}:${awayScore}`)

      const response = await fetch("/api/admin/matches", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
        body: JSON.stringify({
          matchId,
          homeScore,
          awayScore,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log("✅ [ADMIN-PANEL] Resultado actualizado:", result)
        setSuccess(result.message || "Resultado actualizado correctamente")

        // Recargar partidos después de actualizar
        setTimeout(() => {
          loadMatches()
        }, 1000)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error actualizando resultado")
      }
    } catch (err: any) {
      console.error("❌ [ADMIN-PANEL] Error actualizando resultado:", err)
      setError(err.message)
    } finally {
      setSubmitting(null)
    }
  }

  const getStatusBadge = (match: Match) => {
    if (!match.is_active) {
      return (
        <Badge variant="destructive" className="text-xs">
          Inactivo
        </Badge>
      )
    }

    switch (match.status) {
      case "scheduled":
        return (
          <Badge variant="secondary" className="text-xs">
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

  // Asegurar que matches sea un array antes de usar filter
  const safeMatches = Array.isArray(matches) ? matches : []
  const pendingMatches = safeMatches.filter((m) => m.status !== "finished" && m.is_active).length
  const finishedMatches = safeMatches.filter((m) => m.status === "finished").length
  const inactiveMatches = safeMatches.filter((m) => !m.is_active).length

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Cargando panel de administración...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Estadísticas del Admin - Responsive */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardContent className="p-3 md:p-4 text-center">
            <BarChart3 className="h-6 w-6 md:h-8 md:w-8 text-blue-500 mx-auto mb-2" />
            <div className="text-lg md:text-2xl font-bold">{safeMatches.length}</div>
            <div className="text-xs md:text-sm text-gray-600">Total Partidos</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4 text-center">
            <Calendar className="h-6 w-6 md:h-8 md:w-8 text-green-500 mx-auto mb-2" />
            <div className="text-lg md:text-2xl font-bold text-green-600">{finishedMatches}</div>
            <div className="text-xs md:text-sm text-gray-600">Finalizados</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4 text-center">
            <Calendar className="h-6 w-6 md:h-8 md:w-8 text-yellow-500 mx-auto mb-2" />
            <div className="text-lg md:text-2xl font-bold text-yellow-600">{pendingMatches}</div>
            <div className="text-xs md:text-sm text-gray-600">Pendientes</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4 text-center">
            <Users className="h-6 w-6 md:h-8 md:w-8 text-red-500 mx-auto mb-2" />
            <div className="text-lg md:text-2xl font-bold text-red-600">{inactiveMatches}</div>
            <div className="text-xs md:text-sm text-gray-600">Inactivos</div>
          </CardContent>
        </Card>
      </div>

      {/* Debug info */}
      <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
        <div>
          🔧 Debug: {safeMatches.length} partidos cargados | Tipo: {typeof matches} | Es Array:{" "}
          {Array.isArray(matches) ? "Sí" : "No"}
        </div>
        <div>
          📊 Estadísticas: {finishedMatches} finalizados, {pendingMatches} pendientes, {inactiveMatches} inactivos
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription className="text-sm">
            <div>{error}</div>
            <Button variant="outline" size="sm" onClick={loadMatches} className="mt-2 bg-transparent">
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800 text-sm">{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="matchweeks" className="w-full">
        {/* Tabs responsivas */}
        {isMobile ? (
          // Vista móvil - Tabs en 3 filas
          <div className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 gap-1">
              <TabsTrigger value="matchweeks" className="flex items-center gap-1 text-xs">
                <Settings className="h-3 w-3" />
                Jornadas
              </TabsTrigger>
              <TabsTrigger value="matches" className="flex items-center gap-1 text-xs">
                <Calendar className="h-3 w-3" />
                Partidos
              </TabsTrigger>
            </TabsList>
            <TabsList className="grid w-full grid-cols-2 gap-1">
              <TabsTrigger value="leaderboard-detailed" className="flex items-center gap-1 text-xs">
                <BarChart3 className="h-3 w-3" />
                Detallada
              </TabsTrigger>
              <TabsTrigger value="leaderboard-simple" className="flex items-center gap-1 text-xs">
                <Trophy className="h-3 w-3" />
                Simple
              </TabsTrigger>
            </TabsList>
            <TabsList className="grid w-full grid-cols-1 gap-1">
              <TabsTrigger value="results" className="flex items-center gap-1 text-xs">
                <BarChart3 className="h-3 w-3" />
                Resultados
              </TabsTrigger>
            </TabsList>
          </div>
        ) : (
          // Vista desktop - Tabs horizontales
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="matchweeks" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Jornadas
            </TabsTrigger>
            <TabsTrigger value="matches" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Partidos
            </TabsTrigger>
            <TabsTrigger value="leaderboard-detailed" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Clasificación Detallada
            </TabsTrigger>
            <TabsTrigger value="leaderboard-simple" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Clasificación Simple
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Resultados
            </TabsTrigger>
          </TabsList>
        )}

        <TabsContent value="matchweeks" className="mt-4 md:mt-6">
          <MatchweekManager token={token} />
        </TabsContent>

        <TabsContent value="matches" className="mt-4 md:mt-6">
          <MatchGenerator token={token} />
        </TabsContent>

        <TabsContent value="leaderboard-detailed" className="mt-4 md:mt-6">
          <Card>
            <CardHeader className="pb-3 md:pb-4">
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Clasificación Detallada
              </CardTitle>
              <CardDescription className="text-sm">
                Vista completa con todas las selecciones de cada usuario por jornada
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DetailedLeaderboard />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard-simple" className="mt-4 md:mt-6">
          <Card>
            <CardHeader className="pb-3 md:pb-4">
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <Trophy className="h-5 w-5 text-green-600" />
                Clasificación Simple
              </CardTitle>
              <CardDescription className="text-sm">
                Vista resumida con estadísticas generales de cada usuario
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SimpleLeaderboard />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader className="pb-3 md:pb-4">
              <CardTitle className="text-lg md:text-xl">Gestionar Resultados de Partidos</CardTitle>
              <CardDescription className="text-sm">
                Actualiza los resultados de los partidos para calcular automáticamente las eliminaciones (Horario de
                Ciudad de México)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {safeMatches.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-lg mb-2">No hay partidos disponibles</div>
                  <div className="text-sm">Crea partidos en la pestaña "Partidos" primero</div>
                  <Button variant="outline" onClick={loadMatches} className="mt-4 bg-transparent">
                    Recargar Partidos
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 md:space-y-4">
                  {safeMatches.map((match) => (
                    <div key={match.id} className="border rounded-lg p-3 md:p-4">
                      <div className="flex items-center justify-between mb-3 md:mb-4">
                        <div className="flex items-center gap-2 md:gap-4">
                          <div className="text-center">
                            <img
                              src={match.home_logo || "/placeholder.svg?height=40&width=40&query=team+logo"}
                              alt={match.home_team_name}
                              className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-1 object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = "/placeholder.svg?height=40&width=40"
                              }}
                            />
                            <div className="text-xs font-medium">{match.home_short_name}</div>
                          </div>

                          <div className="text-center">
                            <div className="text-sm md:text-lg font-bold">VS</div>
                            <div className="text-xs text-gray-500">J{match.week_number}</div>
                          </div>

                          <div className="text-center">
                            <img
                              src={match.away_logo || "/placeholder.svg?height=40&width=40&query=team+logo"}
                              alt={match.away_team_name}
                              className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-1 object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = "/placeholder.svg?height=40&width=40"
                              }}
                            />
                            <div className="text-xs font-medium">{match.away_short_name}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">{getStatusBadge(match)}</div>
                      </div>

                      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4">
                        <div className="flex items-center gap-2 justify-center">
                          <Input
                            type="number"
                            placeholder="0"
                            className="w-12 md:w-16 text-center text-sm"
                            defaultValue={match.home_score || ""}
                            id={`home-${match.id}`}
                            min="0"
                            disabled={!match.is_active}
                          />
                          <span className="text-sm font-medium">-</span>
                          <Input
                            type="number"
                            placeholder="0"
                            className="w-12 md:w-16 text-center text-sm"
                            defaultValue={match.away_score || ""}
                            id={`away-${match.id}`}
                            min="0"
                            disabled={!match.is_active}
                          />
                        </div>

                        <Button
                          onClick={() => {
                            const homeInput = document.getElementById(`home-${match.id}`) as HTMLInputElement
                            const awayInput = document.getElementById(`away-${match.id}`) as HTMLInputElement
                            const homeScore = Number.parseInt(homeInput.value) || 0
                            const awayScore = Number.parseInt(awayInput.value) || 0
                            updateMatchResult(match.id, homeScore, awayScore)
                          }}
                          disabled={submitting === match.id || !match.is_active}
                          size="sm"
                          className="w-full md:w-auto"
                        >
                          {submitting === match.id && <Loader2 className="mr-2 h-3 w-3 md:h-4 md:w-4 animate-spin" />}
                          <Save className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                          Guardar
                        </Button>
                      </div>

                      <div className="mt-3 space-y-1">
                        <div className="text-xs text-gray-500">
                          {match.home_team_name} vs {match.away_team_name}
                        </div>
                        <div className="text-xs text-blue-600 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDateTime(match.match_date)} (CDMX)
                        </div>
                        <div className="text-xs text-green-600 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {match.home_stadium}
                        </div>
                        {!match.is_active && (
                          <div className="text-xs text-red-600 font-medium">
                            ⚠️ Partido inactivo - No disponible para selecciones
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
