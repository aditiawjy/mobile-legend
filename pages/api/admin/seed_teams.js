import { query } from '../../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    let body
    if (typeof req.body === 'string') {
      const t = req.body.trim()
      body = t ? JSON.parse(t) : {}
    } else {
      body = req.body || {}
    }
    let { teams } = body || {}

    if (!Array.isArray(teams) || teams.length === 0) {
      // Default seed if none provided
      teams = [
        { team_name: 'EVOS', tag: 'EVOS', region: 'ID' },
        { team_name: 'RRQ', tag: 'RRQ', region: 'ID' },
        { team_name: 'ONIC', tag: 'ONIC', region: 'ID' },
        { team_name: 'Alter Ego', tag: 'AE', region: 'ID' },
        { team_name: 'Aura Fire', tag: 'AURA', region: 'ID' },
        { team_name: 'Geek Fam', tag: 'GEEK', region: 'ID' },
      ]
    }

    let affected = 0
    for (const t of teams) {
      const name = String(t.team_name || '').trim()
      if (!name) continue
      const tag = t.tag != null ? String(t.tag) : null
      const region = t.region != null ? String(t.region) : null
      await query(
        `INSERT INTO teams (team_name, tag, region) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE tag = VALUES(tag), region = VALUES(region)`,
        [name, tag, region]
      )
      affected += 1
    }

    return res.status(200).json({ ok: true, count: affected })
  } catch (e) {
    console.error('[admin:seed_teams] error:', e)
    return res.status(500).json({ error: 'Server error', details: e.message })
  }
}
