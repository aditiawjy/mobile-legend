import { getAllHeroesFromCSV, heroExistsInCSV } from '../../../lib/heroesCSV';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      console.log('Fetching all heroes from CSV...');

      // Get all heroes from CSV
      const heroes = getAllHeroesFromCSV();
      console.log(`Found ${heroes.length} heroes from CSV`);

      res.status(200).json(heroes);
    } catch (error) {
      console.error('Error fetching heroes from CSV:', error);
      res.status(500).json({
        error: 'Failed to load heroes data',
        message: error.message,
      });
    }
  } else if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { hero_name, role, damage_type, attack_reliance, note } = body;

      console.log('POST /api/heroes - Creating hero:', {
        hero_name,
        role,
        damage_type,
        attack_reliance,
        note,
      });

      if (!hero_name || !hero_name.trim()) {
        return res.status(400).json({ error: 'hero_name is required' });
      }

      // Check if hero already exists in CSV
      if (heroExistsInCSV(hero_name.trim())) {
        return res.status(400).json({ error: 'Hero already exists in CSV' });
      }

      // Note: CSV-based storage doesn't support runtime insertion
      // Heroes should be added directly to the CSV file
      return res.status(501).json({
        error: 'Creating heroes via API is not supported with CSV storage',
        message: 'Please add heroes directly to public/csv/heroes.csv file',
        hero: {
          hero_name: hero_name.trim(),
          role: role || '',
          damage_type: damage_type || '',
          attack_reliance: attack_reliance || '',
          note: note || '',
        },
      });
    } catch (error) {
      console.error('Error processing hero creation:', error.message);
      console.error('Full error:', error);

      res.status(500).json({
        error: error.message || 'Failed to process hero creation',
      });
    }
  } else {
    res.setHeader('Allow', 'GET, POST');
    res.status(405).json({ message: 'Method not allowed' });
  }
}
