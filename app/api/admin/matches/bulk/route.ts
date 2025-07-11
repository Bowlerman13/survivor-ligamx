import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyToken } from "@/lib/auth"
import { getCurrentMexicoTime } from "@/lib/utils"

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "superadmin") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    const { matchweekId, matches } = await request.json()
    const mexicoTime = getCurrentMexicoTime()

    // Verificar que la jornada existe
    const matchweek = await sql`
      SELECT id FROM matchweeks WHERE id = ${matchweekId}
    `

    if (matchweek.length === 0) {
      return NextResponse.json({ error: "Jornada no encontrada" }, { status: 404 })
    }

    // Eliminar partidos existentes de esta jornada
    await sql`
      DELETE FROM matches WHERE matchweek_id = ${matchweekId}
    `

    // Insertar nuevos partidos
    for (const match of matches) {
      await sql`
        INSERT INTO matches (matchweek_id, home_team_id, away_team_id, match_date, status, is_active, created_at, updated_at)
        VALUES (
          ${matchweekId}, 
          ${match.homeTeamId}, 
          ${match.awayTeamId}, 
          ${match.matchDate}::timestamp, 
          'scheduled',
          true,
          ${mexicoTime}::timestamp,
          ${mexicoTime}::timestamp
        )
      `
    }

    return NextResponse.json({
      success: true,
      message: `${matches.length} partidos creados para la jornada`,
    })
  } catch (error) {
    console.error("Error creando partidos:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
