import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyToken } from "@/lib/auth"
import { getCurrentMexicoTime } from "@/lib/utils"

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

    const { matchIds, isActive } = await request.json()
    const mexicoTime = getCurrentMexicoTime()

    if (!Array.isArray(matchIds) || matchIds.length === 0) {
      return NextResponse.json({ error: "IDs de partidos requeridos" }, { status: 400 })
    }

    // Actualizar el estado activo de los partidos seleccionados
    for (const matchId of matchIds) {
      await sql`
        UPDATE matches 
        SET is_active = ${isActive},
            updated_at = ${mexicoTime}::timestamp
        WHERE id = ${matchId}
      `
    }

    const action = isActive ? "activados" : "desactivados"
    return NextResponse.json({
      success: true,
      message: `${matchIds.length} partido(s) ${action} correctamente`,
    })
  } catch (error) {
    console.error("Error actualizando estado de partidos:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
