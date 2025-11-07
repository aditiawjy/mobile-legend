import { query } from '../../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const columns = await query(
      `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY, COLUMN_DEFAULT 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'heroes'
       ORDER BY ORDINAL_POSITION`
    )

    console.log('Heroes table columns:', columns)
    res.status(200).json({ columns })
  } catch (error) {
    console.error('Error fetching heroes schema:', error)
    res.status(500).json({ error: error.message })
  }
}
