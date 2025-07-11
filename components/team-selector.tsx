"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, Trophy, AlertTriangle, RefreshCw, Search } from "lucide-react"
import { Input } from "@/components/ui/input"

interface Team {
  id: number
  name: string
  short_name: string
  logo_url: string
  city: string
}

interface Matchweek {
  id: number
  week_number: number
  start_date: string
  end_date: string
  is_active: boolean
}

interface CurrentSelection {
  team_id: number
  team_name: string
  short_name: string
  logo_url: string
}

interface TeamSelectorProps {
  token: string
  onSelectionMade: () => void
}

export function TeamSelector({ token, onSelectionMade }: TeamSelectorProps) {
  const [teams, setTeams] = useState<Team[]>([])
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [currentMatchweek, setCurrentMatchweek] = useState<Matchweek | null>(null)
  const [currentSelection, setCurrentSelection] = useState<CurrentSelection | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [debugInfo, setDebugInfo] = useState<any>(null)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    // Filtrar equipos basado en el término de búsqueda
    const filtered = teams.filter(
      (team) =>
        team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.short_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.city.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredTeams(filtered)
  }, [teams, searchTerm])

  const loadData = async () => {
    try {
      console.log("🔄 Cargando datos del selector de equipos...")

      // Cargar jornada actual
      const matchweekResponse = await fetch("/api/matchweeks/current")
      if (matchweekResponse.ok) {
        const matchweek = await matchweekResponse.json()
        setCurrentMatchweek(matchweek)
        console.log("📅 Jornada actual cargada:", matchweek)
      }

      // Cargar equipos disponibles
      const teamsResponse = await fetch("/api/teams/available", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log("🏟️ Respuesta de equipos disponibles:", teamsResponse.status)

      if (teamsResponse.ok) {
        const availableTeams = await teamsResponse.json()
        console.log("✅ Equipos disponibles recibidos:", availableTeams.length)
        setTeams(availableTeams)

        // Debug info
        setDebugInfo({
          totalTeams: availableTeams.length,
          teamNames: availableTeams.map((t: Team) => t.name).slice(0, 5),
        })
      } else {
        const errorData = await teamsResponse.json()
        console.error("❌ Error en respuesta de equipos:", errorData)
        throw new Error(errorData.error || "Error cargando equipos")
      }

      // Cargar selección actual si existe
      const selectionsResponse = await fetch("/api/selections", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (selectionsResponse.ok) {
        const selections = await selectionsResponse.json()
        const currentWeekSelection = selections.find((s: any) => s.matchweek_active === true)
        if (currentWeekSelection) {
          setCurrentSelection({
            team_id: currentWeekSelection.team_id,
            team_name: currentWeekSelection.team_name,
            short_name: currentWeekSelection.short_name,
            logo_url: currentWeekSelection.logo_url,
          })
          setSelectedTeam(currentWeekSelection.team_id)
          console.log("🎯 Selección actual encontrada:", currentWeekSelection.team_name)
        }
      }
    } catch (err: any) {
      console.error("❌ Error cargando datos:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedTeam || !currentMatchweek) return

    setSubmitting(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/selections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          teamId: selectedTeam,
          matchweekId: currentMatchweek.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error)
      }

      setSuccess(data.message || "Selección guardada correctamente")
      onSelectionMade()
      loadData() // Recargar datos para mostrar la nueva selección
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
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

  if (!currentMatchweek) {
    return (
      <Card>
        <CardContent className="p-6 md:p-8 text-center">
          <AlertTriangle className="h-8 w-8 md:h-12 md:w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay jornada activa</h3>
          <p className="text-gray-600 text-sm md:text-base">Espera a que el administrador active la próxima jornada.</p>
        </CardContent>
      </Card>
    )
  }

  if (!currentMatchweek.is_active) {
    return (
      <Card>
        <CardContent className="p-6 md:p-8 text-center">
          <AlertTriangle className="h-8 w-8 md:h-12 md:w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Jornada {currentMatchweek.week_number} cerrada</h3>
          <p className="text-gray-600 text-sm md:text-base mb-4">
            La jornada ya no está activa. No se pueden hacer cambios en las selecciones.
          </p>
          {currentSelection && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Tu selección para esta jornada:</p>
              <div className="flex items-center justify-center gap-3">
                <img
                  src={currentSelection.logo_url || "/placeholder.svg?height=40&width=40&query=team+logo"}
                  alt={currentSelection.team_name}
                  className="w-8 h-8 object-contain"
                />
                <span className="font-semibold text-sm md:text-base">{currentSelection.team_name}</span>
                <Badge variant="secondary" className="text-xs">
                  {currentSelection.short_name}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
          <Trophy className="h-5 w-5 text-green-600" />
          Selecciona tu equipo - Jornada {currentMatchweek.week_number}
          {currentSelection && (
            <Badge variant="outline" className="ml-2 text-xs">
              <RefreshCw className="h-3 w-3 mr-1" />
              Cambiar
            </Badge>
          )}
        </CardTitle>
        <CardDescription className="text-sm">
          {currentSelection ? (
            <>
              Puedes cambiar tu selección mientras la jornada esté activa.
              <br />
              <strong className="text-blue-600">Selección actual: {currentSelection.team_name}</strong>
            </>
          ) : (
            <>
              Elige el equipo que crees que ganará o empatará esta jornada.
              <br />
              <strong className="text-red-600">No podrás usar este equipo nuevamente.</strong>
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 md:space-y-6">
        {/* Debug Info - Solo visible en desarrollo */}
         {teams.length === 0 ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Ya has usado todos los equipos disponibles o has sido eliminado.
              <br />
              <strong>Debug:</strong> Equipos cargados: {teams.length}
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {/* Buscador para móviles */}
            {teams.length > 6 && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar equipo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {filteredTeams.map((team) => (
                <Card
                  key={team.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedTeam === team.id ? "ring-2 ring-green-500 bg-green-50" : "hover:bg-gray-50"
                  } ${currentSelection?.team_id === team.id ? "ring-2 ring-blue-500 bg-blue-50" : ""}`}
                  onClick={() => setSelectedTeam(team.id)}
                >
                  <CardContent className="p-3 md:p-4 text-center">
                    <img
                      src={team.logo_url || "/placeholder.svg?height=60&width=60&query=team+logo"}
                      alt={team.name}
                      className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = "/placeholder.svg?height=60&width=60"
                      }}
                    />
                    <h3 className="font-semibold text-xs md:text-sm leading-tight">{team.name}</h3>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {team.short_name}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1 hidden md:block">{team.city}</p>
                    {currentSelection?.team_id === team.id && (
                      <Badge variant="outline" className="mt-2 text-xs">
                        Actual
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredTeams.length === 0 && searchTerm && (
              <div className="text-center py-6 text-gray-500">
                <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No se encontraron equipos con "{searchTerm}"</p>
                <Button variant="outline" size="sm" onClick={() => setSearchTerm("")} className="mt-2">
                  Limpiar búsqueda
                </Button>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-800 text-sm">{success}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-center pt-2">
              <Button
                onClick={handleSubmit}
                disabled={!selectedTeam || submitting}
                size="lg"
                className="w-full md:w-auto px-8"
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {currentSelection ? "Cambiar Selección" : "Confirmar Selección"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}