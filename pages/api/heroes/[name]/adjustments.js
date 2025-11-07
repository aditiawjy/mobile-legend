import { query } from '../../../../lib/db'

export default async function handler(req, res) {
  const raw = Array.isArray(req.query.name) ? req.query.name[0] : req.query.name
  const name = (raw || '').trim()
  if (!name) return res.status(400).json({ error: 'name is required' })

  try {
    if (req.method === 'GET') {
      const rows = await query(
        'SELECT id, hero_name, adj_date, season, description, created_at, updated_at FROM hero_adjustments WHERE LOWER(hero_name) = LOWER(?) ORDER BY adj_date DESC, created_at DESC',
        [name]
      )
      return res.status(200).json(rows || [])
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const { adj_date, season, description } = body || {}
      if (!description) {
        return res.status(400).json({ error: 'description is required' })
      }
      if (!season) {
        return res.status(400).json({ error: 'season is required' })
      }
      // Normalize date (optional)
      let dateVal = null
      if (adj_date) {
        const d = new Date(adj_date)
        if (!isNaN(d.valueOf())) {
          dateVal = d.toISOString().slice(0, 10) // YYYY-MM-DD
        }
      }
      await query(
        'INSERT INTO hero_adjustments (hero_name, adj_date, season, description) VALUES (?, ?, ?, ?)',
        [name, dateVal, String(season), String(description)]
      )
      return res.status(201).json({ ok: true })
    }

    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    console.error('[ADJ] error:', e)
    return res.status(200).json([])
  }
}
