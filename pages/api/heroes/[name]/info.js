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
      
      // List of fields we want to update on heroes table
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
      
      if (updates.length > 0) {
        params.push(name)
        
        const sqlQuery = `UPDATE heroes SET ${updates.join(', ')} WHERE LOWER(hero_name) = LOWER(?)`
        console.log('[Hero Info API] SQL Query:', sqlQuery)
        console.log('[Hero Info API] SQL Params:', params)
        
        const result = await query(sqlQuery, params)
        console.log('[Hero Info API] Update result:', result)
      } else {
        console.log('[Hero Info API] No hero core fields to update (role/damage_type/attack_reliance/note)')
      }
      
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

      // Handle hero_counter upsert if counter fields are present in the body
      const counterFields = [
        'counter_hero1',
        'counter_hero2',
        'counter_hero3',
        'counter_hero4',
        'counter_hero5',
        'counter_hero6',
        'counter_hero7',
        'counter_hero8',
        'counter_hero9',
        'counter_hero10',
        'counter_hero11',
        'counter_hero12',
        'counter_hero13',
        'counter_hero14',
        'counter_reason1',
        'counter_reason2',
        'counter_reason3',
        'counter_reason4',
        'counter_reason5',
        'counter_reason6',
        'counter_reason7',
        'counter_reason8',
        'counter_reason9',
        'counter_reason10',
        'counter_reason11',
        'counter_reason12',
        'counter_reason13',
        'counter_reason14'
      ]

      const hasCounterPayload = counterFields.some(f => Object.prototype.hasOwnProperty.call(body, f))

      if (hasCounterPayload) {
        const counterValues = counterFields.map(f => {
          if (!Object.prototype.hasOwnProperty.call(body, f)) return null
          const v = body[f]
          return v === undefined || v === null || v === '' ? null : v
        })

        const existingCounter = await query(
          'SELECT id FROM hero_counter WHERE LOWER(hero_name) = LOWER(?) LIMIT 1',
          [name]
        )

        if (existingCounter && existingCounter.length > 0) {
          const counterId = existingCounter[0].id
          await query(
            `UPDATE hero_counter
             SET counter_hero1 = ?, counter_hero2 = ?, counter_hero3 = ?, counter_hero4 = ?, counter_hero5 = ?, counter_hero6 = ?, counter_hero7 = ?, counter_hero8 = ?, counter_hero9 = ?, counter_hero10 = ?, counter_hero11 = ?, counter_hero12 = ?, counter_hero13 = ?, counter_hero14 = ?,
                 counter_reason1 = ?, counter_reason2 = ?, counter_reason3 = ?, counter_reason4 = ?, counter_reason5 = ?, counter_reason6 = ?, counter_reason7 = ?, counter_reason8 = ?, counter_reason9 = ?, counter_reason10 = ?, counter_reason11 = ?, counter_reason12 = ?, counter_reason13 = ?, counter_reason14 = ?
             WHERE id = ?`,
            [...counterValues, counterId]
          )
        } else {
          await query(
            `INSERT INTO hero_counter
             (hero_name,
              counter_hero1, counter_hero2, counter_hero3, counter_hero4, counter_hero5, counter_hero6, counter_hero7, counter_hero8, counter_hero9, counter_hero10, counter_hero11, counter_hero12, counter_hero13, counter_hero14,
              counter_reason1, counter_reason2, counter_reason3, counter_reason4, counter_reason5, counter_reason6, counter_reason7, counter_reason8, counter_reason9, counter_reason10, counter_reason11, counter_reason12, counter_reason13, counter_reason14)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, ...counterValues]
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

      const counterRows = await query(
        `SELECT counter_hero1, counter_hero2, counter_hero3, counter_hero4, counter_hero5, counter_hero6, counter_hero7, counter_hero8, counter_hero9, counter_hero10, counter_hero11, counter_hero12, counter_hero13, counter_hero14,
                counter_reason1, counter_reason2, counter_reason3, counter_reason4, counter_reason5, counter_reason6, counter_reason7, counter_reason8, counter_reason9, counter_reason10, counter_reason11, counter_reason12, counter_reason13, counter_reason14
         FROM hero_counter
         WHERE LOWER(hero_name) = LOWER(?)
         LIMIT 1`,
        [name]
      )

      const counters = []
      if (counterRows && counterRows.length > 0) {
        const row = counterRows[0]
        const pushCounter = (enemy, reason) => {
          if (enemy && enemy.trim()) {
            counters.push({
              enemy: enemy.trim(),
              reason: (reason || '').trim()
            })
          }
        }

        pushCounter(row.counter_hero1, row.counter_reason1)
        pushCounter(row.counter_hero2, row.counter_reason2)
        pushCounter(row.counter_hero3, row.counter_reason3)
        pushCounter(row.counter_hero4, row.counter_reason4)
        pushCounter(row.counter_hero5, row.counter_reason5)
        pushCounter(row.counter_hero6, row.counter_reason6)
        pushCounter(row.counter_hero7, row.counter_reason7)
        pushCounter(row.counter_hero8, row.counter_reason8)
        pushCounter(row.counter_hero9, row.counter_reason9)
        pushCounter(row.counter_hero10, row.counter_reason10)
        pushCounter(row.counter_hero11, row.counter_reason11)
        pushCounter(row.counter_hero12, row.counter_reason12)
        pushCounter(row.counter_hero13, row.counter_reason13)
        pushCounter(row.counter_hero14, row.counter_reason14)
      }

      return res.status(200).json({ hero, compatibility, counters })
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
