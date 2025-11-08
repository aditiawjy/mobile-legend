import { query } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Fetching hero combos from database...');

    // Fetch all combos
    const combos = await query(`
      SELECT 
        id,
        hero1,
        hero2,
        combo_type,
        synergy_score,
        description,
        created_at,
        updated_at
      FROM hero_combos
      ORDER BY synergy_score DESC
    `);

    console.log(`✓ Fetched ${combos.length} combos from database`);

    res.status(200).json({
      success: true,
      totalCombos: combos.length,
      combos: combos
    });

  } catch (error) {
    console.error('Error fetching hero combos:', error);
    
    // Return empty array on error (graceful degradation)
    res.status(200).json({
      success: false,
      totalCombos: 0,
      combos: [],
      error: error.message
    });
  }
}
