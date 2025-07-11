import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    const userId = decoded.userId

    // Debug: Log del usuario
    console.log("🔍 Obteniendo equipos para usuario:", userId)

    // Obtener la jornada activa actual
    const currentMatchweek = await sql`
      SELECT id, week_number FROM matchweeks 
      WHERE is_active = true 
      ORDER BY week_number ASC 
      LIMIT 1
    `

    if (currentMatchweek.length === 0) {
      return NextResponse.json({ error: "No hay jornada activa" }, { status: 404 })
    }

    const currentMatchweekId = currentMatchweek[0].id
    const currentWeekNumber = currentMatchweek[0].week_number

    console.log("📅 Jornada activa:", currentWeekNumber, "ID:", currentMatchweekId)

    // Obtener equipos ya usados por el usuario en jornadas COMPLETADAS (no activas)
    const usedTeams = await sql`
      SELECT uth.team_id, uth.matchweek_id, mw.week_number, t.name as team_name
      FROM user_team_history uth
      JOIN matchweeks mw ON uth.matchweek_id = mw.id
      JOIN teams t ON uth.team_id = t.id
      WHERE uth.user_id = ${userId} 
      AND mw.is_active = false
      ORDER BY mw.week_number
    `

    console.log("🚫 Equipos ya usados en jornadas completadas:", usedTeams)

    // Obtener equipos que tienen partidos INACTIVOS en la jornada actual
    const inactiveTeams = await sql`
      SELECT DISTINCT t.id, t.name
      FROM teams t
      JOIN matches m ON (t.id = m.home_team_id OR t.id = m.away_team_id)
      WHERE m.matchweek_id = ${currentMatchweekId}
      AND m.is_active = false
    `

    console.log("⏸️ Equipos con partidos inactivos esta jornada:", inactiveTeams)

    const usedTeamIds = usedTeams.map((t) => t.team_id)
    const inactiveTeamIds = inactiveTeams.map((t) => t.id)

    // Obtener TODOS los equipos
    const allTeams = await sql`
      SELECT * FROM teams 
      ORDER BY name ASC
    `

    console.log("🏟️ Total de equipos en la base de datos:", allTeams.length)

    // Filtrar equipos disponibles (excluir usados en jornadas completadas Y equipos con partidos inactivos)
    const availableTeams = allTeams.filter(
      (team) => !usedTeamIds.includes(team.id) && !inactiveTeamIds.includes(team.id),
    )

    console.log("✅ Equipos disponibles:", availableTeams.length)
    console.log(
      "📋 Lista de equipos disponibles:",
      availableTeams.map((t) => t.name),
    )

    return NextResponse.json(availableTeams)
  } catch (error) {
    console.error("❌ Error obteniendo equipos disponibles:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
