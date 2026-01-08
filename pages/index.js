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
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              {statsLoading ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
                    <span className="ml-2 text-gray-600">Memuat statistik...</span>
                  </div>
                </div>
              ) : (
                <StatsOverview stats={stats} />
              )}

              {/* 3. Main Features & Navigation */}
              <FeatureNavigation />

              {/* 4. Role Distribution */}
              <RoleDistribution 
                roleDistribution={roleDistribution} 
                totalHeroes={stats.totalHeroes} 
              />

              {/* 5. Latest Hero Adjustments */}
              <LatestAdjustments 
                adjustments={heroAdjustments} 
                loading={adjustmentsLoading} 
              />

              {/* 6. Admin Console (Quick Actions) */}
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
