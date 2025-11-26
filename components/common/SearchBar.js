import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/router'
import { colors, shadows, borderRadius } from '../../lib/design-system'

const ROLE_COLORS = {
  'Tank': 'bg-orange-100 text-orange-700 border-orange-200',
  'Fighter': 'bg-red-100 text-red-700 border-red-200',
  'Assassin': 'bg-purple-100 text-purple-700 border-purple-200',
  'Mage': 'bg-blue-100 text-blue-700 border-blue-200',
  'Marksman': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Support': 'bg-green-100 text-green-700 border-green-200',
}

const ROLES = ['Tank', 'Fighter', 'Assassin', 'Mage', 'Marksman', 'Support']

export default function SearchBar({ onSearch, placeholder = "Cari hero..." }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [selectedRole, setSelectedRole] = useState('')
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)

  // Debounced search
  useEffect(() => {
    // If query is empty AND no role selected, clear results
    if (query.length < 1 && !selectedRole) {
      setSuggestions([])
      setIsOpen(false)
      return
    }

    const fetchSuggestions = async () => {
      setLoading(true)
      try {
        const url = `/api/heroes_search?q=${encodeURIComponent(query)}&role=${encodeURIComponent(selectedRole)}`
        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          setSuggestions(Array.isArray(data) ? data : [])
          // Open dropdown if we have results OR if we are loading (to show spinner) 
          // but here we set isOpen based on data
          setIsOpen(data.length > 0)
        }
      } catch (error) {
        console.error('Search error:', error)
        setSuggestions([])
        setIsOpen(false)
      } finally {
        setLoading(false)
      }
    }

    // Instant search if Role is clicked, otherwise debounce text
    if (selectedRole && query.length === 0) {
      fetchSuggestions()
    } else {
      const timeoutId = setTimeout(fetchSuggestions, 300)
      return () => clearTimeout(timeoutId)
    }
    
  }, [query, selectedRole])

  const handleSelect = (hero) => {
    // hero is now an object { hero_name, role }
    setQuery(hero.hero_name)
    setSuggestions([])
    setIsOpen(false)
    setActiveIndex(-1)
    onSearch && onSearch(hero.hero_name)
  }

  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex(prev => (prev + 1) % suggestions.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex(prev => (prev - 1 + suggestions.length) % suggestions.length)
        break
      case 'Enter':
        e.preventDefault()
        if (activeIndex >= 0) {
          handleSelect(suggestions[activeIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setActiveIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  const handleInputChange = (e) => {
    const value = e.target.value
    setQuery(value)
    setActiveIndex(-1)

    // If empty, trigger search reset
    if (value === '' && !selectedRole) {
      onSearch && onSearch('')
    }
  }

  const toggleRole = (role) => {
    const newRole = selectedRole === role ? '' : role
    setSelectedRole(newRole)
    // Focus input so user can type immediately after selecting role
    inputRef.current?.focus()
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
          inputRef.current && !inputRef.current.contains(e.target)) {
        setIsOpen(false)
        setActiveIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setIsOpen(true)
            }
          }}
          placeholder={selectedRole ? `Cari hero ${selectedRole}...` : placeholder}
          className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white shadow-sm transition-all duration-150"
          autoComplete="off"
          role="combobox"
          aria-controls="heroSuggestions"
          aria-expanded={isOpen}
          aria-activedescendant={activeIndex >= 0 ? `hero-option-${activeIndex}` : undefined}
        />

        <div className="absolute inset-y-0 right-0 flex items-center">
          {loading ? (
            <div className="pr-3">
              <div className="animate-spin h-4 w-4 border-2 border-sky-500 border-t-transparent rounded-full"></div>
            </div>
          ) : query || selectedRole ? (
            <button
              onClick={() => {
                setQuery('')
                setSelectedRole('')
                setSuggestions([])
                setIsOpen(false)
                setActiveIndex(-1)
                onSearch && onSearch('')
              }}
              className="pr-3 text-gray-400 hover:text-gray-600 transition-colors duration-150"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : null}
        </div>
      </div>
      
      {/* Quick Filters */}
      <div className="mt-3 flex gap-2 flex-wrap">
        {ROLES.map(role => (
          <button
            key={role}
            onClick={() => toggleRole(role)}
            className={`px-3 py-1 text-xs font-medium rounded-full border transition-all ${
              selectedRole === role
                ? ROLE_COLORS[role] || 'bg-gray-800 text-white border-gray-800'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {role}
          </button>
        ))}
      </div>

      {/* Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          id="heroSuggestions"
          ref={dropdownRef}
          role="listbox"
          className="absolute z-50 top-12 w-full bg-white shadow-xl border border-gray-200 rounded-lg max-h-80 overflow-auto divide-y divide-gray-100"
        >
          {suggestions.map((hero, index) => {
            const firstLetter = hero.hero_name ? hero.hero_name.charAt(0).toUpperCase() : '?';
            
            return (
              <div
                key={hero.hero_name}
                id={`hero-option-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                className={`px-4 py-3 cursor-pointer transition-colors duration-150 flex items-center gap-3 ${
                  index === activeIndex
                    ? 'bg-sky-50'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => handleSelect(hero)}
                onMouseEnter={() => {
                  setActiveIndex(index)
                  router.prefetch(`/hero/${encodeURIComponent(hero.hero_name)}`)
                }}
              >
                {/* Initials Avatar */}
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-sky-400 to-blue-500 rounded-full flex items-center justify-center shadow-sm">
                  <span className="text-white font-bold text-sm">{firstLetter}</span>
                </div>

                {/* Name & Role */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`font-medium truncate ${index === activeIndex ? 'text-sky-700' : 'text-gray-900'}`}>
                      {hero.hero_name}
                    </p>
                    {hero.role && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${ROLE_COLORS[hero.role.split(',')[0].trim()] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                        {hero.role.split(',')[0]}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* No results message */}
      {isOpen && !loading && suggestions.length === 0 && (query.length >= 1 || selectedRole) && (
        <div className="absolute z-50 top-12 w-full bg-white shadow-lg border border-gray-200 rounded-lg p-4 text-center">
          <svg className="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.5-.881-6.13-2.34M20.828 10.828a8 8 0 10-11.314 0" />
          </svg>
          <p className="text-sm text-gray-500">Tidak ada hero ditemukan</p>
          <p className="text-xs text-gray-400 mt-1">Coba kombinasi filter yang berbeda</p>
        </div>
      )}
    </div>
  )
}
