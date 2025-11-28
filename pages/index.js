import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import SearchBar from '../components/common/SearchBar'
import DashboardOverview from '../components/common/DashboardOverview'
import AppLayout from '../components/common/AppLayout'
import QuickActions from '../components/QuickActions'
import HeroFilter from '../components/hero/HeroFilter'
import HeroGrid from '../components/hero/HeroGrid'

export default function Home() {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [activeIndex, setActiveIndex] = useState(-1)
  const [stats, setStats] = useState({
    totalHeroes: 0,
    totalItems: 0,
    totalMatches: 0,
    totalTeams: 0
  })
  const [statsLoading, setStatsLoading] = useState(true)
  const [heroAdjustments, setHeroAdjustments] = useState([])
  const [adjustmentsLoading, setAdjustmentsLoading] = useState(true)
  const [allHeroes, setAllHeroes] = useState([])
  const [allHeroesLoading, setAllHeroesLoading] = useState(false)
  const [csvUpdating, setCsvUpdating] = useState(false)
  const [csvMessage, setCsvMessage] = useState('')
  const [roleDistribution, setRoleDistribution] = useState([])
  const [heroFilters, setHeroFilters] = useState({})
  const dropdownRef = useRef(null)
  const inputRef = useRef(null)

  const showAllHeroes = router.query.showAll === 'true'

  function useDebounce(value, delay) {
    const [v, setV] = useState(value)
    useEffect(() => {
      const t = setTimeout(() => setV(value), delay)
      return () => clearTimeout(t)
    }, [value, delay])
    return v
  }

  const debouncedQuery = useDebounce(q, 200)

  // Homepage no longer loads hero detail inline; navigate to /hero/[name]

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/stats?t=${Date.now()}`)
        if (response.ok) {
          const data = await response.json()
          console.log('Stats received:', data)
          setStats(data)
        }
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setStatsLoading(false)
      }
    }
    fetchStats()
  }, [])

  // Fetch role distribution for dashboard widget
  useEffect(() => {
    const fetchRoleDistribution = async () => {
      try {
        const response = await fetch('/api/heroes')
        if (response.ok) {
          const heroes = await response.json()
          // Calculate role distribution
          const roleCounts = {}
          // Standard role names for normalization
          const standardRoles = ['Tank', 'Fighter', 'Assassin', 'Mage', 'Marksman', 'Support']
          
          heroes.forEach(hero => {
            // Get primary role and normalize
            let primaryRole = hero.role?.split('/')[0].trim() || 'Unknown'
            // Normalize to standard case (first letter uppercase)
            primaryRole = primaryRole.charAt(0).toUpperCase() + primaryRole.slice(1).toLowerCase()
            // Match to standard role if possible
            const matchedRole = standardRoles.find(r => r.toLowerCase() === primaryRole.toLowerCase()) || primaryRole
            roleCounts[matchedRole] = (roleCounts[matchedRole] || 0) + 1
          })
          
          // Convert to array, filter out Unknown if empty, and sort by standard order then count
          const roleOrder = { Tank: 1, Fighter: 2, Assassin: 3, Mage: 4, Marksman: 5, Support: 6 }
          const distribution = Object.entries(roleCounts)
            .filter(([role]) => role !== 'Unknown' || roleCounts[role] > 0)
            .map(([role, count]) => ({ role, count }))
            .sort((a, b) => (roleOrder[a.role] || 99) - (roleOrder[b.role] || 99))
          setRoleDistribution(distribution)
        }
      } catch (error) {
        console.error('Error fetching role distribution:', error)
      }
    }
    fetchRoleDistribution()
  }, [])

  useEffect(() => {
    const fetchLatestAdjustments = async () => {
      try {
        const response = await fetch('/api/heroes/adjustments?limit=10&sort=date_desc')
        if (response.ok) {
          const data = await response.json()
          console.log('Adjustments data:', data)
          setHeroAdjustments(Array.isArray(data) ? data : [])
        } else {
          console.error('Failed to fetch adjustments:', response.status)
          setHeroAdjustments([])
        }
      } catch (error) {
        console.error('Error fetching adjustments:', error)
        setHeroAdjustments([])
      } finally {
        setAdjustmentsLoading(false)
      }
    }
    fetchLatestAdjustments()
  }, [])

  useEffect(() => {
    const fetchAllHeroes = async () => {
      if (!showAllHeroes) return

      setAllHeroesLoading(true)
      try {
        const response = await fetch('/api/heroes')
        if (response.ok) {
          const data = await response.json()
          setAllHeroes(Array.isArray(data) ? data : [])
        }
      } catch (error) {
        console.error('Error fetching all heroes:', error)
        setAllHeroes([])
      } finally {
        setAllHeroesLoading(false)
      }
    }

    fetchAllHeroes()
  }, [showAllHeroes])

  useEffect(() => {
    let ignore = false
    const search = async () => {
      if (!debouncedQuery) {
        setSuggestions([])
        return
      }
      try {
        const res = await fetch(`/api/heroes_search?q=${encodeURIComponent(debouncedQuery)}`)
        if (!res.ok) throw new Error('Network error')
        const data = await res.json()
        if (!ignore) setSuggestions(Array.isArray(data) ? data : [])
      } catch (e) {
        console.error(e)
      }
    }
    search()
    return () => { ignore = true }
  }, [debouncedQuery])
  const onSelect = (name) => {
    if (!name) return
    setQ(name)
    setSuggestions([])
    // Navigate to dedicated hero detail page
    router.push(`/hero/${encodeURIComponent(name)}`)
  }

  useEffect(() => {
    const onDocClick = (e) => {
      if (!dropdownRef.current) return
      if (!dropdownRef.current.contains(e.target) && e.target !== inputRef.current) {
        setSuggestions([])
      }
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  const handleUpdateCSV = async () => {
    setCsvUpdating(true)
    setCsvMessage('')
    try {
      const response = await fetch('/api/export/heroes-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        const data = await response.json()
        setCsvMessage(`✓ Heroes CSV updated! (${data.heroCount} heroes)`)
        setTimeout(() => setCsvMessage(''), 3000)
      } else {
        const error = await response.json()
        setCsvMessage(`✗ Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error updating CSV:', error)
      setCsvMessage('✗ Error updating CSV')
    } finally {
      setCsvUpdating(false)
    }
  }

  const handleUpdateAdjustmentsCSV = async () => {
    setCsvUpdating(true)
    setCsvMessage('')
    try {
      const response = await fetch('/api/export/hero-adjustments-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        const data = await response.json()
        setCsvMessage(`✓ Hero Adjustments CSV updated! (${data.adjustmentCount} adjustments)`)
        setTimeout(() => setCsvMessage(''), 3000)
      } else {
        const error = await response.json()
        setCsvMessage(`✗ Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error updating Adjustments CSV:', error)
      setCsvMessage('✗ Error updating Adjustments CSV')
    } finally {
      setCsvUpdating(false)
    }
  }

  const handleUpdateEmblemsCSV = async () => {
    setCsvUpdating(true)
    setCsvMessage('')
    try {
      const response = await fetch('/api/export/emblems-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        const data = await response.json()
        setCsvMessage(`✓ Emblems CSV updated! (${data.emblemCount} emblems)`)
        setTimeout(() => setCsvMessage(''), 3000)
      } else {
        const error = await response.json()
        setCsvMessage(`✗ Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error updating Emblems CSV:', error)
      setCsvMessage('✗ Error updating Emblems CSV')
    } finally {
      setCsvUpdating(false)
    }
  }

  const handleUpdateSpellsCSV = async () => {
    setCsvUpdating(true)
    setCsvMessage('')
    try {
      const response = await fetch('/api/export/battle-spells-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        const data = await response.json()
        setCsvMessage(`✓ Battle Spells CSV updated! (${data.spellCount} spells)`)
        setTimeout(() => setCsvMessage(''), 3000)
      } else {
        const error = await response.json()
        setCsvMessage(`✗ Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error updating Battle Spells CSV:', error)
      setCsvMessage('✗ Error updating Battle Spells CSV')
    } finally {
      setCsvUpdating(false)
    }
  }

  return (
    <AppLayout>
      <div className="bg-gradient-to-br from-sky-50 via-white to-blue-50 min-h-screen">
        <div className={`mx-auto px-4 sm:px-6 lg:px-8 py-8 ${showAllHeroes ? 'max-w-full' : 'max-w-7xl'}`}>
          <header className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 flex items-center gap-3">
                <span className="text-sky-600">ML</span> Helper
                {showAllHeroes && <span className="text-lg font-normal text-gray-500">- All Heroes</span>}
              </h1>
              <p className="text-gray-600 mt-2">
                {showAllHeroes
                  ? `Menampilkan semua ${allHeroes.length} heroes dari database Mobile Legends.`
                  : 'Cari dan kelola data hero Mobile Legends dengan mudah dan efisien.'
                }
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <a href="/" className="text-sm inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-200 text-gray-700 bg-white hover:bg-gray-100">
                {showAllHeroes ? 'Dashboard' : 'Home'}
              </a>
            </div>
          </header>

          {!showAllHeroes ? (
            <>
              {/* 1. Search Bar (Top Priority) */}
              <div className="mb-8">
                <SearchBar
                  onSearch={(heroName) => { if (heroName) onSelect(heroName) }}
                  placeholder="Cari hero Mobile Legends..."
                />
              </div>

              {/* 2. Stats Overview */}
              <div className="mb-12">
                {statsLoading ? (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
                      <span className="ml-2 text-gray-600">Memuat statistik...</span>
                    </div>
                  </div>
                ) : (
                  <DashboardOverview stats={stats} roleDistribution={roleDistribution} />
                )}
              </div>

              {/* 3. Latest Hero Adjustments */}
              {/* 3. Latest Hero Adjustments - Improved UI */}
              <div className="mb-12">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  {/* Header with gradient */}
                  <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-white">Latest Hero Adjustments</h2>
                          <p className="text-orange-100 text-sm">Balance changes & patch notes</p>
                        </div>
                      </div>
                      <a href="/edit-hero-adjustments" className="text-sm px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors backdrop-blur-sm">
                        View All
                      </a>
                    </div>
                  </div>

                  <div className="p-6">
                    {adjustmentsLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange-200 border-t-orange-500"></div>
                      </div>
                    ) : heroAdjustments.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {heroAdjustments.slice(0, 6).map((adj, idx) => {
                          const desc = (adj.description || '').toLowerCase()
                          const buffKeywords = ['buff', 'increased', 'improved', 'enhanced', 'added', 'bonus', 'faster', 'stronger', 'higher', 'more damage', 'reduced cooldown', 'lower mana']
                          const nerfKeywords = ['nerf', 'decreased', 'reduced', 'lowered', 'removed', 'slower', 'weaker', 'less damage', 'increased cooldown', 'higher mana cost']
                          const isBuff = buffKeywords.some(k => desc.includes(k))
                          const isNerf = nerfKeywords.some(k => desc.includes(k))
                          const adjustmentType = isBuff && isNerf ? 'mixed' : isBuff ? 'buff' : isNerf ? 'nerf' : 'adjust'
                          
                          const typeStyles = {
                            buff: { 
                              gradient: 'from-green-500 to-emerald-600', 
                              bg: 'bg-green-50', 
                              border: 'border-green-200 hover:border-green-300',
                              text: 'text-green-700',
                              icon: '▲',
                              label: 'BUFF'
                            },
                            nerf: { 
                              gradient: 'from-red-500 to-rose-600', 
                              bg: 'bg-red-50', 
                              border: 'border-red-200 hover:border-red-300',
                              text: 'text-red-700',
                              icon: '▼',
                              label: 'NERF'
                            },
                            mixed: { 
                              gradient: 'from-yellow-500 to-amber-600', 
                              bg: 'bg-yellow-50', 
                              border: 'border-yellow-200 hover:border-yellow-300',
                              text: 'text-yellow-700',
                              icon: '◆',
                              label: 'ADJUST'
                            },
                            adjust: { 
                              gradient: 'from-blue-500 to-indigo-600', 
                              bg: 'bg-blue-50', 
                              border: 'border-blue-200 hover:border-blue-300',
                              text: 'text-blue-700',
                              icon: '●',
                              label: 'UPDATE'
                            },
                          }
                          const style = typeStyles[adjustmentType]
                          
                          return (
                            <a 
                              key={idx} 
                              href={`/hero/${encodeURIComponent(adj.hero_name)}`}
                              className={`group relative ${style.bg} rounded-xl border-2 ${style.border} p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}
                            >
                              {/* Adjustment Type Indicator */}
                              <div className={`absolute -top-2 -right-2 w-16 h-16 bg-gradient-to-br ${style.gradient} rounded-full opacity-10 group-hover:opacity-20 transition-opacity`}></div>
                              
                              <div className="relative flex gap-4">
                                {/* Hero Avatar */}
                                <div className={`flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br ${style.gradient} flex items-center justify-center shadow-lg`}>
                                  <span className="text-white font-bold text-xl">
                                    {adj.hero_name?.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                
                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold text-gray-900 group-hover:text-gray-700 transition-colors truncate">
                                      {adj.hero_name}
                                    </h3>
                                    <span className={`flex-shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${style.gradient} text-white shadow-sm`}>
                                      <span>{style.icon}</span>
                                      {style.label}
                                    </span>
                                  </div>
                                  
                                  <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                                    {adj.description}
                                  </p>
                                  
                                  <div className="flex items-center gap-3 text-xs">
                                    <span className={`${style.text} font-medium`}>
                                      {adj.season || 'Latest Patch'}
                                    </span>
                                    <span className="text-gray-400">•</span>
                                    <span className="text-gray-500">
                                      {adj.adjustment_date ? (() => {
                                        try {
                                          const date = new Date(adj.adjustment_date)
                                          return !isNaN(date) ? date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }) : adj.adjustment_date
                                        } catch (e) {
                                          return adj.adjustment_date
                                        }
                                      })() : 'Recent'}
                                    </span>
                                  </div>
                                </div>
                                
                                {/* Arrow indicator */}
                                <div className="flex-shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <svg className={`w-5 h-5 ${style.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </div>
                              </div>
                            </a>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <p className="text-gray-500 font-medium">Tidak ada adjustments terbaru</p>
                        <p className="text-gray-400 text-sm mt-1">Check back later for balance updates</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 4. Quick Actions (Admin/CSV) */}
              <div className="mb-8">
                <QuickActions 
                   csvUpdating={csvUpdating}
                   csvMessage={csvMessage}
                   handleUpdateCSV={handleUpdateCSV}
                   handleUpdateAdjustmentsCSV={handleUpdateAdjustmentsCSV}
                   handleUpdateEmblemsCSV={handleUpdateEmblemsCSV}
                   handleUpdateSpellsCSV={handleUpdateSpellsCSV}
                />
              </div>
            </>
          ) : (
            <div className="mb-8">
              {/* Hero Filter */}
              <HeroFilter onFilterChange={setHeroFilters} />
              
              {/* Hero Grid with Pagination */}
              <HeroGrid 
                heroes={allHeroes} 
                loading={allHeroesLoading} 
                filters={heroFilters}
              />
            </div>
          )}

          <footer className="mt-10 text-center text-xs text-gray-400">{new Date().getFullYear()} ML Helper</footer>
        </div>
      </div>
    </AppLayout>
  )
}
