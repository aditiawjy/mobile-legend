import { query } from '../../../lib/db'

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const rows = await query(
        `SELECT * FROM matches ORDER BY match_date DESC, created_at DESC`
      )
      return res.status(200).json(rows || [])
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const {
        match_date,
        team_a_hero1, team_a_hero2, team_a_hero3, team_a_hero4, team_a_hero5,
        team_b_hero1, team_b_hero2, team_b_hero3, team_b_hero4, team_b_hero5,
        score_a, score_b,
        result,
      } = body || {}

      // Normalize date
      let dateVal = null
      if (match_date) {
        const d = new Date(match_date)
        if (!isNaN(d.valueOf())) {
          dateVal = d.toISOString().slice(0, 10)
        }
      }

      const toStrOrNull = (v) => v != null && String(v).trim() !== '' ? String(v) : null
      const toIntOrZero = (v) => {
        const n = parseInt(v, 10)
        return Number.isNaN(n) ? 0 : n
      }

      await query(
        `INSERT INTO matches (
          match_date,
          team_a_hero1, team_a_hero2, team_a_hero3, team_a_hero4, team_a_hero5,
          team_b_hero1, team_b_hero2, team_b_hero3, team_b_hero4, team_b_hero5,
          score_a, score_b, result
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          dateVal,
          toStrOrNull(team_a_hero1), toStrOrNull(team_a_hero2), toStrOrNull(team_a_hero3), toStrOrNull(team_a_hero4), toStrOrNull(team_a_hero5),
          toStrOrNull(team_b_hero1), toStrOrNull(team_b_hero2), toStrOrNull(team_b_hero3), toStrOrNull(team_b_hero4), toStrOrNull(team_b_hero5),
          toIntOrZero(score_a), toIntOrZero(score_b), toStrOrNull(result) || ''
        ]
      )

      return res.status(201).json({ ok: true })
    }

    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    console.error('[matches:index] error:', e)
    return res.status(500).json({ error: 'Server error' })
  }
}
