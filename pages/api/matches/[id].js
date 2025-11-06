import { query } from '../../../lib/db'

export default async function handler(req, res) {
  const raw = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id
  const id = Number(raw)
  if (!id || Number.isNaN(id)) return res.status(400).json({ error: 'valid id required' })

  try {
    if (req.method === 'GET') {
      const rows = await query('SELECT * FROM matches WHERE id = ? LIMIT 1', [id])
      if (!rows || rows.length === 0) return res.status(404).json({ error: 'not found' })
      return res.status(200).json(rows[0])
    }

    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const {
        match_date,
        team_a_hero1, team_a_hero2, team_a_hero3, team_a_hero4, team_a_hero5,
        team_b_hero1, team_b_hero2, team_b_hero3, team_b_hero4, team_b_hero5,
        score_a, score_b,
        result,
      } = body || {}

      const updates = []
      const params = []

      if (match_date !== undefined) {
        if (match_date) {
          const d = new Date(match_date)
          if (!isNaN(d.valueOf())) {
            updates.push('match_date = ?')
            params.push(d.toISOString().slice(0, 10))
          }
        } else {
          updates.push('match_date = NULL')
        }
      }

      const setStr = (col, v) => {
        updates.push(`${col} = ?`)
        params.push(v != null && String(v).trim() !== '' ? String(v) : null)
      }
      const setInt = (col, v) => {
        const n = parseInt(v, 10)
        updates.push(`${col} = ?`)
        params.push(Number.isNaN(n) ? 0 : n)
      }

      const map = {
        team_a_hero1, team_a_hero2, team_a_hero3, team_a_hero4, team_a_hero5,
        team_b_hero1, team_b_hero2, team_b_hero3, team_b_hero4, team_b_hero5,
      }
      Object.entries(map).forEach(([k, v]) => {
        if (v !== undefined) setStr(k, v)
      })

      if (score_a !== undefined) setInt('score_a', score_a)
      if (score_b !== undefined) setInt('score_b', score_b)
      if (result !== undefined) setStr('result', result || '')

      if (updates.length === 0) return res.status(400).json({ error: 'no fields to update' })
      params.push(id)
      await query(`UPDATE matches SET ${updates.join(', ')} WHERE id = ?`, params)
      return res.status(200).json({ ok: true })
    }

    if (req.method === 'DELETE') {
      await query('DELETE FROM matches WHERE id = ? LIMIT 1', [id])
      return res.status(200).json({ ok: true })
    }

    res.setHeader('Allow', 'GET, PUT, DELETE')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    console.error('[matches:id] error:', e)
    return res.status(500).json({ error: 'Server error' })
  }
}
