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
  const [csvUpdating, setCsvUpdating] = useState(false)
  const [csvMessage, setCsvMessage] = useState('')
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
            <div className="flex items-center gap-2 flex-wrap">
              {!showAllHeroes && (
                <>
                  <a href="/edit-hero-info" className="text-sm inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 font-medium">Edit Hero Info & Lanes</a>
                  <a href="/items" className="text-sm inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-200 text-gray-700 bg-white hover:bg-gray-100">Items</a>
                  <a href="/damage-composition" className="text-sm inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100">Analysis</a>
                  
                  {/* CSV Update Button */}
                  <button
                    onClick={handleUpdateCSV}
                    disabled={csvUpdating}
                    title="Update Heroes CSV"
                    className="text-sm inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-green-600 text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>{csvUpdating ? 'Updating...' : 'CSV Heroes'}</span>
                  </button>
                  {csvMessage && (
                    <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded">
                      {csvMessage}
                    </span>
                  )}
                  
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

          {/* CSV Export Section */}
          {!showAllHeroes && (
            <div className="mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Manage Heroes
                </h2>
                <p className="text-sm text-gray-600 mb-4">Edit hero information, lanes, skills, and attributes</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                  <a
                    href="/edit-hero-info"
                    className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <h3 className="font-semibold text-blue-900 mb-1">Hero Info & Lanes</h3>
                    <p className="text-xs text-blue-700 mb-2">Edit hero details and lane assignments</p>
                    <span className="inline-flex items-center gap-1 text-xs text-blue-600 font-medium">
                      Edit
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </a>

                  <a
                    href="/edit-skills"
                    className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <h3 className="font-semibold text-purple-900 mb-1">Hero Skills</h3>
                    <p className="text-xs text-purple-700 mb-2">Edit hero skills and descriptions</p>
                    <span className="inline-flex items-center gap-1 text-xs text-purple-600 font-medium">
                      Edit
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </a>

                  <a
                    href="/edit-hero-attributes"
                    className="p-4 bg-green-50 border border-green-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <h3 className="font-semibold text-green-900 mb-1">Hero Attributes</h3>
                    <p className="text-xs text-green-700 mb-2">Edit hero stats and attributes</p>
                    <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                      Edit
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </a>

                  <a
                    href="/edit-hero-adjustments"
                    className="p-4 bg-orange-50 border border-orange-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <h3 className="font-semibold text-orange-900 mb-1">Hero Adjustments</h3>
                    <p className="text-xs text-orange-700 mb-2">Edit balance changes and patches</p>
                    <span className="inline-flex items-center gap-1 text-xs text-orange-600 font-medium">
                      Edit
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </a>

                  <a
                    href="/edit-hero-combos"
                    className="p-4 bg-pink-50 border border-pink-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <h3 className="font-semibold text-pink-900 mb-1 flex items-center gap-1">
                      🔥 Hero Combos
                      <span className="text-[8px] px-1.5 py-0.5 bg-pink-200 text-pink-700 rounded-full font-normal">NEW</span>
                    </h3>
                    <p className="text-xs text-pink-700 mb-2">Manage powerful hero combinations</p>
                    <span className="inline-flex items-center gap-1 text-xs text-pink-600 font-medium">
                      Manage
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {!showAllHeroes && (
            <div className="mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  CSV Data Export
                </h2>
                <p className="text-sm text-gray-600 mb-6">Update CSV files with latest database data</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">Heroes CSV</h3>
                    <p className="text-xs text-blue-700 mb-3">Export all heroes data to CSV file</p>
                    <button
                      onClick={handleUpdateCSV}
                      disabled={csvUpdating}
                      className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      {csvUpdating ? 'Updating...' : 'Update Heroes CSV'}
                    </button>
                    <p className="text-xs text-gray-500 mt-2">File: /csv/heroes.csv</p>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-semibold text-green-900 mb-2">Items CSV</h3>
                    <p className="text-xs text-green-700 mb-3">Export all items data to CSV file</p>
                    <a
                      href="/items"
                      className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 inline-block text-center"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      Go to Items Page
                    </a>
                    <p className="text-xs text-gray-500 mt-2">File: /csv/items.csv</p>
                  </div>
                  
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h3 className="font-semibold text-purple-900 mb-2">Hero Adjustments CSV</h3>
                    <p className="text-xs text-purple-700 mb-3">Export hero adjustments history to CSV</p>
                    <button
                      onClick={handleUpdateAdjustmentsCSV}
                      disabled={csvUpdating}
                      className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      {csvUpdating ? 'Updating...' : 'Update Adjustments CSV'}
                    </button>
                    <p className="text-xs text-gray-500 mt-2">File: /csv/hero-adjustments.csv</p>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="font-semibold text-yellow-900 mb-2">Emblems CSV</h3>
                    <p className="text-xs text-yellow-700 mb-3">Export all emblems data to CSV file</p>
                    <button
                      onClick={handleUpdateEmblemsCSV}
                      disabled={csvUpdating}
                      className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      {csvUpdating ? 'Updating...' : 'Update Emblems CSV'}
                    </button>
                    <p className="text-xs text-gray-500 mt-2">File: /csv/emblems.csv</p>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="font-semibold text-red-900 mb-2">Battle Spells CSV</h3>
                    <p className="text-xs text-red-700 mb-3">Export all battle spells to CSV file</p>
                    <button
                      onClick={handleUpdateSpellsCSV}
                      disabled={csvUpdating}
                      className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      {csvUpdating ? 'Updating...' : 'Update Spells CSV'}
                    </button>
                    <p className="text-xs text-gray-500 mt-2">File: /csv/battle-spells.csv</p>
                  </div>
                </div>
                
                {csvMessage && (
                  <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg text-green-800 text-sm">
                    {csvMessage}
                  </div>
                )}
              </div>
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
                        className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-all border border-gray-200"
                      >
                        <div 
                          className="text-center cursor-pointer mb-3"
                          onClick={() => onSelect(hero.hero_name || hero.name)}
                        >
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
                        <div className="flex gap-2 pt-3 border-t border-gray-200">
                          <button
                            onClick={() => router.push(`/hero/${encodeURIComponent(hero.hero_name || hero.name)}`)}
                            className="flex-1 text-xs px-2 py-1.5 bg-sky-100 text-sky-700 rounded hover:bg-sky-200 transition-colors"
                          >
                            Detail
                          </button>
                          <button
                            onClick={() => router.push(`/edit-skills?name=${encodeURIComponent(hero.hero_name || hero.name)}`)}
                            className="flex-1 text-xs px-2 py-1.5 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                          >
                            Edit
                          </button>
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
