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
    if (!decoded || decoded.role !== "superadmin") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const weekNumber = searchParams.get("week") || "1"

    const matches = await sql`
      SELECT 
        m.*,
        mw.week_number,
        ht.name as home_team_name,
        ht.short_name as home_short_name,
        ht.logo_url as home_logo,
        ht.stadium as home_stadium,
        at.name as away_team_name,
        at.short_name as away_short_name,
        at.logo_url as away_logo,
        at.stadium as away_stadium
      FROM matches m
      JOIN matchweeks mw ON m.matchweek_id = mw.id
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      WHERE mw.week_number = ${weekNumber}
      ORDER BY m.match_date ASC
    `

    return NextResponse.json(matches)
  } catch (error) {
    console.error("Error obteniendo partidos por semana:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "superadmin") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const weekNumber = searchParams.get("week")

    if (!weekNumber) {
      return NextResponse.json({ error: "Número de semana requerido" }, { status: 400 })
    }

    // Obtener el ID de la jornada
    const matchweek = await sql`
      SELECT id FROM matchweeks WHERE week_number = ${weekNumber}
    `

    if (matchweek.length === 0) {
      return NextResponse.json({ error: "Jornada no encontrada" }, { status: 404 })
    }

    // Eliminar todos los partidos de esta jornada
    await sql`
      DELETE FROM matches WHERE matchweek_id = ${matchweek[0].id}
    `

    return NextResponse.json({
      success: true,
      message: `Partidos de la jornada ${weekNumber} eliminados`,
    })
  } catch (error) {
    console.error("Error eliminando partidos:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
