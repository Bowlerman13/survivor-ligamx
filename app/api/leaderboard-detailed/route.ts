import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    // Obtener todos los usuarios con sus selecciones detalladas
    const leaderboardData = await sql`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.is_eliminated,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'week_number', mw.week_number,
              'team_id', t.id,
              'team_name', t.name,
              'team_short_name', t.short_name,
              'team_logo', t.logo_url,
              'result', us.result,
              'is_correct', us.is_correct,
              'created_at', us.created_at
            ) ORDER BY mw.week_number
          ) FILTER (WHERE us.id IS NOT NULL),
          '[]'::json
        ) as selections,
        COUNT(CASE WHEN us.is_correct = true THEN 1 END) as correct_selections,
        COUNT(us.id) as total_selections,
        MAX(mw.week_number) as last_week_survived
      FROM users u
      LEFT JOIN user_selections us ON u.id = us.user_id
      LEFT JOIN matchweeks mw ON us.matchweek_id = mw.id
      LEFT JOIN teams t ON us.team_id = t.id
      WHERE u.role = 'user'
      GROUP BY u.id, u.name, u.email, u.is_eliminated
      ORDER BY 
        u.is_eliminated ASC,
        correct_selections DESC,
        last_week_survived DESC,
        total_selections DESC
    `

    return NextResponse.json(leaderboardData)
  } catch (error) {
    console.error("Error obteniendo leaderboard detallado:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
