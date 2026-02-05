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
        return res.status(200).json({
          skill1_name: null,
          skill1_desc: null,
          skill2_name: null,
          skill2_desc: null,
          skill3_name: null,
          skill3_desc: null,
          ultimate_name: null,
          ultimate_desc: null,
          skill4_name: null,
          skill4_desc: null,
        });
      }

      // Map CSV fields to API response format
      return res.status(200).json({
        skill1_name: hero.skill_1_name || null,
        skill1_desc: hero.skill_1_description || null,
        skill2_name: hero.skill_2_name || null,
        skill2_desc: hero.skill_2_description || null,
        skill3_name: hero.skill_3_name || null,
        skill3_desc: hero.skill_3_description || null,
        ultimate_name: hero.ultimate_name || null,
        ultimate_desc: hero.ultimate_description || null,
        skill4_name: hero.skill_4_name || null,
        skill4_desc: hero.skill_4_description || null,
      });
    }

    if (req.method === 'PUT') {
      // PUT not supported with CSV storage
      return res.status(501).json({
        error: 'Updating skills via API is not supported with CSV storage',
        message: 'Please update skills directly in public/csv/heroes.csv file',
      });
    }

    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('[Skills API] Error:', e);
    return res.status(200).json({
      skill1_name: null,
      skill1_desc: null,
      skill2_name: null,
      skill2_desc: null,
      skill3_name: null,
      skill3_desc: null,
      ultimate_name: null,
      ultimate_desc: null,
      skill4_name: null,
      skill4_desc: null,
    });
  }
}
