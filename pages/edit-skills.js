import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import AppLayout from '../components/AppLayout'
import SearchBar from '../components/SearchBar'
import { useToast } from '../components/Toast'
import { colors, shadows, borderRadius, spacing, typography } from '../lib/design-system'

const fields = [
  { key: 'skill1_name', label: 'Basic Attack Name' },
  { key: 'skill1_desc', label: 'Basic Attack Description', textarea: true },
  { key: 'skill2_name', label: 'Skill 1 Name' },
  { key: 'skill2_desc', label: 'Skill 1 Description', textarea: true },
  { key: 'skill3_name', label: 'Skill 2 Name' },
  { key: 'skill3_desc', label: 'Skill 2 Description', textarea: true },
  { key: 'skill4_name', label: 'Skill 3 Name' },
  { key: 'skill4_desc', label: 'Skill 3 Description', textarea: true },
  { key: 'ultimate_name', label: 'Ultimate Name' },
  { key: 'ultimate_desc', label: 'Ultimate Description', textarea: true },
]

export default function EditSkillsPage() {
  const router = useRouter()
  const { addToast } = useToast()
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
      // Reset data when no hero is selected
      setData(Object.fromEntries(fields.map(f => [f.key, ''])))
      return
    }
    
    // Sink current name into local input for visibility
    setQ(name)
    setUserTyping(false) // This is programmatic, not user input
    
    // Always load data when hero name changes
    if (name !== data.hero_name) {
      setLoading(true)
      setErr('')
      setOk('')
      
      fetch(`/api/heroes/${encodeURIComponent(name)}/skills`)
        .then(async (r) => {
          if (r.status === 404) {
            // Hero tidak ditemukan, reset form untuk input baru
            const emptyData = Object.fromEntries(fields.map(f => [f.key, '']))
            return { ...emptyData, hero_name: name }
          }
          if (!r.ok) {
            const txt = await r.text().catch(() => '')
            throw new Error(`Gagal memuat (${r.status}) ${txt}`)
          }
          const result = await r.json()
          return { ...result, hero_name: name }
        })
        .then(d => {
          // Ensure all fields exist in the data object
          const completeData = { ...Object.fromEntries(fields.map(f => [f.key, ''])), ...d }
          setData(completeData)
        })
        .catch(e => setErr(e.message || 'Error'))
        .finally(() => setLoading(false))
    }
  }, [name, data.hero_name])

  // Debounced search for autocomplete
  const [debouncedQ, setDebouncedQ] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q), 300)
    return () => clearTimeout(timer)
  }, [q])

  // Search heroes for autocomplete with debounce
  useEffect(() => {
    let ignore = false
    const run = async () => {
      const term = debouncedQ.trim()
      if (!term || !userTyping) { setSuggestions([]); setActiveIndex(-1); return }
      try {
        const res = await fetch(`/api/heroes_search?q=${encodeURIComponent(term)}`)
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

  const onSelectHero = (heroName) => {
    setSuggestions([])
    setActiveIndex(-1)
    // Navigate to this hero
    router.push({ pathname: '/edit-skills', query: { name: heroName } }, undefined, { shallow: false })
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
    setData(prevData => ({ ...prevData, [key]: value }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!name) return
    setSaving(true)
    try {
      // Filter out empty fields to avoid unnecessary updates
      const fieldsToUpdate = {}
      fields.forEach(f => {
        const value = data[f.key]
        if (value !== undefined) {
          fieldsToUpdate[f.key] = value
        }
      })

      const res = await fetch(`/api/heroes/${encodeURIComponent(name)}/skills`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fieldsToUpdate),
      })
      if (!res.ok) throw new Error('Gagal menyimpan perubahan')

      addToast({
        type: 'success',
        title: 'Success!',
        message: 'Perubahan berhasil disimpan',
        duration: 5000
      })

      // Update local data to reflect saved state
      setData(prev => ({ ...prev, ...fieldsToUpdate, hero_name: name }))
    } catch (e) {
      addToast({
        type: 'error',
        title: 'Error!',
        message: e.message || 'Gagal menyimpan perubahan',
        duration: 7000
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppLayout>
      <div className="bg-gradient-to-br from-sky-50 via-white to-blue-50 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Edit Skills</h1>
            <p className="mt-2 text-gray-600">Kelola deskripsi skill untuk hero Mobile Legends</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Hero</label>
              <SearchBar
                onSearch={(heroName) => {
                  if (heroName) {
                    router.push(`/edit-skills?name=${encodeURIComponent(heroName)}`)
                  }
                }}
                placeholder="Cari dan pilih hero untuk diedit..."
              />
              {name && (
                <p className="text-sm text-gray-500 mt-2">
                  <span className="font-medium">Sedang mengedit:</span> {name}
                </p>
              )}
            </div>

            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
                <span className="ml-2 text-gray-600">Memuat data...</span>
              </div>
            )}

            {!loading && name && !hasAnyData && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Data skill belum ada</h3>
                    <p className="mt-1 text-sm text-yellow-700">
                      Data skill untuk hero ini belum ada di database. Silakan isi form di bawah lalu klik "Simpan Perubahan".
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {fields.map(f => {
                  const fieldValue = data && data[f.key] !== undefined && data[f.key] !== null ? data[f.key] : ''
                  return (
                    <div key={f.key} className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">{f.label}</label>
                      {f.textarea ? (
                        <textarea
                          value={fieldValue}
                          onChange={(e) => onChange(f.key, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
                          rows={4}
                          placeholder={`Masukkan ${f.label.toLowerCase()}...`}
                        />
                      ) : (
                        <input
                          type="text"
                          value={fieldValue}
                          onChange={(e) => onChange(f.key, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
                          placeholder={`Masukkan ${f.label.toLowerCase()}...`}
                        />
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center px-6 py-2 bg-sky-600 text-white font-medium rounded-lg hover:bg-sky-700 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan Perubahan'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
