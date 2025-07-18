import { neon } from "@neondatabase/serverless"
import { type NextRequest, NextResponse } from "next/server"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(req: NextRequest) {
  try {
    console.log("Server API: Starting fetch for current week matches...")

    // Get the current active matchweek
    const matchweekResult = await sql`
      SELECT id, name, week_number, start_date, end_date, is_active
      FROM matchweeks
      WHERE is_active = TRUE
      LIMIT 1;
    `

    if (matchweekResult.length === 0) {
      console.log("Server API: No active matchweek found.")
      return NextResponse.json(
        {
          matchweek: null,
          matches: [],
          error: "No hay una jornada activa en este momento.",
        },
        { status: 200 },
      )
    }

    const currentMatchweek = matchweekResult[0]
    console.log("Server API: Active matchweek found:", currentMatchweek)

    // Get matches for the current active matchweek
    const matchesResult = await sql`
      SELECT
        m.id AS match_id,
        m.match_date,
        m.home_score,
        m.away_score,
        m.is_finished,
        m.is_active AS match_is_active,
        m.status,
        ht.id AS home_team_id,
        ht.name AS home_team_name,
        ht.short_name AS home_team_short_name,
        ht.logo_url AS home_team_logo_url,
        ht.stadium AS stadium, -- Corrected: stadium from home team
        at.id AS away_team_id,
        at.name AS away_team_name,
        at.short_name AS away_team_short_name,
        at.logo_url AS away_team_logo_url
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      WHERE m.matchweek_id = ${currentMatchweek.id}
      ORDER BY m.match_date ASC;
    `

    console.log(`Server API: Found ${matchesResult.length} matches for matchweek ${currentMatchweek.id}.`)

    const formattedMatches = matchesResult.map((row: any) => {
      const matchData = {
        id: row.match_id,
        homeTeam: {
          id: row.home_team_id,
          name: row.home_team_name,
          shortName: row.home_team_short_name,
          logoUrl: row.home_team_logo_url,
        },
        awayTeam: {
          id: row.away_team_id,
          name: row.away_team_name,
          shortName: row.away_team_short_name,
          logoUrl: row.away_team_logo_url,
        },
        matchDate: row.match_date,
        stadium: row.stadium,
        homeScore: row.home_score,
        awayScore: row.away_score,
        isFinished: row.is_finished,
        isActive: row.match_is_active,
        status: row.status,
      }
      console.log(
        `Server API: Formatted match ${matchData.id}: isFinished=${matchData.isFinished}, scores=${matchData.homeScore}-${matchData.awayScore}, status=${matchData.status}`,
      )
      return matchData
    })

    const responseData = {
      matchweek: {
        id: currentMatchweek.id,
        name: currentMatchweek.name,
        weekNumber: currentMatchweek.week_number,
        startDate: currentMatchweek.start_date,
        endDate: currentMatchweek.end_date,
        isActive: currentMatchweek.is_active,
      },
      matches: formattedMatches,
    }

    console.log("Server API: Successfully prepared response data.")
    return NextResponse.json(responseData)
  } catch (error: any) {
    console.error("Server API: Error fetching current week matches:", error)
    return NextResponse.json(
      { error: `Error al obtener los partidos de la jornada: ${error.message}` },
      { status: 500 },
    )
  }
}
