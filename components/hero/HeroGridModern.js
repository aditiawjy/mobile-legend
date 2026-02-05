import { useState, useMemo, useEffect } from 'react';
import HeroCardModern, { HeroCardModernSkeleton } from './HeroCardModern';

const ITEMS_PER_PAGE = 40;

export default function HeroGridModern({ heroes, loading, filters = {} }) {
  const [currentPage, setCurrentPage] = useState(1);

  // Filter and sort heroes
  const filteredHeroes = useMemo(() => {
    let result = [...heroes];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter((hero) => {
        const name = (hero.hero_name || hero.name || '').toLowerCase();
        return name.includes(searchLower);
      });
    }

    // Role filter
    if (filters.roles && filters.roles.length > 0) {
      result = result.filter((hero) => {
        const heroRole = (hero.role || '').toLowerCase();
        return filters.roles.some((role) => heroRole.includes(role.toLowerCase()));
      });
    }

    // Damage type filter
    if (filters.damageTypes && filters.damageTypes.length > 0) {
      result = result.filter((hero) => {
        const damageType = (hero.damage_type || '').toLowerCase();
        return filters.damageTypes.some((type) => damageType.includes(type.toLowerCase()));
      });
    }

    // Sort
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'name_asc':
          result.sort((a, b) =>
            (a.hero_name || a.name || '').localeCompare(b.hero_name || b.name || '')
          );
          break;
        case 'name_desc':
          result.sort((a, b) =>
            (b.hero_name || b.name || '').localeCompare(a.hero_name || a.name || '')
          );
          break;
        case 'role':
          result.sort((a, b) => (a.role || '').localeCompare(b.role || ''));
          break;
      }
    }

    return result;
  }, [heroes, filters]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Pagination
  const totalPages = Math.ceil(filteredHeroes.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedHeroes = filteredHeroes.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const showPages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
    let endPage = Math.min(totalPages, startPage + showPages - 1);

    if (endPage - startPage + 1 < showPages) {
      startPage = Math.max(1, endPage - showPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
        {[...Array(24)].map((_, i) => (
          <HeroCardModernSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (filteredHeroes.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-gray-200/80 shadow-sm">
        <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No heroes found</h3>
        <p className="text-gray-500 mb-6">
          Try adjusting your search or filters to find what you're looking for.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-sky-500 text-white font-semibold rounded-xl hover:bg-sky-600 transition-colors"
        >
          Clear Filters
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
        {paginatedHeroes.map((hero, index) => (
          <HeroCardModern key={hero.hero_name || hero.name || index} hero={hero} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          {/* First Page */}
          <button
            onClick={() => goToPage(1)}
            disabled={currentPage === 1}
            className="p-2.5 rounded-xl hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="First Page"
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
              />
            </svg>
          </button>

          {/* Previous Page */}
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2.5 rounded-xl hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Previous Page"
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1.5">
            {getPageNumbers().map((page) => (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`w-11 h-11 rounded-xl text-sm font-bold transition-all ${
                  currentPage === page
                    ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30'
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
            className="p-2.5 rounded-xl hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Next Page"
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Last Page */}
          <button
            onClick={() => goToPage(totalPages)}
            disabled={currentPage === totalPages}
            className="p-2.5 rounded-xl hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Last Page"
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 5l7 7-7 7M5 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
