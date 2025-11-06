import { query } from '../../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }
  try {
    // Adjust column/table names if your schema differs
    const rows = await query('SELECT name, description FROM spells ORDER BY name ASC')
    res.status(200).json(rows)
  } catch (error) {
    console.error('Error fetching spells:', error)
    res.status(200).json([])
  }
}
