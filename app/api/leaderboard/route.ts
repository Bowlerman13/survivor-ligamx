import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"
export const runtime = "nodejs"

export async function GET() {
  try {
    console.log("🔄 [LEADERBOARD-SIMPLE] Cargando leaderboard simple desde DB...")

    const leaderboard = await sql`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.is_eliminated,
        u.updated_at as user_updated_at,
        COUNT(us.id) as total_selections,
        COUNT(CASE WHEN us.is_correct = true THEN 1 END) as correct_selections,
        COUNT(CASE WHEN us.result = 'loss' THEN 1 END) as losses,
        MAX(mw.week_number) as last_week_survived
      FROM users u
      LEFT JOIN user_selections us ON u.id = us.user_id
      LEFT JOIN matchweeks mw ON us.matchweek_id = mw.id
      WHERE u.role = 'user'
      GROUP BY u.id, u.name, u.email, u.is_eliminated, u.updated_at
      ORDER BY 
        u.is_eliminated ASC,
        correct_selections DESC,
        last_week_survived DESC,
        total_selections DESC
    `

    console.log(`📊 [LEADERBOARD-SIMPLE] Leaderboard simple cargado: ${leaderboard.length} usuarios`)

    // Respuesta sin caché
    const response = NextResponse.json({
      data: leaderboard,
      timestamp: new Date().toISOString(),
      count: leaderboard.length,
      cache_buster: Math.random().toString(36).substring(7),
      server_info: {
        env: process.env.NODE_ENV,
        region: process.env.VERCEL_REGION || "unknown",
      },
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
    response.headers.set("X-Vercel-Cache", "MISS")

    return response
  } catch (error) {
    console.error("❌ [LEADERBOARD-SIMPLE] Error obteniendo clasificación:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
