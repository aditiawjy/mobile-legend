import { query } from '../../../lib/db'

export default async function handler(req, res) {
  const { id } = req.query
  
  if (!id || isNaN(id)) {
    return res.status(400).json({ message: 'Invalid ID' })
  }

  if (req.method === 'PUT') {
    try {
      const { name, attributes, talent1, talent2, talent3 } = req.body
      
      if (!name) {
        return res.status(400).json({ message: 'Name is required' })
      }

      const result = await query(`
        UPDATE emblems 
        SET emblem_name = ?, attributes = ?, talent_slot1_options = ?, talent_slot2_options = ?, talent_slot3_options = ?
        WHERE id = ?
      `, [name, attributes || '', talent1 || '', talent2 || '', talent3 || '', id])
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Emblem not found' })
      }
      
      res.status(200).json({
        id: parseInt(id),
        name,
        attributes,
        talent1,
        talent2,
        talent3
      })
    } catch (error) {
      console.error('Error updating emblem:', error)
      res.status(500).json({ message: 'Failed to update emblem' })
    }
  } else if (req.method === 'DELETE') {
    try {
      const result = await query('DELETE FROM emblems WHERE id = ?', [id])
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Emblem not found' })
      }
      
      res.status(200).json({ message: 'Emblem deleted successfully' })
    } catch (error) {
      console.error('Error deleting emblem:', error)
      res.status(500).json({ message: 'Failed to delete emblem' })
    }
  } else if (req.method === 'GET') {
    try {
      const rows = await query(`
        SELECT 
          id,
          emblem_name as name, 
          attributes,
          talent_slot1_options as talent1,
          talent_slot2_options as talent2,
          talent_slot3_options as talent3
        FROM emblems 
        WHERE id = ?
      `, [id])
      
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Emblem not found' })
      }
      
      res.status(200).json(rows[0])
    } catch (error) {
      console.error('Error fetching emblem:', error)
      res.status(500).json({ message: 'Failed to fetch emblem' })
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}