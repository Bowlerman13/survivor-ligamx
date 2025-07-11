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

    const selections = await sql`
      SELECT 
        u.name as user_name,
        u.email,
        u.is_eliminated,
        t.name as team_name,
        t.short_name,
        t.logo_url,
        us.result,
        us.is_correct,
        us.created_at,
        us.updated_at,
        mw.week_number,
        m.home_score,
        m.away_score,
        m.status as match_status,
        ht.name as home_team_name,
        at.name as away_team_name
      FROM user_selections us
      JOIN users u ON us.user_id = u.id
      JOIN teams t ON us.team_id = t.id
      JOIN matchweeks mw ON us.matchweek_id = mw.id
      JOIN matches m ON us.match_id = m.id
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      WHERE mw.week_number = ${weekNumber}
      ORDER BY u.name ASC
    `

    return NextResponse.json(selections)
  } catch (error) {
    console.error("Error obteniendo selecciones semanales:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
