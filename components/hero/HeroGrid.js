import { useState, useMemo, useEffect } from 'react'
import HeroCardEnhanced, { HeroCardEnhancedSkeleton } from './HeroCardEnhanced'

const ITEMS_PER_PAGE = 40

export default function HeroGrid({ heroes, loading, filters = {} }) {
  const [currentPage, setCurrentPage] = useState(1)

  // Filter and sort heroes
  const filteredHeroes = useMemo(() => {
    let result = [...heroes]

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter((hero) => {
        const name = (hero.hero_name || hero.name || '').toLowerCase()
        return name.includes(searchLower)
      })
    }

    // Role filter
    if (filters.roles && filters.roles.length > 0) {
      result = result.filter((hero) => {
        const heroRole = (hero.role || '').toLowerCase()
        return filters.roles.some((role) => heroRole.includes(role.toLowerCase()))
      })
    }

    // Damage type filter
    if (filters.damageTypes && filters.damageTypes.length > 0) {
      result = result.filter((hero) => {
        const damageType = (hero.damage_type || '').toLowerCase()
        return filters.damageTypes.some((type) => damageType.includes(type.toLowerCase()))
      })
    }

    // Sort
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'name_asc':
          result.sort((a, b) => (a.hero_name || a.name || '').localeCompare(b.hero_name || b.name || ''))
          break
        case 'name_desc':
          result.sort((a, b) => (b.hero_name || b.name || '').localeCompare(a.hero_name || a.name || ''))
          break
        case 'role':
          result.sort((a, b) => (a.role || '').localeCompare(b.role || ''))
          break
      }
    }

    return result
  }, [heroes, filters])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filters])

  // Pagination
  const totalPages = Math.ceil(filteredHeroes.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedHeroes = filteredHeroes.slice(startIndex, endIndex)

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = []
    const showPages = 5
    let startPage = Math.max(1, currentPage - Math.floor(showPages / 2))
    let endPage = Math.min(totalPages, startPage + showPages - 1)
    
    if (endPage - startPage + 1 < showPages) {
      startPage = Math.max(1, endPage - showPages + 1)
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }
    return pages
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-4">
        {[...Array(20)].map((_, i) => (
          <HeroCardEnhancedSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (filteredHeroes.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-gray-600 font-medium">Tidak ada hero yang ditemukan</p>
        <p className="text-gray-400 text-sm mt-1">Coba ubah filter pencarian</p>
      </div>
    )
  }

  return (
    <div>
      {/* Results Count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600">
          Menampilkan <span className="font-medium">{startIndex + 1}-{Math.min(endIndex, filteredHeroes.length)}</span> dari{' '}
          <span className="font-medium">{filteredHeroes.length}</span> heroes
        </p>
        {totalPages > 1 && (
          <p className="text-sm text-gray-500">
            Halaman {currentPage} dari {totalPages}
          </p>
        )}
      </div>

      {/* Hero Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-4 mb-6">
        {paginatedHeroes.map((hero, index) => (
          <HeroCardEnhanced key={hero.hero_name || hero.name || index} hero={hero} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 pt-4 border-t border-gray-200">
          {/* First Page */}
          <button
            onClick={() => goToPage(1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="First Page"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>

          {/* Previous Page */}
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Previous Page"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1 mx-2">
            {getPageNumbers().map((page) => (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === page
                    ? 'bg-sky-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          {/* Next Page */}
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Next Page"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Last Page */}
          <button
            onClick={() => goToPage(totalPages)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Last Page"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
