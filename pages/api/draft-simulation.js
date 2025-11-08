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

    // Fetch lanes data DIRECTLY from database and REASSIGN based on lanes
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
      let heroesData = draftResult.draftOptions.map(hero => {
        const lanes = lanesMap[hero.name] || [];
        console.log(`${hero.name}: ${lanes.length} lanes found`);
        return {
          ...hero,
          lanes
        };
      });

      // REORDER heroes based on their lanes to match LANE_ASSIGNMENTS
      const LANE_ORDER = ['Gold Lane', 'Exp Lane', 'Mid Lane', 'Jungling', 'Roaming'];
      const assignedHeroes = new Array(5).fill(null);
      const usedHeroes = new Set();

      // First pass: Assign heroes to their PRIMARY lanes
      heroesData.forEach(hero => {
        if (usedHeroes.has(hero.name)) return;
        const primaryLane = hero.lanes.find(l => l.priority === 1);
        if (primaryLane) {
          const laneIndex = LANE_ORDER.indexOf(primaryLane.lane_name);
          if (laneIndex !== -1 && assignedHeroes[laneIndex] === null) {
            assignedHeroes[laneIndex] = hero;
            usedHeroes.add(hero.name);
            console.log(`✓ ${hero.name} assigned to ${primaryLane.lane_name} (primary)`);
          }
        }
      });

      // Second pass: Assign remaining heroes to their SECONDARY/ANY lanes
      heroesData.forEach(hero => {
        if (usedHeroes.has(hero.name)) return;
        for (const lane of hero.lanes) {
          const laneIndex = LANE_ORDER.indexOf(lane.lane_name);
          if (laneIndex !== -1 && assignedHeroes[laneIndex] === null) {
            assignedHeroes[laneIndex] = hero;
            usedHeroes.add(hero.name);
            console.log(`✓ ${hero.name} assigned to ${lane.lane_name} (secondary, priority ${lane.priority})`);
            break;
          }
        }
      });

      // Third pass: Fill remaining slots with unassigned heroes
      let unassignedIndex = 0;
      for (let i = 0; i < assignedHeroes.length; i++) {
        if (assignedHeroes[i] === null) {
          while (unassignedIndex < heroesData.length && usedHeroes.has(heroesData[unassignedIndex].name)) {
            unassignedIndex++;
          }
          if (unassignedIndex < heroesData.length) {
            assignedHeroes[i] = heroesData[unassignedIndex];
            usedHeroes.add(heroesData[unassignedIndex].name);
            console.log(`⚠ ${heroesData[unassignedIndex].name} assigned to ${LANE_ORDER[i]} (no lanes data)`);
            unassignedIndex++;
          }
        }
      }

      heroesWithLanes = assignedHeroes.filter(h => h !== null);
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
