import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import AppLayout from '../components/AppLayout'
import { useToast, toastError } from '../components/Toast'
import LazyImage from '../components/LazyImage'
import ItemsFilter from '../components/ItemsFilter'
import { useItemsInfinite, useItemSearch, useCategories } from '../lib/hooks/useItems'

export default function ItemsHome() {
  const router = useRouter()
  const { addToast } = useToast()
  const [q, setQ] = useState('')
  const [activeIndex, setActiveIndex] = useState(-1)
  const [csvUpdating, setCsvUpdating] = useState(false)
  const [csvMessage, setCsvMessage] = useState('')
  const dropdownRef = useRef(null)
  const inputRef = useRef(null)
  const loaderRef = useRef(null)
  const itemsErrorShownRef = useRef(false)
  const searchErrorShownRef = useRef(false)

  const debouncedQuery = useDebounce(q, 300)

  // Show all items toggle from query
  const showAll = router.query.showAll === 'true'

  // Filter & Sort state - initialized from URL query
  const [filters, setFilters] = useState({
    category: '',
    sortBy: 'name',
    sortOrder: 'asc',
    minPrice: null,
    maxPrice: null
  })

  // Initialize filters from URL on mount
  useEffect(() => {
    if (!router.isReady) return
    const { category, sortBy, sortOrder, minPrice, maxPrice } = router.query
    setFilters({
      category: category || '',
      sortBy: sortBy || 'name',
      sortOrder: sortOrder || 'asc',
      minPrice: minPrice ? parseInt(minPrice) : null,
      maxPrice: maxPrice ? parseInt(maxPrice) : null
    })
  }, [router.isReady])

  // Update URL when filters change
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
    // Build query string with non-empty values
    const query = {}
    if (newFilters.category) query.category = newFilters.category
    if (newFilters.sortBy !== 'name') query.sortBy = newFilters.sortBy
    if (newFilters.sortOrder !== 'asc') query.sortOrder = newFilters.sortOrder
    if (newFilters.minPrice !== null) query.minPrice = newFilters.minPrice
    if (newFilters.maxPrice !== null) query.maxPrice = newFilters.maxPrice
    if (showAll) query.showAll = 'true'
    
    // Update URL without full page reload
    router.push(
      {
        pathname: router.pathname,
        query
      },
      undefined,
      { shallow: true }
    )
  }

  // Get categories for filter
  const { categories, isLoading: isLoadingCategories } = useCategories()

  // Use SWR for infinite scroll items with filters
  const {
    items: allItems,
    total,
    hasMore,
    isLoading: allItemsLoading,
    isLoadingMore: loadingMore,
    isEmpty,
    error: itemsError,
    loadMore,
    refresh: refreshItems
  } = useItemsInfinite(showAll, { ...filters, fetchAll: showAll })

  // Use SWR for search suggestions
  const {
    suggestions,
    isLoading: suggestionsLoading,
    error: searchError
  } = useItemSearch(debouncedQuery)

  // Handle errors with toast (with guard to prevent infinite loops)
  useEffect(() => {
    if (itemsError && !itemsErrorShownRef.current) {
      itemsErrorShownRef.current = true
      addToast(toastError('Gagal memuat daftar items. Silakan refresh halaman.', 'Network Error'))
    } else if (!itemsError) {
      itemsErrorShownRef.current = false
    }
  }, [itemsError, addToast])

  useEffect(() => {
    if (searchError && !searchErrorShownRef.current) {
      searchErrorShownRef.current = true
      addToast(toastError('Gagal mencari items. Silakan coba lagi.', 'Network Error'))
    } else if (!searchError) {
      searchErrorShownRef.current = false
    }
  }, [searchError, addToast])

  const onSelect = (name) => {
    if (!name) return
    setQ(name)
    // Navigate to dedicated item detail page
    router.push(`/item/${encodeURIComponent(name)}`)
  }

  const onKeyDown = (e) => {
    if (!suggestions.length && !suggestionsLoading) return
    switch (e.key) {
      case 'ArrowDown': 
        if (!suggestionsLoading) {
          e.preventDefault()
          setActiveIndex((i) => (i + 1) % suggestions.length)
        }
        break
      case 'ArrowUp': 
        if (!suggestionsLoading) {
          e.preventDefault()
          setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length)
        }
        break
      case 'Enter':
        if (!suggestionsLoading) {
          if (activeIndex >= 0) { e.preventDefault(); onSelect(suggestions[activeIndex]) }
          else if (q.trim()) { onSelect(q.trim()) }
        }
        break
      case 'Escape': 
        setQ('')
        setActiveIndex(-1)
        break
    }
  }

  useEffect(() => {
    const onDocClick = (e) => {
      if (!dropdownRef.current) return
      if (!dropdownRef.current.contains(e.target) && e.target !== inputRef.current) {
        setActiveIndex(-1)
      }
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!showAll || !loaderRef.current || !hasMore || loadingMore) return

    const currentLoader = loaderRef.current
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(currentLoader)

    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader)
      }
    }
  }, [showAll, hasMore, loadingMore, loadMore])

  const handleUpdateItemsCSV = async () => {
    console.log('CSV button clicked!')
    setCsvUpdating(true)
    setCsvMessage('')
    try {
      const response = await fetch('/api/export/items-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        const data = await response.json()
        setCsvMessage(`✓ Items CSV updated! (${data.itemCount} items)`)
        setTimeout(() => setCsvMessage(''), 3000)
      } else {
        const error = await response.json()
        console.error('Items CSV error:', error)
        const errorMsg = error.details || error.error || 'Unknown error'
        setCsvMessage(`✗ Error: ${errorMsg}`)
        setTimeout(() => setCsvMessage(''), 5000)
      }
    } catch (error) {
      console.error('Error updating items CSV:', error)
      setCsvMessage(`✗ Error: ${error.message || 'Failed to update'}`)
    } finally {
      setCsvUpdating(false)
    }
  }

  return (
    <AppLayout>
      <div className="bg-gradient-to-br from-blue-50 via-white to-green-50 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-8">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 flex items-center gap-3">
              <span className="text-green-600">ML</span> Items
              {showAll && <span className="text-lg font-normal text-gray-500">- All Items</span>}
            </h1>
            <p className="text-gray-600 mt-2">
              {showAll ? `Menampilkan ${allItems.length}${total ? ` dari ${total}` : ''} items dari database.` : 'Cari item Mobile Legends dan lihat detailnya secara instan.'}
            </p>
            {showAll && (
              <button
                onClick={refreshItems}
                className="mt-2 text-xs inline-flex items-center gap-1 px-2 py-1 rounded-md border border-gray-300 text-gray-600 bg-white hover:bg-gray-50"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Data
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/"
              className="text-sm inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-200 text-gray-700 bg-white hover:bg-gray-100"
            >
              Heroes
            </a>
            <a
              href="/damage-composition"
              className="text-sm inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100"
            >
              Analysis
            </a>
            
            {/* Items CSV Update Button - Debug: Always visible */}
            <button
              onClick={handleUpdateItemsCSV}
              disabled={csvUpdating}
              title="Update Items CSV"
              className="text-sm inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-green-600 text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              style={{display: 'inline-flex'}}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>{csvUpdating ? 'Updating...' : 'CSV Items'}</span>
            </button>
            {csvMessage && (
              <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded">
                {csvMessage}
              </span>
            )}
            
            <a
              href="/compare-items"
              className="text-sm inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Compare
            </a>
            <a
              href="/?showAll=true"
              className="text-sm inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-200 text-gray-700 bg-white hover:bg-gray-100"
            >
              Heroes
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
              {showAll ? 'Dashboard' : 'Home'}
            </a>
            {showAll && (
              <button
                onClick={() => router.push('/items')}
                className="text-sm inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-200 text-gray-700 bg-white hover:bg-gray-100"
              >
                Kembali ke Search Items
              </button>
            )}
          </div>
        </header>

        {!showAll && (
        <>
        <section className="bg-white rounded-2xl shadow border border-gray-100 p-4 md:p-6">
          <label htmlFor="itemInput" className="block text-sm font-medium text-gray-700 mb-2">Cari Item</label>
          <div className="relative">
            <input
              id="itemInput"
              ref={inputRef}
              value={q}
              onChange={(e) => { setQ(e.target.value); setActiveIndex(-1) }}
              onKeyDown={onKeyDown}
              placeholder="Ketik nama item..."
              className="w-full rounded-none border border-black bg-white focus:border-black focus:ring-black pr-10 px-3 py-2 rounded-xs"
              autoComplete="off"
              role="combobox"
              aria-controls="itemSuggestions"
              aria-expanded={suggestions.length > 0}
              aria-activedescendant={activeIndex >= 0 ? `item-option-${activeIndex}` : undefined}
            />
            {(suggestions.length > 0 || suggestionsLoading) && (
              <div
                id="itemSuggestions"
                ref={dropdownRef}
                role="listbox"
                className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-72 overflow-auto"
              >
                {suggestionsLoading ? (
                  <div className="flex items-center justify-center py-4 px-4">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                    <span className="ml-2 text-sm text-gray-600">Mencari items...</span>
                  </div>
                ) : (
                  suggestions.map((name, i) => (
                    <div
                      key={name + i}
                      id={`item-option-${i}`}
                      role="option"
                      aria-selected={i === activeIndex}
                      className={`cursor-pointer px-4 py-2 text-sm text-gray-700 ${i === 0 ? 'rounded-t-xl' : ''} ${i === suggestions.length - 1 ? 'rounded-b-xl' : ''} ${i === activeIndex ? 'bg-gray-100' : ''}`}
                      onMouseDown={(e) => { e.preventDefault(); onSelect(name) }}
                      onMouseEnter={() => {
                        router.prefetch(`/item/${encodeURIComponent(name)}`)
                      }}
                    >
                      {name}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">Mulai ketik minimal 1 huruf. Gunakan tombol panah untuk navigasi dan Enter untuk pilih.</p>
        </section>

        {/* View All Items Button */}
        <section className="mt-6 text-center">
          <button
            onClick={() => router.push('/items?showAll=true')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors shadow-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            Lihat Semua Items
          </button>
          <p className="text-xs text-gray-500 mt-2">Atau klik tombol di atas untuk melihat semua items yang tersedia</p>
        </section>
        </>
        )}

        {/* All Items Grid */}
        {showAll && (
          <>
            {/* Search Box for All Items */}
            <section className="bg-white rounded-2xl shadow border border-gray-100 p-4 md:p-6 mb-6">
              <label htmlFor="itemSearchAll" className="block text-sm font-medium text-gray-700 mb-2">Cari Item</label>
              <div className="relative">
                <input
                  id="itemSearchAll"
                  ref={inputRef}
                  value={q}
                  onChange={(e) => { setQ(e.target.value); setActiveIndex(-1) }}
                  onKeyDown={onKeyDown}
                  placeholder="Ketik nama item untuk filter..."
                  className="w-full rounded-none border border-black bg-white focus:border-black focus:ring-black pr-10 px-3 py-2 rounded-xs"
                  autoComplete="off"
                />
                {(suggestions.length > 0 || suggestionsLoading) && (
                  <div
                    ref={dropdownRef}
                    className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-72 overflow-auto"
                  >
                    {suggestionsLoading ? (
                      <div className="flex items-center justify-center py-4 px-4">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                        <span className="ml-2 text-sm text-gray-600">Mencari items...</span>
                      </div>
                    ) : (
                      suggestions.map((name, i) => (
                        <div
                          key={name + i}
                          className={`cursor-pointer px-4 py-2 text-sm text-gray-700 ${i === 0 ? 'rounded-t-xl' : ''} ${i === suggestions.length - 1 ? 'rounded-b-xl' : ''} ${i === activeIndex ? 'bg-gray-100' : ''}`}
                          onMouseDown={(e) => { e.preventDefault(); onSelect(name) }}
                        >
                          {name}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">Mulai ketik minimal 1 huruf untuk mencari atau gunakan filter di bawah.</p>
            </section>

            {/* Filter & Sort */}
            <ItemsFilter
              filters={filters}
              onFilterChange={handleFilterChange}
              categories={categories}
              isLoadingCategories={isLoadingCategories}
            />

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
                      className="bg-white rounded-lg p-4 hover:shadow-lg transition-all cursor-pointer border border-gray-200"
                      onClick={() => router.push(`/item/${encodeURIComponent(item.item_name)}`)}
                    >
                      <div className="text-center mb-3">
                        <LazyImage
                          src={item.image_url}
                          alt={item.item_name}
                          containerClassName="w-16 h-16 mx-auto mb-3"
                          className="w-full h-full object-cover rounded-full"
                        />
                        <h3 className="font-semibold text-gray-900 text-sm mb-1">
                          {item.item_name}
                        </h3>
                        <p className="text-xs text-gray-500 mb-2">
                          {item.category || 'Item'}
                        </p>
                        {item.price !== null && item.price !== undefined && (
                          <p className="text-xs font-medium text-amber-600 mb-3">
                            {item.price.toLocaleString()} gold
                          </p>
                        )}
                      </div>
                      
                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {item.attack !== null && item.attack !== undefined && item.attack !== 0 && (
                          <div className="bg-red-50 p-2 rounded">
                            <span className="text-gray-600">ATK:</span> <span className="font-semibold text-red-600">{item.attack}</span>
                          </div>
                        )}
                        {item.magic_power !== null && item.magic_power !== undefined && item.magic_power !== 0 && (
                          <div className="bg-purple-50 p-2 rounded">
                            <span className="text-gray-600">AP:</span> <span className="font-semibold text-purple-600">{item.magic_power}</span>
                          </div>
                        )}
                        {item.hp !== null && item.hp !== undefined && item.hp !== 0 && (
                          <div className="bg-green-50 p-2 rounded">
                            <span className="text-gray-600">HP:</span> <span className="font-semibold text-green-600">{item.hp}</span>
                          </div>
                        )}
                        {item.armor !== null && item.armor !== undefined && item.armor !== 0 && (
                          <div className="bg-blue-50 p-2 rounded">
                            <span className="text-gray-600">ARM:</span> <span className="font-semibold text-blue-600">{item.armor}</span>
                          </div>
                        )}
                        {item.magic_resist !== null && item.magic_resist !== undefined && item.magic_resist !== 0 && (
                          <div className="bg-indigo-50 p-2 rounded">
                            <span className="text-gray-600">MR:</span> <span className="font-semibold text-indigo-600">{item.magic_resist}</span>
                          </div>
                        )}
                        {item.movement_speed !== null && item.movement_speed !== undefined && item.movement_speed !== 0 && (
                          <div className="bg-yellow-50 p-2 rounded">
                            <span className="text-gray-600">SPD:</span> <span className="font-semibold text-yellow-600">{item.movement_speed}</span>
                          </div>
                        )}
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
                      • Semua {allItems.length} items telah dimuat
                    </div>
                  )}
                </div>
              </>
            ) : null}
            </section>
          </>
        )}

        <footer className="mt-10 text-center text-xs text-gray-400">{new Date().getFullYear()} ML Helper</footer>
        </div>
      </div>
    </AppLayout>
  )
}

function useDebounce(value, delay) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return v
}
