import { parseHeroesCSV } from '../../../lib/draftPick';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const query = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
    
    if (!query) {
      return res.status(200).json([]);
    }

    // Parse heroes from CSV
    const allHeroes = parseHeroesCSV();

    // Filter heroes by name (case-insensitive)
    const filtered = allHeroes
      .filter(hero => hero.name.toLowerCase().includes(query))
      .slice(0, 15) // Limit to 15 results
      .map(hero => hero.name);

    res.status(200).json(filtered);
  } catch (error) {
    console.error('CSV heroes search error:', error);
    res.status(200).json([]);
  }
}
