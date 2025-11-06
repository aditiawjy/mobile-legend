import { query } from '../../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }
  try {
    // Query battle_spells dengan nama kolom yang sesuai
    const rows = await query('SELECT spell_name as name, description FROM battle_spells ORDER BY spell_name ASC')
    res.status(200).json(rows)
  } catch (error) {
    console.error('Error fetching battle spells:', error)
    res.status(200).json([])
  }
}