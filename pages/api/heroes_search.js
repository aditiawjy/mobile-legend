import { searchHeroesFromCSV, getHeroesByRoleFromCSV } from '../../lib/heroesCSV';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const role = typeof req.query.role === 'string' ? req.query.role.trim() : '';

  // Return empty if no query AND no role filter
  if (!q && !role) return res.status(200).json([]);

  try {
    let heroes;

    // Apply filters
    if (q && role) {
      // Both name search and role filter
      heroes = searchHeroesFromCSV(q);
      heroes = heroes.filter((hero) => hero.role.toLowerCase().includes(role.toLowerCase()));
    } else if (q) {
      // Only name search
      heroes = searchHeroesFromCSV(q);
    } else if (role) {
      // Only role filter
      heroes = getHeroesByRoleFromCSV(role);
    }

    // Format response
    const formattedHeroes = heroes.slice(0, 20).map((hero) => ({
      hero_name: hero.hero_name,
      role: hero.role,
    }));

    res.status(200).json(formattedHeroes);
  } catch (e) {
    console.error('Heroes search error:', e);
    res.status(200).json([]);
  }
}
