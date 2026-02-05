import { getHeroByNameFromCSV } from '../../lib/heroesCSV';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const name = typeof req.query.name === 'string' ? req.query.name.trim() : '';
  if (!name) return res.status(200).json({});

  try {
    const hero = getHeroByNameFromCSV(name);
    if (!hero) return res.status(200).json({});
    return res.status(200).json(hero);
  } catch (e) {
    console.error('[get_hero_detail] Error:', e);
    return res.status(200).json({});
  }
}
