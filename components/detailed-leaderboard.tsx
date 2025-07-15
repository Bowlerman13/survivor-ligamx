"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Loader2, Trophy, Crown, Medal, Award, ChevronDown, ChevronUp, RefreshCw, Clock } from "lucide-react"
import { formatDateTime } from "@/lib/utils"

interface TeamSelection {
  week_number: number
  team_id: number
  team_name: string
  team_short_name: string
  team_logo: string
  result: string
  is_correct: boolean | null
  created_at: string
  updated_at: string
}

interface LeaderboardEntry {
  id: string
  name: string
  email: string
  is_eliminated: boolean
  user_updated_at: string
  selections: TeamSelection[]
  correct_selections: number
  total_selections: number
  last_week_survived: number
}

interface LeaderboardResponse {
  data: LeaderboardEntry[]
  timestamp: string
  count: number
}

export function DetailedLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")
  const [expandedUser, setExpandedUser] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<string>("")

  useEffect(() => {
    loadDetailedLeaderboard()

    // Detectar si es móvil
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    // Auto-refresh cada 30 segundos
    const interval = setInterval(() => {
      loadDetailedLeaderboard(true)
    }, 30000)

    return () => {
      window.removeEventListener("resize", checkMobile)
      clearInterval(interval)
    }
  }, [])

  const loadDetailedLeaderboard = useCallback(async (isAutoRefresh = false) => {
    if (!isAutoRefresh) {
      setLoading(true)
    } else {
      setRefreshing(true)
    }
    setError("")

    try {
      console.log("🔄 Cargando leaderboard detallado...")

      // Agregar timestamp para evitar caché
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/leaderboard-detailed?t=${timestamp}`, {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (response.ok) {
        const result: LeaderboardResponse = await response.json()
        console.log(`✅ Leaderboard cargado: ${result.count} usuarios at ${result.timestamp}`)

        setLeaderboard(result.data)
        setLastUpdate(result.timestamp)
      } else {
        throw new Error("Error cargando clasificación detallada")
      }
    } catch (err: any) {
      console.error("❌ Error cargando leaderboard:", err)
      setError(err.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  const handleManualRefresh = () => {
    loadDetailedLeaderboard()
  }

  // Función para calcular puntos de un usuario
  const calculatePoints = (selections: TeamSelection[]): number => {
    return selections.reduce((total, selection) => {
      if (selection.result === "win") return total + 3
      if (selection.result === "draw") return total + 1
      return total
    }, 0)
  }

  // Función para obtener el último week_number donde el usuario estuvo vivo
  const getLastWeekAlive = (selections: TeamSelection[], isEliminated: boolean): number => {
    if (!isEliminated) {
      return Math.max(...selections.map((s) => s.week_number), 0)
    }

    const lossSelection = selections.find((s) => s.result === "loss")
    return lossSelection ? lossSelection.week_number : Math.max(...selections.map((s) => s.week_number), 0)
  }

  const getRankIcon = (position: number, isEliminated: boolean) => {
    if (isEliminated) {
      return <span className="text-red-500 text-lg">💀</span>
    }

    switch (position) {
      case 1:
        return <Crown className="h-4 w-4 md:h-5 md:w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
      case 3:
        return <Award className="h-4 w-4 md:h-5 md:w-5 text-amber-600" />
      default:
        return <Trophy className="h-4 w-4 md:h-5 md:w-5 text-gray-300" />
    }
  }

  const getSelectionForWeek = (selections: TeamSelection[], week: number): TeamSelection | null => {
    return selections.find((s) => s.week_number === week) || null
  }

  const getSelectionStyle = (selection: TeamSelection | null, userEliminated: boolean) => {
    if (!selection) {
      return "bg-gray-100 border-gray-200"
    }

    if (userEliminated && selection.is_correct === false) {
      return "bg-red-100 border-red-300 ring-2 ring-red-400"
    }

    if (selection.result === "win") {
      return "bg-green-100 border-green-300 ring-1 ring-green-400"
    } else if (selection.result === "draw") {
      return "bg-blue-100 border-blue-300 ring-1 ring-blue-400"
    } else if (selection.result === "loss") {
      return "bg-red-100 border-red-300"
    }

    return "bg-yellow-100 border-yellow-300"
  }

  const weeks = Array.from({ length: 18 }, (_, i) => i + 1)

  // Ordenar usuarios con el nuevo criterio de desempate
  const sortedLeaderboard = [...leaderboard].sort((a, b) => {
    const aLastWeek = getLastWeekAlive(a.selections, a.is_eliminated)
    const bLastWeek = getLastWeekAlive(b.selections, b.is_eliminated)
    const aPoints = calculatePoints(a.selections)
    const bPoints = calculatePoints(b.selections)

    if (aLastWeek !== bLastWeek) {
      return bLastWeek - aLastWeek
    }

    if (aPoints !== bPoints) {
      return bPoints - aPoints
    }

    return b.correct_selections - a.correct_selections
  })

  const survivors = sortedLeaderboard.filter((entry) => !entry.is_eliminated)
  const eliminated = sortedLeaderboard.filter((entry) => entry.is_eliminated)

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Cargando clasificación...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error}
          <Button variant="outline" size="sm" onClick={handleManualRefresh} className="ml-2 bg-transparent">
            <RefreshCw className="h-4 w-4 mr-1" />
            Reintentar
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  // Vista móvil simplificada
  if (isMobile) {
    return (
      <div className="space-y-4">
        {/* Header con refresh */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-green-600" />
            <span className="font-semibold">Clasificación Detallada</span>
            {refreshing && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
          <Button variant="outline" size="sm" onClick={handleManualRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>

        {/* Timestamp de última actualización */}
        {lastUpdate && (
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Última actualización: {formatDateTime(lastUpdate)} (CDMX)
          </div>
        )}

        {/* Supervivientes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="h-5 w-5 text-green-600" />
              Supervivientes ({survivors.length})
            </CardTitle>
            <CardDescription className="text-sm">Toca para ver detalles de selecciones</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {survivors.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No hay supervivientes registrados</div>
            ) : (
              survivors.map((entry, index) => {
                const userPoints = calculatePoints(entry.selections)
                const lastWeekAlive = getLastWeekAlive(entry.selections, entry.is_eliminated)
                const isExpanded = expandedUser === entry.id

                return (
                  <div key={entry.id} className="border rounded-lg overflow-hidden">
                    {/* Header del usuario */}
                    <div
                      className={`p-4 cursor-pointer ${
                        index < 3 ? "bg-gradient-to-r from-yellow-50 to-green-50" : "bg-gray-50"
                      }`}
                      onClick={() => setExpandedUser(isExpanded ? null : entry.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getRankIcon(index + 1, false)}
                          <div>
                            <div className="font-semibold text-sm">{entry.name}</div>
                            <div className="text-xs text-gray-600">
                              {entry.correct_selections}/{entry.total_selections} correctas
                            </div>
                            <div className="text-xs font-medium text-blue-600">
                              {userPoints} puntos • J{lastWeekAlive}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className="text-lg font-bold">#{index + 1}</div>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Detalles expandibles */}
                    {isExpanded && (
                      <div className="p-4 bg-white border-t">
                        <div className="grid grid-cols-6 gap-2">
                          {weeks.map((week) => {
                            const selection = getSelectionForWeek(entry.selections, week)
                            return (
                              <div
                                key={week}
                                className={`aspect-square rounded border-2 flex flex-col items-center justify-center relative ${getSelectionStyle(selection, entry.is_eliminated)}`}
                              >
                                <div className="text-xs font-medium mb-1">J{week}</div>
                                {selection ? (
                                  <>
                                    <img
                                      src={selection.team_logo || "/placeholder.svg?height=20&width=20&query=team+logo"}
                                      alt={selection.team_short_name}
                                      className="w-4 h-4 object-contain"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        target.src = "/placeholder.svg?height=20&width=20"
                                      }}
                                    />
                                    {/* Indicador de puntos */}
                                    {selection.result === "win" && (
                                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                        3
                                      </div>
                                    )}
                                    {selection.result === "draw" && (
                                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                        1
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-gray-400 text-xs">-</span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* Eliminados */}
        {eliminated.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-red-600">
                💀 Eliminados ({eliminated.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {eliminated.map((entry, index) => {
                const userPoints = calculatePoints(entry.selections)
                const lastWeekAlive = getLastWeekAlive(entry.selections, entry.is_eliminated)
                const isExpanded = expandedUser === entry.id

                return (
                  <div key={entry.id} className="border rounded-lg overflow-hidden bg-red-50 border-red-200 opacity-75">
                    {/* Header del usuario */}
                    <div className="p-4 cursor-pointer" onClick={() => setExpandedUser(isExpanded ? null : entry.id)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getRankIcon(index + 1, true)}
                          <div>
                            <div className="font-semibold text-sm text-gray-700">{entry.name}</div>
                            <div className="text-xs text-red-600">Eliminado J{lastWeekAlive}</div>
                            <div className="text-xs font-medium text-gray-600">{userPoints} puntos totales</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-600">#{survivors.length + index + 1}</div>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Detalles expandibles */}
                    {isExpanded && (
                      <div className="p-4 bg-white border-t">
                        <div className="grid grid-cols-6 gap-2">
                          {weeks.map((week) => {
                            const selection = getSelectionForWeek(entry.selections, week)
                            return (
                              <div
                                key={week}
                                className={`aspect-square rounded border-2 flex flex-col items-center justify-center relative ${getSelectionStyle(selection, entry.is_eliminated)}`}
                              >
                                <div className="text-xs font-medium mb-1">J{week}</div>
                                {selection ? (
                                  <>
                                    <img
                                      src={selection.team_logo || "/placeholder.svg?height=20&width=20&query=team+logo"}
                                      alt={selection.team_short_name}
                                      className="w-4 h-4 object-contain"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        target.src = "/placeholder.svg?height=20&width=20"
                                      }}
                                    />
                                    {/* Indicadores */}
                                    {selection.result === "win" && (
                                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                        3
                                      </div>
                                    )}
                                    {selection.result === "draw" && (
                                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                        1
                                      </div>
                                    )}
                                    {selection.result === "loss" && (
                                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                        💀
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-gray-400 text-xs">-</span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}

        {/* Leyenda móvil */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Leyenda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-green-100 border-2 border-green-300 rounded relative">
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                </div>
                <span>Victoria (3 pts)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-blue-100 border-2 border-blue-300 rounded relative">
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                </div>
                <span>Empate (1 pt)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-red-100 border-2 border-red-300 rounded"></div>
                <span>Derrota (0 pts)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-yellow-100 border-2 border-yellow-300 rounded"></div>
                <span>Pendiente</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Vista desktop (código original con mejoras)
  return (
    <div className="space-y-6">
      {/* Header con refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-green-600" />
          <span className="font-semibold">Clasificación Detallada</span>
          {refreshing && <Loader2 className="h-4 w-4 animate-spin" />}
        </div>
        <Button variant="outline" size="sm" onClick={handleManualRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {/* Timestamp de última actualización */}
      {lastUpdate && (
        <div className="text-xs text-gray-500 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Última actualización: {formatDateTime(lastUpdate)} (CDMX)
        </div>
      )}

      {/* Supervivientes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-green-600" />
            Supervivientes ({survivors.length})
          </CardTitle>
          <CardDescription>
            Jugadores activos ordenados por: 1) Última jornada viva, 2) Puntos totales, 3) Selecciones correctas
            (Horario de Ciudad de México)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {survivors.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No hay supervivientes registrados</div>
          ) : (
            <div className="space-y-4">
              {/* Header con números de jornada */}
              <div className="grid grid-cols-[250px_repeat(18,40px)] gap-1 items-center text-xs font-medium text-gray-600 border-b pb-2">
                <div>Usuario</div>
                {weeks.map((week) => (
                  <div key={week} className="text-center">
                    J{week}
                  </div>
                ))}
              </div>

              {/* Filas de supervivientes */}
              {survivors.map((entry, index) => {
                const userPoints = calculatePoints(entry.selections)
                const lastWeekAlive = getLastWeekAlive(entry.selections, entry.is_eliminated)

                return (
                  <div
                    key={entry.id}
                    className={`grid grid-cols-[250px_repeat(18,40px)] gap-1 items-center p-3 rounded-lg border ${
                      index < 3 ? "bg-gradient-to-r from-yellow-50 to-green-50 border-yellow-200" : "bg-gray-50"
                    }`}
                  >
                    {/* Información del usuario */}
                    <div className="flex items-center gap-2">
                      {getRankIcon(index + 1, false)}
                      <div className="min-w-0">
                        <div className="font-semibold text-sm truncate">{entry.name}</div>
                        <div className="text-xs text-gray-600">
                          {entry.correct_selections}/{entry.total_selections} correctas
                        </div>
                        <div className="text-xs font-medium text-blue-600">
                          {userPoints} puntos • J{lastWeekAlive}
                        </div>
                      </div>
                    </div>

                    {/* Selecciones por semana */}
                    {weeks.map((week) => {
                      const selection = getSelectionForWeek(entry.selections, week)
                      return (
                        <div
                          key={week}
                          className={`w-8 h-8 rounded border-2 flex items-center justify-center relative group ${getSelectionStyle(selection, entry.is_eliminated)}`}
                          title={
                            selection
                              ? `J${week}: ${selection.team_name} - ${
                                  selection.result === "pending"
                                    ? "Pendiente"
                                    : selection.result === "win"
                                      ? "Victoria (3 pts)"
                                      : selection.result === "draw"
                                        ? "Empate (1 pt)"
                                        : "Derrota (0 pts)"
                                }`
                              : `Jornada ${week}: Sin selección`
                          }
                        >
                          {selection ? (
                            <>
                              <img
                                src={selection.team_logo || "/placeholder.svg?height=24&width=24&query=team+logo"}
                                alt={selection.team_short_name}
                                className="w-6 h-6 object-contain"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.src = "/placeholder.svg?height=24&width=24"
                                }}
                              />
                              {/* Indicador de puntos */}
                              {selection.result === "win" && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                  3
                                </div>
                              )}
                              {selection.result === "draw" && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                  1
                                </div>
                              )}
                            </>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}

                          {/* Tooltip con información detallada */}
                          {selection && (
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                              <div>{selection.team_name}</div>
                              <div>{formatDateTime(selection.created_at)} CDMX</div>
                              {selection.updated_at !== selection.created_at && (
                                <div className="text-blue-300">Mod: {formatDateTime(selection.updated_at)}</div>
                              )}
                              <div className="text-center">
                                {selection.result === "pending"
                                  ? "Pendiente"
                                  : selection.result === "win"
                                    ? "✓ Victoria (3 pts)"
                                    : selection.result === "draw"
                                      ? "= Empate (1 pt)"
                                      : "✗ Derrota (0 pts)"}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Eliminados - Vista desktop similar */}
      {eliminated.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">💀 Eliminados ({eliminated.length})</CardTitle>
            <CardDescription>
              Jugadores eliminados ordenados por última jornada sobrevivida y puntos obtenidos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Header con números de jornada */}
              <div className="grid grid-cols-[250px_repeat(18,40px)] gap-1 items-center text-xs font-medium text-gray-600 border-b pb-2">
                <div>Usuario</div>
                {weeks.map((week) => (
                  <div key={week} className="text-center">
                    J{week}
                  </div>
                ))}
              </div>

              {/* Filas de eliminados */}
              {eliminated.map((entry, index) => {
                const userPoints = calculatePoints(entry.selections)
                const lastWeekAlive = getLastWeekAlive(entry.selections, entry.is_eliminated)

                return (
                  <div
                    key={entry.id}
                    className="grid grid-cols-[250px_repeat(18,40px)] gap-1 items-center p-3 rounded-lg border bg-red-50 border-red-200 opacity-75"
                  >
                    {/* Información del usuario */}
                    <div className="flex items-center gap-2">
                      {getRankIcon(index + 1, true)}
                      <div className="min-w-0">
                        <div className="font-semibold text-sm truncate text-gray-700">{entry.name}</div>
                        <div className="text-xs text-red-600">Eliminado J{lastWeekAlive}</div>
                        <div className="text-xs font-medium text-gray-600">{userPoints} puntos totales</div>
                      </div>
                    </div>

                    {/* Selecciones por semana */}
                    {weeks.map((week) => {
                      const selection = getSelectionForWeek(entry.selections, week)
                      return (
                        <div
                          key={week}
                          className={`w-8 h-8 rounded border-2 flex items-center justify-center relative group ${getSelectionStyle(selection, entry.is_eliminated)}`}
                          title={
                            selection
                              ? `J${week}: ${selection.team_name} - ${
                                  selection.result === "pending"
                                    ? "Pendiente"
                                    : selection.result === "win"
                                      ? "Victoria (3 pts)"
                                      : selection.result === "draw"
                                        ? "Empate (1 pt)"
                                        : "ELIMINADO (0 pts)"
                                }`
                              : `Jornada ${week}: Sin selección`
                          }
                        >
                          {selection ? (
                            <>
                              <img
                                src={selection.team_logo || "/placeholder.svg?height=24&width=24&query=team+logo"}
                                alt={selection.team_short_name}
                                className="w-6 h-6 object-contain"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.src = "/placeholder.svg?height=24&width=24"
                                }}
                              />
                              {/* Indicador de puntos */}
                              {selection.result === "win" && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                  3
                                </div>
                              )}
                              {selection.result === "draw" && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                  1
                                </div>
                              )}
                              {selection.result === "loss" && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                  💀
                                </div>
                              )}
                            </>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}

                          {/* Tooltip con información detallada */}
                          {selection && (
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                              <div>{selection.team_name}</div>
                              <div>{formatDateTime(selection.created_at)} CDMX</div>
                              {selection.updated_at !== selection.created_at && (
                                <div className="text-blue-300">Mod: {formatDateTime(selection.updated_at)}</div>
                              )}
                              <div className="text-center">
                                {selection.result === "pending"
                                  ? "Pendiente"
                                  : selection.result === "win"
                                    ? "✓ Victoria (3 pts)"
                                    : selection.result === "draw"
                                      ? "= Empate (1 pt)"
                                      : "💀 ELIMINADO"}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leyenda actualizada */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Leyenda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-100 border-2 border-green-300 ring-1 ring-green-400 rounded relative">
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                </div>
                <span>Victoria (3 puntos)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-100 border-2 border-blue-300 ring-1 ring-blue-400 rounded relative">
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                </div>
                <span>Empate (1 punto)</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-red-100 border-2 border-red-300 rounded"></div>
                <span>Derrota (0 puntos)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-red-100 border-2 border-red-300 ring-2 ring-red-400 rounded relative">
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    💀
                  </div>
                </div>
                <span>Eliminación</span>
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">📊 Sistema de Puntuación y Desempate:</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>
                <strong>1er criterio:</strong> Quien llegue más lejos (última jornada viva)
              </li>
              <li>
                <strong>2do criterio:</strong> Mayor cantidad de puntos totales
              </li>
              <li>
                <strong>3er criterio:</strong> Mayor cantidad de selecciones correctas
              </li>
              <li>
                <strong>Puntuación:</strong> Victoria = 3 pts, Empate = 1 pt, Derrota = 0 pts
              </li>
              <li>
                <strong>Actualización:</strong> Los datos se actualizan automáticamente cada 30 segundos
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
