import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'

const fields = [
  { key: 'category', label: 'Category' },
  { key: 'price', label: 'Price' },
  { key: 'description', label: 'Description', textarea: true },
  { key: 'image_url', label: 'Image URL', placeholder: 'https://example.com/image.png' },
]

export default function EditItemsPage() {
  const router = useRouter()
  const name = typeof router.query.name === 'string' ? router.query.name : ''
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const [data, setData] = useState(() => {
    const initialData = Object.fromEntries(fields.map(f => [f.key, '']))
    return initialData
  })

  const hasAnyData = useMemo(() => {
    if (!data) return false
    return fields.some(f => {
      const value = data[f.key]
      return value && value.toString().trim() !== ''
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
    if (!name) {
      setData(Object.fromEntries(fields.map(f => [f.key, ''])))
      return
    }

    // Put current name into input without triggering user typing
    setQ(name)
    setUserTyping(false)

    // Load item data when name changes
    setLoading(true)
    setErr('')
    setOk('')
    fetch(`/api/items/${encodeURIComponent(name)}`)
      .then(async (r) => {
        if (r.status === 404) {
          // Item not found, prepare empty form with name
          const emptyData = Object.fromEntries(fields.map(f => [f.key, '']))
          return { ...emptyData, item_name: name }
        }
        if (!r.ok) {
          const txt = await r.text().catch(() => '')
          throw new Error(`Gagal memuat (${r.status}) ${txt}`)
        }
        const result = await r.json()
        return { ...result, item_name: name }
      })
      .then(d => {
        const completeData = { ...Object.fromEntries(fields.map(f => [f.key, ''])), ...d }
        setData(completeData)
      })
      .catch(e => setErr(e.message || 'Error'))
      .finally(() => setLoading(false))
  }, [name])

  // Debounce
  const [debouncedQ, setDebouncedQ] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q), 300)
    return () => clearTimeout(timer)
  }, [q])

  // Search items
  useEffect(() => {
    let ignore = false
    const run = async () => {
      const term = debouncedQ.trim()
      if (!term || !userTyping) { setSuggestions([]); setActiveIndex(-1); return }
      try {
        const res = await fetch(`/api/items_search?q=${encodeURIComponent(term)}`)
        if (!res.ok) throw new Error('Network error')
        const data = await res.json()
        if (!ignore) setSuggestions(Array.isArray(data) ? data : [])
      } catch (e) {
        console.error(e)
      }
    }
    run()
    return () => { ignore = true }
  }, [debouncedQ, userTyping])

  const onSelectItem = (itemName) => {
    setSuggestions([])
    setActiveIndex(-1)
    router.push({ pathname: '/edit-items', query: { name: itemName } }, undefined, { shallow: false })
  }

  const onKeyDown = (e) => {
    if (!suggestions.length) return
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); setActiveIndex((i) => (i + 1) % suggestions.length); break
      case 'ArrowUp': e.preventDefault(); setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length); break
      case 'Enter': if (activeIndex >= 0) { e.preventDefault(); onSelectItem(suggestions[activeIndex]) } break
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
      const res = await fetch(`/api/items/${encodeURIComponent(name)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fieldsToUpdate),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `Gagal menyimpan perubahan (${res.status})`)
      }
      const updatedData = await res.json()
      setOk('Perubahan berhasil disimpan')
      setData(prev => ({ ...prev, ...updatedData, item_name: name }))
    } catch (e) {
      setErr(e.message || 'Error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Edit Items</h1>
          <div className="flex items-center gap-2">
            <a
              href="/items"
              className="text-sm inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-200 text-gray-700 bg-white hover:bg-gray-100"
            >
              Items
            </a>
            <a
              href="/edit-matches"
              className="text-sm inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-200 text-gray-700 bg-white hover:bg-gray-100"
            >
              Matches
            </a>
            <a
              href="/"
              className="text-sm inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-200 text-gray-700 bg-white hover:bg-gray-100"
            >
              Home
            </a>
          </div>
        </header>

        <section className="bg-white rounded-2xl shadow border border-gray-100 p-4 md:p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Item</label>
            <div className="relative">
              <input
                id="itemInput"
                ref={inputRef}
                value={q}
                onChange={(e) => { setQ(e.target.value); setActiveIndex(-1); setUserTyping(true) }}
                onKeyDown={onKeyDown}
                placeholder="Ketik nama item..."
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
                      onMouseDown={(e) => { e.preventDefault(); onSelectItem(nameOpt) }}
                    >
                      {nameOpt}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {name && (
              <p className="text-xs text-gray-500 mt-1">Sedang mengedit item: <span className="font-medium">{name}</span></p>
            )}
          </div>

          {loading && <p className="text-sm text-gray-500">Memuat data...</p>}
          {err && <p className="text-sm text-red-600">{err}</p>}
          {ok && <p className="text-sm text-green-600">{ok}</p>}

          {!loading && !err && name && !hasAnyData && (
            <div className="mt-2 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm px-3 py-2">
              Data item ini belum ada di database. Silakan isi form di bawah lalu klik "Simpan Perubahan".
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-4 space-y-4">
            {fields.map(f => {
              const fieldValue = data && data[f.key] !== undefined && data[f.key] !== null ? data[f.key] : ''
              return (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-700">{f.label}</label>
                  {f.textarea ? (
                    <textarea
                      value={fieldValue}
                      onChange={(e) => onChange(f.key, e.target.value)}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:ring-black"
                      rows={4}
                      placeholder={`Masukkan ${f.label.toLowerCase()}...`}
                    />
                  ) : (
                    <input
                      type={f.key === 'price' ? 'number' : 'text'}
                      value={fieldValue}
                      onChange={(e) => onChange(f.key, e.target.value)}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:ring-black"
                      placeholder={f.placeholder || `Masukkan ${f.label.toLowerCase()}...`}
                    />
                  )}
                </div>
              )
            })}

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
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
