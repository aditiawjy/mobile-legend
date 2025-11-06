import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'


export default function EditHeroAdjustmentsPage() {
  const router = useRouter()
  const name = typeof router.query.name === 'string' ? router.query.name : ''
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')

  // List data
  const [list, setList] = useState([])

  // Inline edit state
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ adj_date: '', season: '', description: '' })

  // Form state
  const [form, setForm] = useState({
    adj_date: '',
    season: '',
    description: '',
  })

  // Autocomplete state
  const [q, setQ] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [activeIndex, setActiveIndex] = useState(-1)
  const [userTyping, setUserTyping] = useState(false)
  const dropdownRef = useRef(null)
  const inputRef = useRef(null)

  // Load list when name changes
  useEffect(() => {
    if (!name) { setList([]); return }
    setQ(name); setUserTyping(false)
    setLoading(true); setErr(''); setOk('')
    fetch(`/api/heroes/${encodeURIComponent(name)}/adjustments`)
      .then(async (r) => {
        if (!r.ok) throw new Error('Gagal memuat data')
        return r.json()
      })
      .then(rows => setList(Array.isArray(rows) ? rows : []))
      .catch(e => setErr(e.message || 'Error'))
      .finally(() => setLoading(false))
  }, [name])

  // Debounce hero search
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
    router.push({ pathname: '/edit-hero-adjustments', query: { name: heroName } }, undefined, { shallow: false })
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

  const onFormChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const onEditFormChange = (key, value) => {
    setEditForm(prev => ({ ...prev, [key]: value }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!name) return
    setSaving(true)
    setErr('')
    setOk('')
    try {
      const payload = { adj_date: form.adj_date, season: form.season, description: form.description }
      if (!payload.description) throw new Error('Deskripsi wajib diisi')
      if (!payload.season) throw new Error('Season wajib diisi')
      const res = await fetch(`/api/heroes/${encodeURIComponent(name)}/adjustments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Gagal menyimpan perubahan')
      setOk('Adjustment berhasil ditambahkan')
      setForm({ adj_date: '', season: '', description: '' })
      // Refresh list
      const r = await fetch(`/api/heroes/${encodeURIComponent(name)}/adjustments`)
      if (r.ok) {
        const rows = await r.json()
        setList(Array.isArray(rows) ? rows : [])
      }
    } catch (e) {
      setErr(e.message || 'Error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Edit Hero Adjustments</h1>
          <div className="flex items-center gap-2">
            <a href="/" className="text-sm inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-200 text-gray-700 bg-white hover:bg-gray-100">Heroes</a>
            <a href="/items" className="text-sm inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-200 text-gray-700 bg-white hover:bg-gray-100">Items</a>
            <a href="/edit-matches" className="text-sm inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-200 text-gray-700 bg-white hover:bg-gray-100">Matches</a>
          </div>
        </header>

        <section className="bg-white rounded-2xl shadow border border-gray-100 p-4 md:p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Hero</label>
            <div className="relative">
              <input
                id="heroAdjInput"
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
              <p className="text-xs text-gray-500 mt-1">Sedang mengedit hero: <span className="font-medium">{name}</span></p>
            )}
          </div>

          {loading && <p className="text-sm text-gray-500">Memuat data...</p>}
          {err && <p className="text-sm text-red-600">{err}</p>}
          {ok && <p className="text-sm text-green-600">{ok}</p>}

          <form onSubmit={onSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tanggal</label>
                <input
                  type="date"
                  value={form.adj_date}
                  onChange={(e) => onFormChange('adj_date', e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Season</label>
                <input
                  type="text"
                  value={form.season}
                  onChange={(e) => onFormChange('season', e.target.value)}
                  placeholder="e.g., Season 30"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:ring-black"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700">Deskripsi</label>
                <textarea
                  value={form.description}
                  onChange={(e) => onFormChange('description', e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:ring-black"
                  placeholder="Tuliskan perubahan/penyesuaian skill di patch ..."
                />
              </div>
            </div>
            <div>
              <button
                type="submit"
                disabled={saving || !name}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
              >
                {saving ? 'Menyimpan...' : 'Tambah Adjustment'}
              </button>
            </div>
          </form>

          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-800">Riwayat Adjustments</h2>
            {list.length === 0 ? (
              <p className="text-sm text-gray-500 mt-2">Belum ada data.</p>
            ) : (
              <ul className="mt-3 divide-y divide-gray-100">
                {list.map((row) => {
                  const isEditing = editingId === row.id
                  return (
                    <li key={row.id} className="py-3">
                      <div>
                        <div className="flex-1 min-w-0">
                          {isEditing ? (
                            <div className="space-y-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600">Tanggal</label>
                                <input
                                  type="date"
                                  value={editForm.adj_date || ''}
                                  onChange={(e) => onEditFormChange('adj_date', e.target.value)}
                                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:ring-black"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600">Season</label>
                                <input
                                  type="text"
                                  value={editForm.season || ''}
                                  onChange={(e) => onEditFormChange('season', e.target.value)}
                                  placeholder="e.g., Season 30"
                                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:ring-black"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600">Deskripsi</label>
                                <textarea
                                  rows={3}
                                  value={editForm.description || ''}
                                  onChange={(e) => onEditFormChange('description', e.target.value)}
                                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:ring-black"
                                />
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="text-sm text-gray-500">{row.adj_date || '-'} • {row.season || '-'}</p>
                              <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{row.description}</p>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {!isEditing ? (
                            <>
                              <button
                                type="button"
                                className="text-xs px-2 py-1 rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-100"
                                onClick={() => { setEditingId(row.id); setEditForm({ adj_date: row.adj_date || '', season: row.season || '', description: row.description || '' }) }}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="text-xs px-2 py-1 rounded-md border border-red-200 bg-white text-red-600 hover:bg-red-50"
                                onClick={async () => {
                                  if (!confirm('Hapus adjustment ini?')) return
                                  try {
                                    const resp = await fetch(`/api/heroes/${encodeURIComponent(hero)}/adjustments/${row.id}`, { method: 'DELETE' })
                                    if (!resp.ok) throw new Error('Gagal menghapus')
                                    setList(prev => prev.filter(x => x.id !== row.id))
                                  } catch (e) {
                                    alert(e.message || 'Error')
                                  }
                                }}
                              >
                                Hapus
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="text-xs px-2 py-1 rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-100"
                                onClick={() => { setEditingId(null); setEditForm({ adj_date: '', season: '', description: '' }) }}
                              >
                                Batal
                              </button>
                              <button
                                type="button"
                                className="text-xs px-2 py-1 rounded-md bg-purple-600 text-white hover:bg-purple-700"
                                onClick={async () => {
                                  try {
                                    const payload = { adj_date: editForm.adj_date, season: editForm.season, description: editForm.description }
                                    const resp = await fetch(`/api/heroes/${encodeURIComponent(name)}/adjustments/${row.id}`, {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify(payload),
                                    })
                                    if (!resp.ok) throw new Error('Gagal menyimpan')
                                    // update list locally
                                    setList(prev => prev.map(x => x.id === row.id ? { ...x, ...payload } : x))
                                    setEditingId(null)
                                    setEditForm({ adj_date: '', season: '', description: '' })
                                  } catch (e) {
                                    alert(e.message || 'Error')
                                  }
                                }}
                              >
                                Simpan
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
