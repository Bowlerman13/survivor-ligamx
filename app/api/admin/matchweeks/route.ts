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

    const matchweeks = await sql`
      SELECT * FROM matchweeks 
      ORDER BY week_number ASC
    `

    return NextResponse.json(matchweeks)
  } catch (error) {
    console.error("Error obteniendo jornadas:", error)
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

    const { matchweekId, isActive } = await request.json()

    // Si se está activando una jornada, desactivar todas las demás
    if (isActive) {
      await sql`
        UPDATE matchweeks SET is_active = false
      `
    }

    // Actualizar la jornada específica
    await sql`
      UPDATE matchweeks 
      SET is_active = ${isActive}
      WHERE id = ${matchweekId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error actualizando jornada:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
