"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Trophy, Crown, Medal, Award } from "lucide-react"

interface LeaderboardEntry {
  id: string
  name: string
  email: string
  is_eliminated: boolean
  total_selections: number
  correct_selections: number
  losses: number
  last_week_survived: number
}

export function SimpleLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    loadLeaderboard()
  }, [])

  const loadLeaderboard = async () => {
    try {
      const response = await fetch("/api/leaderboard")

      if (response.ok) {
        const data = await response.json()
        setLeaderboard(data)
      } else {
        throw new Error("Error cargando clasificación")
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />
      default:
        return <Trophy className="h-5 w-5 text-gray-300" />
    }
  }

  const getRankBadge = (position: number) => {
    if (position <= 3) {
      const colors = ["bg-yellow-500", "bg-gray-400", "bg-amber-600"]
      return <Badge className={colors[position - 1]}>#{position}</Badge>
    }
    return <Badge variant="secondary">#{position}</Badge>
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

  const survivors = leaderboard.filter((entry) => !entry.is_eliminated)
  const eliminated = leaderboard.filter((entry) => entry.is_eliminated)

  return (
    <div className="space-y-6">
      {/* Supervivientes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-green-600" />
            Supervivientes ({survivors.length})
          </CardTitle>
          <CardDescription>Jugadores que siguen en la competencia</CardDescription>
        </CardHeader>
        <CardContent>
          {survivors.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No hay supervivientes registrados</div>
          ) : (
            <div className="space-y-3">
              {survivors.map((entry, index) => (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    index < 3 ? "bg-gradient-to-r from-yellow-50 to-green-50 border-yellow-200" : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {getRankIcon(index + 1)}
                    <div>
                      <div className="font-semibold">{entry.name}</div>
                      <div className="text-sm text-gray-600">{entry.correct_selections} selecciones correctas</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right text-sm">
                      <div className="font-medium">Semana {entry.last_week_survived || 0}</div>
                      <div className="text-gray-500">{entry.total_selections} selecciones</div>
                    </div>
                    {getRankBadge(index + 1)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Eliminados */}
      {eliminated.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">💀 Eliminados ({eliminated.length})</CardTitle>
            <CardDescription>Jugadores que han sido eliminados de la competencia</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {eliminated.map((entry, index) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-red-50 border-red-200 opacity-75"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-5 h-5 flex items-center justify-center">
                      <span className="text-red-500">💀</span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-700">{entry.name}</div>
                      <div className="text-sm text-gray-600">Eliminado en semana {entry.last_week_survived || 1}</div>
                    </div>
                  </div>

                  <div className="text-right text-sm">
                    <div className="font-medium text-gray-700">
                      {entry.correct_selections}/{entry.total_selections}
                    </div>
                    <div className="text-gray-500">selecciones</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
