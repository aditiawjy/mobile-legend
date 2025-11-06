import { query } from '../../../lib/db'

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const rows = await query(
        'SELECT id, team_name, tag, region, created_at, updated_at FROM teams ORDER BY team_name ASC'
      )
      return res.status(200).json(rows || [])
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const { team_name, tag, region } = body || {}
      if (!team_name || !String(team_name).trim()) {
        return res.status(400).json({ error: 'team_name is required' })
      }
      await query(
        'INSERT INTO teams (team_name, tag, region) VALUES (?, ?, ?)',
        [String(team_name).trim(), tag != null ? String(tag) : null, region != null ? String(region) : null]
      )
      return res.status(201).json({ ok: true })
    }

    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    console.error('[teams:index] error:', e)
    return res.status(500).json({ error: 'Server error' })
  }
}
