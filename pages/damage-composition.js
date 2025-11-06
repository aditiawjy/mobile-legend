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
  const generateItemRecommendations = async (comp) => {
    const primary = comp.threat.primary
    
    try {
      // Fetch primary threat items
      const res1 = await fetch('/api/analysis/recommend-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threatType: primary, limit: 4 })
      })
      
      // Fetch true damage items if not primary threat
      let allItems = []
      if (res1.ok) {
        const primaryItems = await res1.json()
        allItems = [...primaryItems]
      }
      
      if (primary !== 'true') {
        const res2 = await fetch('/api/analysis/recommend-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ threatType: 'true', limit: 4 })
        })
        if (res2.ok) {
          const trueItems = await res2.json()
          allItems = [...allItems, ...trueItems]
        }
      }
      
      // Sort by efficiency and limit
      allItems.sort((a, b) => b.efficiency - a.efficiency)
      setItemRecommendations(allItems.slice(0, 8))
    } catch (e) {
      console.error('Failed to fetch recommendations:', e)
      setItemRecommendations([])
    }
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
          <header className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Team Damage Analysis</h1>
              <p className="text-gray-600">Analisis komposisi damage team musuh dan dapatkan rekomendasi item efisien</p>
            </div>
            <div className="flex items-center gap-2">
              <a href="/" className="text-sm inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-200 text-gray-700 bg-white hover:bg-gray-100">
                Heroes
              </a>
              <a href="/items" className="text-sm inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-200 text-gray-700 bg-white hover:bg-gray-100">
                Items
              </a>
              <a href="/compare-items" className="text-sm inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Compare
              </a>
            </div>
          </header>

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
                    {itemRecommendations.length > 0 ? (
                      itemRecommendations.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.name}</p>
                            <div className="flex gap-2 mt-1">
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                {item.category}
                              </span>
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                {item.stat_name}: +{item.defense_stat}
                              </span>
                            </div>
                            {item.description && (
                              <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-sm">{item.price.toLocaleString()} gold</p>
                            <p className="text-xs text-gray-500">{item.efficiency.toFixed(2)} efficiency</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>Analisis komposisi untuk melihat rekomendasi item</p>
                      </div>
                    )}
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
