"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Calendar, Play, Pause, Clock } from "lucide-react"

interface Matchweek {
  id: number
  week_number: number
  start_date: string
  end_date: string
  is_active: boolean
  season: string
}

interface MatchweekManagerProps {
  token: string
}

export function MatchweekManager({ token }: MatchweekManagerProps) {
  const [matchweeks, setMatchweeks] = useState<Matchweek[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<number | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    loadMatchweeks()
  }, [])

  const loadMatchweeks = async () => {
    try {
      const response = await fetch("/api/admin/matchweeks", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setMatchweeks(data)
      } else {
        throw new Error("Error cargando jornadas")
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleMatchweekStatus = async (matchweekId: number, currentStatus: boolean) => {
    setUpdating(matchweekId)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/admin/matchweeks", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          matchweekId,
          isActive: !currentStatus,
        }),
      })

      if (response.ok) {
        setSuccess(`Jornada ${!currentStatus ? "activada" : "desactivada"} correctamente`)
        loadMatchweeks()
      } else {
        throw new Error("Error actualizando jornada")
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUpdating(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return (
        <Badge className="bg-green-500">
          <Play className="h-3 w-3 mr-1" />
          Activa
        </Badge>
      )
    }
    return (
      <Badge variant="secondary">
        <Pause className="h-3 w-3 mr-1" />
        Inactiva
      </Badge>
    )
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          Gestión de Jornadas
        </CardTitle>
        <CardDescription>
          Activa o desactiva las jornadas para permitir o bloquear las selecciones de los usuarios
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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

        <div className="grid gap-4">
          {matchweeks.map((matchweek) => (
            <div
              key={matchweek.id}
              className={`flex items-center justify-between p-4 border rounded-lg ${
                matchweek.is_active ? "bg-green-50 border-green-200" : "bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-700">J{matchweek.week_number}</div>
                  <div className="text-xs text-gray-500">Jornada</div>
                </div>

                <div>
                  <div className="font-semibold">Jornada {matchweek.week_number}</div>
                  <div className="text-sm text-gray-600 flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    {formatDate(matchweek.start_date)} - {formatDate(matchweek.end_date)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Temporada {matchweek.season}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {getStatusBadge(matchweek.is_active)}

                <Button
                  onClick={() => toggleMatchweekStatus(matchweek.id, matchweek.is_active)}
                  disabled={updating === matchweek.id}
                  variant={matchweek.is_active ? "destructive" : "default"}
                  size="sm"
                >
                  {updating === matchweek.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {matchweek.is_active ? (
                    <>
                      <Pause className="mr-2 h-4 w-4" />
                      Desactivar
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Activar
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">ℹ️ Información importante:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Solo puede haber una jornada activa a la vez</li>
            <li>• Los usuarios solo pueden hacer/cambiar selecciones en jornadas activas</li>
            <li>• Al activar una jornada, todas las demás se desactivan automáticamente</li>
            <li>• Desactiva la jornada antes de registrar resultados para evitar cambios</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}