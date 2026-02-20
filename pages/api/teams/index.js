export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      return res.status(200).json([])
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const { team_name } = body || {}
      if (!team_name || !String(team_name).trim()) {
        return res.status(400).json({ error: 'team_name is required' })
      }
      return res.status(201).json({ ok: true })
    }

    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    console.error('[teams:index] error:', e)
    return res.status(500).json({ error: 'Server error' })
  }
}
