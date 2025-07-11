import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    const leaderboard = await sql`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.is_eliminated,
        COUNT(us.id) as total_selections,
        COUNT(CASE WHEN us.is_correct = true THEN 1 END) as correct_selections,
        COUNT(CASE WHEN us.result = 'loss' THEN 1 END) as losses,
        MAX(mw.week_number) as last_week_survived
      FROM users u
      LEFT JOIN user_selections us ON u.id = us.user_id
      LEFT JOIN matchweeks mw ON us.matchweek_id = mw.id
      WHERE u.role = 'user'
      GROUP BY u.id, u.name, u.email, u.is_eliminated
      ORDER BY 
        u.is_eliminated ASC,
        correct_selections DESC,
        last_week_survived DESC,
        total_selections DESC
    `

    return NextResponse.json(leaderboard)
  } catch (error) {
    console.error("Error obteniendo clasificación:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
