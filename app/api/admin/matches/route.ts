import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyToken } from "@/lib/auth"
import { getMatchResult, getCurrentMexicoTime } from "@/lib/utils"

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
      ORDER BY mw.week_number DESC, m.match_date ASC
    `

    // Headers para evitar caché
    const response = NextResponse.json(matches)
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")
    response.headers.set("Surrogate-Control", "no-store")

    return response
  } catch (error) {
    console.error("Error obteniendo partidos:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "superadmin") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    const { matchId, homeScore, awayScore } = await request.json()
    const mexicoTime = getCurrentMexicoTime()

    console.log(`🔄 Actualizando resultado: Match ${matchId} - ${homeScore}:${awayScore} at ${mexicoTime}`)

    // Actualizar resultado del partido con horario de Ciudad de México
    await sql`
      UPDATE matches 
      SET home_score = ${homeScore}, 
          away_score = ${awayScore}, 
          status = 'finished',
          updated_at = ${mexicoTime}::timestamp
      WHERE id = ${matchId}
    `

    // Obtener información del partido
    const matchInfo = await sql`
      SELECT home_team_id, away_team_id FROM matches WHERE id = ${matchId}
    `

    if (matchInfo.length === 0) {
      return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 })
    }

    const { home_team_id, away_team_id } = matchInfo[0]

    // Actualizar selecciones de usuarios para este partido
    const selections = await sql`
      SELECT id, user_id, team_id FROM user_selections 
      WHERE match_id = ${matchId}
    `

    console.log(`📊 Procesando ${selections.length} selecciones para el partido ${matchId}`)

    let eliminatedUsers = 0
    for (const selection of selections) {
      const result = getMatchResult(homeScore, awayScore, selection.team_id, home_team_id)
      const isCorrect = result === "win" || result === "draw"

      await sql`
        UPDATE user_selections 
        SET result = ${result}, 
            is_correct = ${isCorrect},
            updated_at = ${mexicoTime}::timestamp
        WHERE id = ${selection.id}
      `

      // Si perdió, eliminar al usuario
      if (!isCorrect) {
        await sql`
          UPDATE users 
          SET is_eliminated = true,
              updated_at = ${mexicoTime}::timestamp
          WHERE id = ${selection.user_id}
        `
        eliminatedUsers++
      }
    }

    console.log(`✅ Resultado actualizado: ${eliminatedUsers} usuarios eliminados`)

    // Respuesta sin caché
    const response = NextResponse.json({
      success: true,
      message: `Resultado actualizado. ${eliminatedUsers} usuarios eliminados.`,
      timestamp: mexicoTime,
    })

    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")

    return response
  } catch (error) {
    console.error("Error actualizando resultado:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
