import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import AppLayout from '../components/AppLayout'

export default function DamageCompositionPage() {
  const router = useRouter()
  const [heroes, setHeroes] = useState([])
  const [selectedHeroes, setSelectedHeroes] = useState([])
  const [composition, setComposition] = useState(null)
  const [itemRecommendations, setItemRecommendations] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const inputRef = useRef(null)

  // Load all heroes on mount
  useEffect(() => {
    const loadHeroes = async () => {
      try {
        const res = await fetch('/api/heroes')
        if (res.ok) {
          const data = await res.json()
          setHeroes(Array.isArray(data) ? data : [])
        }
      } catch (e) {
        console.error('Failed to load heroes:', e)
      }
    }
    loadHeroes()
  }, [])

  // Handle hero search
  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchInput(value)
    
    if (value.length > 0) {
      const filtered = heroes.filter(h => 
        h.hero_name.toLowerCase().includes(value.toLowerCase()) &&
        !selectedHeroes.find(s => s.hero_name === h.hero_name)
      )
      setSuggestions(filtered.slice(0, 5))
    } else {
      setSuggestions([])
    }
  }

  // Add hero to selected
  const addHero = (hero) => {
    if (selectedHeroes.length < 5) {
      setSelectedHeroes([...selectedHeroes, hero])
      setSearchInput('')
      setSuggestions([])
    }
  }

  // Remove hero from selected
  const removeHero = (heroName) => {
    setSelectedHeroes(selectedHeroes.filter(h => h.hero_name !== heroName))
  }

  // Analyze composition
  const handleAnalyze = async () => {
    if (selectedHeroes.length === 0) return
    
    setLoading(true)
    try {
      const res = await fetch('/api/analysis/team-composition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          heroNames: selectedHeroes.map(h => h.hero_name)
        })
      })
      
      if (res.ok) {
        const data = await res.json()
        setComposition(data)
        generateItemRecommendations(data)
      }
    } catch (e) {
      console.error('Analysis failed:', e)
    } finally {
      setLoading(false)
    }
  }

  // Generate item recommendations based on threat
  const generateItemRecommendations = (comp) => {
    const primary = comp.threat.primary
    
    const recommendations = {
      physical: [
        { name: 'Antique Cuirass', role: 'Support', effect: '-5% DMG', gold: 2050, efficiency: 2050 / 5 },
        { name: 'Twilight Armor', role: 'Tank', effect: '+900 HP, +60 ARM', gold: 2220, efficiency: 2220 / 60 },
        { name: 'Blade Armor', role: 'Tank', effect: '+80 ARM, Counter 25%', gold: 2150, efficiency: 2150 / 80 },
        { name: 'Brute Force', role: 'Damage', effect: '+140 ATK, +1000 HP', gold: 3050, efficiency: 3050 / 140 },
      ],
      magic: [
        { name: 'Athenas Blessing', role: 'Support', effect: '-40% Magic DMG', gold: 2020, efficiency: 2020 / 40 },
        { name: 'Hollow Radiance', role: 'Support', effect: '+900 HP, +56 MR', gold: 2180, efficiency: 2180 / 56 },
        { name: 'Force of Nature', role: 'Tank', effect: '+1000 HP, +70 MR', gold: 2250, efficiency: 2250 / 70 },
        { name: 'Immortality', role: 'Tank', effect: 'Revive when die', gold: 3250, efficiency: 3250 / 1 },
      ],
      true: [
        { name: 'Oracle', role: 'Support', effect: '+30% HP Regen', gold: 1900, efficiency: 1900 / 30 },
        { name: 'Dominance Ice', role: 'Support', effect: '-1 ATK SPD', gold: 2120, efficiency: 2120 / 1 },
      ]
    }

    // Get items for primary threat + mixed recommendations
    let items = [...(recommendations[primary] || []), ...(recommendations.true || [])]
    
    // Sort by efficiency
    items.sort((a, b) => a.efficiency - b.efficiency)
    
    // Limit to top recommendations
    setItemRecommendations(items.slice(0, 8))
  }

  const getDamageColor = (type) => {
    switch(type?.toLowerCase()) {
      case 'physical': return 'text-red-600 bg-red-50'
      case 'magic': return 'text-purple-600 bg-purple-50'
      case 'true': return 'text-amber-600 bg-amber-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getThreatColor = (threat) => {
    if (threat >= 60) return 'text-red-600'
    if (threat >= 40) return 'text-amber-600'
    return 'text-green-600'
  }

  return (
    <AppLayout>
      <div className="bg-gradient-to-br from-purple-50 via-white to-pink-50 min-h-screen py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Team Damage Analysis</h1>
            <p className="text-gray-600">Analisis komposisi damage team musuh dan dapatkan rekomendasi item efisien</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Hero Selection */}
            <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Pilih Hero Musuh</h2>
              
              <div className="mb-4">
                <input
                  ref={inputRef}
                  type="text"
                  value={searchInput}
                  onChange={handleSearchChange}
                  placeholder="Cari hero..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
                {suggestions.length > 0 && (
                  <div className="absolute mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    {suggestions.map(hero => (
                      <div
                        key={hero.hero_name}
                        onClick={() => addHero(hero)}
                        className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-sm"
                      >
                        {hero.hero_name} - {hero.damage_type}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Heroes */}
              <div className="space-y-2 mb-4">
                {selectedHeroes.map(hero => (
                  <div key={hero.hero_name} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{hero.hero_name}</p>
                      <p className={`text-xs ${getDamageColor(hero.damage_type)}`}>{hero.damage_type}</p>
                    </div>
                    <button
                      onClick={() => removeHero(hero.hero_name)}
                      className="text-red-600 hover:text-red-800 text-lg"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={handleAnalyze}
                disabled={selectedHeroes.length === 0 || loading}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400"
              >
                {loading ? 'Analyzing...' : 'Analisis Komposisi'}
              </button>

              <p className="text-xs text-gray-500 mt-4">
                Pilih 1-5 hero untuk analisis ({selectedHeroes.length}/5)
              </p>
            </div>

            {/* Composition Analysis */}
            {composition && (
              <div className="lg:col-span-2">
                {/* Threat Overview */}
                <div className="bg-white rounded-xl shadow border border-gray-200 p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Ancaman Utama</h3>
                  
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-red-50 rounded-lg p-4 text-center">
                      <div className={`text-3xl font-bold ${getThreatColor(composition.threat.physical)}`}>
                        {composition.threat.physical}%
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Physical DMG</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4 text-center">
                      <div className={`text-3xl font-bold ${getThreatColor(composition.threat.magic)}`}>
                        {composition.threat.magic}%
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Magic DMG</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-4 text-center">
                      <div className={`text-3xl font-bold ${getThreatColor(composition.threat.true)}`}>
                        {composition.threat.true}%
                      </div>
                      <p className="text-sm text-gray-600 mt-1">True DMG</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-600 mb-1">Ancaman Terbesar</p>
                    <p className={`text-2xl font-bold ${getDamageColor(composition.threat.primary)}`}>
                      {composition.threat.primary.toUpperCase()} DAMAGE
                    </p>
                  </div>
                </div>

                {/* Recommended Items */}
                <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Rekomendasi Item Efisien</h3>
                  
                  <div className="space-y-3">
                    {itemRecommendations.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.name}</p>
                          <div className="flex gap-2 mt-1">
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              {item.role}
                            </span>
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                              {item.effect}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm">{item.gold} gold</p>
                          <p className="text-xs text-gray-500">{item.efficiency.toFixed(1)} per unit</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
