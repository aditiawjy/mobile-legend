import mysql from 'mysql2/promise'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || '',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || '',
    })

    // Get table structures
    const [emblemsColumns] = await connection.execute('DESCRIBE emblems')
    const [battleSpellsColumns] = await connection.execute('DESCRIBE battle_spells')
    
    // Get sample data
    const [emblemsData] = await connection.execute('SELECT * FROM emblems LIMIT 5')
    const [battleSpellsData] = await connection.execute('SELECT * FROM battle_spells LIMIT 5')
    
    // Get counts
    const [emblemsCount] = await connection.execute('SELECT COUNT(*) as count FROM emblems')
    const [battleSpellsCount] = await connection.execute('SELECT COUNT(*) as count FROM battle_spells')

    await connection.end()

    res.status(200).json({
      success: true,
      emblems: {
        columns: emblemsColumns,
        count: emblemsCount[0]?.count || 0,
        sampleData: emblemsData
      },
      battleSpells: {
        columns: battleSpellsColumns,
        count: battleSpellsCount[0]?.count || 0,
        sampleData: battleSpellsData
      }
    })
  } catch (error) {
    console.error('Database error:', error)
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to analyze table structure'
    })
  }
}