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
      const { hero_name, role, damage_type, attack_reliance } = body

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

      // Create new hero with all fields
      await query(
        'INSERT INTO heroes (hero_name, role, damage_type, attack_reliance) VALUES (?, ?, ?, ?)',
        [hero_name.trim(), role || '', damage_type || '', attack_reliance || '']
      )

      res.status(201).json({ ok: true, hero_name: hero_name.trim() })
    } catch (error) {
      console.error('Error creating hero:', error)
      res.status(500).json({ error: 'Failed to create hero' })
    }
  } else {
    res.setHeader('Allow', 'GET, POST')
    res.status(405).json({ message: 'Method not allowed' })
  }
}
