import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'

export default function EditHeroInfoPage() {
  const router = useRouter()
  const name = typeof router.query.name === 'string' ? router.query.name : ''
  
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  
  const [heroData, setHeroData] = useState({
    role: '',
    damage_type: '',
    attack_reliance: '',
    note: ''
  })

  const [allLanes, setAllLanes] = useState([])
  const [heroLanes, setHeroLanes] = useState([])
  const [selectedLaneId, setSelectedLaneId] = useState('')
  const [selectedPriority, setSelectedPriority] = useState(1)
  
  // Autocomplete state
  const [q, setQ] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [activeIndex, setActiveIndex] = useState(-1)
  const [userTyping, setUserTyping] = useState(false)
  const dropdownRef = useRef(null)
  const inputRef = useRef(null)

  // Load lanes options
  useEffect(() => {
    const loadLanes = async () => {
      try {
        const res = await fetch('/api/lanes')
        if (res.ok) {
          const lanes = await res.json()
          setAllLanes(lanes)
        }
      } catch (e) {
        console.error('Error loading lanes:', e)
      }
    }
    loadLanes()
  }, [])

  // Load hero data and lanes
  useEffect(() => {
    if (!name) {
      setHeroData({ role: '', damage_type: '', attack_reliance: '', note: '' })
      setHeroLanes([])
      return
    }

    const loadHero = async () => {
      setLoading(true)
      setErr('')
      setOk('')
      try {
        // Fetch hero info
        const heroRes = await fetch(`/api/heroes/${encodeURIComponent(name)}/info`, { method: 'PUT' }).catch(() => null)
        
        // Get from /api/heroes list
        const heroesRes = await fetch('/api/heroes')
        if (heroesRes.ok) {
          const heroes = await heroesRes.json()
          const hero = heroes.find(h => h.hero_name.toLowerCase() === name.toLowerCase())
          
          if (hero) {
            setHeroData({
              role: hero.role || '',
              damage_type: hero.damage_type || '',
              attack_reliance: hero.attack_reliance || '',
              note: hero.note || ''
            })
            
            // Set hero lanes if available
            if (hero.lanes && Array.isArray(hero.lanes)) {
              setHeroLanes(hero.lanes)
            }
          }
        }
      } catch (e) {
        setErr(e.message || 'Error loading hero data')
      } finally {
        setLoading(false)
      }
    }

    setQ(name)
    setUserTyping(false)
    loadHero()
  }, [name])

  // Debounce search
  const [debouncedQ, setDebouncedQ] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300)
    return () => clearTimeout(t)
  }, [q])

  useEffect(() => {
    let ignore = false
    const run = async () => {
      const term = debouncedQ.trim()
      if (!term || !userTyping) { setSuggestions([]); setActiveIndex(-1); return }
      try {
        const res = await fetch(`/api/heroes_search?q=${encodeURIComponent(term)}`)
        if (!res.ok) throw new Error('Network error')
        const arr = await res.json()
        if (!ignore) setSuggestions(Array.isArray(arr) ? arr : [])
      } catch (e) {
        console.error(e)
      }
    }
    run()
    return () => { ignore = true }
  }, [debouncedQ, userTyping])

  const onSelectHero = (heroName) => {
    setSuggestions([])
    setActiveIndex(-1)
    router.push({ pathname: '/edit-hero-info', query: { name: heroName } }, undefined, { shallow: false })
  }

  const onKeyDown = (e) => {
    if (!suggestions.length) return
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); setActiveIndex((i) => (i + 1) % suggestions.length); break
      case 'ArrowUp': e.preventDefault(); setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length); break
      case 'Enter': if (activeIndex >= 0) { e.preventDefault(); onSelectHero(suggestions[activeIndex]) } break
      case 'Escape': setSuggestions([]); break
    }
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

  const handleAddLane = async () => {
    if (!name || !selectedLaneId) {
      setErr('Pilih lane terlebih dahulu')
      return
    }

    setSaving(true)
    setErr('')
    setOk('')
    
    try {
      const res = await fetch('/api/admin/hero_lanes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hero_name: name,
          lane_id: parseInt(selectedLaneId),
          priority: parseInt(selectedPriority)
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal menambahkan lane')
      }

      // Reload hero lanes
      const heroesRes = await fetch('/api/heroes')
      if (heroesRes.ok) {
        const heroes = await heroesRes.json()
        const hero = heroes.find(h => h.hero_name.toLowerCase() === name.toLowerCase())
        if (hero && hero.lanes) {
          setHeroLanes(hero.lanes)
        }
      }

      setOk('Lane berhasil ditambahkan')
      setSelectedLaneId('')
      setSelectedPriority(1)
    } catch (e) {
      setErr(e.message || 'Error')
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveLane = async (laneId) => {
    if (!name) return

    setSaving(true)
    setErr('')
    
    try {
      const res = await fetch('/api/admin/hero_lanes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hero_name: name,
          lane_id: laneId
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal menghapus lane')
      }

      // Reload hero lanes
      const heroesRes = await fetch('/api/heroes')
      if (heroesRes.ok) {
        const heroes = await heroesRes.json()
        const hero = heroes.find(h => h.hero_name.toLowerCase() === name.toLowerCase())
        if (hero && hero.lanes) {
          setHeroLanes(hero.lanes)
        }
      }

      setOk('Lane berhasil dihapus')
    } catch (e) {
      setErr(e.message || 'Error')
    } finally {
      setSaving(false)
    }
  }

  const handleChangeInfo = (field, value) => {
    setHeroData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name) return

    setSaving(true)
    setErr('')
    setOk('')
    
    try {
      const res = await fetch(`/api/heroes/${encodeURIComponent(name)}/info`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(heroData)
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal menyimpan perubahan')
      }

      setOk('Informasi hero berhasil disimpan')
    } catch (e) {
      setErr(e.message || 'Error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Edit Hero Info & Lanes</h1>
          <div className="flex items-center gap-2">
            <a href="/" className="text-sm inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-200 text-gray-700 bg-white hover:bg-gray-100">Heroes</a>
            <a href="/" className="text-sm inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-200 text-gray-700 bg-white hover:bg-gray-100">Home</a>
          </div>
        </header>

        <section className="bg-white rounded-2xl shadow border border-gray-100 p-6 mb-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Hero</label>
            <div className="relative">
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => { setQ(e.target.value); setActiveIndex(-1); setUserTyping(true) }}
                onKeyDown={onKeyDown}
                placeholder="Ketik nama hero..."
                className="w-full rounded-md border border-gray-300 bg-white focus:border-black focus:ring-black px-3 py-2"
                autoComplete="off"
              />
              {suggestions.length > 0 && (
                <div
                  ref={dropdownRef}
                  className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-72 overflow-auto"
                >
                  {suggestions.map((nameOpt, i) => (
                    <div
                      key={nameOpt + i}
                      className={`cursor-pointer px-4 py-2 text-sm text-gray-700 ${i === 0 ? 'rounded-t-xl' : ''} ${i === suggestions.length - 1 ? 'rounded-b-xl' : ''} ${i === activeIndex ? 'bg-gray-100' : ''}`}
                      onMouseDown={(e) => { e.preventDefault(); onSelectHero(nameOpt) }}
                    >
                      {nameOpt}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {name && (
              <p className="text-xs text-gray-500 mt-1">Sedang mengedit: <span className="font-medium">{name}</span></p>
            )}
          </div>

          {loading && <p className="text-sm text-gray-500">Memuat data...</p>}
          {err && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3 mb-4">{err}</div>}
          {ok && <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded p-3 mb-4">{ok}</div>}

          {!loading && name && (
            <>
              {/* Hero Info Form */}
              <form onSubmit={handleSubmit} className="mb-8">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Informasi Hero</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <input
                      type="text"
                      value={heroData.role}
                      onChange={(e) => handleChangeInfo('role', e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:ring-black"
                      placeholder="Contoh: Marksman, Mage"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Damage Type</label>
                    <input
                      type="text"
                      value={heroData.damage_type}
                      onChange={(e) => handleChangeInfo('damage_type', e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:ring-black"
                      placeholder="Contoh: Physical, Magic"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Attack Reliance</label>
                    <input
                      type="text"
                      value={heroData.attack_reliance}
                      onChange={(e) => handleChangeInfo('attack_reliance', e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:ring-black"
                      placeholder="Contoh: Skill, Basic Attack"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                  <textarea
                    value={heroData.note}
                    onChange={(e) => handleChangeInfo('note', e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:ring-black"
                    placeholder="Deskripsi hero..."
                    rows={3}
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Info Hero'}
                </button>
              </form>

              {/* Lanes Section */}
              <div className="border-t pt-8">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Kelola Lanes</h2>

                {/* Add Lane Form */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Tambah Lane</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Pilih Lane</label>
                      <select
                        value={selectedLaneId}
                        onChange={(e) => setSelectedLaneId(e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:ring-black text-sm"
                        disabled={saving}
                      >
                        <option value="">-- Pilih Lane --</option>
                        {allLanes.map(lane => {
                          const alreadyAdded = heroLanes.some(hl => hl.lane_name === lane.lane_name)
                          return (
                            <option key={lane.id} value={lane.id} disabled={alreadyAdded}>
                              {lane.lane_name} {alreadyAdded ? '(Sudah ditambahkan)' : ''}
                            </option>
                          )
                        })}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Priority</label>
                      <select
                        value={selectedPriority}
                        onChange={(e) => setSelectedPriority(e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:ring-black text-sm"
                        disabled={saving}
                      >
                        <option value="1">1 - Primary</option>
                        <option value="2">2 - Secondary</option>
                        <option value="3">3 - Situational</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={handleAddLane}
                        disabled={saving || !selectedLaneId}
                        className="w-full inline-flex items-center justify-center gap-1 px-3 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? 'Menambahkan...' : '+ Tambah'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Current Lanes */}
                {heroLanes.length > 0 ? (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Lanes Hero Ini</h3>
                    <div className="space-y-2">
                      {heroLanes.map((lane, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">{lane.lane_name}</p>
                            <p className="text-xs text-gray-500">
                              Priority: {lane.priority === 1 ? 'Primary (Lane utama)' : lane.priority === 2 ? 'Secondary (Alternatif)' : 'Situational (Jarang)'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveLane(allLanes.find(l => l.lane_name === lane.lane_name)?.id)}
                            disabled={saving}
                            className="px-3 py-1 text-sm rounded-md bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
                          >
                            Hapus
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-500">Belum ada lane untuk hero ini</p>
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  )
}
