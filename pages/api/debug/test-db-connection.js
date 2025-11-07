import mysql from 'mysql2/promise'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const {
    DB_HOST = 'localhost',
    DB_NAME = '',
    DB_USER = '',
    DB_PASS = '',
    DB_PORT = '3306',
  } = process.env

  console.log('Testing database connection with:')
  console.log('- Host:', DB_HOST)
  console.log('- Port:', DB_PORT)
  console.log('- Database:', DB_NAME)
  console.log('- User:', DB_USER)
  console.log('- Password:', DB_PASS ? '***' : '(empty)')

  try {
    console.log('Attempting to connect...')
    const connection = await mysql.createConnection({
      host: DB_HOST,
      port: Number(DB_PORT),
      user: DB_USER,
      password: DB_PASS,
      database: DB_NAME,
    })

    console.log('Connection successful!')

    // Test query
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM heroes')
    console.log('Query successful! Heroes count:', rows[0].count)

    await connection.end()

    res.status(200).json({
      success: true,
      message: 'Database connection successful',
      heroesCount: rows[0].count,
      config: {
        host: DB_HOST,
        port: DB_PORT,
        database: DB_NAME,
        user: DB_USER
      }
    })
  } catch (error) {
    console.error('Database connection failed!')
    console.error('Error:', error.message)
    console.error('Error code:', error.code)
    console.error('Error errno:', error.errno)

    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
      errno: error.errno,
      config: {
        host: DB_HOST,
        port: DB_PORT,
        database: DB_NAME,
        user: DB_USER
      }
    })
  }
}
