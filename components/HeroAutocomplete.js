import { useState, useRef, useEffect } from 'react'

export default function HeroAutocomplete({ 
  value, 
  onChange, 
  placeholder = "Cari hero...",
  className = ""
}) {
  const [query, setQuery] = useState(value || '')
  const [suggestions, setSuggestions] = useState([])
  const [activeIndex, setActiveIndex] = useState(-1)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)

  // Update query when value prop changes
  useEffect(() => {
    setQuery(value || '')
  }, [value])

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
    onChange(heroName)
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
        if (activeIndex >= 0) {
          e.preventDefault()
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const onDocClick = (e) => {
      if (!dropdownRef.current || !inputRef.current) return
      if (!dropdownRef.current.contains(e.target) && e.target !== inputRef.current) {
        setIsOpen(false)
      }
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            onChange(e.target.value)
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 1 && suggestions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full rounded-md border border-gray-300 bg-white focus:border-black focus:ring-black px-3 py-2 pr-10"
          autoComplete="off"
        />
        
        {/* Loading indicator */}
        {loading && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
          </div>
        )}
        
        {/* Clear button */}
        {!loading && query && (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              onChange('')
              setSuggestions([])
              setIsOpen(false)
            }}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-10 mt-1 w-full bg-white shadow-lg border border-gray-200 rounded-lg max-h-60 overflow-auto"
        >
          {suggestions.map((hero, index) => (
            <div
              key={hero + index}
              className={`cursor-pointer px-4 py-2 text-sm text-gray-700 ${
                index === activeIndex ? 'bg-gray-100' : 'hover:bg-gray-50'
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
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg border border-gray-200 rounded-lg p-3">
          <div className="text-center text-gray-500">
            <p className="text-sm">Tidak ada hero ditemukan</p>
            <p className="text-xs text-gray-400 mt-1">Coba kata kunci yang berbeda</p>
          </div>
        </div>
      )}
    </div>
  )
}