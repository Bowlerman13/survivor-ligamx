"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Trophy, Target, TrendingUp, Clock } from "lucide-react"
import { formatDateTime } from "@/lib/utils"

interface Selection {
  id: string
  team_name: string
  short_name: string
  logo_url: string
  week_number: number
  result: string
  is_correct: boolean
  home_team_name: string
  away_team_name: string
  home_score: number | null
  away_score: number | null
  match_status: string
  created_at: string
  updated_at: string
}

interface UserSelectionsProps {
  token: string
}

export function UserSelections({ token }: UserSelectionsProps) {
  const [selections, setSelections] = useState<Selection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    loadSelections()
  }, [])

  const loadSelections = async () => {
    try {
      const response = await fetch("/api/selections", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setSelections(data)
      } else {
        throw new Error("Error cargando selecciones")
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getResultBadge = (result: string, isCorrect: boolean | null) => {
    if (result === "pending") {
      return <Badge variant="secondary">Pendiente</Badge>
    }

    if (isCorrect === true) {
      return <Badge className="bg-green-500">✓ Correcto</Badge>
    } else if (isCorrect === false) {
      return <Badge variant="destructive">✗ Incorrecto</Badge>
    }

    return <Badge variant="secondary">-</Badge>
  }

  const getScoreDisplay = (homeScore: number | null, awayScore: number | null, homeTeam: string, awayTeam: string) => {
    if (homeScore === null || awayScore === null) {
      return `${homeTeam} vs ${awayTeam}`
    }
    return `${homeTeam} ${homeScore} - ${awayScore} ${awayTeam}`
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

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  const correctSelections = selections.filter((s) => s.is_correct === true).length
  const totalSelections = selections.filter((s) => s.result !== "pending").length

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">{correctSelections}</div>
            <div className="text-sm text-gray-600">Selecciones Correctas</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{selections.length}</div>
            <div className="text-sm text-gray-600">Total Selecciones</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">
              {totalSelections > 0 ? Math.round((correctSelections / totalSelections) * 100) : 0}%
            </div>
            <div className="text-sm text-gray-600">Efectividad</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de selecciones */}
      <Card>
        <CardHeader>
          <CardTitle>Mis Selecciones</CardTitle>
          <CardDescription>
            Historial de todos tus equipos seleccionados por jornada (Horario de Ciudad de México)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selections.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No tienes selecciones aún. ¡Haz tu primera selección!</div>
          ) : (
            <div className="space-y-4">
              {selections.map((selection) => (
                <div
                  key={selection.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={selection.logo_url || "/placeholder.svg?height=40&width=40&query=team+logo"}
                      alt={selection.team_name}
                      className="w-10 h-10 object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = "/placeholder.svg?height=40&width=40"
                      }}
                    />
                    <div>
                      <div className="font-semibold">{selection.team_name}</div>
                      <div className="text-sm text-gray-600">Jornada {selection.week_number}</div>
                      <div className="text-xs text-gray-500">
                        {getScoreDisplay(
                          selection.home_score,
                          selection.away_score,
                          selection.home_team_name,
                          selection.away_team_name,
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Registrado: {formatDateTime(selection.created_at)} (CDMX)
                      </div>
                      {selection.updated_at !== selection.created_at && (
                        <div className="text-xs text-blue-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Modificado: {formatDateTime(selection.updated_at)} (CDMX)
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right">{getResultBadge(selection.result, selection.is_correct)}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
