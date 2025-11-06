import { query } from '../../../../lib/db'

export default async function handler(req, res) {
  const raw = Array.isArray(req.query.name) ? req.query.name[0] : req.query.name
  const name = (raw || '').trim()
  if (!name) return res.status(400).json({ error: 'name is required' })

  try {
    if (req.method === 'GET') {
      const rows = await query(
        'SELECT * FROM hero_attributes WHERE LOWER(hero_name) = LOWER(?) LIMIT 1',
        [name]
      )
      if (!rows || rows.length === 0) return res.status(404).json({ error: 'not found' })
      return res.status(200).json(rows[0])
    }

    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      // List of allowed fields to update
      const fields = [
        'hp','physical_attack','mana','magic_power','physical_defense','physical_defense_pct','attack_speed','crit_chance','magic_defense','magic_defense_pct','cd_reduction','movement_speed','hp_regen','mana_regen','physical_penetration','physical_penetration_pct','magic_penetration','magic_penetration_pct','lifesteal','spell_vamp','basic_attack_range','resilience','crit_damage','healing_effect','crit_damage_reduction','healing_received'
      ]

      // Check if record exists
      const existing = await query(
        'SELECT hero_name FROM hero_attributes WHERE LOWER(hero_name) = LOWER(?) LIMIT 1',
        [name]
      )

      if (!existing || existing.length === 0) {
        // INSERT new row with provided fields
        const insertCols = ['hero_name']
        const insertVals = [name]
        const placeholders = ['?']
        for (const f of fields) {
          if (Object.prototype.hasOwnProperty.call(body, f)) {
            insertCols.push(f)
            insertVals.push(body[f])
            placeholders.push('?')
          }
        }
        if (insertCols.length === 1) {
          // No fields provided besides hero_name
          return res.status(400).json({ error: 'no fields to insert' })
        }
        await query(
          `INSERT INTO hero_attributes (${insertCols.join(', ')}) VALUES (${placeholders.join(', ')})`,
          insertVals
        )
        return res.status(200).json({ ok: true, inserted: true })
      }

      // UPDATE existing row
      const updates = []
      const params = []
      for (const f of fields) {
        if (Object.prototype.hasOwnProperty.call(body, f)) { updates.push(`${f} = ?`); params.push(body[f]) }
      }
      if (updates.length === 0) return res.status(400).json({ error: 'no fields to update' })
      params.push(name)
      await query(`UPDATE hero_attributes SET ${updates.join(', ')} WHERE LOWER(hero_name) = LOWER(?)`, params)
      return res.status(200).json({ ok: true, updated: true })
    }

    res.setHeader('Allow', 'GET, PUT')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    console.error('[ATTR] error:', e)
    return res.status(500).json({ error: 'Server error' })
  }
}
