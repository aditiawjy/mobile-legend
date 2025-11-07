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

          {/* Team Validation */}
          <div className="bg-gray-800 border border-gray-700 rounded p-4">
            <h3 className="font-bold text-lg mb-3">Komposisi Tim</h3>
            <div className="flex gap-4">
              <div className={`flex-1 p-3 rounded text-center ${
                draftResult.teamValidation.isBalanced
                  ? 'bg-green-900 border border-green-700'
                  : 'bg-yellow-900 border border-yellow-700'
              }`}>
                <p className="text-sm text-gray-300">Status</p>
                <p className="font-bold text-lg">
                  {draftResult.teamValidation.isBalanced ? '✓ Balanced' : '⚠ Needs Balance'}
                </p>
              </div>
              <div className="flex-1 p-3 rounded bg-gray-700 border border-gray-600">
                <p className="text-sm text-gray-300 mb-2">Distribusi Role</p>
                <div className="space-y-1">
                  {Object.entries(draftResult.teamValidation.roleDistribution).map(([role, count]) => (
                    <p key={role} className="text-sm">
                      <span className="text-gray-400">{role}:</span> <span className="font-semibold">{count}</span>
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
