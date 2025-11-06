import { query } from '../../../../lib/db'

export default async function handler(req, res) {
  const raw = Array.isArray(req.query.name) ? req.query.name[0] : req.query.name
  const name = (raw || '').trim()
  if (!name) return res.status(400).json({ error: 'name is required' })

  try {
    if (req.method === 'GET') {
      // First check if hero exists at all
      const heroExists = await query(
        'SELECT hero_name FROM heroes WHERE LOWER(hero_name) = LOWER(?)',
        [name]
      )
      
      if (!heroExists || heroExists.length === 0) {
        return res.status(404).json({ error: 'hero not found' })
      }
      
      // Get skill data
      const rows = await query(
        'SELECT skill1_name, skill1_desc, skill2_name, skill2_desc, skill3_name, skill3_desc, ultimate_name, ultimate_desc, skill4_name, skill4_desc FROM heroes WHERE LOWER(hero_name) = LOWER(?)',
        [name]
      )
      
      if (!rows || rows.length === 0) {
        // Hero exists but no skill data, return empty skills
        return res.status(200).json({
          skill1_name: null,
          skill1_desc: null,
          skill2_name: null,
          skill2_desc: null,
          skill3_name: null,
          skill3_desc: null,
          ultimate_name: null,
          ultimate_desc: null,
          skill4_name: null,
          skill4_desc: null
        })
      }
      
      return res.status(200).json(rows[0])
    }

    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const fields = [
        'skill1_name','skill1_desc','skill2_name','skill2_desc','skill3_name','skill3_desc','ultimate_name','ultimate_desc','skill4_name','skill4_desc'
      ]
      const updates = []
      const params = []
      for (const f of fields) {
        if (Object.prototype.hasOwnProperty.call(body, f)) { updates.push(`${f} = ?`); params.push(body[f]) }
      }
      if (updates.length === 0) return res.status(400).json({ error: 'no fields to update' })
      params.push(name)
      await query(`UPDATE heroes SET ${updates.join(', ')} WHERE LOWER(hero_name) = LOWER(?)`, params)
      return res.status(200).json({ ok: true })
    }

    res.setHeader('Allow', 'GET, PUT')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    console.error('[DEBUG] Database error:', e)
    return res.status(500).json({ error: 'Server error', details: e.message })
  }
}
