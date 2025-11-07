import { query } from '../../../../lib/db'

export default async function handler(req, res) {
  const raw = Array.isArray(req.query.name) ? req.query.name[0] : req.query.name
  const name = (raw || '').trim()
  if (!name) return res.status(400).json({ error: 'name is required' })

  try {
    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      // List of allowed fields to update for hero info
      const fields = ['role', 'damage_type', 'attack_reliance', 'note']

      // Build dynamic UPDATE query
      const updates = []
      const params = []
      for (const f of fields) {
        if (Object.prototype.hasOwnProperty.call(body, f)) {
          updates.push(`${f} = ?`)
          params.push(body[f])
        }
      }
      
      if (updates.length === 0) {
        return res.status(400).json({ error: 'no fields to update' })
      }
      
      params.push(name)
      
      console.log('Updating hero info:', { name, updates, params })
      
      await query(
        `UPDATE heroes SET ${updates.join(', ')} WHERE LOWER(hero_name) = LOWER(?)`,
        params
      )
      
      return res.status(200).json({ ok: true })
    }

    res.setHeader('Allow', 'PUT')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    console.error('[Hero Info API] error:', e)
    return res.status(500).json({ error: 'Server error', message: e.message })
  }
}
