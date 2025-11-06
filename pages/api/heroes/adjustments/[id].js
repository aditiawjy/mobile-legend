import { query } from '../../../../lib/db'

export default async function handler(req, res) {
  const raw = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id
  const id = Number(raw)
  if (!id || Number.isNaN(id)) return res.status(400).json({ error: 'valid id required' })

  try {
    if (req.method === 'GET') {
      const rows = await query('SELECT * FROM hero_adjustments WHERE id = ? LIMIT 1', [id])
      if (!rows || rows.length === 0) return res.status(404).json({ error: 'not found' })
      return res.status(200).json(rows[0])
    }

    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const { adj_date, season, description } = body || {}
      const updates = []
      const params = []
      if (adj_date !== undefined) {
        if (adj_date) {
          const d = new Date(adj_date)
          if (!isNaN(d.valueOf())) {
            updates.push('adj_date = ?')
            params.push(d.toISOString().slice(0, 10))
          }
        } else {
          updates.push('adj_date = NULL')
        }
      }
      if (season !== undefined) {
        updates.push('season = ?')
        params.push(String(season))
      }
      if (description !== undefined) {
        updates.push('description = ?')
        params.push(String(description))
      }
      if (updates.length === 0) return res.status(400).json({ error: 'no fields to update' })
      params.push(id)
      await query(`UPDATE hero_adjustments SET ${updates.join(', ')} WHERE id = ?`, params)
      return res.status(200).json({ ok: true })
    }

    if (req.method === 'DELETE') {
      await query('DELETE FROM hero_adjustments WHERE id = ? LIMIT 1', [id])
      return res.status(200).json({ ok: true })
    }

    res.setHeader('Allow', 'GET, PUT, DELETE')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    console.error('[ADJ:id] error:', e)
    return res.status(500).json({ error: 'Server error' })
  }
}
