import { simulateDraftPick, validateDraftTeam, parseHeroesCSV } from '../../lib/draftPick';

export default function handler(req, res) {
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

    res.status(200).json({
      success: true,
      data: {
        selectedHero: draftResult.selected,
        recommendedPartners: draftResult.partners,
        draft: {
          options: draftResult.draftOptions,
          roles: draftResult.draftOptions.map(h => ({
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
