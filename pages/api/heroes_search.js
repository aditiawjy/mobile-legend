import { query } from '../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : ''
  if (!q) return res.status(200).json([])
  try {
    const like = `%${q}%`
    const rows = await query(
      'SELECT hero_name FROM heroes WHERE hero_name LIKE ? ORDER BY hero_name ASC LIMIT 15',
      [like]
    )
    const names = rows.map(r => r.hero_name)
    res.status(200).json(names)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Server error' })
  }
}
