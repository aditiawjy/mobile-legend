import { getHeroByNameFromCSV } from '../../../../lib/heroesCSV';

export default async function handler(req, res) {
  const raw = Array.isArray(req.query.name) ? req.query.name[0] : req.query.name;
  const name = (raw || '').trim();
  if (!name) return res.status(400).json({ error: 'name is required' });

  try {
    if (req.method === 'PUT') {
      // PUT not supported with CSV storage
      return res.status(501).json({
        error: 'Updating hero info via API is not supported with CSV storage',
        message: 'Please update hero info directly in public/csv/heroes.csv file',
      });
    } else if (req.method === 'GET') {
      // Fetch hero basic info from CSV
      const hero = getHeroByNameFromCSV(name);

      if (!hero) {
        return res.status(404).json({
          error: 'Hero not found',
          hero: null,
          compatibility: {
            partner_hero1: '',
            partner_hero2: '',
            partner_hero3: '',
            partner_hero4: '',
            synergy_reason1: '',
            synergy_reason2: '',
            synergy_reason3: '',
            synergy_reason4: '',
          },
          counters: [],
        });
      }

      // CSV tidak memiliki data compatibility dan counter
      // Return default empty values
      const compatibility = {
        partner_hero1: '',
        partner_hero2: '',
        partner_hero3: '',
        partner_hero4: '',
        synergy_reason1: '',
        synergy_reason2: '',
        synergy_reason3: '',
        synergy_reason4: '',
      };

      const counters = [];

      return res.status(200).json({
        hero: {
          role: hero.role || null,
          damage_type: hero.damage_type || null,
          attack_reliance: hero.attack_reliance || null,
          note: hero.note || null,
        },
        compatibility,
        counters,
      });
    }

    res.setHeader('Allow', 'PUT, GET');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('[Hero Info API] Error:', e.message);
    console.error('[Hero Info API] Full error:', e);
    return res.status(500).json({
      error: 'Server error',
      message: e.message,
    });
  }
}
