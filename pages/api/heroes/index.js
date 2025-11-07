import { db } from '../../../lib/db'
import { query } from '../../../lib/db'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      console.log('Fetching all heroes from database...')
      const connection = await db()

      // Get all heroes from database
      const [heroes] = await connection.execute('SELECT * FROM heroes ORDER BY hero_name')
      console.log(`Found ${heroes.length} heroes`)

      // Do NOT end the pool per request; Next.js dev server reuses it.
      // Leaving the pool open avoids connection churn and errors.

      res.status(200).json(heroes)
    } catch (error) {
      console.error('Error fetching all heroes:', error)

      // Return empty array when database is not available
      res.status(200).json([])
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
