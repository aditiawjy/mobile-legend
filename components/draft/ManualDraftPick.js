import { useState, useEffect, useRef } from 'react';
import HeroAutocomplete from '../hero/HeroAutocomplete';
import { fetchLanes, getDefaultLanes, LANE_ICONS } from '../../lib/laneConstants';
import { ROLE_ICONS, getRoleIcon, getDamageTypeIcon } from './draftConstants';

export default function ManualDraftPick() {
  const [draftPicks, setDraftPicks] = useState(['', '', '', '', '']);
  const [enemyDraftPicks, setEnemyDraftPicks] = useState(['', '', '', '', '']);
  const [heroDetails, setHeroDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [composition, setComposition] = useState(null);
  const [allHeroesWithLanes, setAllHeroesWithLanes] = useState([]);
  const [heroCombos, setHeroCombos] = useState([]);
  const [heroCompatibility, setHeroCompatibility] = useState({}); // map hero_name(lower) -> compatibility
  const [draftRules, setDraftRules] = useState(null); // CSV rules from draft-rules.csv
  const [lanes, setLanes] = useState(getDefaultLanes()); // Dynamic lanes from DB (replaces DRAFT_POSITIONS)
  const [heroSearch, setHeroSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [damageTypeFilter, setDamageTypeFilter] = useState('');
  const [attackRelianceFilter, setAttackRelianceFilter] = useState('');
  const [laneFilter, setLaneFilter] = useState('');
   const [heroListMode, setHeroListMode] = useState('all');
  const [selectedHeroForDetails, setSelectedHeroForDetails] = useState(null);
  const [activeSlot, setActiveSlot] = useState({ side: 'our', index: 0 });
  const [hoveredHero, setHoveredHero] = useState(null);
  const searchInputRef = useRef(null);

  // Load all heroes with lanes data on mount
  useEffect(() => {
    const loadAllHeroes = async () => {
      try {
        const response = await fetch('/api/heroes');
        if (response.ok) {
          const heroes = await response.json();
          setAllHeroesWithLanes(heroes);
        }
      } catch (error) {
        console.error('Error loading heroes:', error);
      }
    };
    loadAllHeroes();
  }, []);

  // Load hero combos data from database
  useEffect(() => {
    const loadCombos = async () => {
      try {
        const response = await fetch('/api/hero-combos');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.combos) {
            // Map database fields to expected format
            const combos = data.combos.map(combo => ({
              hero1: combo.hero1,
              hero2: combo.hero2,
              comboType: combo.combo_type,
              synergyScore: combo.synergy_score,
              description: combo.description
            }));
            setHeroCombos(combos);
            console.log(`Loaded ${combos.length} combos from database`);
          }
        }
      } catch (error) {
        console.error('Error loading hero combos from database:', error);
      }
    };
    loadCombos();
  }, []);

  // Load draft rules from CSV (Phase 1: Hybrid approach)
  useEffect(() => {
    const loadDraftRules = async () => {
      try {
        const response = await fetch('/api/draft-rules');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setDraftRules(data.data);
            console.log('Loaded draft rules from CSV:', {
              roleCompatibility: Object.keys(data.data.roleCompatibility).length,
              heroPriority: Object.keys(data.data.heroPriority).length,
              synergyRules: data.data.synergyRules.length
            });
          }
        }
      } catch (error) {
        console.error('Error loading draft rules from CSV:', error);
      }
    };
    loadDraftRules();
  }, []);

  // Load lanes from database (data-driven, not hardcoded)
  useEffect(() => {
    async function loadLanes() {
      try {
        const fetchedLanes = await fetchLanes();
        setLanes(fetchedLanes);
        console.log('Loaded lanes from DB:', fetchedLanes.map(l => l.lane).join(', '));
      } catch (error) {
        console.error('Error loading lanes:', error);
        // Keep default lanes as fallback
      }
    }
    loadLanes();
  }, []);

  // Load hero compatibility data for picked heroes (from /api/heroes/[name]/info)
  useEffect(() => {
    const loadCompatibility = async () => {
      // Determine which hero names we need compatibility for
      const namesToFetch = heroDetails
        .map(h => h.hero_name)
        .filter(Boolean)
        .filter(name => !heroCompatibility[name.toLowerCase()]);

      if (namesToFetch.length === 0) return;

      const updates = {};
      for (const heroName of namesToFetch) {
        try {
          const res = await fetch(`/api/heroes/${encodeURIComponent(heroName)}/info`);
          if (!res.ok) continue;
          const info = await res.json();
          if (info && info.compatibility) {
            updates[heroName.toLowerCase()] = info.compatibility;
          }
        } catch (error) {
          console.error('Error loading hero compatibility for', heroName, error);
        }
      }

      if (Object.keys(updates).length > 0) {
        setHeroCompatibility(prev => ({ ...prev, ...updates }));
      }
    };

    if (heroDetails && heroDetails.length > 0) {
      loadCompatibility();
    }
  }, [heroDetails]);

  const handlePickChange = (index, value) => {
    const newPicks = [...draftPicks];
    newPicks[index] = value;
    setDraftPicks(newPicks);
  };

  const handleEnemyPickChange = (index, value) => {
    const newPicks = [...enemyDraftPicks];
    newPicks[index] = value;
    setEnemyDraftPicks(newPicks);
  };

  // Helper: Detect if hero has CC (Crowd Control)
  const hasCC = (hero) => {
    const ar = hero.attack_reliance?.toLowerCase() || '';
    const note = hero.note?.toLowerCase() || '';
    const ccKeywords = ['control', 'crowd', 'stun', 'immobilize', 'knock', 'slow', 'suppress', 'pull', 'freeze', 'terrify'];
    return ccKeywords.some(keyword => ar.includes(keyword) || note.includes(keyword));
  };

  // Helper: Detect if hero has Burst damage
  const hasBurst = (hero) => {
    const ar = hero.attack_reliance?.toLowerCase() || '';
    const note = hero.note?.toLowerCase() || '';
    return ar.includes('burst') || note.includes('burst');
  };

  // Helper: Detect if hero has Area/AoE damage
  const hasAreaDamage = (hero) => {
    const note = hero.note?.toLowerCase() || '';
    const ar = hero.attack_reliance?.toLowerCase() || '';
    return note.includes('area') || note.includes('aoe') || ar.includes('damage') || note.includes('damage area');
  };

  // Helper: Classify Roaming playstyle
  const getRoamingPlaystyle = (hero) => {
    if (!hero) return 'none';
    const role = hero.role?.toLowerCase() || '';
    const ar = hero.attack_reliance?.toLowerCase() || '';
    const note = hero.note?.toLowerCase() || '';
    
    // Pick-off style: Assassin or Chase/Burst
    if (role.includes('assassin') || ar.includes('chase') || ar.includes('burst') || note.includes('pick') || note.includes('assassin')) {
      return 'pick-off';
    }
    
    // Team fight style: Tank/Support with Initiator or Guard
    if ((role.includes('tank') || role.includes('support')) && (ar.includes('initiator') || ar.includes('guard') || note.includes('team'))) {
      return 'team-fight';
    }
    
    return 'general';
  };

  // Helper: Detect if hero is Tank or Tanky (badan tahan)
  const isTankOrTanky = (hero) => {
    const role = hero.role?.toLowerCase() || '';
    const ar = hero.attack_reliance?.toLowerCase() || '';
    const note = hero.note?.toLowerCase() || '';
    
    // Primary: Role contains Tank
    if (role.includes('tank')) return true;
    
    // Secondary: Fighter/Support with durability keywords
    const tankyKeywords = ['guard', 'regen', 'shield', 'defense', 'tebal', 'tahan', 'durability', 'sustain'];
    if ((role.includes('fighter') || role.includes('support')) && 
        tankyKeywords.some(keyword => ar.includes(keyword) || note.includes(keyword))) {
      return true;
    }
    
    return false;
  };

  const hasObjectiveControl = (hero) => {
    const role = hero.role?.toLowerCase() || '';
    const ar = hero.attack_reliance?.toLowerCase() || '';
    const note = hero.note?.toLowerCase() || '';
    const junglerKeywords = ['jungle', 'jungling', 'hyper', 'retri', 'retribution'];
    const objectiveKeywords = ['lord', 'turtle', 'objective', 'secure', 'steal'];

    if (junglerKeywords.some(keyword => ar.includes(keyword) || note.includes(keyword))) {
      return true;
    }

    if (objectiveKeywords.some(keyword => note.includes(keyword))) {
      return true;
    }

    if (role.includes('assassin') || role.includes('fighter')) {
      if (objectiveKeywords.some(keyword => ar.includes(keyword))) {
        return true;
      }
    }

    return false;
  };

  // Helper: Check if hero has combo with picked heroes
  const getComboWith = (hero, pickedHeroNames) => {
    if (!hero || !pickedHeroNames || pickedHeroNames.length === 0) return null;
    
    for (const pickedName of pickedHeroNames) {
      const combo = heroCombos.find(c => 
        (c.hero1.toLowerCase() === hero.hero_name.toLowerCase() && c.hero2.toLowerCase() === pickedName.toLowerCase()) ||
        (c.hero2.toLowerCase() === hero.hero_name.toLowerCase() && c.hero1.toLowerCase() === pickedName.toLowerCase())
      );
      if (combo) {
        return {
          ...combo,
          partnerHero: combo.hero1.toLowerCase() === hero.hero_name.toLowerCase() ? combo.hero2 : combo.hero1
        };
      }
    }
    return null;
  };

  // Get recommended heroes for a specific lane based on already picked heroes
  const getRecommendedHeroesForLane = (laneIndex) => {
    const targetLane = lanes[laneIndex].lane;
    const pickedHeroNames = draftPicks.filter((p, idx) => idx !== laneIndex && p && p.trim());
    const pickedHeroes = heroDetails.filter(h => pickedHeroNames.includes(h.hero_name));

    // Analyze current team composition
    const currentRoles = pickedHeroes.map(h => h.role?.split('/')[0].trim()).filter(Boolean);
    const currentDamageTypes = pickedHeroes.map(h => {
      const dt = h.damage_type?.toLowerCase() || '';
      if (dt.includes('physical') && dt.includes('magic')) return 'mixed';
      if (dt.includes('physical')) return 'physical';
      if (dt.includes('magic')) return 'magic';
      return 'unknown';
    });
    const currentAttackReliance = pickedHeroes.map(h => {
      const ar = h.attack_reliance?.toLowerCase() || '';
      if (ar.includes('basic attack') && ar.includes('skill')) return 'balanced';
      if (ar.includes('basic attack')) return 'basic_attack';
      if (ar.includes('skill')) return 'skill';
      return 'unknown';
    });

    const physicalCount = currentDamageTypes.filter(d => d === 'physical' || d === 'mixed').length;
    const magicCount = currentDamageTypes.filter(d => d === 'magic' || d === 'mixed').length;
    const basicAttackCount = currentAttackReliance.filter(a => a === 'basic_attack' || a === 'balanced').length;
    const skillCount = currentAttackReliance.filter(a => a === 'skill' || a === 'balanced').length;
    
    // Check if team has tank/tanky hero
    const hasTank = pickedHeroes.some(h => isTankOrTanky(h));

    // Filter and score heroes
    const recommended = allHeroesWithLanes
      .filter(hero => {
        // Check if hero has target lane
        const hasTargetLane = hero.lanes && hero.lanes.some(l => l.lane_name === targetLane);
        // Check if not already picked
        const notPicked = !pickedHeroNames.some(name => name.toLowerCase() === hero.hero_name.toLowerCase());
        // Only show heroes that actually have this lane; compatibility affects scoring, not eligibility
        return hasTargetLane && notPicked;
      })
      .map(hero => {
        let score = 0;

        // Score 1: Lane priority (primary = +100, secondary = +50)
        const lanePriority = hero.lanes.find(l => l.lane_name === targetLane)?.priority || 99;
        if (lanePriority === 1) score += 100;
        else if (lanePriority === 2) score += 50;

        // Score 2: Role diversity (+30 if unique role)
        const heroRole = hero.role?.split('/')[0].trim();
        if (heroRole && !currentRoles.includes(heroRole)) {
          score += 30;
        }

        // Score 3: Damage type balance (+40 for balancing damage types)
        const heroDamageType = (() => {
          const dt = hero.damage_type?.toLowerCase() || '';
          if (dt.includes('physical') && dt.includes('magic')) return 'mixed';
          if (dt.includes('physical')) return 'physical';
          if (dt.includes('magic')) return 'magic';
          return 'unknown';
        })();

        // Prefer magic if team has too much physical
        if (physicalCount > magicCount && (heroDamageType === 'magic' || heroDamageType === 'mixed')) {
          score += 40;
        }
        // Prefer physical if team has too much magic
        if (magicCount > physicalCount && (heroDamageType === 'physical' || heroDamageType === 'mixed')) {
          score += 40;
        }
        // Mixed damage is always good
        if (heroDamageType === 'mixed') {
          score += 20;
        }

        // Score 4: Attack reliance balance (+35 for balancing attack reliance)
        const heroAttackReliance = (() => {
          const ar = hero.attack_reliance?.toLowerCase() || '';
          if (ar.includes('basic attack') && ar.includes('skill')) return 'balanced';
          if (ar.includes('basic attack')) return 'basic_attack';
          if (ar.includes('skill')) return 'skill';
          return 'unknown';
        })();

        // Prefer skill-based if team has too much basic attack
        if (basicAttackCount > skillCount && (heroAttackReliance === 'skill' || heroAttackReliance === 'balanced')) {
          score += 35;
        }
        // Prefer basic attack if team has too much skill-based
        if (skillCount > basicAttackCount && (heroAttackReliance === 'basic_attack' || heroAttackReliance === 'balanced')) {
          score += 35;
        }
        // Balanced attack reliance is always good
        if (heroAttackReliance === 'balanced') {
          score += 15;
        }

        // Score 5: Roaming-Mid Lane Synergy (ONLY for Mid Lane recommendations)
        if (laneIndex === 2) { // Mid Lane index
          const roamingHeroName = draftPicks[4]; // Roaming index
          if (roamingHeroName && roamingHeroName.trim()) {
            const roamingHero = pickedHeroes.find(h => 
              h.hero_name.toLowerCase() === roamingHeroName.toLowerCase()
            );
            
            if (roamingHero) {
              const roamPlaystyle = getRoamingPlaystyle(roamingHero);
              const roamHasCC = hasCC(roamingHero);
              const midHasCC = hasCC(hero);
              const midHasBurst = hasBurst(hero);
              const midHasArea = hasAreaDamage(hero);

              // Rule 1: Roaming non-CC → Mid Laner wajib CC (+50 bonus)
              if (!roamHasCC && midHasCC) {
                score += 50;
              }

              // Rule 2: Roaming pick-off → Mid harus burst damage (+45 bonus)
              if (roamPlaystyle === 'pick-off' && midHasBurst) {
                score += 45;
              }

              // Rule 3: Roaming team-fight → Mid harus area damage (+45 bonus)
              if (roamPlaystyle === 'team-fight' && midHasArea) {
                score += 45;
              }
            }
          }
        }

        // Score 6: Tank/Tanky Hero Priority - CRITICAL for team survival
        // If team doesn't have tank yet, prioritize tank heroes (+60 bonus)
        if (!hasTank && isTankOrTanky(hero)) {
          score += 60;
        }

        // Score 7: Hero Combo Synergy - POWERFUL combinations
        // Check if hero has combo with any picked hero
        const combo = getComboWith(hero, pickedHeroNames);
        if (combo) {
          // Add synergy score from combo (normalized: 75-95 score → 40-70 bonus)
          const comboBonus = Math.floor((combo.synergyScore - 50) / 1.5);
          score += comboBonus;
        }

        // Score 8: Hero Compatibility (from hero_compatibility table)
        // If this hero is explicitly marked as a good partner for any picked hero, add a bonus
        const compatMatches = [];
        pickedHeroes.forEach(selHero => {
          if (!selHero || !selHero.hero_name) return;
          const compat = heroCompatibility[selHero.hero_name.toLowerCase()];
          if (!compat) return;

          const targetName = hero.hero_name.toLowerCase();
          // Skip self-compatibility (hero → hero yang sama)
          if (selHero.hero_name.toLowerCase() === targetName) return;

          if (compat.partner_hero1 && compat.partner_hero1.toLowerCase() === targetName) {
            compatMatches.push({
              from: selHero.hero_name,
              slot: 1,
              reason: compat.synergy_reason1 || '',
            });
          }
          if (compat.partner_hero2 && compat.partner_hero2.toLowerCase() === targetName) {
            compatMatches.push({
              from: selHero.hero_name,
              slot: 2,
              reason: compat.synergy_reason2 || '',
            });
          }
          if (compat.partner_hero3 && compat.partner_hero3.toLowerCase() === targetName) {
            compatMatches.push({
              from: selHero.hero_name,
              slot: 3,
              reason: compat.synergy_reason3 || '',
            });
          }
          if (compat.partner_hero4 && compat.partner_hero4.toLowerCase() === targetName) {
            compatMatches.push({
              from: selHero.hero_name,
              slot: 4,
              reason: compat.synergy_reason4 || '',
            });
          }
        });

        if (compatMatches.length > 0) {
          // Small but meaningful bonus for DB-defined compatibility
          score += 25;
        }

        // Score 9: CSV Synergy Rules (Phase 1: Hybrid approach)
        // Check synergy from draft-rules.csv for picked heroes
        if (draftRules && draftRules.synergyRules && pickedHeroes.length > 0) {
          pickedHeroes.forEach(pickedHero => {
            if (!pickedHero || !pickedHero.hero_name) return;
            
            const synergy = draftRules.synergyRules.find(rule => 
              (rule.selectedHero.toLowerCase() === pickedHero.hero_name.toLowerCase() && 
               rule.partnerHero.toLowerCase() === hero.hero_name.toLowerCase()) ||
              (rule.selectedHero.toLowerCase() === hero.hero_name.toLowerCase() && 
               rule.partnerHero.toLowerCase() === pickedHero.hero_name.toLowerCase())
            );
            
            if (synergy && synergy.bonus) {
              // Normalize CSV synergy bonus: +1-3 → +15-45 (align with Manual scale)
              score += synergy.bonus * 15;
            }
          });
        }

        return { ...hero, score, combo, compatMatches };
      })
      .sort((a, b) => b.score - a.score); // Sort by score descending

    // Prioritize heroes with explicit compatibility in the top 5
    const compatHeroes = recommended.filter(h => h.compatMatches && h.compatMatches.length > 0);
    const nonCompatHeroes = recommended.filter(h => !h.compatMatches || h.compatMatches.length === 0);
    const prioritized = [...compatHeroes, ...nonCompatHeroes];

    return prioritized.slice(0, 5); // Top 5 with compatibility prioritized
  };

  const fetchHeroDetails = async (heroNames) => {
    setLoading(true);
    try {
      const validHeroNames = heroNames.filter(name => name && name.trim());
      if (validHeroNames.length === 0) {
        setHeroDetails([]);
        setComposition(null);
        setLoading(false);
        return;
      }

      // Fetch all heroes with lanes from database
      const response = await fetch('/api/heroes');
      const allHeroes = await response.json();

      // Map heroes dalam urutan yang sama dengan draftPicks (maintain order!)
      const selectedHeroes = heroNames
        .map(name => {
          if (!name || !name.trim()) return null;
          return allHeroes.find(hero => 
            hero.hero_name.toLowerCase() === name.toLowerCase()
          );
        })
        .filter(hero => hero !== null && hero !== undefined);

      setHeroDetails(selectedHeroes);

      // Calculate composition
      if (selectedHeroes.length > 0) {
        const roleCount = {};
        const damageTypes = { physical: 0, magic: 0, mixed: 0 };

        selectedHeroes.forEach(hero => {
          // Count roles
          const primaryRole = hero.role ? hero.role.split('/')[0].trim() : 'Unknown';
          roleCount[primaryRole] = (roleCount[primaryRole] || 0) + 1;

          // Count damage types
          const damageType = hero.damage_type ? hero.damage_type.toLowerCase() : '';
          if (damageType.includes('physical')) damageTypes.physical++;
          else if (damageType.includes('magic')) damageTypes.magic++;
          else if (damageType.includes('mixed')) damageTypes.mixed++;
        });

        const isBalanced = Object.keys(roleCount).length >= 3;

        setComposition({
          roleDistribution: roleCount,
          damageTypes,
          isBalanced,
          total: selectedHeroes.length,
        });
      } else {
        setComposition(null);
      }
    } catch (error) {
      console.error('Error fetching hero details:', error);
      setHeroDetails([]);
      setComposition(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchHeroDetails(draftPicks);
    }, 500);

    return () => clearTimeout(timer);
  }, [draftPicks]);

  const handleClearAll = () => {
    setDraftPicks(['', '', '', '', '']);
    setEnemyDraftPicks(['', '', '', '', '']);
    setHeroDetails([]);
    setComposition(null);
  };

  const hasAnyPick = draftPicks.some(pick => pick && pick.trim());

  const uniqueRoles = Array.from(
    new Set(
      allHeroesWithLanes
        .flatMap(h => {
          if (!h.role) return [];
          return h.role.split('/').map(r => {
            const role = r.trim();
            return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
          });
        })
        .filter(Boolean)
    )
  ).sort();

  const uniqueDamageTypes = Array.from(
    new Set(
      allHeroesWithLanes
        .map(h => {
          const dt = h.damage_type || h.damageType || '';
          return dt.trim();
        })
        .filter(Boolean)
    )
  ).sort();

  const uniqueAttackReliance = Array.from(
    new Set(
      allHeroesWithLanes
        .map(h => {
          const ar = h.attack_reliance || h.attackReliance || '';
          return ar.trim();
        })
        .filter(Boolean)
    )
  ).sort();

  const uniqueLanes = Array.from(
    new Set(
      allHeroesWithLanes
        .flatMap(h => (Array.isArray(h.lanes) ? h.lanes.map(l => l.lane_name) : []))
        .filter(Boolean)
    )
  ).sort();

  const filteredHeroes = allHeroesWithLanes.filter(hero => {
    const name = hero.hero_name || hero.name || '';
    const role = hero.role || '';
    const damageType = hero.damage_type || hero.damageType || '';
    const attackRel = hero.attack_reliance || hero.attackReliance || '';
    const lanesList = Array.isArray(hero.lanes) ? hero.lanes.map(l => l.lane_name) : [];

    if (heroSearch && !name.toLowerCase().includes(heroSearch.toLowerCase())) {
      return false;
    }
    if (roleFilter) {
      // Normalize roles for comparison
      const heroRoles = role.split('/').map(r => r.trim().toLowerCase());
      if (!heroRoles.some(r => r === roleFilter.toLowerCase())) {
        return false;
      }
    }
    if (damageTypeFilter && !damageType.toLowerCase().includes(damageTypeFilter.toLowerCase())) {
      return false;
    }
    if (attackRelianceFilter && !attackRel.toLowerCase().includes(attackRelianceFilter.toLowerCase())) {
      return false;
    }
    if (laneFilter && !lanesList.some(l => l.toLowerCase() === laneFilter.toLowerCase())) {
      return false;
    }

    return true;
  });

  const enemyPickedNames = enemyDraftPicks
    .filter(name => name && name.trim())
    .map(name => name.toLowerCase());

  const counterMetaByHeroName = {};

  if (enemyPickedNames.length > 0 && allHeroesWithLanes.length > 0) {
    enemyPickedNames.forEach(enemyNameLower => {
      const enemyHero = allHeroesWithLanes.find(h => {
        const name = h.hero_name || h.name || '';
        return name.toLowerCase() === enemyNameLower;
      });
      if (!enemyHero || !Array.isArray(enemyHero.counters)) return;

      enemyHero.counters.forEach(c => {
        const candidateNameRaw = (c.enemy || '').trim();
        if (!candidateNameRaw) return;
        const candidateHero = allHeroesWithLanes.find(h => {
          const name = h.hero_name || h.name || '';
          return name.toLowerCase() === candidateNameRaw.toLowerCase();
        });
        if (!candidateHero) return;

        const key = (candidateHero.hero_name || candidateHero.name || '').toLowerCase();
        if (!key) return;

        if (!counterMetaByHeroName[key]) {
          counterMetaByHeroName[key] = {
            hero: candidateHero,
            score: 0,
            entries: [],
          };
        }
        counterMetaByHeroName[key].score += 1;

        const enemyLabel = enemyHero.hero_name || enemyHero.name || '';
        if (c.reason && c.reason.trim()) {
          counterMetaByHeroName[key].entries.push(`Vs ${enemyLabel}: ${c.reason.trim()}`);
        } else {
          counterMetaByHeroName[key].entries.push(`Vs ${enemyLabel}`);
        }
      });
    });
  }

  const synergyMetaByHeroName = {};

  if (heroDetails.length > 0 && allHeroesWithLanes.length > 0) {
    const pickedNamesLower = heroDetails
      .map(h => (h.hero_name || '').toLowerCase())
      .filter(Boolean);

    allHeroesWithLanes.forEach(hero => {
      const name = hero.hero_name || hero.name || '';
      const key = name.toLowerCase();
      if (!key) return;
      if (pickedNamesLower.includes(key)) return;

      let score = 0;
      const tags = [];
      const tooltipLines = [];

      heroDetails.forEach(selHero => {
        if (!selHero || !selHero.hero_name) return;
        const selName = selHero.hero_name;
        const selKey = selName.toLowerCase();

        if (heroCombos && heroCombos.length > 0) {
          const combo = heroCombos.find(c =>
            (c.hero1 && c.hero1.toLowerCase() === selKey && c.hero2 && c.hero2.toLowerCase() === key) ||
            (c.hero2 && c.hero2.toLowerCase() === selKey && c.hero1 && c.hero1.toLowerCase() === key)
          );
          if (combo) {
            const bonus = Math.floor((combo.synergyScore - 50) / 1.5);
            if (bonus > 0) {
              score += bonus;
              if (!tags.includes('Combo')) tags.push('Combo');
              const lineBase = `Combo ${selName} + ${name}`;
              if (combo.description && combo.description.trim()) {
                tooltipLines.push(`${lineBase}: ${combo.description.trim()}`);
              } else {
                tooltipLines.push(lineBase);
              }
            }
          }
        }

        const compat = heroCompatibility[selKey];
        if (compat) {
          const target = key;
          const pushCompat = (partner, reason) => {
            if (!partner) return;
            if (partner.toLowerCase() === target) {
              score += 25;
              if (!tags.includes('Compat')) tags.push('Compat');
              const base = `Synergy ${selName} → ${name}`;
              if (reason && reason.trim()) {
                tooltipLines.push(`${base}: ${reason.trim()}`);
              } else {
                tooltipLines.push(base);
              }
            }
          };

          pushCompat(compat.partner_hero1, compat.synergy_reason1);
          pushCompat(compat.partner_hero2, compat.synergy_reason2);
          pushCompat(compat.partner_hero3, compat.synergy_reason3);
          pushCompat(compat.partner_hero4, compat.synergy_reason4);
        }
      });

      if (score > 0) {
        synergyMetaByHeroName[key] = {
          hero,
          score,
          tags,
          tooltip: tooltipLines.join('\n'),
        };
      }
    });
  }

  let displayHeroes = filteredHeroes;

  if (heroListMode === 'counter') {
    displayHeroes = filteredHeroes
      .filter(hero => {
        const name = hero.hero_name || hero.name || '';
        const key = name.toLowerCase();
        return !!counterMetaByHeroName[key];
      })
      .sort((a, b) => {
        const aKey = (a.hero_name || a.name || '').toLowerCase();
        const bKey = (b.hero_name || b.name || '').toLowerCase();
        const aScore = counterMetaByHeroName[aKey]?.score || 0;
        const bScore = counterMetaByHeroName[bKey]?.score || 0;
        return bScore - aScore;
      });
  } else if (heroListMode === 'synergy') {
    displayHeroes = filteredHeroes
      .filter(hero => {
        const name = hero.hero_name || hero.name || '';
        const key = name.toLowerCase();
        return !!synergyMetaByHeroName[key];
      })
      .sort((a, b) => {
        const aKey = (a.hero_name || a.name || '').toLowerCase();
        const bKey = (b.hero_name || b.name || '').toLowerCase();
        const aScore = synergyMetaByHeroName[aKey]?.score || 0;
        const bScore = synergyMetaByHeroName[bKey]?.score || 0;
        return bScore - aScore;
      });
  } else if (heroListMode === 'recommended') {
    const pickedHeroes = heroDetails;
    const hasTank = pickedHeroes.some(h => isTankOrTanky(h));
    
    // Identify active slot and side
    const targetSide = activeSlot?.side || 'our';
    const targetLaneIndex = activeSlot?.index;
    const targetLaneName = (targetSide === 'our' && typeof targetLaneIndex === 'number') 
      ? lanes[targetLaneIndex]?.lane 
      : null;

    // Identify empty lanes
    const emptyLaneNames = lanes
       .filter((l, idx) => !draftPicks[idx] || !draftPicks[idx].trim())
       .map(l => l.lane);

    displayHeroes = filteredHeroes
      .map(hero => {
        let score = 0;
        const name = hero.hero_name || hero.name || '';
        const key = name.toLowerCase();

        // 1. Counter Score (Weight: 15 per counter point)
        const counter = counterMetaByHeroName[key];
        if (counter) score += counter.score * 15;

        // 2. Synergy Score (Weight: 1 per synergy point)
        const synergy = synergyMetaByHeroName[key];
        if (synergy) score += synergy.score;

        // 3. Tank Need (Weight: 50 - Huge Priority)
        // Only apply if we are picking for our team
        if (targetSide === 'our' && !hasTank && isTankOrTanky(hero)) {
            score += 50;
        }
        
        // 4. Lane Need / Active Slot Match (Weight: 40 for Active, 20 for Generic Empty)
        if (targetSide === 'our' && hero.lanes) {
             // If we have an active slot, prioritize hero for that slot
             if (targetLaneName) {
                const activeLaneMatch = hero.lanes.find(l => l.lane_name === targetLaneName);
                if (activeLaneMatch) {
                   score += activeLaneMatch.priority === 1 ? 60 : 30; // Primary lane gets huge boost
                }
             } 
             // Otherwise check if it fills ANY empty lane (fallback)
             else if (emptyLaneNames.length > 0) {
                 const primaryLane = hero.lanes.find(l => l.priority === 1)?.lane_name;
                 if (primaryLane && emptyLaneNames.includes(primaryLane)) {
                     score += 20;
                 }
             }
        }
        
        // 5. Team Composition Balance (Basic)
        if (targetSide === 'our' && composition) {
             const dt = hero.damage_type?.toLowerCase() || '';
             const teamPhysical = composition.damageTypes?.physical || 0;
             const teamMagic = composition.damageTypes?.magic || 0;
             
             // If team lacks magic, boost magic heroes
             if (teamPhysical > teamMagic + 2 && (dt.includes('magic') || dt.includes('mixed'))) {
                 score += 25;
             }
             // If team lacks physical, boost physical heroes
             if (teamMagic > teamPhysical + 2 && (dt.includes('physical') || dt.includes('mixed'))) {
                 score += 25;
             }
        }

        return { ...hero, _recScore: score };
      })
      .sort((a, b) => b._recScore - a._recScore);
  }

  // Validate lanes - relaxed validation
  const laneValidation = () => {
    if (heroDetails.length === 0) return { isValid: true, errors: [], warnings: [] };

    const errors = [];
    const warnings = [];
    const usedLanes = new Set();
    let allLanesFilled = draftPicks.filter(p => p && p.trim()).length === 5;

    // Loop through lanes to maintain correct index mapping
    lanes.forEach((position, idx) => {
      const heroName = draftPicks[idx];
      if (!heroName || !heroName.trim()) return; // Skip empty slots
      
      const hero = heroDetails.find(h => 
        h.hero_name.toLowerCase() === heroName.toLowerCase()
      );
      if (!hero) return; // Skip if hero not loaded yet
      
      const heroLanes = hero.lanes || [];

      // Only validate heroes that HAVE lanes data
      if (heroLanes.length > 0) {
        // Check if hero matches the assigned lane
        const isLaneMatch = heroLanes.some(lane => lane.lane_name === position.lane);
        if (!isLaneMatch) {
          warnings.push(`${hero.hero_name}: Tidak cocok untuk ${position.lane}`);
        }

        // Check for duplicate lanes (based on hero's primary lane)
        const primaryLane = heroLanes.find(l => l.priority === 1)?.lane_name;
        if (primaryLane) {
          if (usedLanes.has(primaryLane)) {
            errors.push(`Duplicate lane: ${primaryLane} (${hero.hero_name})`);
          }
          usedLanes.add(primaryLane);
        }
      }
    });

    if (!allLanesFilled) {
      errors.push(`Draft tidak lengkap: Pilih 5 heroes (${draftPicks.filter(p => p && p.trim()).length}/5)`);
    }

    // CRITICAL: Check if team has tank/tanky hero
    if (allLanesFilled) {
      const allPickedHeroes = lanes.map((position, idx) => {
        const heroName = draftPicks[idx];
        if (!heroName || !heroName.trim()) return null;
        return heroDetails.find(h => h.hero_name.toLowerCase() === heroName.toLowerCase());
      }).filter(h => h !== null && h !== undefined);
      
      const hasTank = allPickedHeroes.some(h => isTankOrTanky(h));
      if (!hasTank) {
        errors.push('⚠️ KRITIS: Tim tidak punya Tank/Hero tahan badan! Tim akan sulit bertahan.');
      }

      const hasAnyCC = allPickedHeroes.some(h => hasCC(h));
      if (!hasAnyCC) {
        warnings.push('Tim tidak punya Crowd Control yang jelas (no hard CC).');
      }

      const hasAnyBurst = allPickedHeroes.some(h => hasBurst(h));
      if (!hasAnyBurst) {
        warnings.push('Tim tidak punya burst damage yang kuat (no burst).');
      }

      const hasAnyObjective = allPickedHeroes.some(h => hasObjectiveControl(h));
      if (!hasAnyObjective) {
        warnings.push('Tim lemah dalam objective control (Turtle/Lord).');
      }
    }

    return {
      isValid: errors.length === 0 && allLanesFilled,
      errors,
      warnings,
      allLanesFilled
    };
  };

  const validation = laneValidation();

  return (
    <div className="w-full mx-auto bg-white text-gray-900 rounded-xl shadow-sm border border-gray-200">
      {/* Sticky Draft Board */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Manual Draft Pick</h1>
          <div className="flex gap-2">
             {hasAnyPick && (
              <button
                onClick={handleClearAll}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs font-semibold transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {/* Our Team */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {lanes.map((position, idx) => {
              const isActive = activeSlot?.side === 'our' && activeSlot?.index === idx;
              const heroName = draftPicks[idx];

              // Real-time Synergy Feedback
              const hasSynergyWithHovered = hoveredHero && heroName && (() => {
                  const key1 = hoveredHero.hero_name.toLowerCase();
                  const key2 = heroName.toLowerCase();
                  // Check DB combo
                  const combo = heroCombos.find(c => 
                      (c.hero1.toLowerCase() === key1 && c.hero2.toLowerCase() === key2) ||
                      (c.hero2.toLowerCase() === key1 && c.hero1.toLowerCase() === key2)
                  );
                  if (combo) return true;

                  // Check Compatibility
                  const compat = heroCompatibility[key2];
                  if (compat) {
                      if (compat.partner_hero1?.toLowerCase() === key1 ||
                          compat.partner_hero2?.toLowerCase() === key1 ||
                          compat.partner_hero3?.toLowerCase() === key1 ||
                          compat.partner_hero4?.toLowerCase() === key1) return true;
                  }
                  return false;
              })();

              const hasCompatWithHovered = hoveredHero && heroName && (() => {
                  const key1 = hoveredHero.hero_name.toLowerCase();
                  const key2 = heroName.toLowerCase();
                  const compat = heroCompatibility[key2];
                  if (compat) {
                      if (compat.partner_hero1?.toLowerCase() === key1 ||
                          compat.partner_hero2?.toLowerCase() === key1 ||
                          compat.partner_hero3?.toLowerCase() === key1 ||
                          compat.partner_hero4?.toLowerCase() === key1) return true;
                  }
                  return false;
              })();

              return (
                <div 
                  key={`our-${idx}`}
                  onClick={() => {
                    setActiveSlot({ side: 'our', index: idx });
                    // Focus search input immediately for speed
                    if (searchInputRef.current) searchInputRef.current.focus();
                  }}
                  className={`flex-1 min-w-[100px] h-24 relative cursor-pointer rounded-lg border-2 transition-all ${
                    hasSynergyWithHovered 
                      ? 'border-green-500 bg-green-50 shadow-[0_0_15px_rgba(74,222,128,0.3)] scale-105 z-10'
                      : isActive 
                        ? 'border-sky-500 bg-sky-50 shadow-[0_0_15px_rgba(14,165,233,0.3)]' 
                        : heroName 
                          ? 'border-blue-400 bg-blue-50'
                          : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  {hasSynergyWithHovered && (
                     <div className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full shadow-lg animate-bounce z-20">
                       {hasCompatWithHovered ? '🤝 Partner!' : '✨ Synergy!'}
                     </div>
                  )}
                  <div className="absolute top-1 left-2 text-xl opacity-60">{position.icon}</div>
                  <div className="absolute top-1 right-2 text-[10px] uppercase tracking-wider text-gray-500">{position.lane}</div>
                  
                  <div className="absolute inset-0 flex flex-col items-center justify-center pt-4">
                    {heroName ? (
                      <>
                         <div className="font-bold text-sm text-center px-1 leading-tight text-gray-800">{heroName}</div>
                         <button 
                           onClick={(e) => { e.stopPropagation(); handlePickChange(idx, ''); }}
                           className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center bg-red-100 hover:bg-red-500 text-red-500 hover:text-white rounded-full text-[10px]"
                         >✕</button>
                      </>
                    ) : (
                      <div className="text-2xl text-gray-300 font-light">+</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Enemy Team */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {lanes.map((position, idx) => {
              const isActive = activeSlot?.side === 'enemy' && activeSlot?.index === idx;
              const heroName = enemyDraftPicks[idx];

              // Real-time Counter Feedback (Warning)
              const isThreatToHovered = hoveredHero && heroName && (() => {
                 // Check if existing enemy hero (heroName) is a counter to hovered hero
                 // Using counterMetaByHeroName logic (which is pre-calculated for hoveredHero vs ENTIRE enemy team, but here we need specific 1v1)
                 
                 // Check if hoveredHero is weak against heroName
                 // hoveredHero.counters contains list of enemies that counter hoveredHero
                 if (hoveredHero.counters && Array.isArray(hoveredHero.counters)) {
                     return hoveredHero.counters.some(c => c.enemy?.toLowerCase() === heroName.toLowerCase());
                 }
                 return false;
              })();

              return (
                <div 
                  key={`enemy-${idx}`}
                  onClick={() => {
                    setActiveSlot({ side: 'enemy', index: idx });
                    // Focus search input immediately for speed
                    if (searchInputRef.current) searchInputRef.current.focus();
                  }}
                  className={`flex-1 min-w-[100px] h-16 relative cursor-pointer rounded-lg border-2 transition-all ${
                    isThreatToHovered
                      ? 'border-red-500 bg-red-50 shadow-[0_0_15px_rgba(239,68,68,0.3)] scale-105 z-10'
                      : isActive 
                        ? 'border-sky-500 bg-sky-50 shadow-[0_0_15px_rgba(14,165,233,0.3)]' 
                        : heroName 
                          ? 'border-red-400 bg-red-50'
                          : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  {isThreatToHovered && (
                     <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full shadow-lg animate-pulse z-20">
                       ⚠️ Threat!
                     </div>
                  )}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {heroName ? (
                      <>
                         <div className="font-bold text-xs text-center px-1 leading-tight text-gray-800">{heroName}</div>
                         <button 
                           onClick={(e) => { e.stopPropagation(); handleEnemyPickChange(idx, ''); }}
                           className="absolute top-1 right-1 w-3 h-3 flex items-center justify-center bg-red-100 hover:bg-red-500 text-red-500 hover:text-white rounded-full text-[8px]"
                         >✕</button>
                      </>
                    ) : (
                      <div className="flex items-center gap-1 text-gray-400">
                         <span className="text-sm">{position.icon}</span>
                         <span className="text-[10px]">Enemy</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      
      <div className="p-6 pt-2">

      <div className="mb-6 rounded-lg bg-gray-50 p-4 border border-gray-200">
        <div className="flex flex-col gap-4">
          {/* Top Row: Search & Role Filters */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="md:w-1/4">
              <label className="block mb-1 text-xs font-semibold text-gray-600">Search Hero</label>
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={heroSearch}
                  onChange={(e) => setHeroSearch(e.target.value)}
                  placeholder="Ketik nama hero..."
                  className="w-full pl-9 pr-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  autoFocus
                />
                <span className="absolute left-3 top-2.5 text-gray-400 text-xs">🔍</span>
              </div>
            </div>
            
            <div className="flex-1 overflow-x-auto pb-1">
              <label className="block mb-1 text-xs font-semibold text-gray-600">Quick Role Filters</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setRoleFilter('')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap border ${
                    roleFilter === ''
                      ? 'bg-sky-500 border-sky-500 text-white shadow-lg shadow-sky-500/20'
                      : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  All Roles
                </button>
                {uniqueRoles.map(role => (
                  <button
                    key={role}
                    onClick={() => setRoleFilter(role === roleFilter ? '' : role)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap border flex items-center gap-1.5 ${
                      roleFilter === role
                        ? 'bg-sky-500 border-sky-500 text-white shadow-lg shadow-sky-500/20'
                        : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span>{getRoleIcon(role)}</span>
                    <span>{role}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Row: Other Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-gray-200">
            <div>
              <label className="block mb-1 text-xs font-semibold text-gray-600">Damage Type</label>
              <select
                value={damageTypeFilter}
                onChange={(e) => setDamageTypeFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                {uniqueDamageTypes.map(dt => (
                  <option key={dt} value={dt}>{dt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 text-xs font-semibold text-gray-600">Attack Reliance</label>
              <select
                value={attackRelianceFilter}
                onChange={(e) => setAttackRelianceFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                {uniqueAttackReliance.map(ar => (
                  <option key={ar} value={ar}>{ar}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 text-xs font-semibold text-gray-600">Lane</label>
              <select
                value={laneFilter}
                onChange={(e) => setLaneFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              >
                <option value="">All Lanes</option>
                {uniqueLanes.map(lane => (
                  <option key={lane} value={lane}>{lane}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        <div className="mt-4 flex gap-2 text-xs border-b border-gray-200 overflow-x-auto">
          <button
            type="button"
            onClick={() => setHeroListMode('all')}
            className={`px-4 py-2 rounded-t-md border-b-2 whitespace-nowrap transition-colors ${
              heroListMode === 'all'
                ? 'border-sky-500 text-sky-600 bg-sky-50 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            Semua Hero
          </button>
          <button
            type="button"
            onClick={() => setHeroListMode('recommended')}
            className={`px-4 py-2 rounded-t-md border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              heroListMode === 'recommended'
                ? 'border-emerald-500 text-emerald-600 bg-emerald-50 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span>💡</span>
            <span>Recommended</span>
          </button>
          <button
            type="button"
            onClick={() => setHeroListMode('counter')}
            className={`px-4 py-2 rounded-t-md border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              heroListMode === 'counter'
                ? 'border-red-500 text-red-600 bg-red-50 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span>⚔️</span>
            <span>Counter Musuh</span>
          </button>
          <button
            type="button"
            onClick={() => setHeroListMode('synergy')}
            className={`px-4 py-2 rounded-t-md border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              heroListMode === 'synergy'
                ? 'border-purple-500 text-purple-600 bg-purple-50 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span>🤝</span>
            <span>Synergy Tim</span>
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-4 lg:flex-row">
          <div className="lg:w-2/3">
            <p className="mb-2 text-xs text-gray-500">
              Hasil: <span className="font-semibold text-gray-700">{displayHeroes.length}</span> hero
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {displayHeroes.slice(0, 40).map(hero => {
                const primaryRole = hero.role ? hero.role.split('/')[0].trim() : 'Unknown';
                const damageType = hero.damage_type || hero.damageType || 'Unknown';
                const attackRel = hero.attack_reliance || hero.attackReliance || 'Unknown';
                const primaryLane = Array.isArray(hero.lanes)
                  ? (hero.lanes.find(l => l.priority === 1)?.lane_name || hero.lanes[0]?.lane_name)
                  : undefined;
                const isSelected = selectedHeroForDetails &&
                  ((selectedHeroForDetails.hero_name || selectedHeroForDetails.name) === (hero.hero_name || hero.name));

                const name = hero.hero_name || hero.name || '';
                const key = name.toLowerCase();
                const counterMeta = counterMetaByHeroName[key];
                const synergyMeta = synergyMetaByHeroName[key];

                const tooltipLines = [];
                if (counterMeta && Array.isArray(counterMeta.entries) && counterMeta.entries.length > 0) {
                  tooltipLines.push(...counterMeta.entries);
                }
                if (synergyMeta && synergyMeta.tooltip) {
                  tooltipLines.push(synergyMeta.tooltip);
                }
                const tooltip = tooltipLines.length > 0 ? tooltipLines.join('\n') : undefined;

                const counterLabel = counterMeta && counterMeta.entries && counterMeta.entries.length > 0
                  ? counterMeta.entries[0]
                  : null;

                const roleIcon = getRoleIcon(primaryRole);
                const damageIcon = getDamageTypeIcon(damageType);

                // Check if picked
                const pickedInOurTeam = draftPicks.some(p => p && p.toLowerCase() === key);
                const pickedInEnemyTeam = enemyDraftPicks.some(p => p && p.toLowerCase() === key);

                return (
                  <div
                    key={hero.hero_name || hero.name}
                    onMouseEnter={() => setHoveredHero(hero)}
                    onMouseLeave={() => setHoveredHero(null)}
                    onClick={() => {
                      if (pickedInOurTeam || pickedInEnemyTeam) return; // Prevent picking already picked hero
                      
                      if (activeSlot) {
                        const heroName = hero.hero_name || hero.name;
                        // Clear search after pick
                        setHeroSearch('');
                        if (searchInputRef.current) searchInputRef.current.focus();

                        if (activeSlot.side === 'our') {
                          handlePickChange(activeSlot.index, heroName);
                          const nextIdx = activeSlot.index < 4 ? activeSlot.index + 1 : 4;
                          if (activeSlot.index < 4) setActiveSlot({ side: 'our', index: nextIdx });
                        } else {
                          handleEnemyPickChange(activeSlot.index, heroName);
                          const nextIdx = activeSlot.index < 4 ? activeSlot.index + 1 : 4;
                          if (activeSlot.index < 4) setActiveSlot({ side: 'enemy', index: nextIdx });
                        }
                      }
                      setSelectedHeroForDetails(hero);
                    }}
                    title={tooltip}
                    className={`relative p-3 text-xs transition-colors border rounded-lg cursor-pointer overflow-hidden ${
                      pickedInOurTeam
                        ? 'bg-blue-50 border-blue-400 opacity-60'
                        : pickedInEnemyTeam
                        ? 'bg-red-50 border-red-400 opacity-60'
                        : isSelected
                        ? 'bg-sky-50 border-sky-500'
                        : 'bg-white border-gray-200 hover:border-sky-400 hover:bg-gray-50 shadow-sm'
                    }`}
                  >
                    {pickedInEnemyTeam && (
                      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                        <span className="text-red-500 text-4xl font-bold opacity-50">✕</span>
                      </div>
                    )}
                    {pickedInOurTeam && (
                      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                        <span className="text-blue-500 text-4xl font-bold opacity-30">✓</span>
                      </div>
                    )}

                    <p className="mb-1 text-sm font-semibold text-gray-800 truncate">
                      {hero.hero_name || hero.name}
                    </p>
                    <p className="mb-1 text-[11px] text-sky-600 truncate flex items-center gap-1">
                      {roleIcon && <span>{roleIcon}</span>}
                      <span>{primaryRole}</span>
                    </p>
                    <p className="text-[11px] text-gray-500 truncate flex items-center gap-1">
                      <span>{damageIcon}</span>
                      <span>{damageType} • {attackRel}</span>
                    </p>
                    {primaryLane && (
                      <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-600 truncate">
                        <span>{LANE_ICONS[primaryLane] || '🔵'}</span>
                        <span>{primaryLane}</span>
                      </div>
                    )}
                    {(counterMeta || synergyMeta || (heroListMode === 'recommended' && hero._recScore > 0)) && (
                      <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
                        {heroListMode === 'recommended' && hero._recScore > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold border border-emerald-300">
                            ⭐ {hero._recScore}
                          </span>
                        )}
                        {counterMeta && (
                          <span className="px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">
                            {counterLabel || 'Counter Musuh'}
                          </span>
                        )}
                        {synergyMeta && (
                          <span className="px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
                            Synergy Tim
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {displayHeroes.length === 0 && (
                <div className="col-span-2 text-xs text-center text-gray-500 sm:col-span-3 lg:col-span-4 xl:col-span-5">
                  Tidak ada hero yang cocok dengan filter.
                </div>
              )}
            </div>
          </div>

          <div className="lg:w-1/3">
            <div className="h-full p-3 border border-gray-200 rounded-lg bg-white shadow-sm">
              {selectedHeroForDetails ? (() => {
                const hero = selectedHeroForDetails;
                const name = hero.hero_name || hero.name || '';
                const primaryRole = hero.role ? hero.role.split('/')[0].trim() : 'Unknown';
                const damageType = hero.damage_type || hero.damageType || 'Unknown';
                const attackRel = hero.attack_reliance || hero.attackReliance || 'Unknown';
                const lanesList = Array.isArray(hero.lanes) ? hero.lanes : [];
                const primaryLane = lanesList.length > 0
                  ? (lanesList.find(l => l.priority === 1)?.lane_name || lanesList[0]?.lane_name)
                  : undefined;
                const counters = Array.isArray(hero.counters) ? hero.counters : [];

                return (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-gray-800 truncate">
                        {name}
                      </h3>
                      {primaryLane && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-[11px] text-emerald-700">
                          <span>{LANE_ICONS[primaryLane] || '🔵'}</span>
                          <span>{primaryLane}</span>
                        </span>
                      )}
                    </div>
                    <p className="mb-1 text-[11px] text-sky-600 truncate">
                      {primaryRole}
                    </p>
                    <p className="mb-3 text-[11px] text-gray-500 truncate">
                      {damageType} • {attackRel}
                    </p>

                    {lanesList.length > 0 && (
                      <div className="mb-3">
                        <p className="mb-1 text-[11px] text-gray-500">Lane rekomendasi</p>
                        <div className="flex flex-wrap gap-1">
                          {lanesList.map(lane => (
                            <span
                              key={`${lane.lane_name}-${lane.priority}`}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] ${
                                lane.priority === 1
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              <span>{LANE_ICONS[lane.lane_name] || '🔵'}</span>
                              <span>{lane.lane_name}</span>
                              {lane.priority === 1 && (
                                <span className="ml-1 text-[9px] text-emerald-100">PRIMARY</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mb-3">
                      <p className="mb-1 text-[11px] text-gray-500">Level kesulitan</p>
                      <p className="text-[12px] text-gray-700">
                        Belum diatur (menggunakan data/rules terpisah jika tersedia).
                      </p>
                    </div>

                    <div className="mb-3">
                      <p className="mb-1 text-[11px] text-gray-500">Kelebihan / karakter hero</p>
                      <div className="max-h-40 overflow-y-auto text-[12px] text-gray-700 whitespace-pre-line">
                        {hero.note && hero.note.trim()
                          ? hero.note
                          : 'Belum ada catatan hero di kolom Note (heroes.csv / tabel heroes).'}
                      </div>
                    </div>

                    {counters.length > 0 && (
                      <div className="mb-1">
                        <p className="mb-1 text-[11px] text-gray-500">Lemah vs (berdasarkan hero_counter)</p>
                        <ul className="space-y-0.5 text-[12px] text-red-600 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                          {counters.map((c, idx) => (
                            <li key={idx}>
                              <span className="font-semibold">{c.enemy}</span>
                              {c.reason && c.reason.trim() && (
                                <span>{` - ${c.reason}`}</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                );
              })() : (
                <div className="flex items-center justify-center h-full text-[12px] text-gray-400 text-center">
                  Klik salah satu hero di daftar untuk melihat detail (Note, lane rekomendasi, dan data counter).
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Validation Summary */}
      {heroDetails.length > 0 && (
        <div className="mb-6">
          {/* Errors */}
          {validation.errors.length > 0 && (
            <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4 mb-3">
              <h3 className="text-lg font-bold text-red-700 mb-2 flex items-center gap-2">
                <span>❌</span> Draft Tidak Valid
              </h3>
              <ul className="text-sm text-red-600 space-y-1">
                {validation.errors.map((error, idx) => (
                  <li key={idx}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {validation.warnings.length > 0 && (
            <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 mb-3">
              <h3 className="text-lg font-bold text-yellow-700 mb-2 flex items-center gap-2">
                <span>⚠️</span> Peringatan
              </h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                {validation.warnings.map((warning, idx) => (
                  <li key={idx}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Success */}
          {validation.isValid && validation.warnings.length === 0 && (
            <div className="bg-green-50 border-2 border-green-400 rounded-lg p-4">
              <h3 className="text-lg font-bold text-green-700 mb-2 flex items-center gap-2">
                <span>✅</span> Draft Valid!
              </h3>
              <p className="text-sm text-green-600">
                Semua lanes terisi dengan benar dan tidak ada duplikat. Tim siap bertanding! 🎉
              </p>
            </div>
          )}
        </div>
      )}

      {/* Requirements Info */}
      <div className="mb-6 bg-sky-50 border-2 border-sky-300 rounded-lg p-4">
        <h3 className="text-lg font-bold text-sky-700 mb-2 flex items-center gap-2">
          <span>ℹ️</span> Requirements Draft Pick
        </h3>
        <ul className="text-sm text-sky-700 space-y-1">
          <li>✓ Pilih 5 heroes (satu untuk setiap lane: Gold, Exp, Mid, Jungling, Roaming)</li>
          <li>✓ Setiap hero harus memiliki data lanes yang sudah dikonfigurasi</li>
          <li>✓ Hero sebaiknya cocok dengan lane yang ditugaskan (akan ada warning jika tidak cocok)</li>
          <li>✓ Tidak boleh ada duplicate primary lanes</li>
          <li>⚠️ Hero tanpa data lanes akan menyebabkan draft invalid</li>
        </ul>
        <div className="mt-3 pt-3 border-t border-sky-200">
          <p className="text-xs text-sky-600">
            💡 Konfigurasi lanes hero di: <a href="/edit-hero-info" className="underline hover:text-sky-800">Edit Hero Info & Lanes</a>
          </p>
        </div>
      </div>



      {loading && (
        <div className="text-center py-8">
          <div className="inline-block w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 mt-3">Loading hero details...</p>
        </div>
      )}

      {/* Hero Details */}
      {heroDetails.length > 0 && !loading && (
        <>
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">
              Draft Summary ({heroDetails.length}/5)
              {heroDetails.length === 5 ? ' ✅' : ` ⚠️ (Kurang ${5 - heroDetails.length} hero)`}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {(() => {
                const enemyPickedNames = enemyDraftPicks
                  .filter(name => name && name.trim())
                  .map(name => name.toLowerCase());

                return lanes.map((position, idx) => {
                  // Find hero for this position from draftPicks (maintain correct index!)
                  const heroName = draftPicks[idx];
                  if (!heroName || !heroName.trim()) return null; // Skip empty slots
                  
                  const hero = heroDetails.find(h => 
                    h.hero_name.toLowerCase() === heroName.toLowerCase()
                  );
                  if (!hero) return null; // Skip if hero not loaded yet
                  
                  const heroLanes = hero.lanes || [];
                  const isLaneMatch = heroLanes.some(lane => lane.lane_name === position.lane);
                  const hasNoLanes = heroLanes.length === 0;

                  const heroCounters = Array.isArray(hero.counters) ? hero.counters : [];
                  const activeCounters = heroCounters.filter(c => 
                    c.enemy && enemyPickedNames.includes(c.enemy.toLowerCase())
                  );
                  
                  return (
                    <div
                      key={hero.hero_name}
                      className={`rounded-lg p-4 border-2 transition-all ${
                        hasNoLanes
                          ? 'bg-gray-50 border-gray-300 hover:shadow-lg'
                          : isLaneMatch
                          ? 'bg-white border-sky-400 hover:shadow-lg shadow-sm'
                          : 'bg-yellow-50 border-yellow-400'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-2">{position.icon}</div>
                        <p className="font-bold text-lg mb-1 text-gray-800">{hero.hero_name}</p>
                        <p className="text-xs text-sky-600 mb-2">{position.lane}</p>
                        <p className="text-sm text-gray-500 mb-2">
                          {hero.role || 'Unknown Role'}
                        </p>
                        
                        {/* Lane Info - Only show if lanes exist */}
                        {heroLanes.length > 0 && (
                          <div className="mt-2 mb-2">
                            <div className="text-xs">
                              <p className="text-gray-500 mb-1">Hero Lanes:</p>
                              <div className="space-y-1">
                                {heroLanes.map((lane, lIdx) => (
                                  <div
                                    key={lIdx}
                                    className={`px-2 py-1 rounded ${
                                      lane.lane_name === position.lane
                                        ? 'bg-green-500 text-white'
                                        : 'bg-gray-100 text-gray-700'
                                    }`}
                                  >
                                    {lane.lane_name}
                                    {lane.priority === 1 && '★'}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Status Badge - Only for lane mismatch */}
                            {!isLaneMatch && (
                              <div className="mt-2 px-2 py-1 bg-yellow-600 rounded text-xs text-white">
                                ⚠ Not typical for {position.lane}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="space-y-1 text-xs text-gray-400 mt-2">
                          <p>
                            <span className="text-gray-500">Damage:</span>{' '}
                            {hero.damage_type || 'Unknown'}
                          </p>
                          <p>
                            <span className="text-gray-500">Type:</span>{' '}
                            {hero.attack_reliance || 'Unknown'}
                          </p>
                        </div>

                        {/* Counter info vs enemy draft */}
                        {activeCounters.length > 0 && (
                          <div className="mt-3 text-xs text-red-300 text-left">
                            <p className="font-semibold flex items-center gap-1 justify-center">
                              <span>⚠️</span>
                              <span>Countered by enemy draft:</span>
                            </p>
                            <ul className="mt-1 space-y-0.5">
                              {activeCounters.map((c, i) => (
                                <li key={i}>
                                  <span className="font-semibold">{c.enemy}</span>
                                  {c.reason && c.reason.trim() && (
                                    <span>{` - ${c.reason}`}</span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* Compatibility Summary */}
          <div className="mb-8 bg-green-900/20 border border-green-600 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-300 mb-2 flex items-center gap-2">
              <span>🤝</span>
              <span>Hero Compatibility Summary</span>
            </h3>
            {(() => {
              const activeCompat = [];
              // For each picked hero, check if they have compat partners also present in the draft
              heroDetails.forEach(sourceHero => {
                const compat = heroCompatibility[sourceHero.hero_name?.toLowerCase()];
                if (!compat) return;

                const partnersInDraft = [];
                const pushIfMatch = (partnerName, slot, reason) => {
                  if (!partnerName) return;
                  // Skip self-compatibility
                  if (partnerName.toLowerCase() === sourceHero.hero_name?.toLowerCase()) return;
                  const match = heroDetails.find(h => h.hero_name && h.hero_name.toLowerCase() === partnerName.toLowerCase());
                  if (match) {
                    partnersInDraft.push({ name: match.hero_name, slot, reason: reason || '' });
                  }
                };

                pushIfMatch(compat.partner_hero1, 1, compat.synergy_reason1);
                pushIfMatch(compat.partner_hero2, 2, compat.synergy_reason2);
                pushIfMatch(compat.partner_hero3, 3, compat.synergy_reason3);
                pushIfMatch(compat.partner_hero4, 4, compat.synergy_reason4);

                if (partnersInDraft.length > 0) {
                  activeCompat.push({
                    hero: sourceHero.hero_name,
                    partners: partnersInDraft,
                  });
                }
              });

              if (activeCompat.length === 0) {
                return (
                  <p className="text-xs text-green-200">
                    Belum ada pasangan hero dalam draft ini yang cocok dengan data hero_compatibility di database.
                  </p>
                );
              }

              return (
                <ul className="space-y-2 text-xs text-green-100">
                  {activeCompat.map((entry, idx) => (
                    <li key={idx}>
                      <span className="font-semibold">{entry.hero}</span>
                      <span className="mx-1">→</span>
                      <span>
                        {entry.partners
                          .map(p => `${p.name} (slot ${p.slot}${p.reason ? `: ${p.reason}` : ''})`)
                          .join(', ')}
                      </span>
                    </li>
                  ))}
                </ul>
              );
            })()}
          </div>

          {/* Counter vs Enemy Draft Summary */}
          <div className="mb-8 bg-red-900/20 border border-red-600 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-red-300 mb-2 flex items-center gap-2">
              <span>\ud83d\udee1</span>
              <span>Counter vs Enemy Draft</span>
            </h3>
            {(() => {
              const enemyPicked = enemyDraftPicks
                .filter(name => name && name.trim())
                .map(name => name.toLowerCase());

              if (enemyPicked.length === 0) {
                return (
                  <p className="text-xs text-red-200">
                    Isi enemy draft di panel kanan untuk melihat apakah ada hero kamu yang tercounter keras oleh draft musuh.
                  </p>
                );
              }

              const threatEntries = [];

              heroDetails.forEach(hero => {
                const heroCounters = Array.isArray(hero.counters) ? hero.counters : [];
                const activeCounters = heroCounters.filter(c => 
                  c.enemy && enemyPicked.includes(c.enemy.toLowerCase())
                );

                if (activeCounters.length > 0) {
                  threatEntries.push({
                    hero: hero.hero_name,
                    counters: activeCounters,
                  });
                }
              });

              if (threatEntries.length === 0) {
                return (
                  <p className="text-xs text-green-200">
                    Tidak ada hard counter yang tercatat di database untuk draft musuh saat ini. Kamu masih aman secara match-up murni.
                  </p>
                );
              }

              return (
                <>
                  <p className="text-xs text-red-200 mb-2">
                    {threatEntries.length}/{heroDetails.length} hero kamu memiliki hard counter di enemy draft (berdasarkan tabel hero_counter).
                  </p>
                  <ul className="space-y-1 text-xs text-red-100">
                    {threatEntries.map((entry, idx) => (
                      <li key={idx}>
                        <span className="font-semibold">{entry.hero}</span>
                        <span className="mx-1">\u2190</span>
                        <span>
                          {entry.counters
                            .map(c => {
                              const base = c.enemy;
                              if (c.reason && c.reason.trim()) {
                                return `${base} (${c.reason})`;
                              }
                              return base;
                            })
                            .join(', ')}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              );
            })()}
          </div>

          {/* Team Composition Analysis */}
          {composition && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">Team Composition Analysis</h3>
              
              {/* Lanes Status */}
              <div className="mb-4 p-3 bg-gray-700 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Lanes Configuration Status</h4>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Heroes with lanes data:</span>
                  <span className={`text-lg font-bold ${
                    heroDetails.filter(h => h.lanes && h.lanes.length > 0).length === 5
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}>
                    {heroDetails.filter(h => h.lanes && h.lanes.length > 0).length} / 5
                  </span>
                </div>
                {heroDetails.filter(h => !h.lanes || h.lanes.length === 0).length > 0 && (
                  <div className="mt-2 text-xs text-red-300">
                    ⚠️ {heroDetails.filter(h => !h.lanes || h.lanes.length === 0).map(h => h.hero_name).join(', ')} belum punya data lanes
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Balance Status */}
                <div className={`p-4 rounded-lg text-center ${
                  composition.isBalanced
                    ? 'bg-green-900 border-2 border-green-500'
                    : 'bg-yellow-900 border-2 border-yellow-500'
                }`}>
                  <p className="text-sm text-gray-300 mb-2">Team Balance</p>
                  <p className="text-2xl font-bold">
                    {composition.isBalanced ? '✓ Balanced' : '⚠ Unbalanced'}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    {composition.isBalanced 
                      ? '3+ different roles' 
                      : 'Need more role diversity'}
                  </p>
                </div>

                {/* Role Distribution */}
                <div className="p-4 bg-gray-700 border border-gray-600 rounded-lg">
                  <p className="text-sm text-gray-300 mb-3 font-semibold">Role Distribution</p>
                  <div className="space-y-2">
                    {Object.entries(composition.roleDistribution).map(([role, count]) => (
                      <div key={role} className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">{role}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-800 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ width: `${(count / composition.total) * 100}%` }}
                            />
                          </div>
                          <span className="font-semibold text-sm w-6 text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Damage Type Distribution */}
                <div className="p-4 bg-gray-700 border border-gray-600 rounded-lg">
                  <p className="text-sm text-gray-300 mb-3 font-semibold">Damage Types</p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-red-400">Physical</span>
                      <span className="font-bold text-lg">{composition.damageTypes.physical}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-purple-400">Magic</span>
                      <span className="font-bold text-lg">{composition.damageTypes.magic}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-yellow-400">Mixed</span>
                      <span className="font-bold text-lg">{composition.damageTypes.mixed}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="mt-6 p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
                <p className="text-sm font-semibold text-blue-300 mb-2">💡 Recommendations:</p>
                <ul className="text-sm text-gray-300 space-y-1">
                  {!composition.isBalanced && (
                    <li>• Add more role diversity for better team balance</li>
                  )}
                  {composition.damageTypes.physical === composition.total && (
                    <li>• Consider adding magic damage heroes for better penetration</li>
                  )}
                  {composition.damageTypes.magic === composition.total && (
                    <li>• Consider adding physical damage heroes for better balance</li>
                  )}
                  {composition.total < 5 && (
                    <li>• Pick {5 - composition.total} more hero(es) to complete the draft</li>
                  )}
                  {composition.isBalanced && composition.total === 5 && (
                    <li>• Your team composition looks great! 🎉</li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </>
      )}

      {!hasAnyPick && !loading && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">Start typing hero names to build your draft team</p>
          <p className="text-sm mt-2">You can pick up to 5 heroes</p>
        </div>
      )}
    </div>
  </div>
  );
}
