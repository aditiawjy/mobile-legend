import { getHeroesCount } from '../../lib/heroesCSV';
import { getItemsCount } from '../../lib/itemsCSV';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('Fetching stats from CSV files...');

    // Get counts from CSV files
    const totalHeroes = getHeroesCount();
    const totalItems = getItemsCount();

    // Matches and Teams masih dari database (tidak ada CSV)
    // Untuk sementara return 0 atau bisa diimplementasikan CSV juga
    const totalMatches = 0;
    const totalTeams = 0;
    const recentHeroes = 0;

    console.log('Stats:', { totalHeroes, totalItems, totalMatches, totalTeams });

    res.status(200).json({
      totalHeroes,
      totalItems,
      totalMatches,
      totalTeams,
      recentHeroes,
      source: 'csv',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching stats from CSV:', error);

    // Return fallback data
    res.status(200).json({
      totalHeroes: 0,
      totalItems: 0,
      totalMatches: 0,
      totalTeams: 0,
      recentHeroes: 0,
      message: 'Error loading stats from CSV',
    });
  }
}
