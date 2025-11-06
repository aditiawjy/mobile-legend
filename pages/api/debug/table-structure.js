import { query } from '../../../lib/db'

export default async function handler(req, res) {
  try {
    // Get table structure
    const structure = await query(
      "SHOW COLUMNS FROM heroes LIKE '%skill%'"
    )
    
    // Get all columns
    const allColumns = await query(
      'SHOW COLUMNS FROM heroes'
    )
    
    return res.status(200).json({
      skill_columns: structure,
      all_columns: allColumns,
      skill_column_names: structure.map(col => col.Field)
    })
  } catch (error) {
    console.error('Database error:', error)
    return res.status(500).json({ error: 'Failed to get table structure', details: error.message })
  }
}
