import { query } from '../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : ''
  const role = typeof req.query.role === 'string' ? req.query.role.trim() : ''
  
  // Return empty if no query AND no role filter
  if (!q && !role) return res.status(200).json([])
  
  try {
    let sql = 'SELECT hero_name, role FROM heroes WHERE 1=1'
    const params = []

    // Add name filter if query provided
    if (q) {
      sql += ' AND hero_name LIKE ?'
      params.push(`%${q}%`)
    }

    // Add role filter if provided
    if (role) {
      sql += ' AND role LIKE ?'
      params.push(`%${role}%`)
    }

    sql += ' ORDER BY hero_name ASC LIMIT 20'

    const rows = await query(sql, params)
    res.status(200).json(rows)
  } catch (e) {
    console.error('Heroes search error:', e)
    res.status(200).json([])
  }
}
