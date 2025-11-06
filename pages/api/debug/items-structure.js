import { query } from '../../../lib/db'

export default async function handler(req, res) {
  try {
    // Get items table structure
    const structure = await query('SHOW COLUMNS FROM items')
    
    // Get sample data
    const sample = await query('SELECT * FROM items LIMIT 3')
    
    return res.status(200).json({
      columns: structure,
      sample_data: sample,
      column_names: structure.map(col => col.Field)
    })
  } catch (error) {
    console.error('Database error:', error)
    return res.status(500).json({ error: 'Failed to get items table structure', details: error.message })
  }
}
