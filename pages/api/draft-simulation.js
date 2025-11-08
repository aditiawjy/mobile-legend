import { simulateDraftPick, validateDraftTeam, parseHeroesCSV } from '../../lib/draftPick';

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

    // Fetch lanes data from database for all heroes in draft
    let heroesWithLanes = draftResult.draftOptions;
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/heroes`);
      if (response.ok) {
        const allHeroes = await response.json();
        heroesWithLanes = draftResult.draftOptions.map(hero => {
          const dbHero = allHeroes.find(h => h.hero_name === hero.name);
          return {
            ...hero,
            lanes: dbHero?.lanes || []
          };
        });
      }
    } catch (err) {
      console.error('Error fetching lanes:', err);
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
