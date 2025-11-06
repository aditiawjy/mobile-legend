import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import AppLayout from '../components/AppLayout'
import { useToast, toastError } from '../components/Toast'
import LazyImage from '../components/LazyImage'
import { useItemsInfinite, useItemSearch } from '../lib/hooks/useItems'

export default function ItemsHome() {
  const router = useRouter()
  const { addToast } = useToast()
  const [q, setQ] = useState('')
  const [activeIndex, setActiveIndex] = useState(-1)
  const dropdownRef = useRef(null)
  const inputRef = useRef(null)
  const loaderRef = useRef(null)

  const debouncedQuery = useDebounce(q, 300)

  // Show all items toggle from query
  const showAll = router.query.showAll === 'true'

  // Use SWR for infinite scroll items
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
  } = useItemsInfinite(showAll)

  // Use SWR for search suggestions
  const {
    suggestions,
    isLoading: suggestionsLoading,
    error: searchError
  } = useItemSearch(debouncedQuery)

  // Handle errors with toast
  useEffect(() => {
    if (itemsError) {
      addToast(toastError('Gagal memuat daftar items. Silakan refresh halaman.', 'Network Error'))
    }
  }, [itemsError, addToast])

  useEffect(() => {
    if (searchError) {
      addToast(toastError('Gagal mencari items. Silakan coba lagi.', 'Network Error'))
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
          <p className="text-xs text-gray-500 mt-2">Mulai ketik minimal 1 huruf. Gunakan tombol panah untuk navigasi dan Enter untuk pilih.</p>
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
