import { getHeroByNameFromCSV } from '../../../../lib/heroesCSV';

export default async function handler(req, res) {
  const raw = Array.isArray(req.query.name) ? req.query.name[0] : req.query.name;
  const name = (raw || '').trim();
  if (!name) return res.status(400).json({ error: 'name is required' });

  try {
    if (req.method === 'GET') {
      // Get hero data from CSV
      const hero = getHeroByNameFromCSV(name);

      if (!hero) {
        return res.status(404).json({ error: 'Hero not found' });
      }

      // CSV tidak memiliki data attributes terpisah
      // Return empty/default attributes
      return res.status(200).json({
        hero_name: hero.hero_name,
        hp: null,
        physical_attack: null,
        mana: null,
        magic_power: null,
        physical_defense: null,
        physical_defense_pct: null,
        attack_speed: null,
        crit_chance: null,
        magic_defense: null,
        magic_defense_pct: null,
        cd_reduction: null,
        movement_speed: null,
        hp_regen: null,
        mana_regen: null,
        physical_penetration: null,
        physical_penetration_pct: null,
        magic_penetration: null,
        magic_penetration_pct: null,
        lifesteal: null,
        spell_vamp: null,
        basic_attack_range: null,
        resilience: null,
        crit_damage: null,
        healing_effect: null,
        crit_damage_reduction: null,
        healing_received: null,
      });
    }

    if (req.method === 'PUT') {
      // PUT not supported with CSV storage
      return res.status(501).json({
        error: 'Updating attributes via API is not supported with CSV storage',
        message:
          'CSV storage does not support hero attributes. Please use database or add attributes to heroes.csv',
      });
    }

    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('[ATTR] error:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}
