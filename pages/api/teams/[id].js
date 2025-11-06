import { query } from '../../../lib/db'

export default async function handler(req, res) {
  const raw = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id
  const id = Number(raw)
  if (!id || Number.isNaN(id)) return res.status(400).json({ error: 'valid id required' })

  try {
    if (req.method === 'GET') {
      const rows = await query('SELECT id, team_name, tag, region, created_at, updated_at FROM teams WHERE id = ? LIMIT 1', [id])
      if (!rows || rows.length === 0) return res.status(404).json({ error: 'not found' })
      return res.status(200).json(rows[0])
    }

    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const { team_name, tag, region } = body || {}
      const updates = []
      const params = []
      if (team_name !== undefined) { updates.push('team_name = ?'); params.push(String(team_name).trim()) }
      if (tag !== undefined) { updates.push('tag = ?'); params.push(tag != null ? String(tag) : null) }
      if (region !== undefined) { updates.push('region = ?'); params.push(region != null ? String(region) : null) }
      if (updates.length === 0) return res.status(400).json({ error: 'no fields to update' })
      params.push(id)
      await query(`UPDATE teams SET ${updates.join(', ')} WHERE id = ?`, params)
      return res.status(200).json({ ok: true })
    }

    if (req.method === 'DELETE') {
      await query('DELETE FROM teams WHERE id = ? LIMIT 1', [id])
      return res.status(200).json({ ok: true })
    }

    res.setHeader('Allow', 'GET, PUT, DELETE')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    console.error('[teams:id] error:', e)
    return res.status(500).json({ error: 'Server error' })
  }
}
