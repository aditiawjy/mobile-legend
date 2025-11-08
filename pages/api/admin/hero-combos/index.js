import { query } from '../../../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // Create new combo
    try {
      const { hero1, hero2, combo_type, synergy_score, description } = req.body;

      if (!hero1 || !hero2 || !combo_type) {
        return res.status(400).json({ 
          success: false, 
          error: 'hero1, hero2, and combo_type are required' 
        });
      }

      // Check if combo already exists
      const existing = await query(
        'SELECT id FROM hero_combos WHERE (hero1 = ? AND hero2 = ?) OR (hero1 = ? AND hero2 = ?)',
        [hero1, hero2, hero2, hero1]
      );

      if (existing && existing.length > 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Combo already exists' 
        });
      }

      const result = await query(
        'INSERT INTO hero_combos (hero1, hero2, combo_type, synergy_score, description) VALUES (?, ?, ?, ?, ?)',
        [hero1, hero2, combo_type, synergy_score || 80, description || '']
      );

      res.status(201).json({ 
        success: true, 
        id: result.insertId,
        message: 'Combo created successfully' 
      });

    } catch (error) {
      console.error('Error creating combo:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }

  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
  }
}
