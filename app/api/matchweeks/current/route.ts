import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    const currentMatchweek = await sql`
      SELECT * FROM matchweeks 
      WHERE is_active = true 
      ORDER BY week_number ASC 
      LIMIT 1
    `

    if (currentMatchweek.length === 0) {
      return NextResponse.json({ error: "No hay jornada activa" }, { status: 404 })
    }

    return NextResponse.json(currentMatchweek[0])
  } catch (error) {
    console.error("Error obteniendo jornada actual:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
