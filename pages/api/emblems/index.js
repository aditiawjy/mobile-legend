import { query } from '../../../lib/db'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const rows = await query(`SELECT 
        id,
        emblem_name as name, 
        attributes,
        talent_slot1_options as talent1,
        talent_slot2_options as talent2,
        talent_slot3_options as talent3
        FROM emblems 
        ORDER BY emblem_name ASC`)
      res.status(200).json(rows)
    } catch (error) {
      console.error('Error fetching emblems:', error)
      res.status(500).json([])
    }
  } else if (req.method === 'POST') {
    try {
      const { name, attributes, talent1, talent2, talent3 } = req.body
      
      if (!name) {
        return res.status(400).json({ message: 'Name is required' })
      }

      const result = await query(`
        INSERT INTO emblems (emblem_name, attributes, talent_slot1_options, talent_slot2_options, talent_slot3_options) 
        VALUES (?, ?, ?, ?, ?)
      `, [name, attributes || '', talent1 || '', talent2 || '', talent3 || ''])
      
      res.status(201).json({
        id: result.insertId,
        name,
        attributes,
        talent1,
        talent2,
        talent3
      })
    } catch (error) {
      console.error('Error creating emblem:', error)
      res.status(500).json({ message: 'Failed to create emblem' })
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}
