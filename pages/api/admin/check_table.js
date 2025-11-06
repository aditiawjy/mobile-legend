import { query } from '../../../lib/db'

export default async function handler(req, res) {
  const name = typeof req.query.name === 'string' ? req.query.name : ''
  if (!name) return res.status(400).json({ error: 'name required' })
  try {
    const rows = await query(
      `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? LIMIT 1`,
      [name]
    )
    const exists = Array.isArray(rows) && rows.length > 0
    return res.status(200).json({ exists, table: name })
  } catch (e) {
    console.error('[check_table] error:', e)
    return res.status(500).json({ error: 'Server error', details: e.message })
  }
}
