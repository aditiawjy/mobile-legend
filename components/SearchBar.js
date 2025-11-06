import { useState, useRef, useEffect } from 'react'
import { colors, shadows, borderRadius } from '../lib/design-system'

export default function SearchBar({ onSearch, placeholder = "Cari hero..." }) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (query.length < 1) {
        setSuggestions([])
        setIsOpen(false)
        return
      }

      setLoading(true)
      try {
        const response = await fetch(`/api/heroes_search?q=${encodeURIComponent(query)}`)
        if (response.ok) {
          const data = await response.json()
          setSuggestions(Array.isArray(data) ? data : [])
          setIsOpen(data.length > 0)
        }
      } catch (error) {
        console.error('Search error:', error)
        setSuggestions([])
        setIsOpen(false)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query])

  const handleSelect = (heroName) => {
    setQuery(heroName)
    setSuggestions([])
    setIsOpen(false)
    setActiveIndex(-1)
    onSearch && onSearch(heroName)
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
    if (value === '') {
      onSearch && onSearch('')
    }
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
          placeholder={placeholder}
          className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white shadow-sm transition-all duration-150"
          autoComplete="off"
        />

        <div className="absolute inset-y-0 right-0 flex items-center">
          {loading ? (
            <div className="pr-3">
              <div className="animate-spin h-4 w-4 border-2 border-sky-500 border-t-transparent rounded-full"></div>
            </div>
          ) : query ? (
            <button
              onClick={() => {
                setQuery('')
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

      {/* Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full bg-white shadow-lg border border-gray-200 rounded-lg max-h-72 overflow-auto"
        >
          {suggestions.map((hero, index) => (
            <div
              key={hero}
              className={`px-4 py-3 text-sm cursor-pointer transition-colors duration-150 ${
                index === activeIndex
                  ? 'bg-sky-50 text-sky-700 border-l-4 border-sky-500'
                  : 'text-gray-700 hover:bg-gray-50'
              } ${index === 0 ? 'rounded-t-lg' : ''} ${
                index === suggestions.length - 1 ? 'rounded-b-lg' : ''
              }`}
              onClick={() => handleSelect(hero)}
              onMouseEnter={() => setActiveIndex(index)}
            >
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {hero}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No results message */}
      {isOpen && !loading && query.length >= 1 && suggestions.length === 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white shadow-lg border border-gray-200 rounded-lg p-4">
          <div className="text-center text-gray-500">
            <svg className="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.5-.881-6.13-2.34M20.828 10.828a8 8 0 10-11.314 0" />
            </svg>
            <p className="text-sm">Tidak ada hero ditemukan</p>
            <p className="text-xs text-gray-400 mt-1">Coba kata kunci yang berbeda</p>
          </div>
        </div>
      )}
    </div>
  )
}
