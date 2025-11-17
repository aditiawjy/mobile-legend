import { db } from '../../../lib/db'
import { query } from '../../../lib/db'
import { loadHeroesFromCSVWithLanes } from '../../../lib/draftPick'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      console.log('Fetching all heroes from database...')
      const connection = await db()

      // Get all heroes from database
      const [heroes] = await connection.execute('SELECT * FROM heroes ORDER BY hero_name')
      console.log(`Found ${heroes.length} heroes`)

      // Get lanes for each hero
      const [lanesData] = await connection.execute(`
        SELECT hl.hero_name, l.lane_name, l.description as lane_description, hl.priority
        FROM hero_lanes hl
        JOIN lanes l ON hl.lane_id = l.id
        ORDER BY hl.hero_name, hl.priority
      `)

      // Group lanes by hero_name
      const lanesMap = {}
      lanesData.forEach(row => {
        if (!lanesMap[row.hero_name]) {
          lanesMap[row.hero_name] = []
        }
        lanesMap[row.hero_name].push({
          lane_name: row.lane_name,
          description: row.lane_description,
          priority: row.priority
        })
      })

      // Get hero counters from hero_counter table
      const [counterRows] = await connection.execute(`
        SELECT hero_name,
               counter_hero1, counter_hero2, counter_hero3, counter_hero4, counter_hero5, counter_hero6, counter_hero7, counter_hero8, counter_hero9, counter_hero10, counter_hero11, counter_hero12, counter_hero13, counter_hero14,
               counter_reason1, counter_reason2, counter_reason3, counter_reason4, counter_reason5, counter_reason6, counter_reason7, counter_reason8, counter_reason9, counter_reason10, counter_reason11, counter_reason12, counter_reason13, counter_reason14
        FROM hero_counter
      `)

      const countersMap = {}
      counterRows.forEach(row => {
        if (!row.hero_name) return
        if (!countersMap[row.hero_name]) {
          countersMap[row.hero_name] = []
        }

        const pushCounter = (enemy, reason) => {
          if (enemy && enemy.trim()) {
            const cleanEnemy = enemy.trim()
            countersMap[row.hero_name].push({
              enemy: cleanEnemy,
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
      })

      // Attach lanes and counters to each hero
      const heroesWithLanes = heroes.map(hero => ({
        ...hero,
        lanes: lanesMap[hero.hero_name] || [],
        counters: countersMap[hero.hero_name] || []
      }))

      // Do NOT end the pool per request; Next.js dev server reuses it.
      // Leaving the pool open avoids connection churn and errors.

      res.status(200).json(heroesWithLanes)
    } catch (error) {
      console.error('Error fetching all heroes from database:', error)
      console.log('Attempting fallback to CSV data...')

      try {
        // Fallback to CSV data when database is unavailable
        const heroesFromCSV = loadHeroesFromCSVWithLanes()
        console.log(`Successfully loaded ${heroesFromCSV.length} heroes from CSV fallback`)
        res.status(200).json(heroesFromCSV)
      } catch (csvError) {
        console.error('Error loading heroes from CSV fallback:', csvError)
        // Only return empty array if both database and CSV fail
        res.status(200).json([])
      }
    }
  } else if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const { hero_name, role, damage_type, attack_reliance, note } = body

      console.log('POST /api/heroes - Creating hero:', { hero_name, role, damage_type, attack_reliance, note })

      if (!hero_name || !hero_name.trim()) {
        return res.status(400).json({ error: 'hero_name is required' })
      }

      // Check if hero already exists
      const existing = await query(
        'SELECT hero_name FROM heroes WHERE LOWER(hero_name) = LOWER(?)',
        [hero_name.trim()]
      )

      if (existing && existing.length > 0) {
        return res.status(400).json({ error: 'Hero already exists' })
      }

      // Check which columns exist in the heroes table
      const columns = await query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'heroes'`
      )
      const columnNames = columns.map(col => col.COLUMN_NAME)
      console.log('Available columns:', columnNames)

      // Build dynamic INSERT based on available columns
      const fieldsToInsert = { hero_name: hero_name.trim() }
      if (columnNames.includes('role') && role) fieldsToInsert.role = role
      if (columnNames.includes('damage_type') && damage_type) fieldsToInsert.damage_type = damage_type
      if (columnNames.includes('attack_reliance') && attack_reliance) fieldsToInsert.attack_reliance = attack_reliance
      if (columnNames.includes('note') && note) fieldsToInsert.note = note

      const fieldNames = Object.keys(fieldsToInsert)
      const placeholders = fieldNames.map(() => '?').join(', ')
      const values = fieldNames.map(key => fieldsToInsert[key])

      console.log('Inserting fields:', fieldNames)
      console.log('Inserting hero into database...')
      
      const result = await query(
        `INSERT INTO heroes (${fieldNames.join(', ')}) VALUES (${placeholders})`,
        values
      )
      console.log('Hero created successfully:', result)

      res.status(201).json({ ok: true, hero_name: hero_name.trim() })
    } catch (error) {
      console.error('Error creating hero:', error.message)
      console.error('Full error:', error)
      console.error('Error code:', error.code)
      console.error('Error errno:', error.errno)
      console.error('SQL State:', error.sqlState)
      
      // Return detailed error to help with debugging
      const errorMsg = error.message || error.sqlMessage || 'Failed to create hero'
      console.error('Returning error:', errorMsg)
      
      res.status(500).json({ 
        error: errorMsg,
        code: error.code,
        sqlState: error.sqlState
      })
    }
  } else {
    res.setHeader('Allow', 'GET, POST')
    res.status(405).json({ message: 'Method not allowed' })
  }
}
