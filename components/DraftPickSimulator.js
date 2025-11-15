import { useState, useEffect } from 'react';

const getPrimaryRole = (roleString) => roleString?.split('/')[0].trim() || roleString;

const LANE_ASSIGNMENTS = [
  { id: 1, label: 'Gold Lane', lane: 'Gold Lane', icon: '💰' },
  { id: 2, label: 'Exp Lane', lane: 'Exp Lane', icon: '⚔️' },
  { id: 3, label: 'Mid Lane', lane: 'Mid Lane', icon: '🎯' },
  { id: 4, label: 'Jungling', lane: 'Jungling', icon: '🌳' },
  { id: 5, label: 'Roaming', lane: 'Roaming', icon: '🛡️' },
];

const hasCC = (hero) => {
  const ar = hero.attackReliance?.toLowerCase() || '';
  const note = hero.note?.toLowerCase() || '';
  const ccKeywords = ['control', 'crowd', 'stun', 'immobilize', 'knock', 'slow', 'suppress', 'pull', 'freeze', 'terrify'];
  return ccKeywords.some(keyword => ar.includes(keyword) || note.includes(keyword));
};

const hasBurst = (hero) => {
  const ar = hero.attackReliance?.toLowerCase() || '';
  const note = hero.note?.toLowerCase() || '';
  return ar.includes('burst') || note.includes('burst');
};

const hasObjectiveControl = (hero) => {
  const role = hero.role?.toLowerCase() || '';
  const ar = hero.attackReliance?.toLowerCase() || '';
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

export default function DraftPickSimulator() {
  const [heroes, setHeroes] = useState([]);
  const [selectedHero, setSelectedHero] = useState('Miya');
  const [draftResult, setDraftResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load heroes list on client side for selection
    fetch('/api/heroes-list')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setHeroes(data.data.sort((a, b) => a.name.localeCompare(b.name)));
          if (!selectedHero) setSelectedHero(data.data[0]?.name);
        }
      })
      .catch(err => console.error('Error loading heroes:', err));
  }, []);

  const simulateDraft = async (heroName) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/draft-simulation?hero=${encodeURIComponent(heroName)}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      setDraftResult(data.data);
      setSelectedHero(heroName);
    } catch (err) {
      setError(err.message || 'Error dalam simulasi draft pick');
      console.error('Draft simulation error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedHero) {
      simulateDraft(selectedHero);
    }
  }, []);

  // Validate lanes
  const laneValidation = () => {
    if (!draftResult || !draftResult.draft.options) return { isValid: true, errors: [], warnings: [] };

    const errors = [];
    const warnings = [];
    const heroesWithLanes = draftResult.draft.options.filter(h => h.lanes && h.lanes.length > 0);
    const allHeroes = draftResult.draft.options;

    // Only check lane matching for heroes that HAVE lanes data
    draftResult.draft.options.forEach((hero, idx) => {
      const heroLanes = hero.lanes || [];
      const assignedLane = LANE_ASSIGNMENTS[idx];

      // Skip validation if hero doesn't have lanes data yet
      if (heroLanes.length > 0) {
        // Check if hero matches assigned lane
        const isLaneMatch = heroLanes.some(lane => lane.lane_name === assignedLane.lane);
        if (!isLaneMatch) {
          warnings.push(`${hero.name}: Tidak cocok untuk ${assignedLane.lane}`);
        }
      }
    });

    if (allHeroes.length > 0) {
      const hasAnyCC = allHeroes.some(h => hasCC(h));
      if (!hasAnyCC) {
        warnings.push('Tim tidak punya Crowd Control yang jelas (no hard CC).');
      }

      const hasAnyBurst = allHeroes.some(h => hasBurst(h));
      if (!hasAnyBurst) {
        warnings.push('Tim tidak punya burst damage yang kuat (no burst).');
      }

      const hasAnyObjective = allHeroes.some(h => hasObjectiveControl(h));
      if (!hasAnyObjective) {
        warnings.push('Tim lemah dalam objective control (Turtle/Lord).');
      }
    }

    // No errors for missing lanes, just show info
    return {
      isValid: true, // Always valid, even without lanes
      errors,
      warnings,
      heroesWithLanes: heroesWithLanes.length
    };
  };

  const validation = draftResult ? laneValidation() : { isValid: true, errors: [], warnings: [], heroesWithLanes: 0 };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-gray-900 text-white rounded-lg">
      <h1 className="text-3xl font-bold mb-6">Draft Pick Simulator (Auto Recommendation)</h1>

      {/* Hero Selection */}
      <div className="mb-8">
        <label className="block text-lg font-semibold mb-3">Pilih Hero Utama:</label>
        <div className="relative">
          <select
            value={selectedHero}
            onChange={(e) => simulateDraft(e.target.value)}
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded text-white cursor-pointer hover:border-gray-500"
            disabled={loading}
          >
            <option value="">-- Pilih Hero --</option>
            {heroes.map(hero => (
              <option key={hero.name} value={hero.name}>
                {hero.name} ({getPrimaryRole(hero.role)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8">
          <p className="text-gray-400">Sedang membuat simulasi...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-900 border border-red-700 rounded p-4 mb-6">
          <p className="text-red-100">{error}</p>
        </div>
      )}

      {draftResult && (
        <>
          {/* Validation Summary - Only show if there are warnings */}
          {validation.warnings.length > 0 && (
            <div className="mb-6">
              {/* Warnings */}
              <div className="bg-yellow-900/50 border-2 border-yellow-500 rounded-lg p-4 mb-3">
                <h3 className="text-lg font-bold text-yellow-300 mb-2 flex items-center gap-2">
                  <span>⚠️</span> Lane Mismatch
                </h3>
                <ul className="text-sm text-yellow-200 space-y-1">
                  {validation.warnings.map((warning, idx) => (
                    <li key={idx}>• {warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Requirements Info */}
          <div className="mb-6 bg-blue-900/30 border-2 border-blue-500 rounded-lg p-4">
            <h3 className="text-lg font-bold text-blue-300 mb-2 flex items-center gap-2">
              <span>ℹ️</span> Lane Assignments (Auto)
            </h3>
            <p className="text-sm text-blue-200 mb-2">
              Sistem otomatis assign 5 heroes ke lanes berikut:
            </p>
            <div className="grid grid-cols-5 gap-2 text-xs">
              {LANE_ASSIGNMENTS.map(lane => (
                <div key={lane.id} className="bg-blue-800/50 rounded p-2 text-center">
                  <div className="text-lg mb-1">{lane.icon}</div>
                  <div className="text-blue-200">{lane.label}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-blue-700">
              <p className="text-xs text-blue-300">
                💡 Konfigurasi lanes hero di: <a href="/edit-hero-info" className="underline hover:text-blue-100">Edit Hero Info & Lanes</a>
              </p>
            </div>
          </div>

          {/* Selected Hero */}
          <div className="mb-8 bg-blue-900 border border-blue-700 rounded p-6">
            <h2 className="text-2xl font-bold mb-4">Hero Utama Dipilih</h2>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-3xl font-bold text-blue-300">{draftResult.selectedHero.name}</p>
                <p className="text-lg text-blue-200 mt-2">
                  Role: <span className="font-semibold">{draftResult.selectedHero.role}</span>
                </p>
                <p className="text-sm text-gray-300 mt-1">
                  Damage: {draftResult.selectedHero.damageType}
                </p>
                <p className="text-sm text-gray-300">
                  Reliance: {draftResult.selectedHero.attackReliance}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400 italic">
                  {draftResult.recommendations.pickReason}
                </p>
              </div>
            </div>
          </div>

          {/* Draft Options (5 Heroes Total) */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">
              5 Pilihan Draft dengan Lane Assignments
              {validation.heroesWithLanes === 5 ? ' ✅' : ` ⚠️ (${validation.heroesWithLanes}/5 punya lanes)`}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {draftResult.draft.options.map((hero, idx) => {
                const heroLanes = hero.lanes || [];
                const assignedLane = LANE_ASSIGNMENTS[idx];
                const hasNoLanes = heroLanes.length === 0;
                const isLaneMatch = heroLanes.some(lane => lane.lane_name === assignedLane.lane);
                
                return (
                  <div
                    key={hero.name}
                    className={`rounded p-4 border-2 transition-all ${
                      idx === 0
                        ? 'bg-blue-950 border-blue-500 shadow-lg shadow-blue-500'
                        : hasNoLanes
                        ? 'bg-gray-800 border-gray-700 hover:border-gray-500'
                        : isLaneMatch
                        ? 'bg-gray-800 border-green-500 hover:border-green-400'
                        : 'bg-yellow-900/30 border-yellow-500'
                    }`}
                  >
                    <div className="text-center">
                      {/* Lane Assignment */}
                      <div className="mb-2 pb-2 border-b border-gray-600">
                        <div className="text-2xl mb-1">{assignedLane.icon}</div>
                        <p className="text-xs text-blue-300 font-semibold">{assignedLane.label}</p>
                      </div>

                      <p className="font-bold text-lg mb-1">{hero.name}</p>
                      <p className="text-sm text-gray-400">{getPrimaryRole(hero.role)}</p>
                      <p className="text-xs text-gray-500 mt-1">{hero.damageType}</p>
                      
                      {/* Lane Info - Only show if lanes exist */}
                      {heroLanes.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-gray-600">
                          <div className="text-xs">
                            <p className="text-gray-500 mb-2">Hero Lanes:</p>
                            <div className="space-y-1">
                              {heroLanes.slice(0, 3).map((lane, lIdx) => (
                                <div
                                  key={lIdx}
                                  className={`px-2 py-1 rounded flex items-center justify-center gap-1 ${
                                    lane.lane_name === assignedLane.lane
                                      ? 'bg-green-700 text-white'
                                      : 'bg-gray-700 text-gray-300'
                                  }`}
                                >
                                  <span>{lane.lane_name}</span>
                                  {lane.priority === 1 && <span className="text-yellow-400">★</span>}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Status Badge - Only for lane mismatch */}
                          {!isLaneMatch && (
                            <div className="mt-2 px-2 py-1 bg-yellow-600 rounded text-xs text-white">
                              ⚠ Tidak cocok untuk {assignedLane.lane}
                            </div>
                          )}

                          {isLaneMatch && (
                            <div className="mt-2 px-2 py-1 bg-green-700 rounded text-xs text-white">
                              ✓ Cocok dengan {assignedLane.lane}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recommended Partners */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Tim Rekomendasi</h2>
            <div className="space-y-3">
              {draftResult.recommendations.partnerRoles.map((partner, idx) => (
                <div
                  key={partner.name}
                  className="bg-gray-800 border border-gray-700 rounded p-4 flex justify-between items-center hover:border-yellow-500 transition-all"
                >
                  <div>
                    <p className="font-bold text-lg">{partner.name}</p>
                    <p className="text-sm text-gray-400">{partner.role}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-yellow-300">{partner.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team Composition Analysis */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4">Team Composition Analysis</h3>
            
            {/* Lanes Status - Info only */}
            {validation.heroesWithLanes > 0 && (
              <div className="mb-4 p-3 bg-gray-700 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Lanes Configuration Status</h4>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Heroes with lanes data:</span>
                  <span className="text-lg font-bold text-blue-400">
                    {validation.heroesWithLanes} / 5
                  </span>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Balance Status */}
              <div className={`p-4 rounded-lg text-center ${
                draftResult.teamValidation.isBalanced
                  ? 'bg-green-900 border-2 border-green-500'
                  : 'bg-yellow-900 border-2 border-yellow-500'
              }`}>
                <p className="text-sm text-gray-300 mb-2">Team Balance</p>
                <p className="text-2xl font-bold">
                  {draftResult.teamValidation.isBalanced ? '✓ Balanced' : '⚠ Unbalanced'}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  {draftResult.teamValidation.isBalanced 
                    ? '3+ different roles' 
                    : 'Need more role diversity'}
                </p>
              </div>

              {/* Role Distribution */}
              <div className="p-4 bg-gray-700 border border-gray-600 rounded-lg">
                <p className="text-sm text-gray-300 mb-3 font-semibold">Role Distribution</p>
                <div className="space-y-2">
                  {Object.entries(draftResult.teamValidation.roleDistribution).map(([role, count]) => (
                    <div key={role} className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">{role}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-800 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${(count / draftResult.draft.options.length) * 100}%` }}
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
                  {(() => {
                    const damageTypes = { physical: 0, magic: 0, mixed: 0 };
                    draftResult.draft.options.forEach(hero => {
                      const damageType = hero.damageType?.toLowerCase() || '';
                      if (damageType.includes('physical') && damageType.includes('magic')) {
                        damageTypes.mixed++;
                      } else if (damageType.includes('physical')) {
                        damageTypes.physical++;
                      } else if (damageType.includes('magic')) {
                        damageTypes.magic++;
                      }
                    });
                    
                    return (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-red-400">Physical</span>
                          <span className="font-bold text-lg">{damageTypes.physical}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-purple-400">Magic</span>
                          <span className="font-bold text-lg">{damageTypes.magic}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-yellow-400">Mixed</span>
                          <span className="font-bold text-lg">{damageTypes.mixed}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
