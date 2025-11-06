import { query } from '../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  const name = typeof req.query.name === 'string' ? req.query.name.trim() : ''
  if (!name) return res.status(200).json({})
  try {
    const rows = await query('SELECT * FROM heroes WHERE hero_name = ? LIMIT 1', [name])
    if (!rows || rows.length === 0) return res.status(200).json({})
    return res.status(200).json(rows[0])
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Server error' })
  }
}
