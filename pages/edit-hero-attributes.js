import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'

// Define a manageable subset of fields to edit first. You can expand later as needed.
const fields = [
  { key: 'hp', label: 'HP', type: 'number' },
  { key: 'physical_attack', label: 'Physical Attack', type: 'number' },
  { key: 'mana', label: 'Mana', type: 'number' },
  { key: 'magic_power', label: 'Magic Power', type: 'number' },
  { key: 'physical_defense', label: 'Physical Defense', type: 'number' },
  { key: 'physical_defense_pct', label: 'Physical Defense %', type: 'number', step: '0.01' },
  { key: 'attack_speed', label: 'Attack Speed', type: 'number', step: '0.01' },
  { key: 'crit_chance', label: 'Crit Chance %', type: 'number', step: '0.01' },
  { key: 'magic_defense', label: 'Magic Defense', type: 'number' },
  { key: 'magic_defense_pct', label: 'Magic Defense %', type: 'number', step: '0.01' },
  { key: 'cd_reduction', label: 'Cooldown Reduction %', type: 'number', step: '0.01' },
  { key: 'movement_speed', label: 'Movement Speed', type: 'number' },
  { key: 'hp_regen', label: 'HP Regen', type: 'number', step: '0.01' },
  { key: 'mana_regen', label: 'Mana Regen', type: 'number', step: '0.01' },
  { key: 'physical_penetration', label: 'Physical Penetration', type: 'number' },
  { key: 'physical_penetration_pct', label: 'Physical Penetration %', type: 'number', step: '0.01' },
  { key: 'magic_penetration', label: 'Magic Penetration', type: 'number' },
  { key: 'magic_penetration_pct', label: 'Magic Penetration %', type: 'number', step: '0.01' },
  { key: 'lifesteal', label: 'Lifesteal %', type: 'number', step: '0.01' },
  { key: 'spell_vamp', label: 'Spell Vamp %', type: 'number', step: '0.01' },
  { key: 'basic_attack_range', label: 'Basic Attack Range', type: 'number', step: '0.01' },
  { key: 'resilience', label: 'Resilience', type: 'number' },
  { key: 'crit_damage', label: 'Crit Damage', type: 'number' },
  { key: 'healing_effect', label: 'Healing Effect %', type: 'number', step: '0.01' },
  { key: 'crit_damage_reduction', label: 'Crit Damage Reduction %', type: 'number', step: '0.01' },
  { key: 'healing_received', label: 'Healing Received %', type: 'number', step: '0.01' },
]

export default function EditHeroAttributesPage() {
  const router = useRouter()
  const name = typeof router.query.name === 'string' ? router.query.name : ''
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const [data, setData] = useState(() => Object.fromEntries(fields.map(f => [f.key, ''])))

  const hasAnyData = useMemo(() => {
    if (!data) return false
    return fields.some(f => {
      const value = data[f.key]
      return value !== '' && value !== null && value !== undefined
    })
  }, [data])

  // Autocomplete state
  const [q, setQ] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [activeIndex, setActiveIndex] = useState(-1)
  const [userTyping, setUserTyping] = useState(false)
  const dropdownRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!name) { setData(Object.fromEntries(fields.map(f => [f.key, '']))); return }
    setQ(name); setUserTyping(false)
    setLoading(true); setErr(''); setOk('')
    fetch(`/api/heroes/${encodeURIComponent(name)}/attributes`)
      .then(async (r) => {
        if (r.status === 404) {
          return Object.fromEntries(fields.map(f => [f.key, '']))
        }
        if (!r.ok) {
          const t = await r.text().catch(() => '')
          throw new Error(`Gagal memuat (${r.status}) ${t}`)
        }
        return r.json()
      })
      .then(attrs => setData({ ...Object.fromEntries(fields.map(f => [f.key, ''])), ...attrs }))
      .catch(e => setErr(e.message || 'Error'))
      .finally(() => setLoading(false))
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
    router.push({ pathname: '/edit-hero-attributes', query: { name: heroName } }, undefined, { shallow: false })
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

  const onChange = (key, value) => {
    setData(prev => ({ ...prev, [key]: value }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!name) return
    setSaving(true)
    setErr('')
    setOk('')
    try {
      const fieldsToUpdate = {}
      fields.forEach(f => {
        const value = data[f.key]
        if (value !== undefined) fieldsToUpdate[f.key] = value
      })
      const res = await fetch(`/api/heroes/${encodeURIComponent(name)}/attributes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fieldsToUpdate),
      })
      if (!res.ok) throw new Error('Gagal menyimpan perubahan')
      setOk('Perubahan berhasil disimpan')
      // Refetch latest attributes to reflect saved state
      try {
        const r = await fetch(`/api/heroes/${encodeURIComponent(name)}/attributes`)
        if (r.ok) {
          const fresh = await r.json()
          setData(prev => ({ ...prev, ...fresh }))
        }
      } catch {}
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
          <h1 className="text-2xl font-bold text-gray-800">Edit Hero Attributes</h1>
          <div className="flex items-center gap-2">
            <a href="/" className="text-sm inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-200 text-gray-700 bg-white hover:bg-gray-100">Heroes</a>
            <a href="/edit-matches" className="text-sm inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-200 text-gray-700 bg-white hover:bg-gray-100">Matches</a>
            <a href="/" className="text-sm inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-200 text-gray-700 bg-white hover:bg-gray-100">Home</a>
          </div>
        </header>

        <section className="bg-white rounded-2xl shadow border border-gray-100 p-4 md:p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Hero</label>
            <div className="relative">
              <input
                id="heroAttrInput"
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
              <p className="text-xs text-gray-500 mt-1">Sedang mengedit atribut: <span className="font-medium">{name}</span></p>
            )}
          </div>

          {loading && <p className="text-sm text-gray-500">Memuat data...</p>}
          {err && <p className="text-sm text-red-600">{err}</p>}
          {ok && <p className="text-sm text-green-600">{ok}</p>}

          {!loading && !err && name && !hasAnyData && (
            <div className="mt-2 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm px-3 py-2">
              Data attributes untuk hero ini belum ada. Silakan isi form di bawah lalu klik "Simpan Perubahan".
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map(f => {
              const fieldValue = data && data[f.key] !== undefined && data[f.key] !== null ? data[f.key] : ''
              return (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-700">{f.label}</label>
                  <input
                    type={f.type || 'text'}
                    step={f.step || undefined}
                    value={fieldValue}
                    onChange={(e) => onChange(f.key, e.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:ring-black"
                    placeholder={`Masukkan ${f.label.toLowerCase()}...`}
                  />
                </div>
              )
            })}

            <div className="md:col-span-2 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
              >
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}
