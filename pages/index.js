import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import EditNav from '../components/EditNav'
import SearchBar from '../components/SearchBar'
import HeroCard from '../components/HeroCard'
import DashboardOverview from '../components/DashboardOverview'
import AppLayout from '../components/AppLayout'

// Backend origin for opening full PHP pages (not proxied via Next.js)
// You can override this in .env.local as NEXT_PUBLIC_BACKEND_ORIGIN
const BACKEND_ORIGIN = process.env.NEXT_PUBLIC_BACKEND_ORIGIN || 'http://localhost:8888'

export default function Home() {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [activeIndex, setActiveIndex] = useState(-1)
  const [detail, setDetail] = useState(null)
  const [heroAttrs, setHeroAttrs] = useState(null)
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

  const onKeyDown = (e) => {
    if (!suggestions.length) return
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex((i) => (i + 1) % suggestions.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length)
        break
      case 'Enter':
        if (activeIndex >= 0) {
          e.preventDefault()
          onSelect(suggestions[activeIndex])
        } else if (q.trim()) {
          onSelect(q.trim())
        }
        break
      case 'Escape':
        setSuggestions([])
        break
    }
  }

  const skills = useMemo(() => {
    if (!detail) return []
    const s = [
      { key: 'skill1', title: 'Basic Attack', name: detail.skill1_name, desc: detail.skill1_desc },
      { key: 'skill2', title: 'Skill 1', name: detail.skill2_name, desc: detail.skill2_desc },
      { key: 'skill3', title: 'Skill 2', name: detail.skill3_name, desc: detail.skill3_desc },
      { key: 'ultimate', title: 'Ultimate', name: detail.ultimate_name, desc: detail.ultimate_desc },
      { key: 'skill4', title: 'Skill 4', name: detail.skill4_name, desc: detail.skill4_desc },
    ].filter(s => (s.name && s.name.trim()) || (s.desc && s.desc.trim()))
    return s
  }, [detail])

  useEffect(() => {
    if (detail?.hero_name) {
      fetch(`/api/heroes/${encodeURIComponent(detail.hero_name)}/attributes`)
        .then(r => r.ok ? r.json() : null)
        .then(a => setHeroAttrs(a || null))
        .catch(() => setHeroAttrs(null))
    } else {
      setHeroAttrs(null)
    }
  }, [detail?.hero_name])

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
  return (
    <AppLayout>
      <div className="bg-gradient-to-br from-sky-50 via-white to-blue-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <div className="flex items-center gap-2">
              {!showAllHeroes && (
                <>
                  <a href="/items" className="text-sm inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-200 text-gray-700 bg-white hover:bg-gray-100">Items</a>
                  <a href="/damage-composition" className="text-sm inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100">Analysis</a>
                  <a href="/edit-matches" className="text-sm inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-200 text-gray-700 bg-white hover:bg-gray-100">Matches</a>
                  <a href="/edit-teams" className="text-sm inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-200 text-gray-700 bg-white hover:bg-gray-100">Teams</a>
                </>
              )}
              <a href="/" className="text-sm inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-200 text-gray-700 bg-white hover:bg-gray-100">
                {showAllHeroes ? 'Dashboard' : 'Home'}
              </a>
            </div>
          </header>

          {!showAllHeroes && (
            <div className="mb-12">
              {statsLoading ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
                    <span className="ml-2 text-gray-600">Memuat statistik...</span>
                  </div>
                </div>
              ) : (
                <DashboardOverview stats={stats} />
              )}
            </div>
          )}

          {!showAllHeroes && (
            <div className="mb-8">
              <SearchBar
                onSearch={(heroName) => { if (heroName) onSelect(heroName) }}
                placeholder="Cari hero Mobile Legends..."
              />
            </div>
          )}

          {/* Latest Hero Adjustments */}
          {!showAllHeroes && (
            <div className="mb-12">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Latest Hero Adjustments
                </h2>

                {adjustmentsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                    <span className="ml-2 text-gray-600">Memuat adjustments...</span>
                  </div>
                ) : heroAdjustments.length > 0 ? (
                  <div className="space-y-3">
                    {heroAdjustments.map((adj, idx) => (
                      <div key={idx} className="flex items-start justify-between p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200 hover:shadow-md transition-shadow">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <a href={`/hero/${encodeURIComponent(adj.hero_name)}`} className="font-semibold text-lg text-orange-700 hover:text-orange-900 transition-colors">
                              {adj.hero_name}
                            </a>
                            <span className="text-xs px-2 py-1 rounded-full bg-orange-200 text-orange-800">
                              {adj.season || 'Latest'}
                            </span>
                          </div>
                          <p className="text-gray-700 text-sm">{adj.description}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {adj.adjustment_date ? (() => {
                              try {
                                const date = new Date(adj.adjustment_date)
                                return !isNaN(date) ? date.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }) : adj.adjustment_date
                              } catch (e) {
                                return adj.adjustment_date
                              }
                            })() : 'No date'}
                          </p>
                        </div>
                        <a
                          href={`/hero/${encodeURIComponent(adj.hero_name)}`}
                          className="ml-4 px-3 py-1.5 text-sm bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors whitespace-nowrap"
                        >
                          View Hero
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Tidak ada adjustments terbaru</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Hero detail is now a dedicated page at /hero/[name] */}

          {showAllHeroes && (
            <div className="mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">All Heroes</h2>
                    <p className="text-gray-600 mt-1">Menampilkan semua {allHeroes.length} heroes dari database</p>
                  </div>
                  <button
                    onClick={() => router.push('/')}
                    className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Kembali ke Search
                  </button>
                </div>

                {allHeroesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
                    <span className="ml-2 text-gray-600">Memuat heroes...</span>
                  </div>
                ) : allHeroes.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {allHeroes.map((hero, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer border border-gray-200"
                        onClick={() => onSelect(hero.hero_name || hero.name)}
                      >
                        <div className="text-center">
                          <div className="w-16 h-16 bg-gradient-to-br from-sky-400 to-blue-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                            <span className="text-white font-bold text-lg">
                              {hero.hero_name ? hero.hero_name.charAt(0).toUpperCase() : hero.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <h3 className="font-semibold text-gray-900 text-sm mb-1">
                            {hero.hero_name || hero.name}
                          </h3>
                          <p className="text-xs text-gray-500">{hero.role || 'Hero'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-600">Tidak ada heroes ditemukan di database.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <footer className="mt-10 text-center text-xs text-gray-400">{new Date().getFullYear()} ML Helper</footer>
        </div>
      </div>
    </AppLayout>
  )
}

function useDebounce(value, delay) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return v
}
