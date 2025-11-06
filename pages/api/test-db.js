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
    console.log('Available tables:', tables)

    // Try to query heroes table specifically
    const [heroes] = await connection.execute('SELECT COUNT(*) as count FROM heroes')
    console.log('Heroes count:', heroes[0]?.count || 0)

    await connection.end()

    res.status(200).json({
      success: true,
      tables: tables.map(table => Object.values(table)[0]),
      heroesCount: heroes[0]?.count || 0,
      message: 'Database connection successful'
    })
  } catch (error) {
    console.error('Database test error:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState
    })

    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
      details: {
        DB_HOST: process.env.DB_HOST,
        DB_PORT: process.env.DB_PORT,
        DB_NAME: process.env.DB_NAME,
        DB_USER: process.env.DB_USER
      },
      message: 'Database connection failed'
    })
  }
}
