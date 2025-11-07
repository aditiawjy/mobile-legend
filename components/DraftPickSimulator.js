import { useState, useEffect } from 'react';

const getPrimaryRole = (roleString) => roleString?.split('/')[0].trim() || roleString;

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

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-gray-900 text-white rounded-lg">
      <h1 className="text-3xl font-bold mb-6">Draft Pick Simulator</h1>

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
            <h2 className="text-2xl font-bold mb-4">5 Pilihan Draft</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {draftResult.draft.options.map((hero, idx) => (
                <div
                  key={hero.name}
                  className={`rounded p-4 border-2 transition-all ${
                    idx === 0
                      ? 'bg-blue-950 border-blue-500 shadow-lg shadow-blue-500'
                      : 'bg-gray-800 border-gray-700 hover:border-yellow-500'
                  }`}
                >
                  <div className="text-center">
                    <p className="font-bold text-lg mb-2">{idx === 0 ? '🎯' : '✓'}</p>
                    <p className="font-bold">{hero.name}</p>
                    <p className="text-sm text-gray-400 mt-1">{getPrimaryRole(hero.role)}</p>
                    <p className="text-xs text-gray-500 mt-2">{hero.damageType}</p>
                  </div>
                </div>
              ))}
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
