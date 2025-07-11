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
    if (!decoded) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    const { teamId, matchweekId } = await request.json()
    const userId = decoded.userId
    const mexicoTime = getCurrentMexicoTime()

    // Verificar que el usuario no sea admin
    if (decoded.role === "superadmin") {
      return NextResponse.json({ error: "Los administradores no pueden participar en la competencia" }, { status: 403 })
    }

    // Verificar si la jornada está activa (permite cambios)
    const matchweek = await sql`
      SELECT is_active FROM matchweeks WHERE id = ${matchweekId}
    `

    if (matchweek.length === 0) {
      return NextResponse.json({ error: "Jornada no encontrada" }, { status: 404 })
    }

    if (!matchweek[0].is_active) {
      return NextResponse.json({ error: "La jornada no está activa. No se pueden hacer cambios." }, { status: 400 })
    }

    // Verificar si ya usó este equipo anteriormente (EXCLUYENDO la jornada actual)
    const teamUsed = await sql`
      SELECT id FROM user_team_history 
      WHERE user_id = ${userId} 
      AND team_id = ${teamId}
      AND matchweek_id != ${matchweekId}
    `

    if (teamUsed.length > 0) {
      return NextResponse.json({ error: "Ya has usado este equipo en una jornada anterior" }, { status: 400 })
    }

    // Buscar el partido donde juega el equipo en esta jornada
    const matches = await sql`
      SELECT id FROM matches 
      WHERE matchweek_id = ${matchweekId} 
      AND (home_team_id = ${teamId} OR away_team_id = ${teamId})
      AND is_active = true
    `

    if (matches.length === 0) {
      return NextResponse.json(
        { error: "El equipo no juega en esta jornada o su partido está inactivo" },
        { status: 400 },
      )
    }

    const matchId = matches[0].id

    // Verificar si ya tiene selección para esta jornada
    const existingSelection = await sql`
      SELECT id, team_id FROM user_selections 
      WHERE user_id = ${userId} AND matchweek_id = ${matchweekId}
    `

    if (existingSelection.length > 0) {
      // Actualizar selección existente
      const oldTeamId = existingSelection[0].team_id

      // Actualizar la selección con horario de Ciudad de México
      await sql`
        UPDATE user_selections 
        SET team_id = ${teamId}, 
            match_id = ${matchId}, 
            result = 'pending', 
            is_correct = null, 
            updated_at = ${mexicoTime}::timestamp
        WHERE user_id = ${userId} AND matchweek_id = ${matchweekId}
      `

      // Solo eliminar del historial si es diferente al nuevo equipo
      if (oldTeamId !== teamId) {
        // Eliminar el equipo anterior del historial
        await sql`
          DELETE FROM user_team_history 
          WHERE user_id = ${userId} AND team_id = ${oldTeamId} AND matchweek_id = ${matchweekId}
        `

        // Agregar el nuevo equipo al historial con horario de Ciudad de México
        await sql`
          INSERT INTO user_team_history (user_id, team_id, matchweek_id, created_at, updated_at)
          VALUES (${userId}, ${teamId}, ${matchweekId}, ${mexicoTime}::timestamp, ${mexicoTime}::timestamp)
          ON CONFLICT (user_id, team_id) DO UPDATE SET
          matchweek_id = ${matchweekId},
          updated_at = ${mexicoTime}::timestamp
        `
      }

      return NextResponse.json({ success: true, message: "Selección actualizada correctamente" })
    } else {
      // Crear nueva selección con horario de Ciudad de México
      await sql`
        INSERT INTO user_selections (user_id, matchweek_id, team_id, match_id, result, created_at, updated_at)
        VALUES (${userId}, ${matchweekId}, ${teamId}, ${matchId}, 'pending', ${mexicoTime}::timestamp, ${mexicoTime}::timestamp)
      `

      // Agregar equipo al historial con horario de Ciudad de México
      await sql`
        INSERT INTO user_team_history (user_id, team_id, matchweek_id, created_at, updated_at)
        VALUES (${userId}, ${teamId}, ${matchweekId}, ${mexicoTime}::timestamp, ${mexicoTime}::timestamp)
        ON CONFLICT (user_id, team_id) DO UPDATE SET
        matchweek_id = ${matchweekId},
        updated_at = ${mexicoTime}::timestamp
      `

      return NextResponse.json({ success: true, message: "Selección creada correctamente" })
    }
  } catch (error) {
    console.error("Error creando/actualizando selección:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

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

    const selections = await sql`
      SELECT 
        us.*,
        t.name as team_name,
        t.short_name,
        t.logo_url,
        mw.week_number,
        mw.is_active as matchweek_active,
        m.home_team_id,
        m.away_team_id,
        m.home_score,
        m.away_score,
        m.status as match_status,
        ht.name as home_team_name,
        at.name as away_team_name
      FROM user_selections us
      JOIN teams t ON us.team_id = t.id
      JOIN matchweeks mw ON us.matchweek_id = mw.id
      JOIN matches m ON us.match_id = m.id
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      WHERE us.user_id = ${userId}
      ORDER BY mw.week_number DESC
    `

    return NextResponse.json(selections)
  } catch (error) {
    console.error("Error obteniendo selecciones:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
