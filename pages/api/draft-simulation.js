import { simulateDraftPick, validateDraftTeam, parseHeroesCSV } from '../../lib/draftPick';
import { query } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const heroName = req.query.hero || req.body.hero;

    if (!heroName) {
      return res.status(400).json({ error: 'Parameter hero diperlukan' });
    }

    // Validate hero exists
    const heroes = parseHeroesCSV();
    const heroExists = heroes.some(h => h.name === heroName);
    if (!heroExists) {
      return res.status(404).json({ error: `Hero "${heroName}" tidak ditemukan` });
    }

    // Simulate draft pick
    const draftResult = simulateDraftPick(heroName);

    // Validate team composition
    const validation = validateDraftTeam(draftResult.draftOptions);

    // Fetch lanes data DIRECTLY from database (NOT via fetch)
    let heroesWithLanes = draftResult.draftOptions;
    try {
      console.log('Fetching lanes from database directly...');
      
      // Get lanes for all draft heroes in one query
      const heroNames = draftResult.draftOptions.map(h => h.name);
      const placeholders = heroNames.map(() => '?').join(',');
      
      const lanesData = await query(`
        SELECT hl.hero_name, l.lane_name, l.description as lane_description, hl.priority
        FROM hero_lanes hl
        JOIN lanes l ON hl.lane_id = l.id
        WHERE hl.hero_name IN (${placeholders})
        ORDER BY hl.hero_name, hl.priority
      `, heroNames);

      console.log('Lanes data fetched:', lanesData.length, 'rows');

      // Group lanes by hero_name
      const lanesMap = {};
      lanesData.forEach(row => {
        if (!lanesMap[row.hero_name]) {
          lanesMap[row.hero_name] = [];
        }
        lanesMap[row.hero_name].push({
          lane_name: row.lane_name,
          description: row.lane_description,
          priority: row.priority
        });
      });

      // Attach lanes to heroes
      heroesWithLanes = draftResult.draftOptions.map(hero => {
        const lanes = lanesMap[hero.name] || [];
        console.log(`${hero.name}: ${lanes.length} lanes found`);
        return {
          ...hero,
          lanes
        };
      });
    } catch (err) {
      console.error('Error fetching lanes from database:', err);
    }

    res.status(200).json({
      success: true,
      data: {
        selectedHero: draftResult.selected,
        recommendedPartners: draftResult.partners,
        draft: {
          options: heroesWithLanes,
          roles: heroesWithLanes.map(h => ({
            name: h.name,
            role: h.role,
          })),
        },
        recommendations: draftResult.recommendations,
        teamValidation: validation,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Draft simulation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Terjadi kesalahan saat simulasi draft pick',
    });
  }
}
