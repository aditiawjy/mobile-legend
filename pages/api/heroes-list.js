import { parseHeroesCSV } from '../../lib/draftPick';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const heroes = parseHeroesCSV();

    res.status(200).json({
      success: true,
      data: heroes,
      total: heroes.length,
    });
  } catch (error) {
    console.error('Error fetching heroes:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error fetching heroes list',
    });
  }
}
