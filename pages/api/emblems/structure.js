import { query } from '../../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }
  
  try {
    // Get table structure
    const columns = await query('DESCRIBE emblems')
    
    // Get sample data with all columns
    const sampleData = await query('SELECT * FROM emblems LIMIT 1')
    
    // Get count
    const count = await query('SELECT COUNT(*) as total FROM emblems')

    res.status(200).json({
      success: true,
      columns: columns,
      sampleData: sampleData,
      totalRecords: count[0]?.total || 0,
      columnNames: columns.map(col => col.Field)
    })
  } catch (error) {
    console.error('Structure check error:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
}