import { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import HeroAutocomplete from '../components/HeroAutocomplete';

export default function EditHeroCombos() {
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Form state
  const [hero1, setHero1] = useState('');
  const [hero2, setHero2] = useState('');
  const [comboType, setComboType] = useState('');
  const [synergyScore, setSynergyScore] = useState(80);
  const [description, setDescription] = useState('');

  // Load combos
  const loadCombos = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/hero-combos');
      const data = await response.json();
      if (data.success && data.combos) {
        setCombos(data.combos);
      }
    } catch (error) {
      console.error('Error loading combos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCombos();
  }, []);

  // Reset form
  const resetForm = () => {
    setEditingId(null);
    setHero1('');
    setHero2('');
    setComboType('');
    setSynergyScore(80);
    setDescription('');
  };

  // Edit combo
  const handleEdit = (combo) => {
    setEditingId(combo.id);
    setHero1(combo.hero1);
    setHero2(combo.hero2);
    setComboType(combo.combo_type);
    setSynergyScore(combo.synergy_score);
    setDescription(combo.description);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Save combo (create or update)
  const handleSave = async () => {
    if (!hero1 || !hero2 || !comboType) {
      alert('Hero1, Hero2, and Combo Type are required!');
      return;
    }

    setSaving(true);
    try {
      const url = editingId 
        ? `/api/admin/hero-combos/${editingId}`
        : '/api/admin/hero-combos';
      
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hero1,
          hero2,
          combo_type: comboType,
          synergy_score: synergyScore,
          description
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert(editingId ? '✓ Combo updated!' : '✓ Combo created!');
        resetForm();
        loadCombos();
      } else {
        alert(`✗ Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error saving combo:', error);
      alert('✗ Error saving combo');
    } finally {
      setSaving(false);
    }
  };

  // Delete combo
  const handleDelete = async (id, hero1, hero2) => {
    if (!confirm(`Delete combo: ${hero1} + ${hero2}?`)) return;

    try {
      const response = await fetch(`/api/admin/hero-combos/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        alert('✓ Combo deleted!');
        loadCombos();
      } else {
        alert(`✗ Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting combo:', error);
      alert('✗ Error deleting combo');
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                🔥 Hero Combos Management
              </h1>
              <p className="text-gray-400 mt-2">Manage powerful hero combinations for draft recommendations</p>
            </div>
            <a
              href="/"
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              ← Back to Dashboard
            </a>
          </div>

          {/* Add/Edit Form */}
          <div className="mb-8 bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              {editingId ? '✏️ Edit Combo' : '➕ Add New Combo'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Hero 1 *
                </label>
                <HeroAutocomplete
                  value={hero1}
                  onChange={setHero1}
                  placeholder="Select first hero..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Hero 2 *
                </label>
                <HeroAutocomplete
                  value={hero2}
                  onChange={setHero2}
                  placeholder="Select second hero..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Combo Type *
                </label>
                <input
                  type="text"
                  value={comboType}
                  onChange={(e) => setComboType(e.target.value)}
                  placeholder="e.g., Ultimate Combo, CC Chain, Protect-Carry"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Synergy Score (1-100)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={synergyScore}
                  onChange={(e) => setSynergyScore(parseInt(e.target.value) || 80)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain why this combo works..."
                rows={3}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-pink-600 hover:bg-pink-700 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : editingId ? 'Update Combo' : 'Add Combo'}
              </button>
              
              {editingId && (
                <button
                  onClick={resetForm}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg font-semibold"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </div>

          {/* Combos List */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                📋 All Combos ({combos.length})
              </h2>
              <button
                onClick={loadCombos}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
              >
                🔄 Refresh
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-400 mt-3">Loading combos...</p>
              </div>
            ) : combos.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="mb-4">No combos found. Click button below to populate data.</p>
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/admin/seed_hero_combos', { method: 'POST' });
                      const data = await response.json();
                      if (data.success) {
                        alert(`✓ Seeded ${data.totalCombos} combos!`);
                        loadCombos();
                      } else {
                        alert(`✗ Error: ${data.error}`);
                      }
                    } catch (error) {
                      alert('✗ Error seeding combos');
                    }
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg"
                >
                  Populate from CSV (30+ combos)
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {combos.map((combo) => (
                  <div
                    key={combo.id}
                    className="bg-gray-700 border border-gray-600 rounded-lg p-4 hover:border-pink-500 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-pink-400">
                            {combo.hero1} + {combo.hero2}
                          </h3>
                          <span className="px-2 py-1 bg-purple-900/50 border border-purple-500 rounded text-xs text-purple-300">
                            {combo.combo_type}
                          </span>
                          <span className="px-2 py-1 bg-pink-900/50 border border-pink-500 rounded text-xs text-pink-300 font-bold">
                            Score: {combo.synergy_score}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300">{combo.description}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          ID: {combo.id} | Created: {new Date(combo.created_at).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEdit(combo)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDelete(combo.id, combo.hero1, combo.hero2)}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded text-sm font-medium"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-blue-900/30 border border-blue-500 rounded-lg p-4">
            <h3 className="text-sm font-bold text-blue-300 mb-2">ℹ️ How Combos Work</h3>
            <ul className="text-xs text-blue-200 space-y-1">
              <li>• Combos are automatically detected in Manual Draft Pick</li>
              <li>• Higher synergy score (75-95) = higher priority in recommendations</li>
              <li>• Combo heroes appear with PURPLE background and 🔥 fire icon</li>
              <li>• Tooltip shows combo type, partner hero, and description</li>
              <li>• Examples: Ultimate Combo, CC Chain, Protect-Carry, Counter, etc.</li>
            </ul>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
