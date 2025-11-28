import { useState, useEffect, useRef, useMemo } from 'react';
import HeroAutocomplete from '../hero/HeroAutocomplete';
import { fetchLanes, getDefaultLanes, LANE_ICONS } from '../../lib/laneConstants';
import { ROLE_ICONS, getRoleIcon, getDamageTypeIcon, getDamageTypeColor } from './draftConstants';

export default function ManualDraftPick() {
  // State Initialization - 4 bans per team
  const [draftPicks, setDraftPicks] = useState(['', '', '', '', '']);
  const [enemyDraftPicks, setEnemyDraftPicks] = useState(['', '', '', '', '']);
  const [ourBans, setOurBans] = useState(['', '', '', '']); // 4 bans
  const [enemyBans, setEnemyBans] = useState(['', '', '', '']); // 4 bans
  
  const [heroDetails, setHeroDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [composition, setComposition] = useState(null);
  const [allHeroesWithLanes, setAllHeroesWithLanes] = useState([]);
  const [heroCombos, setHeroCombos] = useState([]);
  const [heroCompatibility, setHeroCompatibility] = useState({}); 
  const [draftRules, setDraftRules] = useState(null);
  const [lanes, setLanes] = useState(getDefaultLanes());
  
  // Filters
  const [heroSearch, setHeroSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [damageTypeFilter, setDamageTypeFilter] = useState('');
  const [attackRelianceFilter, setAttackRelianceFilter] = useState('');
  const [laneFilter, setLaneFilter] = useState('');
  const [heroListMode, setHeroListMode] = useState('all');
  
  const [selectedHeroForDetails, setSelectedHeroForDetails] = useState(null);
  const [activeSlot, setActiveSlot] = useState({ side: 'our', index: 0, type: 'pick' }); 
  const [hoveredHero, setHoveredHero] = useState(null);
  const searchInputRef = useRef(null);

  // Computed: All Banned Heroes
  const allBannedHeroes = [...ourBans, ...enemyBans]
    .filter(name => name && name.trim())
    .map(name => name.toLowerCase());

  // Computed: Validation
  const validation = useMemo(() => {
    const errors = [];
    const warnings = [];
    
    const pickedHeroes = draftPicks.filter(p => p && p.trim());
    const enemyPicked = enemyDraftPicks.filter(p => p && p.trim());
    const ourBansList = ourBans.filter(b => b && b.trim());
    const enemyBansList = enemyBans.filter(b => b && b.trim());
    
    // Check for duplicate heroes in our picks
    const duplicatesInOur = pickedHeroes.filter((hero, idx) => 
      pickedHeroes.findIndex(h => h.toLowerCase() === hero.toLowerCase()) !== idx
    );
    if (duplicatesInOur.length > 0) {
      errors.push(`Duplicate hero in your picks: ${duplicatesInOur[0]}`);
    }
    
    // Check for duplicate bans (same hero banned twice)
    const allBansForCheck = [...ourBansList, ...enemyBansList];
    const duplicateBans = allBansForCheck.filter((ban, idx) => 
      allBansForCheck.findIndex(b => b.toLowerCase() === ban.toLowerCase()) !== idx
    );
    if (duplicateBans.length > 0) {
      errors.push(`Duplicate ban: ${duplicateBans[0]}`);
    }
    
    // Check if our pick is already picked by enemy
    pickedHeroes.forEach(hero => {
      if (enemyPicked.some(e => e.toLowerCase() === hero.toLowerCase())) {
        errors.push(`${hero} is already picked by enemy`);
      }
    });
    
    // Check if picked hero is banned
    pickedHeroes.forEach(hero => {
      if (allBannedHeroes.includes(hero.toLowerCase())) {
        errors.push(`${hero} is banned`);
      }
    });
    
    // Warnings
    if (composition && composition.total >= 3) {
      if (composition.damageTypes.physical === composition.total) {
        warnings.push('All physical damage - consider adding magic damage');
      }
      if (composition.damageTypes.magic === composition.total) {
        warnings.push('All magic damage - consider adding physical damage');
      }
      if (!composition.roleDistribution['Tank'] && composition.total >= 4) {
        warnings.push('No tank in composition');
      }
    }
    
    return { errors, warnings };
  }, [draftPicks, enemyDraftPicks, ourBans, enemyBans, allBannedHeroes, composition]);

  // --- Effects ---

  // Load Heroes
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

  // Load Combos
  useEffect(() => {
    const loadCombos = async () => {
      try {
        const response = await fetch('/api/hero-combos');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.combos) {
            const combos = data.combos.map(combo => ({
              hero1: combo.hero1,
              hero2: combo.hero2,
              comboType: combo.combo_type,
              synergyScore: combo.synergy_score,
              description: combo.description
            }));
            setHeroCombos(combos);
          }
        }
      } catch (error) {
        console.error('Error loading hero combos:', error);
      }
    };
    loadCombos();
  }, []);

  // Load Rules
  useEffect(() => {
    const loadDraftRules = async () => {
      try {
        const response = await fetch('/api/draft-rules');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setDraftRules(data.data);
          }
        }
      } catch (error) {
        console.error('Error loading draft rules:', error);
      }
    };
    loadDraftRules();
  }, []);

  // Load Lanes
  useEffect(() => {
    async function loadLanes() {
      try {
        const fetchedLanes = await fetchLanes();
        setLanes(fetchedLanes);
      } catch (error) {
        console.error('Error loading lanes:', error);
      }
    }
    loadLanes();
  }, []);

  // Load Compatibility for Picked Heroes
  useEffect(() => {
    const loadCompatibility = async () => {
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
          console.error('Error loading hero compatibility:', error);
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

  // --- Helpers ---

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
  
  const handleBanChange = (side, index, heroName) => {
    if (side === 'our') {
      setOurBans(prev => {
        const newBans = [...prev];
        newBans[index] = heroName;
        return newBans;
      });
    } else {
      setEnemyBans(prev => {
        const newBans = [...prev];
        newBans[index] = heroName;
        return newBans;
      });
    }
  };

  const handleClearAll = () => {
    setDraftPicks(['', '', '', '', '']);
    setEnemyDraftPicks(['', '', '', '', '']);
    setOurBans(['', '', '', '']);
    setEnemyBans(['', '', '', '']);
    setHeroDetails([]);
    setComposition(null);
  };

  const hasCC = (hero) => {
    const ar = hero.attack_reliance?.toLowerCase() || '';
    const note = hero.note?.toLowerCase() || '';
    const ccKeywords = ['control', 'crowd', 'stun', 'immobilize', 'knock', 'slow', 'suppress', 'pull', 'freeze', 'terrify'];
    return ccKeywords.some(keyword => ar.includes(keyword) || note.includes(keyword));
  };

  const hasBurst = (hero) => {
    const ar = hero.attack_reliance?.toLowerCase() || '';
    const note = hero.note?.toLowerCase() || '';
    return ar.includes('burst') || note.includes('burst');
  };

  const hasAreaDamage = (hero) => {
    const note = hero.note?.toLowerCase() || '';
    const ar = hero.attack_reliance?.toLowerCase() || '';
    return note.includes('area') || note.includes('aoe') || ar.includes('damage') || note.includes('damage area');
  };

  const getRoamingPlaystyle = (hero) => {
    if (!hero) return 'none';
    const role = hero.role?.toLowerCase() || '';
    const ar = hero.attack_reliance?.toLowerCase() || '';
    const note = hero.note?.toLowerCase() || '';
    
    if (role.includes('assassin') || ar.includes('chase') || ar.includes('burst') || note.includes('pick') || note.includes('assassin')) {
      return 'pick-off';
    }
    
    if ((role.includes('tank') || role.includes('support')) && (ar.includes('initiator') || ar.includes('guard') || note.includes('team'))) {
      return 'team-fight';
    }
    
    return 'general';
  };

  const isTankOrTanky = (hero) => {
    const role = hero.role?.toLowerCase() || '';
    const ar = hero.attack_reliance?.toLowerCase() || '';
    const note = hero.note?.toLowerCase() || '';
    
    if (role.includes('tank')) return true;
    
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

  // Fetch Details Logic
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

      const response = await fetch('/api/heroes');
      const allHeroes = await response.json();

      const selectedHeroes = heroNames
        .map(name => {
          if (!name || !name.trim()) return null;
          return allHeroes.find(hero => 
            hero.hero_name.toLowerCase() === name.toLowerCase()
          );
        })
        .filter(hero => hero !== null && hero !== undefined);

      setHeroDetails(selectedHeroes);

      if (selectedHeroes.length > 0) {
        const roleCount = {};
        const damageTypes = { physical: 0, magic: 0, mixed: 0 };

        selectedHeroes.forEach(hero => {
          const primaryRole = hero.role ? hero.role.split('/')[0].trim() : 'Unknown';
          roleCount[primaryRole] = (roleCount[primaryRole] || 0) + 1;

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


  // --- Derived Data ---
  const hasAnyPick = draftPicks.some(pick => pick && pick.trim());
  const hasAnyBan = [...ourBans, ...enemyBans].some(ban => ban && ban.trim());

  // Unique Filters
  const uniqueRoles = ['Tank', 'Fighter', 'Assassin', 'Mage', 'Marksman', 'Support'];
  const uniqueDamageTypes = ['Physical', 'Magic', 'Mixed']; // Simplified
  const uniqueLanes = lanes.map(l => l.lane);

  // Filter Logic
  const filteredHeroes = allHeroesWithLanes.filter(hero => {
    const name = hero.hero_name || hero.name || '';
    const role = hero.role || '';
    const damageType = hero.damage_type || hero.damageType || '';
    const attackRel = hero.attack_reliance || hero.attackReliance || '';
    const lanesList = Array.isArray(hero.lanes) ? hero.lanes.map(l => l.lane_name) : [];

    if (allBannedHeroes.includes(name.toLowerCase())) return false;
    if (heroSearch && !name.toLowerCase().includes(heroSearch.toLowerCase())) return false;
    if (roleFilter) {
      const heroRoles = role.split('/').map(r => r.trim().toLowerCase());
      if (!heroRoles.some(r => r === roleFilter.toLowerCase())) return false;
    }
    if (damageTypeFilter && !damageType.toLowerCase().includes(damageTypeFilter.toLowerCase())) return false;
    if (attackRelianceFilter && !attackRel.toLowerCase().includes(attackRelianceFilter.toLowerCase())) return false;
    if (laneFilter && !lanesList.some(l => l.toLowerCase() === laneFilter.toLowerCase())) return false;

    return true;
  });

  // Meta Calculations
  const enemyPickedNames = enemyDraftPicks
    .filter(name => name && name.trim())
    .map(name => name.toLowerCase());

  const counterMetaByHeroName = {};
  if (enemyPickedNames.length > 0 && allHeroesWithLanes.length > 0) {
    enemyPickedNames.forEach(enemyNameLower => {
      const enemyHero = allHeroesWithLanes.find(h => (h.hero_name || h.name || '').toLowerCase() === enemyNameLower);
      if (!enemyHero || !Array.isArray(enemyHero.counters)) return;

      enemyHero.counters.forEach(c => {
        const candidateNameRaw = (c.enemy || '').trim();
        if (!candidateNameRaw) return;
        const candidateHero = allHeroesWithLanes.find(h => (h.hero_name || h.name || '').toLowerCase() === candidateNameRaw.toLowerCase());
        if (!candidateHero) return;

        const key = (candidateHero.hero_name || candidateHero.name || '').toLowerCase();
        if (!counterMetaByHeroName[key]) {
          counterMetaByHeroName[key] = { hero: candidateHero, score: 0, entries: [] };
        }
        counterMetaByHeroName[key].score += 1;
        const enemyLabel = enemyHero.hero_name || enemyHero.name || '';
        counterMetaByHeroName[key].entries.push(c.reason ? `Vs ${enemyLabel}: ${c.reason}` : `Vs ${enemyLabel}`);
      });
    });
  }

  const synergyMetaByHeroName = {};
  if (heroDetails.length > 0 && allHeroesWithLanes.length > 0) {
    const pickedNamesLower = heroDetails.map(h => (h.hero_name || '').toLowerCase()).filter(Boolean);
    allHeroesWithLanes.forEach(hero => {
      const name = hero.hero_name || hero.name || '';
      const key = name.toLowerCase();
      if (!key || pickedNamesLower.includes(key)) return;

      let score = 0;
      const tags = [];
      const tooltipLines = [];

      heroDetails.forEach(selHero => {
        if (!selHero || !selHero.hero_name) return;
        const selKey = selHero.hero_name.toLowerCase();
        
        // Combos
        if (heroCombos) {
            const combo = heroCombos.find(c => 
                (c.hero1.toLowerCase() === selKey && c.hero2.toLowerCase() === key) ||
                (c.hero2.toLowerCase() === selKey && c.hero1.toLowerCase() === key)
            );
            if (combo) {
                const bonus = Math.floor((combo.synergyScore - 50) / 1.5);
                if (bonus > 0) score += bonus;
                tooltipLines.push(`Combo w/ ${selHero.hero_name}`);
            }
        }
        
        // Compatibility
        const compat = heroCompatibility[selKey];
        if (compat) {
             if ([compat.partner_hero1, compat.partner_hero2, compat.partner_hero3, compat.partner_hero4]
                 .some(p => p && p.toLowerCase() === key)) {
                 score += 25;
                 tooltipLines.push(`Synergy w/ ${selHero.hero_name}`);
             }
        }
      });

      if (score > 0) {
        synergyMetaByHeroName[key] = { hero, score, tags, tooltip: tooltipLines.join('\n') };
      }
    });
  }

  // Display List Sorting/Filtering
  let displayHeroes = filteredHeroes;
  if (heroListMode === 'counter') {
     displayHeroes = filteredHeroes.filter(h => counterMetaByHeroName[h.hero_name.toLowerCase()])
        .sort((a,b) => (counterMetaByHeroName[b.hero_name.toLowerCase()]?.score || 0) - (counterMetaByHeroName[a.hero_name.toLowerCase()]?.score || 0));
  } else if (heroListMode === 'synergy') {
     displayHeroes = filteredHeroes.filter(h => synergyMetaByHeroName[h.hero_name.toLowerCase()])
        .sort((a,b) => (synergyMetaByHeroName[b.hero_name.toLowerCase()]?.score || 0) - (synergyMetaByHeroName[a.hero_name.toLowerCase()]?.score || 0));
  } else if (heroListMode === 'recommended') {
      // Simplified recommendation logic for brevity
      const targetSide = activeSlot?.side || 'our';
      const hasTank = heroDetails.some(isTankOrTanky);
      displayHeroes = filteredHeroes.map(h => {
          let score = 0;
          const key = h.hero_name.toLowerCase();
          if (counterMetaByHeroName[key]) score += counterMetaByHeroName[key].score * 15;
          if (synergyMetaByHeroName[key]) score += synergyMetaByHeroName[key].score;
          if (targetSide === 'our' && !hasTank && isTankOrTanky(h)) score += 50;
          return { ...h, _recScore: score };
      }).sort((a,b) => b._recScore - a._recScore);
  }

  // --- Render ---
  return (
    <div className="flex flex-col h-screen max-h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans selection:bg-cyan-500/30">
      
      {/* Header / Status Bar */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shrink-0 shadow-lg z-20">
        <div className="flex items-center gap-4">
          <a href="/" className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors mr-2">
            ←
          </a>
          <div className="flex flex-col">
            <h1 className="text-xl font-black tracking-tight text-white uppercase italic">
              <span className="text-cyan-400">Tournament</span> Draft
            </h1>
            <div className="flex gap-1 h-1 mt-1 w-full bg-slate-800 rounded-full overflow-hidden">
               {[...Array(10)].map((_, i) => (
                 <div key={i} className={`flex-1 ${
                    i < 5 
                      ? (draftPicks[i] ? 'bg-cyan-500' : 'bg-slate-700')
                      : (enemyDraftPicks[i-5] ? 'bg-rose-500' : 'bg-slate-700')
                 }`} />
               ))}
            </div>
          </div>
        </div>

        {/* Phase Indicator */}
        <div className="flex flex-col items-center">
           <div className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-0.5">Current Phase</div>
           <div className={`text-xl font-black tracking-wider px-4 py-0.5 rounded flex items-center gap-2 uppercase ${
              activeSlot.side === 'our' 
                ? (activeSlot.type === 'ban' ? 'text-cyan-400 bg-cyan-950/30 border border-cyan-500/30' : 'text-cyan-400 bg-cyan-950/30 border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.2)]')
                : (activeSlot.type === 'ban' ? 'text-rose-400 bg-rose-950/30 border border-rose-500/30' : 'text-rose-400 bg-rose-950/30 border border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.2)]')
           }`}>
              <span>{activeSlot.side === 'our' ? 'BLUE TEAM' : 'RED TEAM'}</span>
              <span>{activeSlot.type}</span>
           </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleClearAll}
            className="px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors uppercase tracking-wider"
          >
            Reset Draft
          </button>
        </div>
      </header>

      {/* Main Arena */}
      <main className="flex-1 flex overflow-hidden relative">
        
        {/* LEFT: Blue Team (Our) */}
        <aside className="w-[340px] flex flex-col bg-gradient-to-r from-slate-900 to-slate-900/50 border-r border-slate-800 shrink-0 relative z-10">
          {/* Bans */}
          <div className="p-4 border-b border-slate-800/50 bg-slate-900/80">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex justify-between">
               <span>Blue Bans</span>
            </div>
            <div className="flex gap-2">
              {ourBans.map((ban, idx) => (
                <div 
                  key={`our-ban-${idx}`}
                  onClick={() => setActiveSlot({ side: 'our', index: idx, type: 'ban' })}
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center cursor-pointer relative overflow-hidden transition-all group ${
                     activeSlot.side === 'our' && activeSlot.type === 'ban' && activeSlot.index === idx
                       ? 'border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.4)] scale-110 z-10'
                       : ban ? 'border-slate-600 opacity-80' : 'border-slate-800 bg-slate-800/50 hover:border-slate-600'
                  }`}
                >
                  {ban ? (
                    <>
                       <div className="absolute inset-0 bg-slate-800">
                          {/* In real app, use Image here */}
                          <div className="w-full h-full flex items-center justify-center bg-slate-700 text-[10px] font-bold text-gray-400">
                            {ban.substring(0, 2)}
                          </div>
                       </div>
                       <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/60">
                          <span className="text-rose-500 text-xl font-bold">✕</span>
                       </div>
                    </>
                  ) : (
                    <span className="text-slate-600 text-xs group-hover:text-slate-400">🚫</span>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Picks */}
          <div className="flex-1 p-4 flex flex-col gap-3 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
             {draftPicks.map((heroName, idx) => {
                const isActive = activeSlot.side === 'our' && activeSlot.type === 'pick' && activeSlot.index === idx;
                const lane = lanes[idx];
                const hero = heroDetails.find(h => h.hero_name === heroName);
                
                return (
                   <div 
                     key={`our-pick-${idx}`}
                     onClick={() => {
                       setActiveSlot({ side: 'our', index: idx, type: 'pick' });
                       if (searchInputRef.current) searchInputRef.current.focus();
                     }}
                     className={`relative flex items-center h-24 rounded-r-xl border-l-4 transition-all cursor-pointer group ${
                        isActive
                          ? 'bg-gradient-to-r from-cyan-950/60 to-transparent border-cyan-400 pl-4'
                          : heroName 
                             ? 'bg-slate-800/40 border-cyan-600/50 hover:bg-slate-800/60 pl-3'
                             : 'bg-slate-900/20 border-slate-700 hover:border-slate-600 pl-2'
                     }`}
                   >
                      {/* Lane Icon Background */}
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 text-6xl text-white/5 pointer-events-none">
                         {lane.icon}
                      </div>
                      
                      {/* Content */}
                      <div className="relative z-10 flex items-center gap-4 w-full">
                         <div className={`w-14 h-14 rounded-lg flex items-center justify-center shadow-lg border border-slate-700/50 ${
                            heroName ? 'bg-slate-700' : 'bg-slate-800/50 border-dashed'
                         }`}>
                            {heroName ? (
                               <span className="text-lg font-bold text-cyan-400">{heroName.charAt(0)}</span>
                            ) : (
                               <span className="text-2xl opacity-20 text-white">+</span>
                            )}
                         </div>
                         
                         <div className="flex-1 min-w-0">
                            {heroName ? (
                               <>
                                  <div className="text-lg font-bold text-white leading-none truncate">{heroName}</div>
                                  <div className="text-xs text-cyan-400/80 mt-1 flex items-center gap-1">
                                     {hero?.role && <span>{getRoleIcon(hero.role)} {hero.role.split('/')[0]}</span>}
                                  </div>
                               </>
                            ) : (
                               <>
                                  <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">{isActive ? 'Picking...' : 'Empty Slot'}</div>
                                  <div className="text-xs text-slate-600 mt-0.5">{lane.lane}</div>
                               </>
                            )}
                         </div>
                      </div>
                      
                      {/* Remove Button */}
                      {heroName && (
                         <button 
                            onClick={(e) => { e.stopPropagation(); handlePickChange(idx, ''); }}
                            className="absolute top-2 right-2 w-5 h-5 rounded flex items-center justify-center text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                         >
                            ✕
                         </button>
                      )}
                   </div>
                );
             })}
          </div>
        </aside>

        {/* CENTER: Hero Pool & Controls */}
        <section className="flex-1 flex flex-col bg-slate-950/80 relative z-0">
           
           {/* Filters Bar */}
           <div className="p-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-20">
              <div className="flex gap-3 mb-3">
                 <div className="relative flex-1">
                    <div className="absolute left-3 top-2.5 text-slate-500">🔍</div>
                    <input 
                       ref={searchInputRef}
                       type="text" 
                       placeholder="Search hero..." 
                       value={heroSearch}
                       onChange={(e) => setHeroSearch(e.target.value)}
                       className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 outline-none transition-all"
                    />
                 </div>
                 
                 {/* Quick Filters */}
                 <div className="flex gap-1">
                    {uniqueRoles.map(role => (
                       <button
                          key={role}
                          onClick={() => setRoleFilter(role === roleFilter ? '' : role)}
                          title={role}
                          className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg border transition-all ${
                             roleFilter === role 
                               ? 'bg-cyan-900/50 border-cyan-500 text-cyan-400 shadow-lg shadow-cyan-500/20' 
                               : 'bg-slate-800 border-slate-700 text-slate-500 hover:bg-slate-700 hover:text-slate-300'
                          }`}
                       >
                          {getRoleIcon(role)}
                       </button>
                    ))}
                 </div>
              </div>

              <div className="flex items-center gap-4 text-xs">
                 <div className="flex bg-slate-800 rounded-lg p-1 gap-1">
                    <button 
                       onClick={() => setHeroListMode('all')}
                       className={`px-3 py-1.5 rounded-md font-semibold transition-all ${heroListMode === 'all' ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                       All Heroes
                    </button>
                    <button 
                       onClick={() => setHeroListMode('recommended')}
                       className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1 ${heroListMode === 'recommended' ? 'bg-emerald-900/30 text-emerald-400 shadow' : 'text-slate-500 hover:text-emerald-400'}`}
                    >
                       <span>💡</span> Recommended
                    </button>
                    <button 
                       onClick={() => setHeroListMode('counter')}
                       className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1 ${heroListMode === 'counter' ? 'bg-rose-900/30 text-rose-400 shadow' : 'text-slate-500 hover:text-rose-400'}`}
                    >
                       <span>⚔️</span> Counters
                    </button>
                 </div>
                 
                 <div className="h-4 w-px bg-slate-700 mx-2" />
                 
                 <select 
                   value={damageTypeFilter}
                   onChange={(e) => setDamageTypeFilter(e.target.value)}
                   className="bg-transparent text-slate-400 font-medium focus:outline-none hover:text-white cursor-pointer"
                 >
                    <option value="">All Damage</option>
                    {uniqueDamageTypes.map(t => <option key={t} value={t}>{t}</option>)}
                 </select>
              </div>
           </div>

           {/* Hero Grid */}
           <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                 {displayHeroes.map(hero => {
                    const name = hero.hero_name || hero.name;
                    const isBanned = allBannedHeroes.includes(name.toLowerCase());
                    const isPicked = draftPicks.includes(name) || enemyDraftPicks.includes(name);
                    const isDisabled = isBanned || isPicked;
                    
                    // Smart Highlights
                    const score = hero._recScore || 0;
                    const isRecommended = heroListMode === 'recommended' && score > 0;
                    
                    return (
                       <div 
                          key={name}
                          onClick={() => {
                             if (isDisabled) return;
                             // Action
                             if (activeSlot.type === 'ban') {
                                handleBanChange(activeSlot.side, activeSlot.index, name);
                                // Auto advance logic could go here
                             } else {
                                if (activeSlot.side === 'our') handlePickChange(activeSlot.index, name);
                                else handleEnemyPickChange(activeSlot.index, name);
                             }
                             setHeroSearch('');
                          }}
                          onMouseEnter={() => setHoveredHero(hero)}
                          onMouseLeave={() => setHoveredHero(null)}
                          className={`
                             relative aspect-[3/4] rounded-lg border overflow-hidden transition-all group
                             ${isDisabled 
                                ? 'opacity-40 grayscale border-slate-800 cursor-not-allowed' 
                                : 'cursor-pointer hover:scale-105 border-slate-700 hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-500/20 hover:z-10 bg-slate-800'
                             }
                             ${isRecommended ? 'ring-2 ring-emerald-500/50' : ''}
                          `}
                       >
                          {/* Placeholder for Hero Image */}
                          <div className="absolute inset-0 bg-gradient-to-b from-slate-700 to-slate-900 flex flex-col items-center justify-center p-2 text-center">
                             <div className="text-3xl mb-1">{getRoleIcon(hero.role)}</div>
                             <div className="text-xs font-bold text-slate-200 leading-tight">{name}</div>
                             <div className={`text-[10px] mt-1 font-medium ${getDamageTypeColor(hero.damage_type)}`}>
                                {hero.damage_type?.split(' ')[0]}
                             </div>
                          </div>
                          
                          {/* Overlay Stats */}
                          {isRecommended && (
                             <div className="absolute top-1 right-1 bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                                {score}
                             </div>
                          )}
                          {isDisabled && (
                             <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <span className="text-red-500 font-bold uppercase rotate-12 border-2 border-red-500 px-2 py-1 rounded text-xs">
                                   {isBanned ? 'Banned' : 'Picked'}
                                </span>
                             </div>
                          )}
                       </div>
                    );
                 })}
              </div>
           </div>
           
           {/* Analysis Footer */}
           <div className="h-auto bg-slate-900 border-t border-slate-800 p-3 shrink-0">
              <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
                 <span className="font-bold uppercase tracking-wider text-slate-500">Team Analysis</span>
                 <span>{composition ? `${composition.total}/5 Heroes` : 'Drafting...'}</span>
              </div>
              
              <div className="flex gap-4 h-16">
                 {/* Stats Charts */}
                 <div className="flex-1 bg-slate-800/50 rounded p-2 flex items-center gap-4">
                    {composition ? (
                       <>
                          <div className="flex flex-col gap-1 flex-1">
                             <div className="flex justify-between text-[10px] uppercase">
                                <span className="text-orange-400">Physical</span>
                                <span>{composition.damageTypes.physical}</span>
                             </div>
                             <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                <div style={{width: `${(composition.damageTypes.physical/5)*100}%`}} className="h-full bg-orange-500"></div>
                             </div>
                          </div>
                          <div className="flex flex-col gap-1 flex-1">
                             <div className="flex justify-between text-[10px] uppercase">
                                <span className="text-purple-400">Magic</span>
                                <span>{composition.damageTypes.magic}</span>
                             </div>
                             <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                <div style={{width: `${(composition.damageTypes.magic/5)*100}%`}} className="h-full bg-purple-500"></div>
                             </div>
                          </div>
                       </>
                    ) : (
                       <div className="text-slate-600 text-center w-full italic">Pick heroes to see analysis</div>
                    )}
                 </div>
                 
                 {/* Validation Messages */}
                 <div className="flex-1 overflow-y-auto">
                    {validation.errors.length > 0 && (
                       <div className="text-rose-400 text-[10px] mb-1 font-semibold">
                          ❌ {validation.errors[0]}
                       </div>
                    )}
                    {validation.warnings.map((w, i) => (
                       <div key={i} className="text-amber-400 text-[10px]">⚠️ {w}</div>
                    ))}
                 </div>
              </div>
           </div>

        </section>

        {/* RIGHT: Red Team (Enemy) */}
        <aside className="w-[340px] flex flex-col bg-gradient-to-l from-slate-900 to-slate-900/50 border-l border-slate-800 shrink-0 relative z-10">
          {/* Bans */}
          <div className="p-4 border-b border-slate-800/50 bg-slate-900/80">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex justify-between">
               <span>Red Bans</span>
            </div>
            <div className="flex gap-2 justify-end">
              {enemyBans.map((ban, idx) => (
                <div 
                  key={`enemy-ban-${idx}`}
                  onClick={() => setActiveSlot({ side: 'enemy', index: idx, type: 'ban' })}
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center cursor-pointer relative overflow-hidden transition-all group ${
                     activeSlot.side === 'enemy' && activeSlot.type === 'ban' && activeSlot.index === idx
                       ? 'border-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.4)] scale-110 z-10'
                       : ban ? 'border-rose-900/50 opacity-80' : 'border-slate-800 bg-slate-800/50 hover:border-slate-600'
                  }`}
                >
                  {ban ? (
                    <>
                       <div className="absolute inset-0 bg-slate-800">
                          <div className="w-full h-full flex items-center justify-center bg-slate-700 text-[10px] font-bold text-gray-400">
                            {ban.substring(0, 2)}
                          </div>
                       </div>
                       <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/60">
                          <span className="text-white text-xl font-bold">✕</span>
                       </div>
                    </>
                  ) : (
                    <span className="text-slate-600 text-xs group-hover:text-slate-400">🚫</span>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Picks */}
          <div className="flex-1 p-4 flex flex-col gap-3 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
             {enemyDraftPicks.map((heroName, idx) => {
                const isActive = activeSlot.side === 'enemy' && activeSlot.type === 'pick' && activeSlot.index === idx;
                const lane = lanes[idx];
                const hero = allHeroesWithLanes.find(h => (h.hero_name || h.name) === heroName);
                
                return (
                   <div 
                     key={`enemy-pick-${idx}`}
                     onClick={() => {
                       setActiveSlot({ side: 'enemy', index: idx, type: 'pick' });
                       if (searchInputRef.current) searchInputRef.current.focus();
                     }}
                     className={`relative flex flex-row-reverse items-center h-24 rounded-l-xl border-r-4 transition-all cursor-pointer group ${
                        isActive
                          ? 'bg-gradient-to-l from-rose-950/60 to-transparent border-rose-400 pr-4'
                          : heroName 
                             ? 'bg-slate-800/40 border-rose-600/50 hover:bg-slate-800/60 pr-3'
                             : 'bg-slate-900/20 border-slate-700 hover:border-slate-600 pr-2'
                     }`}
                   >
                      {/* Lane Icon Background */}
                      <div className="absolute left-2 top-1/2 -translate-y-1/2 text-6xl text-white/5 pointer-events-none">
                         {lane.icon}
                      </div>
                      
                      {/* Content */}
                      <div className="relative z-10 flex flex-row-reverse items-center gap-4 w-full text-right">
                         <div className={`w-14 h-14 rounded-lg flex items-center justify-center shadow-lg border border-slate-700/50 ${
                            heroName ? 'bg-slate-700' : 'bg-slate-800/50 border-dashed'
                         }`}>
                            {heroName ? (
                               <span className="text-lg font-bold text-rose-400">{heroName.charAt(0)}</span>
                            ) : (
                               <span className="text-2xl opacity-20 text-white">+</span>
                            )}
                         </div>
                         
                         <div className="flex-1 min-w-0">
                            {heroName ? (
                               <>
                                  <div className="text-lg font-bold text-white leading-none truncate">{heroName}</div>
                                  <div className="text-xs text-rose-400/80 mt-1 flex items-center gap-1 justify-end">
                                     {hero?.role && <span>{hero.role.split('/')[0]} {getRoleIcon(hero.role)}</span>}
                                     {!hero?.role && <span>Enemy Team</span>}
                                  </div>
                               </>
                            ) : (
                               <>
                                  <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">{isActive ? 'Picking...' : 'Empty Slot'}</div>
                                  <div className="text-xs text-slate-600 mt-0.5">{lane.lane}</div>
                               </>
                            )}
                         </div>
                      </div>

                      {/* Remove Button */}
                      {heroName && (
                         <button 
                            onClick={(e) => { e.stopPropagation(); handleEnemyPickChange(idx, ''); }}
                            className="absolute top-2 left-2 w-5 h-5 rounded flex items-center justify-center text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                         >
                            ✕
                         </button>
                      )}
                   </div>
                );
             })}
          </div>
        </aside>

      </main>
    </div>
  );
}
