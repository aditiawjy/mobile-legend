import mysql from 'mysql2/promise'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    console.log('Testing database connection...')

    // Try to connect with the environment variables directly
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || '',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || '',
    })

    console.log('Connection successful!')

    // Get all table names
    const [tables] = await connection.execute('SHOW TABLES')
    const tableNames = tables.map(table => Object.values(table)[0])
    console.log('Available tables:', tableNames)

    // Try to find hero-related tables and their counts
    const heroResults = {}
    const heroPatterns = ['hero', 'ml_hero', 'mobile_legend']

    for (const tableName of tableNames) {
      const lowerTableName = tableName.toLowerCase()
      if (heroPatterns.some(pattern => lowerTableName.includes(pattern))) {
        try {
          const [countResult] = await connection.execute(`SELECT COUNT(*) as count FROM \`${tableName}\``)
          heroResults[tableName] = countResult[0]?.count || 0
          console.log(`${tableName} count:`, heroResults[tableName])
        } catch (error) {
          console.log(`${tableName} count error:`, error.message)
        }
      }
    }

    await connection.end()

    res.status(200).json({
      success: true,
      dbConfig: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER
      },
      availableTables: tableNames,
      heroTables: heroResults,
      message: 'Database analysis complete'
    })
  } catch (error) {
    console.error('Database test error:', error)
    res.status(500).json({
      success: false,
      error: error.message,
      dbConfig: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER
      },
      message: 'Database connection failed'
    })
  }
}
