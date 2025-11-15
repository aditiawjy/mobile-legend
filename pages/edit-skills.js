import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import AppLayout from '../components/AppLayout'
import SearchBar from '../components/SearchBar'
import { useToast } from '../components/Toast'
import { colors, shadows, borderRadius, spacing, typography } from '../lib/design-system'

const fields = [
  { key: 'role', label: 'Role', section: 'hero' },
  { key: 'damage_type', label: 'Damage Type', section: 'hero' },
  { key: 'attack_reliance', label: 'Attack Reliance', section: 'hero' },
  { key: 'note', label: 'Note', textarea: true, section: 'hero' },
  { key: 'skill1_name', label: 'Basic Attack Name', section: 'skills' },
  { key: 'skill1_desc', label: 'Basic Attack Description', textarea: true, section: 'skills' },
  { key: 'skill2_name', label: 'Skill 1 Name', section: 'skills' },
  { key: 'skill2_desc', label: 'Skill 1 Description', textarea: true, section: 'skills' },
  { key: 'skill3_name', label: 'Skill 2 Name', section: 'skills' },
  { key: 'skill3_desc', label: 'Skill 2 Description', textarea: true, section: 'skills' },
  { key: 'skill4_name', label: 'Skill 3 Name', section: 'skills' },
  { key: 'skill4_desc', label: 'Skill 3 Description', textarea: true, section: 'skills' },
  { key: 'ultimate_name', label: 'Ultimate Name', section: 'skills' },
  { key: 'ultimate_desc', label: 'Ultimate Description', textarea: true, section: 'skills' },
]

export default function EditSkillsPage() {
  const router = useRouter()
  const { addToast } = useToast()
  const name = typeof router.query.name === 'string' ? router.query.name : ''
  const [loading, setLoading] = useState(false)
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const [data, setData] = useState(() => {
    const initialData = Object.fromEntries(fields.map(f => [f.key, '']))
    return initialData
  })

  // Dropdown options
  const [roles, setRoles] = useState([])
  const [damageTypes, setDamageTypes] = useState([])
  const [attackReliances, setAttackReliances] = useState([])

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

  // Fetch dropdown options from database
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoadingOptions(true)
        const res = await fetch('/api/heroes')
        
        if (res.ok) {
          const heroes = await res.json()
          
          if (Array.isArray(heroes)) {
            // Extract unique values
            const uniqueRoles = [...new Set(heroes.map(h => h.role).filter(Boolean))].sort()
            const uniqueDamageTypes = [...new Set(heroes.map(h => h.damage_type).filter(Boolean))].sort()
            const uniqueAttackReliances = [...new Set(heroes.map(h => h.attack_reliance).filter(Boolean))].sort()
            
            setRoles(uniqueRoles)
            setDamageTypes(uniqueDamageTypes)
            setAttackReliances(uniqueAttackReliances)
          }
        }
      } catch (error) {
        console.error('Error fetching dropdown options:', error)
      } finally {
        setLoadingOptions(false)
      }
    }

    fetchOptions()
  }, [])

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
      
      // Load both hero info and skills
      Promise.all([
        fetch(`/api/get_hero_detail?name=${encodeURIComponent(name)}`).then(r => r.ok ? r.json() : {}),
        fetch(`/api/heroes/${encodeURIComponent(name)}/skills`).then(r => r.ok ? r.json() : {})
      ])
        .then(([heroInfo, skillsInfo]) => {
          const emptyData = Object.fromEntries(fields.map(f => [f.key, '']))
          const combinedData = {
            ...emptyData,
            ...heroInfo,
            ...skillsInfo,
            hero_name: name
          }
          setData(combinedData)
        })
        .catch(e => {
          console.error('Error loading data:', e)
          setErr(e.message || 'Error')
        })
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
      // Separate hero info and skills
      const heroFields = {}
      const skillFields = {}
      
      fields.forEach(f => {
        const value = data[f.key]
        if (value !== undefined) {
          if (f.section === 'hero') {
            heroFields[f.key] = value
          } else if (f.section === 'skills') {
            skillFields[f.key] = value
          }
        }
      })

      // Save hero info if any
      if (Object.keys(heroFields).length > 0) {
        const heroRes = await fetch(`/api/heroes/${encodeURIComponent(name)}/info`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(heroFields),
        })
        if (!heroRes.ok) throw new Error('Gagal menyimpan hero info')
      }

      // Save skills if any
      if (Object.keys(skillFields).length > 0) {
        const skillsRes = await fetch(`/api/heroes/${encodeURIComponent(name)}/skills`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(skillFields),
        })
        if (!skillsRes.ok) throw new Error('Gagal menyimpan skills')
      }

      addToast({
        type: 'success',
        title: 'Success!',
        message: 'Perubahan berhasil disimpan',
        duration: 5000
      })

      // Update local data to reflect saved state
      setData(prev => ({ ...prev, ...heroFields, ...skillFields, hero_name: name }))
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
            <h1 className="text-3xl font-bold text-gray-900">
              {name ? `Edit Skills: ${name}` : 'Edit Skills'}
            </h1>
            <p className="mt-2 text-gray-600">
              Kelola deskripsi skill untuk hero Mobile Legends
            </p>
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
              {/* Hero Info Section */}
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Hero Info</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {fields.filter(f => f.section === 'hero').map(f => {
                    const fieldValue = data && data[f.key] !== undefined && data[f.key] !== null ? data[f.key] : ''
                    
                    // Render dropdown for role, damage_type, attack_reliance
                    if (f.key === 'role') {
                      return (
                        <div key={f.key} className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">{f.label}</label>
                          {loadingOptions ? (
                            <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-500">
                              Loading...
                            </div>
                          ) : roles.length > 0 ? (
                            <select
                              value={fieldValue}
                              onChange={(e) => onChange(f.key, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
                            >
                              <option value="">Pilih role...</option>
                              {roles.map(role => (
                                <option key={role} value={role}>{role}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={fieldValue}
                              onChange={(e) => onChange(f.key, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
                              placeholder="Masukkan role..."
                            />
                          )}
                        </div>
                      )
                    }
                    
                    if (f.key === 'damage_type') {
                      return (
                        <div key={f.key} className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">{f.label}</label>
                          {loadingOptions ? (
                            <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-500">
                              Loading...
                            </div>
                          ) : damageTypes.length > 0 ? (
                            <select
                              value={fieldValue}
                              onChange={(e) => onChange(f.key, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
                            >
                              <option value="">Pilih damage type...</option>
                              {damageTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={fieldValue}
                              onChange={(e) => onChange(f.key, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
                              placeholder="Masukkan damage type..."
                            />
                          )}
                        </div>
                      )
                    }
                    
                    if (f.key === 'attack_reliance') {
                      return (
                        <div key={f.key} className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">{f.label}</label>
                          {loadingOptions ? (
                            <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-500">
                              Loading...
                            </div>
                          ) : attackReliances.length > 0 ? (
                            <select
                              value={fieldValue}
                              onChange={(e) => onChange(f.key, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
                            >
                              <option value="">Pilih attack reliance...</option>
                              {attackReliances.map(reliance => (
                                <option key={reliance} value={reliance}>{reliance}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={fieldValue}
                              onChange={(e) => onChange(f.key, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
                              placeholder="Masukkan attack reliance..."
                            />
                          )}
                        </div>
                      )
                    }
                    
                    // Default rendering for note (textarea)
                    return (
                      <div key={f.key} className={f.textarea ? "md:col-span-2 space-y-2" : "space-y-2"}>
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
              </div>

              {/* Skills Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { title: 'Basic Attack', nameKey: 'skill1_name', descKey: 'skill1_desc' },
                    { title: 'Skill 1', nameKey: 'skill2_name', descKey: 'skill2_desc' },
                    { title: 'Skill 2', nameKey: 'skill3_name', descKey: 'skill3_desc' },
                    { title: 'Skill 3', nameKey: 'skill4_name', descKey: 'skill4_desc' },
                    { title: 'Ultimate', nameKey: 'ultimate_name', descKey: 'ultimate_desc' },
                  ].map(group => {
                    const nameField = fields.find(f => f.key === group.nameKey)
                    const descField = fields.find(f => f.key === group.descKey)
                    const nameValue = data && data[group.nameKey] !== undefined && data[group.nameKey] !== null ? data[group.nameKey] : ''
                    const descValue = data && data[group.descKey] !== undefined && data[group.descKey] !== null ? data[group.descKey] : ''
                    return (
                      <div key={group.nameKey} className="space-y-3">
                        <h4 className="text-md font-semibold text-gray-800">{group.title}</h4>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            {nameField ? nameField.label : `${group.title} Name`}
                          </label>
                          <input
                            type="text"
                            value={nameValue}
                            onChange={(e) => onChange(group.nameKey, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
                            placeholder={`Masukkan ${(nameField ? nameField.label : `${group.title} Name`).toLowerCase()}...`}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            {descField ? descField.label : `${group.title} Description`}
                          </label>
                          <textarea
                            value={descValue}
                            onChange={(e) => onChange(group.descKey, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
                            rows={4}
                            placeholder={`Masukkan ${(descField ? descField.label : `${group.title} Description`).toLowerCase()}...`}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
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
