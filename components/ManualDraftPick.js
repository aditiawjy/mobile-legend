import { useState, useEffect } from 'react';
import HeroAutocomplete from './HeroAutocomplete';

const DRAFT_POSITIONS = [
  { id: 1, label: 'Gold Lane', lane: 'Gold Lane', icon: '💰' },
  { id: 2, label: 'Exp Lane', lane: 'Exp Lane', icon: '⚔️' },
  { id: 3, label: 'Mid Lane', lane: 'Mid Lane', icon: '🎯' },
  { id: 4, label: 'Jungling', lane: 'Jungling', icon: '🌳' },
  { id: 5, label: 'Roaming', lane: 'Roaming', icon: '🛡️' },
];

export default function ManualDraftPick() {
  const [draftPicks, setDraftPicks] = useState(['', '', '', '', '']);
  const [heroDetails, setHeroDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [composition, setComposition] = useState(null);
  const [allHeroesWithLanes, setAllHeroesWithLanes] = useState([]);

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

  const handlePickChange = (index, value) => {
    const newPicks = [...draftPicks];
    newPicks[index] = value;
    setDraftPicks(newPicks);
  };

  // Get recommended heroes for a specific lane based on already picked heroes
  const getRecommendedHeroesForLane = (laneIndex) => {
    const targetLane = DRAFT_POSITIONS[laneIndex].lane;
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

    const physicalCount = currentDamageTypes.filter(d => d === 'physical' || d === 'mixed').length;
    const magicCount = currentDamageTypes.filter(d => d === 'magic' || d === 'mixed').length;

    // Filter and score heroes
    const recommended = allHeroesWithLanes
      .filter(hero => {
        // Check if hero has target lane
        const hasTargetLane = hero.lanes && hero.lanes.some(l => l.lane_name === targetLane);
        // Check if not already picked
        const notPicked = !pickedHeroNames.some(name => name.toLowerCase() === hero.hero_name.toLowerCase());
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

        return { ...hero, score };
      })
      .sort((a, b) => b.score - a.score) // Sort by score descending
      .slice(0, 5); // Top 5 recommendations

    return recommended;
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

      // Filter heroes yang dipilih
      const selectedHeroes = allHeroes.filter(hero =>
        validHeroNames.some(name => 
          hero.hero_name.toLowerCase() === name.toLowerCase()
        )
      );

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
    setHeroDetails([]);
    setComposition(null);
  };

  const hasAnyPick = draftPicks.some(pick => pick && pick.trim());

  // Validate lanes - relaxed validation
  const laneValidation = () => {
    if (heroDetails.length === 0) return { isValid: true, errors: [], warnings: [] };

    const errors = [];
    const warnings = [];
    const usedLanes = new Set();
    let allLanesFilled = heroDetails.length === 5;

    heroDetails.forEach((hero, idx) => {
      const position = DRAFT_POSITIONS[idx];
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
      errors.push(`Draft tidak lengkap: Pilih 5 heroes (${heroDetails.length}/5)`);
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
    <div className="w-full max-w-6xl mx-auto p-6 bg-gray-900 text-white rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manual Draft Pick</h1>
        {hasAnyPick && (
          <button
            onClick={handleClearAll}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-semibold transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Validation Summary */}
      {heroDetails.length > 0 && (
        <div className="mb-6">
          {/* Errors */}
          {validation.errors.length > 0 && (
            <div className="bg-red-900/50 border-2 border-red-500 rounded-lg p-4 mb-3">
              <h3 className="text-lg font-bold text-red-300 mb-2 flex items-center gap-2">
                <span>❌</span> Draft Tidak Valid
              </h3>
              <ul className="text-sm text-red-200 space-y-1">
                {validation.errors.map((error, idx) => (
                  <li key={idx}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {validation.warnings.length > 0 && (
            <div className="bg-yellow-900/50 border-2 border-yellow-500 rounded-lg p-4 mb-3">
              <h3 className="text-lg font-bold text-yellow-300 mb-2 flex items-center gap-2">
                <span>⚠️</span> Peringatan
              </h3>
              <ul className="text-sm text-yellow-200 space-y-1">
                {validation.warnings.map((warning, idx) => (
                  <li key={idx}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Success */}
          {validation.isValid && validation.warnings.length === 0 && (
            <div className="bg-green-900/50 border-2 border-green-500 rounded-lg p-4">
              <h3 className="text-lg font-bold text-green-300 mb-2 flex items-center gap-2">
                <span>✅</span> Draft Valid!
              </h3>
              <p className="text-sm text-green-200">
                Semua lanes terisi dengan benar dan tidak ada duplikat. Tim siap bertanding! 🎉
              </p>
            </div>
          )}
        </div>
      )}

      {/* Requirements Info */}
      <div className="mb-6 bg-blue-900/30 border-2 border-blue-500 rounded-lg p-4">
        <h3 className="text-lg font-bold text-blue-300 mb-2 flex items-center gap-2">
          <span>ℹ️</span> Requirements Draft Pick
        </h3>
        <ul className="text-sm text-blue-200 space-y-1">
          <li>✓ Pilih 5 heroes (satu untuk setiap lane: Gold, Exp, Mid, Jungling, Roaming)</li>
          <li>✓ Setiap hero harus memiliki data lanes yang sudah dikonfigurasi</li>
          <li>✓ Hero sebaiknya cocok dengan lane yang ditugaskan (akan ada warning jika tidak cocok)</li>
          <li>✓ Tidak boleh ada duplicate primary lanes</li>
          <li>⚠️ Hero tanpa data lanes akan menyebabkan draft invalid</li>
        </ul>
        <div className="mt-3 pt-3 border-t border-blue-700">
          <p className="text-xs text-blue-300">
            💡 Konfigurasi lanes hero di: <a href="/edit-hero-info" className="underline hover:text-blue-100">Edit Hero Info & Lanes</a>
          </p>
        </div>
      </div>

      {/* Draft Pick Inputs */}
      <div className="mb-8 space-y-4">
        <h2 className="text-xl font-semibold mb-4">Select 5 Heroes by Lane</h2>
        <div className="grid grid-cols-1 gap-4">
          {DRAFT_POSITIONS.map((position, idx) => {
            const recommendedHeroes = getRecommendedHeroesForLane(idx);
            const hasRecommendations = recommendedHeroes.length > 0 && !draftPicks[idx];
            const pickedHeroNames = draftPicks.filter((p, i) => i !== idx && p && p.trim());

            return (
              <div key={position.id} className="space-y-2">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-32">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{position.icon}</span>
                      <div>
                        <span className="text-lg font-bold text-blue-400 block">{position.label}</span>
                        <p className="text-xs text-gray-500">{position.lane}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <HeroAutocomplete
                      value={draftPicks[idx]}
                      onChange={(value) => handlePickChange(idx, value)}
                      placeholder={`Select hero for ${position.label}...`}
                      position={position.label}
                    />
                  </div>
                </div>

                {/* Recommendations */}
                {hasRecommendations && (
                  <div className="ml-36 bg-gray-800 border border-blue-600/30 rounded-lg p-3">
                    <p className="text-xs text-blue-300 mb-2 font-semibold flex items-center gap-1">
                      <span>💡</span>
                      <span>Smart Picks for {position.lane}</span>
                      {pickedHeroNames.length > 0 && (
                        <span className="text-gray-400">
                          (synergizes with {pickedHeroNames.slice(-1)[0]})
                        </span>
                      )}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {recommendedHeroes.map(hero => {
                        const isPrimary = hero.lanes.find(l => l.lane_name === position.lane)?.priority === 1;
                        const heroRole = hero.role?.split('/')[0];
                        return (
                          <button
                            key={hero.hero_name}
                            onClick={() => handlePickChange(idx, hero.hero_name)}
                            className="px-3 py-1.5 bg-gray-700 hover:bg-blue-600 rounded text-xs text-white transition-colors flex items-center gap-1.5"
                            title={`${hero.hero_name} - ${heroRole} - Score: ${hero.score || 0}`}
                          >
                            <span>{hero.hero_name}</span>
                            {isPrimary && <span className="text-yellow-400">★</span>}
                            <span className="text-gray-400 text-[10px]">
                              ({heroRole})
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 mt-3">Loading hero details...</p>
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
              {heroDetails.map((hero, idx) => {
                const position = DRAFT_POSITIONS[idx];
                const heroLanes = hero.lanes || [];
                const isLaneMatch = heroLanes.some(lane => lane.lane_name === position.lane);
                const hasNoLanes = heroLanes.length === 0;
                
                return (
                  <div
                    key={hero.hero_name}
                    className={`rounded-lg p-4 border-2 transition-all ${
                      hasNoLanes
                        ? 'bg-gray-800 border-gray-700 hover:shadow-lg hover:shadow-gray-500/50'
                        : isLaneMatch
                        ? 'bg-gray-800 border-blue-500 hover:shadow-lg hover:shadow-blue-500/50'
                        : 'bg-yellow-900/30 border-yellow-500'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">{position.icon}</div>
                      <p className="font-bold text-lg mb-1">{hero.hero_name}</p>
                      <p className="text-xs text-blue-400 mb-2">{position.lane}</p>
                      <p className="text-sm text-gray-400 mb-2">
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
                                      ? 'bg-green-700 text-white'
                                      : 'bg-gray-700 text-gray-300'
                                  }`}
                                >
                                  {lane.lane_name}
                                  {lane.priority === 1 && ' ★'}
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
                    </div>
                  </div>
                );
              })}
            </div>
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
  );
}
