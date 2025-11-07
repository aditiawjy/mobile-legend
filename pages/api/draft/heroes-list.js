import { parseHeroesCSV } from '../../../lib/draftPick';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const heroes = parseHeroesCSV();

    // Format untuk compatibility dengan ManualDraftPick component
    const formatted = heroes.map(hero => ({
      hero_name: hero.name,
      role: hero.role,
      damage_type: hero.damageType,
      attack_reliance: hero.attackReliance,
      note: hero.note,
    }));

    res.status(200).json(formatted);
  } catch (error) {
    console.error('Error fetching CSV heroes list:', error);
    res.status(500).json({ error: error.message || 'Error fetching heroes list' });
  }
}
