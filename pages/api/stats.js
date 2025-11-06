import { db } from '../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    console.log('Attempting to connect to database...')
    console.log('DB Config:', {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER
    })

    const connection = await db()

    // First, get all available tables (optional for debugging)
    let tables = []
    try {
      const [t] = await connection.execute('SHOW TABLES')
      tables = t
      console.log('Available tables:', tables.map(table => Object.values(table)[0]))
    } catch (e) {
      console.log('SHOW TABLES failed (non-fatal):', e.message)
    }

    // Prepare totals
    let totalHeroes = 0
    let totalItems = 0
    let totalMatches = 0
    let totalTeams = 0
    let recentHeroes = 0

    // Get total heroes - we know the table name is "heroes"
    try {
      const [heroRows] = await connection.execute('SELECT COUNT(*) as count FROM heroes')
      totalHeroes = Number(heroRows[0]?.count) || 0
      console.log('Heroes count:', totalHeroes)
    } catch (error) {
      console.log('Heroes table error:', error.message)
    }

    // Get total items
    try {
      const [itemRows] = await connection.execute('SELECT COUNT(*) as count FROM items')
      totalItems = Number(itemRows[0]?.count) || 0
      console.log('Items count:', totalItems)
    } catch (error) {
      console.log('Items table error:', error.message)
    }

    // Get total matches
    try {
      const [matchRows] = await connection.execute('SELECT COUNT(*) as count FROM matches')
      totalMatches = Number(matchRows[0]?.count) || 0
      console.log('Matches count:', totalMatches)
    } catch (error) {
      console.log('Matches table error:', error.message)
    }

    // Get total teams
    try {
      const [teamRows] = await connection.execute('SELECT COUNT(*) as count FROM teams')
      totalTeams = Number(teamRows[0]?.count) || 0
      console.log('Teams count:', totalTeams)
    } catch (error) {
      console.log('Teams table error:', error.message)
    }

    try {
      const [recentHeroRows] = await connection.execute(`
        SELECT COUNT(*) as count
        FROM heroes
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      `)
      recentHeroes = Number(recentHeroRows[0]?.count) || 0
      console.log('Recent heroes count:', recentHeroes)
    } catch (error) {
      console.log('Recent heroes query failed:', error.message)
    }

    // Do NOT end the pool per request; Next.js dev server reuses it.
    // Leaving the pool open avoids connection churn and errors.

    res.status(200).json({
      totalHeroes,
      totalItems,
      totalMatches,
      totalTeams,
      recentHeroes,
      debug: {
        tables: tables.map(table => Object.values(table)[0]),
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Database connection error:', error)

    // Return fallback data when database is not available
    res.status(200).json({
      totalHeroes: 0,
      totalItems: 0,
      totalMatches: 0,
      totalTeams: 0,
      recentHeroes: 0,
      message: 'Database not available, showing default values'
    })
  }
}
