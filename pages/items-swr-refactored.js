import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import useSWR, { useSWRInfinite } from 'swr'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import AppLayout from '../components/AppLayout'
import LazyImage from '../components/LazyImage'

// SWR fetcher function
const fetcher = async (url) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.')
    error.info = await res.json()
    error.status = res.status
    throw error
  }
  return res.json()
}

// API endpoints
const API_BASE = '/api'
const SEARCH_ENDPOINT = `${API_BASE}/search`
const ALL_ITEMS_ENDPOINT = `${API_BASE}/items`

export default function ItemsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const searchInputRef = useRef(null)
  const loaderRef = useRef(null)

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // SWR hook for search suggestions
  const { 
    data: suggestionsData, 
    error: suggestionsError, 
    isLoading: suggestionsLoading 
  } = useSWR(
    debouncedSearchTerm.length > 0 ? `${SEARCH_ENDPOINT}?q=${encodeURIComponent(debouncedSearchTerm)}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 1000,
    }
  )

  // Extract suggestions from SWR data
  const suggestions = useMemo(() => {
    if (!suggestionsData) return []
    return suggestionsData.suggestions || []
  }, [suggestionsData])

  // SWR Infinite hook for all items with pagination
  const {
    data: allItemsData,
    error: allItemsError,
    size,
    setSize,
    isLoading: allItemsLoading,
    isValidating
  } = useSWRInfinite(
    (index) => `${ALL_ITEMS_ENDPOINT}?page=${index + 1}&limit=12`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateFirstPage: false,
    }
  )

  // Flatten paginated data and extract items
  const allItems = useMemo(() => {
    if (!allItemsData) return []
    return allItemsData.flatMap(page => page.items || [])
  }, [allItemsData])

  // Check if there are more pages to load
  const hasMore = useMemo(() => {
    if (!allItemsData || allItemsData.length === 0) return false
    const lastPage = allItemsData[allItemsData.length - 1]
    return lastPage.hasMore !== false && lastPage.items?.length > 0
  }, [allItemsData])

  // Loading more state
  const loadingMore = isValidating && size > 0

  // Check if there are no items
  const isEmpty = allItems.length === 0 && !allItemsLoading

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchTerm(value)
    setActiveIndex(-1)
    setShowSuggestions(value.length > 0)
  }

  // Handle search form submission
  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      router.push(`/item/${encodeURIComponent(searchTerm.trim())}`)
    }
  }

  // Handle suggestion selection
  const handleSelectSuggestion = (name) => {
    setSearchTerm(name)
    setShowSuggestions(false)
    router.push(`/item/${encodeURIComponent(name)}`)
  }

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return

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
        if (activeIndex >= 0 && activeIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[activeIndex])
        } else {
          handleSearchSubmit(e)
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setActiveIndex(-1)
        break
    }
  }

  // Infinite scroll observer
  useEffect(() => {
    if (!loaderRef.current || !hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore) {
          setSize(size + 1)
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(loaderRef.current)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, size, setSize])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <AppLayout>
      <Head>
        <title>Items - ML Helper</title>
        <meta name="description" content="Cari dan jelajahi items di database ML Helper" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Items Database</h1>
            <p className="text-gray-600">Cari atau jelajahi semua items yang tersedia</p>
          </div>

          {/* Tab Navigation */}
          <div className="flex justify-center mb-6">
            <div className="bg-white rounded-full shadow-md p-1 flex">
              <button
                onClick={() => setShowAll(false)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  !showAll
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Pencarian
              </button>
              <button
                onClick={() => setShowAll(true)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  showAll
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Semua Items
              </button>
            </div>
          </div>

          {/* Search Section */}
          {!showAll && (
            <section className="bg-white rounded-2xl shadow border border-gray-100 p-4 md:p-6 mb-6">
              <form onSubmit={handleSearchSubmit}>
                <div className="relative" ref={searchInputRef}>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setShowSuggestions(searchTerm.length > 0)}
                    placeholder="Ketik nama item..."
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoComplete="off"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </button>

                  {/* Suggestions Dropdown */}
                  {showSuggestions && searchTerm.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {suggestionsLoading ? (
                        <div className="flex items-center justify-center py-3">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                          <span className="ml-2 text-sm text-gray-600">Mencari items...</span>
                        </div>
                      ) : suggestions.length > 0 ? (
                        suggestions.map((name, i) => (
                          <div
                            key={name + i}
                            className={`cursor-pointer px-4 py-2 text-sm text-gray-700 ${
                              i === 0 ? 'rounded-t-xl' : ''
                            } ${
                              i === suggestions.length - 1 ? 'rounded-b-xl' : ''
                            } ${
                              i === activeIndex ? 'bg-gray-100' : ''
                            }`}
                            onMouseDown={(e) => {
                              e.preventDefault()
                              handleSelectSuggestion(name)
                            }}
                          >
                            {name}
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-sm text-gray-500">
                          Tidak ada hasil untuk "{searchTerm}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </form>
              <p className="text-xs text-gray-500 mt-2">
                Mulai ketik minimal 1 huruf. Gunakan tombol panah untuk navigasi dan Enter untuk pilih.
              </p>
            </section>
          )}

          {/* All Items Grid */}
          {showAll && (
            <section className="bg-white rounded-2xl shadow border border-gray-100 p-4 md:p-6">
              {allItemsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
                  <span className="ml-2 text-gray-600">Memuat items...</span>
                </div>
              ) : isEmpty ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">Tidak ada items ditemukan di database.</p>
                </div>
              ) : allItems.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {allItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer border border-gray-200"
                        onClick={() => router.push(`/item/${encodeURIComponent(item.item_name)}`)}
                      >
                        <div className="text-center">
                          <LazyImage
                            src={item.image_url}
                            alt={item.item_name}
                            containerClassName="w-16 h-16 mx-auto mb-3"
                            className="w-full h-full object-cover rounded-full"
                          />
                          <h3 className="font-semibold text-gray-900 text-sm mb-1">
                            {item.item_name}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {item.category || 'Item'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Infinite Scroll Loader */}
                  <div ref={loaderRef} className="mt-8 flex flex-col items-center justify-center py-4">
                    {loadingMore && (
                      <>
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                        <span className="mt-2 text-sm text-gray-600">Memuat lebih banyak items...</span>
                      </>
                    )}
                    {!hasMore && allItems.length > 0 && (
                      <div className="text-sm text-gray-500">
                        ✓ Semua {allItems.length} items telah dimuat
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </section>
          )}

          <footer className="mt-10 text-center text-xs text-gray-400">
            {new Date().getFullYear()} ML Helper
          </footer>
        </div>
      </div>
    </AppLayout>
  )
}