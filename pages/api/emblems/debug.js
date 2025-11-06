import { query } from '../../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }
  
  try {
    // Test koneksi dan lihat struktur tabel
    const columns = await query('DESCRIBE emblems')
    const count = await query('SELECT COUNT(*) as count FROM emblems')
    const sampleData = await query('SELECT * FROM emblems LIMIT 3')
    
    // Coba query dengan nama kolom yang berbeda
    let testQuery1, testQuery2, testQuery3
    
    try {
      testQuery1 = await query('SELECT emblem_name, emblem_type, description FROM emblems LIMIT 3')
    } catch (e) {
      testQuery1 = { error: e.message }
    }
    
    try {
      testQuery2 = await query('SELECT name, type, description FROM emblems LIMIT 3')
    } catch (e) {
      testQuery2 = { error: e.message }
    }
    
    try {
      testQuery3 = await query('SELECT * FROM emblems LIMIT 3')
    } catch (e) {
      testQuery3 = { error: e.message }
    }

    res.status(200).json({
      success: true,
      tableStructure: columns,
      totalCount: count[0]?.count || 0,
      sampleData: sampleData,
      testQueries: {
        query1: testQuery1,
        query2: testQuery2,
        query3: testQuery3
      }
    })
  } catch (error) {
    console.error('Debug error:', error)
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    })
  }
}