import { query } from '../../../../lib/db';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'PUT') {
    // Update combo
    try {
      const { hero1, hero2, combo_type, synergy_score, description } = req.body;

      if (!hero1 || !hero2 || !combo_type) {
        return res.status(400).json({ 
          success: false, 
          error: 'hero1, hero2, and combo_type are required' 
        });
      }

      // Check if combo exists
      const existing = await query('SELECT id FROM hero_combos WHERE id = ?', [id]);
      
      if (!existing || existing.length === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'Combo not found' 
        });
      }

      // Check for duplicate (excluding current combo)
      const duplicate = await query(
        'SELECT id FROM hero_combos WHERE id != ? AND ((hero1 = ? AND hero2 = ?) OR (hero1 = ? AND hero2 = ?))',
        [id, hero1, hero2, hero2, hero1]
      );

      if (duplicate && duplicate.length > 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Another combo with same heroes already exists' 
        });
      }

      await query(
        'UPDATE hero_combos SET hero1 = ?, hero2 = ?, combo_type = ?, synergy_score = ?, description = ? WHERE id = ?',
        [hero1, hero2, combo_type, synergy_score || 80, description || '', id]
      );

      res.status(200).json({ 
        success: true, 
        message: 'Combo updated successfully' 
      });

    } catch (error) {
      console.error('Error updating combo:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }

  } else if (req.method === 'DELETE') {
    // Delete combo
    try {
      const existing = await query('SELECT id FROM hero_combos WHERE id = ?', [id]);
      
      if (!existing || existing.length === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'Combo not found' 
        });
      }

      await query('DELETE FROM hero_combos WHERE id = ?', [id]);

      res.status(200).json({ 
        success: true, 
        message: 'Combo deleted successfully' 
      });

    } catch (error) {
      console.error('Error deleting combo:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }

  } else {
    res.setHeader('Allow', 'PUT, DELETE');
    res.status(405).json({ error: 'Method not allowed' });
  }
}
