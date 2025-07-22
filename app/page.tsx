"use client"

import { useState, useEffect } from "react"
import { AuthForm } from "../components/auth-form"
import { TeamSelector } from "../components/team-selector"
import { UserSelections } from "../components/user-selections"
import { WeeklyMatches } from "../components/weekly-matches"
import { Leaderboard } from "../components/leaderboard"
import { AdminPanel } from "../components/admin-panel"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { LogOut, Trophy, Target, BarChart3, Crown, Lock, Calendar } from "lucide-react"

interface User {
  id: string
  email: string
  name: string
  role: string
  isEliminated?: boolean
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [showLogin, setShowLogin] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Verificar si hay token guardado
    const savedToken = localStorage.getItem("survivormx_token")
    const savedUser = localStorage.getItem("survivormx_user")

    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }

    // Detectar si es móvil
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const handleAuthSuccess = (userData: User, userToken: string) => {
    setUser(userData)
    setToken(userToken)
    localStorage.setItem("survivormx_token", userToken)
    localStorage.setItem("survivormx_user", JSON.stringify(userData))
  }

  const handleLogout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem("survivormx_token")
    localStorage.removeItem("survivormx_user")
  }

  const handleSelectionMade = () => {
    setRefreshKey((prev) => prev + 1)
  }

  if (!user || !token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-green-600 mb-2">🏆 SurvivorMx</h1>
            <p className="text-gray-600 text-sm md:text-base">Liga MX Survivor 2025-2026</p>
          </div>

          <div className="flex justify-center space-x-4 mb-6">
            <Button
              variant={showLogin ? "default" : "outline"}
              onClick={() => setShowLogin(true)}
              size={isMobile ? "sm" : "default"}
            >
              Iniciar Sesión
            </Button>
            <Button
              variant={!showLogin ? "default" : "outline"}
              onClick={() => setShowLogin(false)}
              size={isMobile ? "sm" : "default"}
            >
              Registrarse
            </Button>
          </div>

          <AuthForm mode={showLogin ? "login" : "register"} onSuccess={handleAuthSuccess} />

          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-center text-base md:text-lg">¿Cómo funciona?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs md:text-sm">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 md:w-6 md:h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-xs">
                  1
                </div>
                <div>Cada jornada selecciona un equipo que crees que ganará o empatará</div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 md:w-6 md:h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-xs">
                  2
                </div>
                <div>No puedes repetir el mismo equipo durante toda la temporada</div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 md:w-6 md:h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-xs">
                  3
                </div>
                <div>Si tu equipo pierde, quedas eliminado de la competencia</div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 md:w-6 md:h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-xs">
                  4
                </div>
                <div>El objetivo es ser el último superviviente</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header Responsive */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 md:h-16">
            <div className="flex items-center gap-2 md:gap-3">
              <h1 className="text-xl md:text-2xl font-bold text-green-600">🏆 SurvivorMx</h1>
              <Badge variant="secondary" className="text-xs hidden md:block">
                Liga MX 2025-2026
              </Badge>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              <div className="text-right">
                <div className="font-semibold flex items-center gap-1 md:gap-2 text-sm md:text-base">
                  <span className="truncate max-w-24 md:max-w-none">{user.name}</span>
                  {user.role === "superadmin" && (
                    <Crown className="h-3 w-3 md:h-4 md:w-4 text-yellow-500" title="Super Administrador" />
                  )}
                  {user.isEliminated && (
                    <Badge variant="destructive" className="text-xs">
                      Eliminado
                    </Badge>
                  )}
                </div>
                <div className="text-xs md:text-sm text-gray-600 hidden md:block">{user.email}</div>
              </div>
              <Button variant="outline" size={isMobile ? "sm" : "default"} onClick={handleLogout}>
                <LogOut className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden md:inline">Salir</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        {user.role === "superadmin" ? (
          // Panel de Administrador Simplificado
          <AdminPanel token={token} />
        ) : (
          // Panel de Usuario Normal - Responsive
          <Tabs defaultValue="select" className="w-full">
            {isMobile ? (
              // Vista móvil - Tabs compactas
              <TabsList className="grid w-full grid-cols-4 mb-4">
                <TabsTrigger value="select" className="flex items-center gap-1 text-xs">
                  <Target className="h-3 w-3" />
                  Selección
                </TabsTrigger>
                 <TabsTrigger value="weekly-matches" className="flex items-center gap-1 text-xs">
                  <Calendar className="h-3 w-3" />
                  Jornada
                </TabsTrigger>
                <TabsTrigger value="selections" className="flex items-center gap-1 text-xs">
                  <BarChart3 className="h-3 w-3" />
                  Mis Picks
                </TabsTrigger>
                <TabsTrigger value="leaderboard" className="flex items-center gap-1 text-xs">
                  <Trophy className="h-3 w-3" />
                  Ranking
                </TabsTrigger>
              </TabsList>
            ) : (
              // Vista desktop - Tabs normales
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="select" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Hacer Selección
                </TabsTrigger>
                <TabsTrigger value="weekly-matches" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Jornada Semanal
                </TabsTrigger>
                <TabsTrigger value="selections" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Mis Selecciones
                </TabsTrigger>
                <TabsTrigger value="leaderboard" className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Clasificación
                </TabsTrigger>
              </TabsList>
            )}

            <TabsContent value="select" className="mt-4 md:mt-6">
              {user.isEliminated ? (
                <Card>
                  <CardContent className="p-6 md:p-8 text-center">
                    <div className="text-4xl md:text-6xl mb-4">💀</div>
                    <h3 className="text-xl md:text-2xl font-bold text-red-600 mb-2">Has sido eliminado</h3>
                    <p className="text-gray-600 mb-4 text-sm md:text-base">
                      Tu último equipo seleccionado perdió su partido. ¡Mejor suerte la próxima temporada!
                    </p>
                    <p className="text-xs md:text-sm text-gray-500">
                      Puedes seguir viendo la clasificación y el progreso de otros jugadores.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <TeamSelector token={token} onSelectionMade={handleSelectionMade} />
              )}
            </TabsContent>

             <TabsContent value="weekly-matches" className="mt-4 md:mt-6">
              <WeeklyMatches />
            </TabsContent>

            <TabsContent value="selections" className="mt-4 md:mt-6">
              <UserSelections token={token} key={`selections-${refreshKey}`} />
            </TabsContent>
            
            <TabsContent value="leaderboard" className="mt-4 md:mt-6">
              <Leaderboard key={`leaderboard-${refreshKey}`} />
            </TabsContent>
          </Tabs>
        )}
      </main>

      {/* Footer Responsive */}
      <footer className="bg-white border-t mt-8 md:mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
          <div className="text-center text-xs md:text-sm text-gray-600">
            <p>SurvivorMx - Liga MX Survivor 2025-2026</p>
            <p className="mt-1">¡Que gane el mejor estratega! 🏆</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
