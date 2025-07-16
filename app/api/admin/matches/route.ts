import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyToken } from "@/lib/auth"
import { getMatchResult, getCurrentMexicoTime } from "@/lib/utils"
import { revalidatePath, revalidateTag } from "next/cache"

export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"
export const runtime = "nodejs"

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

    console.log("🔄 [ADMIN] Cargando partidos desde base de datos...")

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

    console.log(`✅ [ADMIN] ${matches.length} partidos cargados`)

    // Respuesta con estructura consistente
    const response = NextResponse.json({
      success: true,
      data: matches, // Siempre enviar como 'data'
      count: matches.length,
      timestamp: new Date().toISOString(),
      server_time: getCurrentMexicoTime(),
      cache_buster: Math.random().toString(36).substring(7),
    })

    // Headers anti-caché para Vercel Edge
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0",
    )
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")
    response.headers.set("Surrogate-Control", "no-store")
    response.headers.set("CDN-Cache-Control", "no-store")
    response.headers.set("Vercel-Cache-Control", "no-store")
    response.headers.set("X-Vercel-Cache", "MISS")

    return response
  } catch (error) {
    console.error("❌ [ADMIN] Error obteniendo partidos:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
        data: [], // Siempre incluir data como array vacío en caso de error
        count: 0,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
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

    console.log(`🔄 [ADMIN] Actualizando resultado: Match ${matchId} - ${homeScore}:${awayScore} at ${mexicoTime}`)

    // Actualizar resultado del partido
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

    console.log(`📊 [ADMIN] Procesando ${selections.length} selecciones para el partido ${matchId}`)

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

    console.log(`✅ [ADMIN] Resultado actualizado: ${eliminatedUsers} usuarios eliminados`)

    // Revalidar todas las rutas relacionadas
    try {
      revalidatePath("/api/leaderboard")
      revalidatePath("/api/leaderboard-detailed")
      revalidatePath("/api/selections")
      revalidateTag("leaderboard")
      revalidateTag("matches")
      revalidateTag("selections")
    } catch (revalidateError) {
      console.log("⚠️ [ADMIN] Error en revalidación:", revalidateError)
    }

    // Respuesta sin caché
    const response = NextResponse.json({
      success: true,
      message: `Resultado actualizado. ${eliminatedUsers} usuarios eliminados.`,
      timestamp: new Date().toISOString(),
      server_time: mexicoTime,
      eliminated_users: eliminatedUsers,
      processed_selections: selections.length,
      cache_buster: Math.random().toString(36).substring(7),
    })

    // Headers anti-caché extremos
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0",
    )
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")
    response.headers.set("Surrogate-Control", "no-store")
    response.headers.set("CDN-Cache-Control", "no-store")
    response.headers.set("Vercel-Cache-Control", "no-store")

    return response
  } catch (error) {
    console.error("❌ [ADMIN] Error actualizando resultado:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
