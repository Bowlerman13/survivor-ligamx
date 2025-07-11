import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { hashPassword, generateToken } from "@/lib/auth"
import { getCurrentMexicoTime } from "@/lib/utils"

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 })
    }

    // Verificar si el usuario ya existe
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `

    if (existingUser.length > 0) {
      return NextResponse.json({ error: "El email ya está registrado" }, { status: 400 })
    }

    // Crear nuevo usuario con horario de Ciudad de México
    const hashedPassword = await hashPassword(password)
    const mexicoTime = getCurrentMexicoTime()

    const newUser = await sql`
      INSERT INTO users (email, password_hash, name, created_at, updated_at)
      VALUES (${email}, ${hashedPassword}, ${name}, ${mexicoTime}::timestamp, ${mexicoTime}::timestamp)
      RETURNING id, email, name, role
    `

    const user = newUser[0]
    const token = generateToken(user.id, user.email, user.role)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    })
  } catch (error) {
    console.error("Error en registro:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
