import { validateDraftTeam, getRecommendedPartnersWithLanes, normalizeDamageType, getPrimaryRole } from '../../lib/draftPick';
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

    // Validate hero exists in DATABASE (single source of truth post-sync)
    const heroCheck = await query(
      'SELECT hero_name FROM heroes WHERE hero_name = ? LIMIT 1',
      [heroName]
    );
    if (!heroCheck || heroCheck.length === 0) {
      return res.status(404).json({ 
        error: `Hero "${heroName}" tidak ditemukan di database. Jalankan 'npm run sync:heroes' untuk sinkronisasi CSV ke DB.` 
      });
    }

    // Fetch selected hero WITH lanes from DB
    let selectedHeroWithLanes = null;
    try {
      const heroData = await query(
        'SELECT * FROM heroes WHERE hero_name = ?',
        [heroName]
      );
      
      if (heroData && heroData.length > 0) {
        const heroLanesData = await query(`
          SELECT l.lane_name, l.description as lane_description, hl.priority
          FROM hero_lanes hl
          JOIN lanes l ON hl.lane_id = l.id
          WHERE hl.hero_name = ?
          ORDER BY hl.priority
        `, [heroName]);

        selectedHeroWithLanes = {
          name: heroData[0].hero_name,
          role: heroData[0].role,
          damageType: heroData[0].damage_type,
          attackReliance: heroData[0].attack_reliance,
          note: heroData[0].note,
          lanes: heroLanesData.map(l => ({
            lane_name: l.lane_name,
            description: l.lane_description,
            priority: l.priority
          }))
        };
      }
    } catch (err) {
      console.error('Error fetching selected hero with lanes:', err);
      return res.status(500).json({ error: 'Failed to fetch hero data' });
    }

    // Fetch ALL heroes WITH lanes from DB (for lane-aware recommendation)
    let allHeroesWithLanes = [];
    try {
      console.log('Fetching all heroes with lanes from database...');
      
      const allHeroesData = await query(`
        SELECT h.hero_name, h.role, h.damage_type, h.attack_reliance, h.note
        FROM heroes h
      `);

      const allLanesData = await query(`
        SELECT hl.hero_name, l.lane_name, l.description as lane_description, hl.priority
        FROM hero_lanes hl
        JOIN lanes l ON hl.lane_id = l.id
        ORDER BY hl.hero_name, hl.priority
      `);

      // Group lanes by hero_name
      const lanesMap = {};
      allLanesData.forEach(row => {
        if (!lanesMap[row.hero_name]) {
          lanesMap[row.hero_name] = [];
        }
        lanesMap[row.hero_name].push({
          lane_name: row.lane_name,
          description: row.lane_description,
          priority: row.priority
        });
      });

      // Combine heroes with their lanes
      allHeroesWithLanes = allHeroesData.map(hero => ({
        name: hero.hero_name,
        role: hero.role,
        damageType: hero.damage_type,
        attackReliance: hero.attack_reliance,
        note: hero.note,
        lanes: lanesMap[hero.hero_name] || []
      }));

      console.log(`Loaded ${allHeroesWithLanes.length} heroes with lanes`);
    } catch (err) {
      console.error('Error fetching all heroes with lanes:', err);
      return res.status(500).json({ error: 'Failed to fetch heroes data' });
    }

    // Fetch hero combos from database BEFORE recommendation (for scoring)
    let heroCombos = [];
    try {
      console.log('Fetching hero combos from database...');
      const combosData = await query('SELECT * FROM hero_combos ORDER BY synergy_score DESC');
      heroCombos = combosData || [];
      console.log(`Loaded ${heroCombos.length} combos from database`);
    } catch (err) {
      console.error('Error fetching combos:', err);
    }

    // Lane-aware recommendation with DB combos (HYBRID!)
    const recommendedPartners = getRecommendedPartnersWithLanes(
      selectedHeroWithLanes,
      allHeroesWithLanes,
      4,
      heroCombos  // Pass combos for scoring
    );

    const draftOptions = [selectedHeroWithLanes, ...recommendedPartners];
    
    // Validate team composition
    const validation = validateDraftTeam(draftOptions);

    // Fetch hero compatibility from database (who this hero is good with)
    let heroCompatibility = null;
    try {
      console.log('Fetching hero compatibility from database...');
      const compatRows = await query(
        `SELECT partner_hero1, partner_hero2, partner_hero3, partner_hero4,
                synergy_reason1, synergy_reason2, synergy_reason3, synergy_reason4
         FROM hero_compatibility
         WHERE LOWER(hero_name) = LOWER(?)
         LIMIT 1`,
        [heroName]
      );
      if (compatRows && compatRows.length > 0) {
        heroCompatibility = compatRows[0];
        console.log('Hero compatibility found for', heroName);
      }
    } catch (err) {
      console.error('Error fetching hero compatibility:', err);
    }

    const compatibilityPartners = [];
    if (heroCompatibility) {
      if (heroCompatibility.partner_hero1) {
        compatibilityPartners.push({
          name: heroCompatibility.partner_hero1,
          reason: heroCompatibility.synergy_reason1 || '',
          slot: 1,
        });
      }
      if (heroCompatibility.partner_hero2) {
        compatibilityPartners.push({
          name: heroCompatibility.partner_hero2,
          reason: heroCompatibility.synergy_reason2 || '',
          slot: 2,
        });
      }
      if (heroCompatibility.partner_hero3) {
        compatibilityPartners.push({
          name: heroCompatibility.partner_hero3,
          reason: heroCompatibility.synergy_reason3 || '',
          slot: 3,
        });
      }
      if (heroCompatibility.partner_hero4) {
        compatibilityPartners.push({
          name: heroCompatibility.partner_hero4,
          reason: heroCompatibility.synergy_reason4 || '',
          slot: 4,
        });
      }
    }

    // Check for combos and compatibility in recommended partners
    const partnersWithCombo = recommendedPartners.map(partner => {
      const combo = heroCombos.find(c => 
        (c.hero1.toLowerCase() === heroName.toLowerCase() && c.hero2.toLowerCase() === partner.name.toLowerCase()) ||
        (c.hero2.toLowerCase() === heroName.toLowerCase() && c.hero1.toLowerCase() === partner.name.toLowerCase())
      );

      const compat = compatibilityPartners.find(c => 
        c.name && c.name.toLowerCase() === partner.name.toLowerCase()
      );

      return {
        ...partner,
        combo: combo ? {
          comboType: combo.combo_type,
          synergyScore: combo.synergy_score,
          description: combo.description
        } : null,
        compatibility: compat ? {
          reason: compat.reason,
          slot: compat.slot,
        } : null,
      };
    });

    // Lane-based assignment: heroes already have lanes from lane-aware recommendation
    let heroesWithLanes = draftOptions;
    const LANE_ORDER = ['Gold Lane', 'Exp Lane', 'Mid Lane', 'Jungling', 'Roaming'];
    const assignedHeroes = new Array(5).fill(null);
    const usedHeroes = new Set();

    try {
      console.log('Assigning heroes to lanes based on lane-aware recommendation...');

      // First pass: Assign heroes to their PRIMARY lanes
      draftOptions.forEach(hero => {
        if (usedHeroes.has(hero.name)) return;
        const primaryLane = hero.lanes.find(l => l.priority === 1);
        if (primaryLane) {
          const laneIndex = LANE_ORDER.indexOf(primaryLane.lane_name);
          if (laneIndex !== -1 && assignedHeroes[laneIndex] === null) {
            assignedHeroes[laneIndex] = hero;
            usedHeroes.add(hero.name);
            console.log(`✓ ${hero.name} → ${primaryLane.lane_name} (primary)`);
          }
        }
      });

      // Second pass: Assign remaining heroes to their SECONDARY/ALTERNATIVE lanes
      draftOptions.forEach(hero => {
        if (usedHeroes.has(hero.name)) return;
        for (const lane of hero.lanes) {
          const laneIndex = LANE_ORDER.indexOf(lane.lane_name);
          if (laneIndex !== -1 && assignedHeroes[laneIndex] === null) {
            assignedHeroes[laneIndex] = hero;
            usedHeroes.add(hero.name);
            console.log(`✓ ${hero.name} → ${lane.lane_name} (priority ${lane.priority})`);
            break;
          }
        }
      });

      // Third pass: Fill empty lanes from allHeroesWithLanes pool (if any slots remain empty)
      for (let i = 0; i < assignedHeroes.length; i++) {
        if (assignedHeroes[i] === null) {
          const targetLane = LANE_ORDER[i];
          
          // Find hero from pool that can fill this lane
          const fillHero = allHeroesWithLanes.find(h => 
            !usedHeroes.has(h.name) &&
            h.lanes.some(l => l.lane_name === targetLane)
          );

          if (fillHero) {
            assignedHeroes[i] = fillHero;
            usedHeroes.add(fillHero.name);
            console.log(`✓ ${fillHero.name} → ${targetLane} (fill from pool)`);
          } else {
            console.log(`⚠ No hero available to fill ${targetLane}`);
          }
        }
      }

      heroesWithLanes = assignedHeroes.filter(h => h !== null);
      console.log(`Lane assignment complete: ${heroesWithLanes.length}/5 lanes filled`);
    } catch (err) {
      console.error('Error fetching lanes from database:', err);
    }

    // Build recommendations structure with lane-aware info
    const selectedPrimaryRole = getPrimaryRole(selectedHeroWithLanes.role);
    const selectedDamageType = normalizeDamageType(selectedHeroWithLanes.damageType);
    const selectedPrimaryLane = selectedHeroWithLanes.lanes?.find(l => l.priority === 1)?.lane_name;

    const partnerRolesWithCompatibility = partnersWithCombo.map(partner => {
      const partnerDamageType = normalizeDamageType(partner.damageType);
      const partnerPrimaryLane = partner.lanes?.find(l => l.priority === 1)?.lane_name;
      const hasDiversity = partnerDamageType !== selectedDamageType;
      const hasLaneDiversity = partnerPrimaryLane && selectedPrimaryLane && partnerPrimaryLane !== selectedPrimaryLane;
      
      const compat = compatibilityPartners.find(c => 
        c.name && c.name.toLowerCase() === partner.name.toLowerCase()
      );

      return {
        name: partner.name,
        role: getPrimaryRole(partner.role),
        damageType: partnerDamageType,
        primaryLane: partnerPrimaryLane,
        diversityBonus: hasDiversity,
        laneDiversityBonus: hasLaneDiversity,
        compatibility: compat ? {
          reason: compat.reason,
          slot: compat.slot,
        } : null,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        selectedHero: {
          ...selectedHeroWithLanes,
          primaryRole: selectedPrimaryRole,
          primaryLane: selectedPrimaryLane,
        },
        recommendedPartners: partnersWithCombo,
        draft: {
          options: heroesWithLanes,
          roles: heroesWithLanes.map(h => ({
            name: h.name,
            role: h.role,
            primaryLane: h.lanes?.find(l => l.priority === 1)?.lane_name,
          })),
        },
        recommendations: {
          pickReason: `${selectedHeroWithLanes.name} adalah ${selectedPrimaryRole} (${selectedPrimaryLane || 'flexible'}) dengan kemampuan ${selectedHeroWithLanes.attackReliance}`,
          partnerRoles: partnerRolesWithCompatibility,
        },
        scoring: {
          selectedDamageType,
          selectedPrimaryLane,
          algorithm: 'Hybrid: CSV Rules + DB Combos + Lane Coverage (Phase 1)',
          factors: {
            basePriority: 'From draft-rules.csv hero_priority (1-10)',
            diversityBonus: '+2 if damage type differs',
            synergyBonus: 'From draft-rules.csv synergy rules (+0-3)',
            laneCoverageBonus: '+5 if different primary lane, +3 if unique lanes, -5 if all lanes overlap, +2 if flexible (3+ lanes)',
            comboBonus: 'From hero_combos DB table (+1-5, normalized from synergy_score 70-95)',
          },
        },
        teamValidation: validation,
        combosDetected: partnersWithCombo.filter(p => p.combo !== null).map(p => ({
          hero: p.name,
          comboType: p.combo.comboType,
          synergyScore: p.combo.synergyScore,
          description: p.combo.description
        })),
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
