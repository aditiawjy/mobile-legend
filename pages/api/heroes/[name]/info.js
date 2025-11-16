import { query } from '../../../../lib/db'

export default async function handler(req, res) {
  const raw = Array.isArray(req.query.name) ? req.query.name[0] : req.query.name
  const name = (raw || '').trim()
  if (!name) return res.status(400).json({ error: 'name is required' })

  try {
    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      console.log('[Hero Info API] Received body:', body)
      console.log('[Hero Info API] Hero name:', name)
      
      // Check which columns exist in the heroes table first
      const columns = await query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'heroes'`
      )
      const columnNames = columns.map(col => col.COLUMN_NAME)
      console.log('[Hero Info API] Available columns:', columnNames)
      
      // List of fields we want to update
      const requestedFields = ['role', 'damage_type', 'attack_reliance', 'note']

      // Build dynamic UPDATE query only for existing columns
      const updates = []
      const params = []
      
      for (const f of requestedFields) {
        if (Object.prototype.hasOwnProperty.call(body, f) && columnNames.includes(f)) {
          updates.push(`${f} = ?`)
          params.push(body[f] || '')
          console.log(`[Hero Info API] Adding field to update: ${f} = ${body[f]}`)
        } else if (Object.prototype.hasOwnProperty.call(body, f) && !columnNames.includes(f)) {
          console.log(`[Hero Info API] Skipping field (not in table): ${f}`)
        }
      }
      
      if (updates.length === 0) {
        console.log('[Hero Info API] No fields to update')
        return res.status(400).json({ error: 'no fields to update' })
      }
      
      params.push(name)
      
      const sqlQuery = `UPDATE heroes SET ${updates.join(', ')} WHERE LOWER(hero_name) = LOWER(?)`
      console.log('[Hero Info API] SQL Query:', sqlQuery)
      console.log('[Hero Info API] SQL Params:', params)
      
      const result = await query(sqlQuery, params)
      console.log('[Hero Info API] Update result:', result)
      
      // Handle hero_compatibility upsert if compatibility fields are present in the body
      const compatFields = [
        'partner_hero1',
        'partner_hero2',
        'partner_hero3',
        'partner_hero4',
        'synergy_reason1',
        'synergy_reason2',
        'synergy_reason3',
        'synergy_reason4'
      ]

      const hasCompatPayload = compatFields.some(f => Object.prototype.hasOwnProperty.call(body, f))

      if (hasCompatPayload) {
        const compatValues = compatFields.map(f => {
          if (!Object.prototype.hasOwnProperty.call(body, f)) return null
          const v = body[f]
          return v === undefined || v === null || v === '' ? null : v
        })

        const existing = await query(
          'SELECT id FROM hero_compatibility WHERE LOWER(hero_name) = LOWER(?) LIMIT 1',
          [name]
        )

        if (existing && existing.length > 0) {
          const compatId = existing[0].id
          await query(
            `UPDATE hero_compatibility
             SET partner_hero1 = ?, partner_hero2 = ?, partner_hero3 = ?, partner_hero4 = ?,
                 synergy_reason1 = ?, synergy_reason2 = ?, synergy_reason3 = ?, synergy_reason4 = ?
             WHERE id = ?`,
            [...compatValues, compatId]
          )
        } else {
          await query(
            `INSERT INTO hero_compatibility
             (hero_name, partner_hero1, partner_hero2, partner_hero3, partner_hero4,
              synergy_reason1, synergy_reason2, synergy_reason3, synergy_reason4)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, ...compatValues]
          )
        }
      }

      return res.status(200).json({ ok: true, updated: updates.length })
    } else if (req.method === 'GET') {
      // Fetch hero basic info
      const heroRows = await query(
        `SELECT role, damage_type, attack_reliance, note
         FROM heroes
         WHERE LOWER(hero_name) = LOWER(?)
         LIMIT 1`,
        [name]
      )

      const hero = heroRows && heroRows.length > 0 ? heroRows[0] : null

      // Fetch hero compatibility info
      const compatRows = await query(
        `SELECT partner_hero1, partner_hero2, partner_hero3, partner_hero4,
                synergy_reason1, synergy_reason2, synergy_reason3, synergy_reason4
         FROM hero_compatibility
         WHERE LOWER(hero_name) = LOWER(?)
         LIMIT 1`,
        [name]
      )

      const compatibility = compatRows && compatRows.length > 0
        ? compatRows[0]
        : {
            partner_hero1: '',
            partner_hero2: '',
            partner_hero3: '',
            partner_hero4: '',
            synergy_reason1: '',
            synergy_reason2: '',
            synergy_reason3: '',
            synergy_reason4: ''
          }

      return res.status(200).json({ hero, compatibility })
    }

    res.setHeader('Allow', 'PUT, GET')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    console.error('[Hero Info API] Error:', e.message)
    console.error('[Hero Info API] Full error:', e)
    console.error('[Hero Info API] Error code:', e.code)
    console.error('[Hero Info API] SQL State:', e.sqlState)
    return res.status(500).json({ 
      error: 'Server error', 
      message: e.message,
      code: e.code,
      sqlState: e.sqlState
    })
  }
}
