import { query } from '../../../lib/db'

export default async function handler(req, res) {
  // POST: Add lane to hero
  // DELETE: Remove lane from hero
  // GET: Get all hero-lane relationships
  
  if (req.method === 'GET') {
    try {
      const rows = await query(`
        SELECT hl.id, hl.hero_name, hl.lane_id, l.lane_name, hl.priority
        FROM hero_lanes hl
        JOIN lanes l ON hl.lane_id = l.id
        ORDER BY hl.hero_name, hl.priority
      `)
      return res.status(200).json(rows)
    } catch (e) {
      console.error('[hero_lanes GET] error:', e)
      return res.status(500).json({ error: 'Server error', details: e.message })
    }
  }

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const { hero_name, lane_id, priority = 1 } = body

      if (!hero_name || !lane_id) {
        return res.status(400).json({ error: 'hero_name and lane_id are required' })
      }

      // Check if hero exists
      const hero = await query('SELECT hero_name FROM heroes WHERE LOWER(hero_name) = LOWER(?)', [hero_name])
      if (!hero || hero.length === 0) {
        return res.status(404).json({ error: 'Hero not found' })
      }

      // Check if lane exists
      const lane = await query('SELECT id FROM lanes WHERE id = ?', [lane_id])
      if (!lane || lane.length === 0) {
        return res.status(404).json({ error: 'Lane not found' })
      }

      // Insert or update
      await query(
        `INSERT INTO hero_lanes (hero_name, lane_id, priority) 
         VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE priority = VALUES(priority)`,
        [hero_name, lane_id, priority]
      )

      return res.status(201).json({ ok: true, message: 'Hero lane added successfully' })
    } catch (e) {
      console.error('[hero_lanes POST] error:', e)
      return res.status(500).json({ error: 'Server error', details: e.message })
    }
  }

  if (req.method === 'DELETE') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const { hero_name, lane_id } = body

      if (!hero_name || !lane_id) {
        return res.status(400).json({ error: 'hero_name and lane_id are required' })
      }

      await query(
        'DELETE FROM hero_lanes WHERE LOWER(hero_name) = LOWER(?) AND lane_id = ?',
        [hero_name, lane_id]
      )

      return res.status(200).json({ ok: true, message: 'Hero lane removed successfully' })
    } catch (e) {
      console.error('[hero_lanes DELETE] error:', e)
      return res.status(500).json({ error: 'Server error', details: e.message })
    }
  }

  res.setHeader('Allow', 'GET, POST, DELETE')
  return res.status(405).json({ error: 'Method not allowed' })
}
