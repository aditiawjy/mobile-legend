import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import SearchBar from '../components/common/SearchBar'
import StatsOverview from '../components/common/StatsOverview'
import RoleDistribution from '../components/common/RoleDistribution'
import FeatureNavigation from '../components/common/FeatureNavigation'
import LatestAdjustments from '../components/common/LatestAdjustments'
import AppLayout from '../components/common/AppLayout'
import QuickActions from '../components/QuickActions'
import HeroFilter from '../components/hero/HeroFilter'
import HeroGrid from '../components/hero/HeroGrid'

export default function Home() {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [suggestions, setSuggestions] = useState([])
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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/stats?t=${Date.now()}`)
        if (response.ok) {
          const data = await response.json()
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

  useEffect(() => {
    const fetchRoleDistribution = async () => {
      try {
        const response = await fetch('/api/heroes')
        if (response.ok) {
          const heroes = await response.json()
          const roleCounts = {}
          const standardRoles = ['Tank', 'Fighter', 'Assassin', 'Mage', 'Marksman', 'Support']
          
          heroes.forEach(hero => {
            let primaryRole = hero.role?.split('/')[0].trim() || 'Unknown'
            primaryRole = primaryRole.charAt(0).toUpperCase() + primaryRole.slice(1).toLowerCase()
            const matchedRole = standardRoles.find(r => r.toLowerCase() === primaryRole.toLowerCase()) || primaryRole
            roleCounts[matchedRole] = (roleCounts[matchedRole] || 0) + 1
          })
          
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
          setHeroAdjustments(Array.isArray(data) ? data : [])
        }
      } catch (error) {
        console.error('Error fetching adjustments:', error)
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
      } finally {
        setAllHeroesLoading(false)
      }
    }
    fetchAllHeroes()
  }, [showAllHeroes])

  const onSelect = (name) => {
    if (!name) return
    router.push(`/hero/${encodeURIComponent(name)}`)
  }

  const handleUpdateCSV = async (type) => {
    setCsvUpdating(true)
    setCsvMessage('')
    let endpoint = ''
    let label = ''

    switch(type) {
      case 'heroes': endpoint = '/api/export/heroes-csv'; label = 'Heroes'; break;
      case 'adjustments': endpoint = '/api/export/hero-adjustments-csv'; label = 'Hero Adjustments'; break;
      case 'emblems': endpoint = '/api/export/emblems-csv'; label = 'Emblems'; break;
      case 'spells': endpoint = '/api/export/battle-spells-csv'; label = 'Battle Spells'; break;
      default: return;
    }

    try {
      const response = await fetch(endpoint, { method: 'POST' })
      if (response.ok) {
        setCsvMessage(`✓ ${label} CSV updated!`)
        setTimeout(() => setCsvMessage(''), 3000)
      } else {
        setCsvMessage(`✗ Error updating ${label}`)
      }
    } catch (error) {
      setCsvMessage('✗ Error connection')
    } finally {
      setCsvUpdating(false)
    }
  }

  return (
    <AppLayout>
      <div className="bg-gray-50 min-h-screen">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-sky-700 via-blue-800 to-indigo-900 text-white pb-24 pt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="max-w-2xl">
                <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                  {showAllHeroes ? 'All Mobile Legends Heroes' : 'ML Helper Dashboard'}
                </h1>
                <p className="text-blue-100 text-lg md:text-xl font-light opacity-90 mb-8">
                  {showAllHeroes 
                    ? `Explore database lengkap hero Mobile Legends (${allHeroes.length} heroes).`
                    : 'Pusat komando analisis data hero, item, dan strategi Mobile Legends Anda.'
                  }
                </p>
                
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => router.push(showAllHeroes ? '/' : '/?showAll=true')}
                    className="px-6 py-3 bg-white text-blue-700 font-bold rounded-2xl shadow-lg hover:bg-blue-50 transition-all active:scale-95"
                  >
                    {showAllHeroes ? 'Back to Dashboard' : 'View All Heroes'}
                  </button>
                  <button 
                    onClick={() => router.push('/draft-pick')}
                    className="px-6 py-3 bg-blue-600/30 text-white font-bold rounded-2xl border border-white/20 backdrop-blur-sm hover:bg-blue-600/50 transition-all active:scale-95"
                  >
                    Open Draft Pick
                  </button>
                </div>
              </div>

              {!showAllHeroes && (
                <div className="w-full md:w-96 bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 shadow-2xl">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-blue-200 mb-4">Quick Hero Search</h3>
                  <SearchBar
                    onSearch={(heroName) => { if (heroName) onSelect(heroName) }}
                    placeholder="Type hero name..."
                    className="!bg-white/90"
                  />
                  <p className="mt-4 text-xs text-blue-200/70 italic">
                    Example: Lancelot, Gusion, or Tigreal
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Section - Negative Margin for "Overlap" effect */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16">
          {!showAllHeroes ? (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="relative z-10">
                {statsLoading ? (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="h-32 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/20 shadow-sm"></div>
                    ))}
                  </div>
                ) : (
                  <StatsOverview stats={stats} />
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12">
                {/* Left Column - Main Content */}
                <div className="lg:col-span-8 space-y-8">
                  {/* Feature Cards */}
                  <section>
                    <FeatureNavigation />
                  </section>

                  {/* Latest Adjustments */}
                  <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-1 overflow-hidden">
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                      <h2 className="text-xl font-bold text-gray-900">Latest Hero Adjustments</h2>
                      <button 
                        onClick={() => router.push('/hero/adjustments')}
                        className="text-sm text-blue-600 font-medium hover:underline"
                      >
                        View all
                      </button>
                    </div>
                    <div className="p-2">
                      <LatestAdjustments 
                        adjustments={heroAdjustments} 
                        loading={adjustmentsLoading} 
                        compact={true}
                      />
                    </div>
                  </section>
                </div>

                {/* Right Column - Sidebar Widgets */}
                <div className="lg:col-span-4 space-y-8">
                  {/* Role Distribution */}
                  <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                    <RoleDistribution 
                      roleDistribution={roleDistribution} 
                      totalHeroes={stats.totalHeroes} 
                      layout="vertical"
                    />
                  </section>

                  {/* Admin Console */}
                  <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Admin Console
                    </h3>
                    <QuickActions 
                       csvUpdating={csvUpdating}
                       csvMessage={csvMessage}
                       handleUpdateCSV={() => handleUpdateCSV('heroes')}
                       handleUpdateAdjustmentsCSV={() => handleUpdateCSV('adjustments')}
                       handleUpdateEmblemsCSV={() => handleUpdateCSV('emblems')}
                       handleUpdateSpellsCSV={() => handleUpdateCSV('spells')}
                    />
                  </section>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-xl p-8 mb-12 min-h-[600px]">
              <div className="mb-8 border-b border-gray-100 pb-6">
                <HeroFilter onFilterChange={setHeroFilters} />
              </div>
              
              <HeroGrid 
                heroes={allHeroes} 
                loading={allHeroesLoading} 
                filters={heroFilters}
              />
            </div>
          )}

          <footer className="pb-10 pt-10 border-t border-gray-100 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-sky-600 rounded flex items-center justify-center text-[10px] font-bold text-white">M</div>
              <span className="text-gray-900 font-semibold">ML Helper</span>
            </div>
            <p className="text-sm text-gray-500">© {new Date().getFullYear()} Mobile Legends Database & Helper Tool. Built for players.</p>
          </footer>
        </div>
      </div>
    </AppLayout>
  )
}
