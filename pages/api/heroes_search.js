import { query } from '../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : ''
  if (!q) return res.status(200).json([])
  try {
    const role = typeof req.query.role === 'string' ? req.query.role.trim() : ''
    
    let sql = 'SELECT hero_name, role FROM heroes WHERE hero_name LIKE ?'
    const params = [`%${q}%`]

    if (role) {
      sql += ' AND role LIKE ?'
      params.push(`%${role}%`)
    }

    sql += ' ORDER BY hero_name ASC LIMIT 15'

    const rows = await query(sql, params)
    // Return objects instead of just strings
    res.status(200).json(rows)
  } catch (e) {
    console.error('Heroes search error:', e)
    res.status(200).json([])
  }
}
