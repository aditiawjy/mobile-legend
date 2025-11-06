import useSWR from 'swr'
import useSWRInfinite from 'swr/infinite'

// Fetcher function for SWR
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

/**
 * Hook for fetching paginated items with infinite scroll
 * Uses SWR Infinite for automatic pagination
 * 
 * @param {boolean} shouldFetch - Enable/disable fetching
 * @param {object} options - Filter & sort options
 * @param {string} options.category - Filter by category
 * @param {string} options.sortBy - Sort field (name, price)
 * @param {string} options.sortOrder - Sort order (asc, desc)
 * @param {number} options.minPrice - Minimum price filter
 * @param {number} options.maxPrice - Maximum price filter
 */
export function useItemsInfinite(shouldFetch = true, options = {}) {
  const PAGE_SIZE = 20
  const {
    category = '',
    sortBy = 'name',
    sortOrder = 'asc',
    minPrice = null,
    maxPrice = null,
    fetchAll = false // New option to fetch all items at once
  } = options

  const getKey = (pageIndex, previousPageData) => {
    // If shouldFetch is false, return null to disable fetching
    if (!shouldFetch) return null
    
    // If fetchAll is true, only fetch once
    if (fetchAll && pageIndex > 0) return null
    
    // Reached the end
    if (previousPageData && !previousPageData.hasMore) return null
    
    // Build URL with query params
    const offset = pageIndex * PAGE_SIZE
    const params = new URLSearchParams({
      limit: PAGE_SIZE.toString(),
      offset: offset.toString(),
      sortBy,
      sortOrder
    })

    if (fetchAll) params.append('fetchAll', 'true')
    if (category) params.append('category', category)
    if (minPrice !== null) params.append('minPrice', minPrice.toString())
    if (maxPrice !== null) params.append('maxPrice', maxPrice.toString())
    
    return `/api/items?${params.toString()}`
  }

  const {
    data,
    error,
    size,
    setSize,
    isValidating,
    mutate
  } = useSWRInfinite(getKey, fetcher, {
    revalidateFirstPage: false,
    revalidateAll: false,
    persistSize: false, // Reset when filters change
  })

  // Flatten all pages into single array
  const items = data ? data.flatMap(page => page.items || []) : []
  
  // Check if there's more data to load
  const hasMore = data ? data[data.length - 1]?.hasMore : false
  
  // Loading states
  const isLoadingInitialData = !data && !error
  const isLoadingMore = isLoadingInitialData || 
    (size > 0 && data && typeof data[size - 1] === 'undefined')
  
  const isEmpty = data?.[0]?.items?.length === 0
  const isRefreshing = isValidating && data && data.length === size

  // Total count from first page
  const total = data?.[0]?.total || 0

  // Active filters from response
  const activeFilters = data?.[0]?.filters || {}

  return {
    items,
    total,
    hasMore,
    isLoading: isLoadingInitialData,
    isLoadingMore,
    isRefreshing,
    isEmpty,
    error,
    loadMore: () => setSize(size + 1),
    refresh: mutate,
    activeFilters,
    size
  }
}

/**
 * Hook for fetching single item detail
 */
export function useItem(itemName) {
  const { data, error, isValidating, mutate } = useSWR(
    itemName ? `/api/items/${encodeURIComponent(itemName)}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 10000, // 10 seconds
    }
  )

  return {
    item: data,
    isLoading: !data && !error,
    isValidating,
    error,
    refresh: mutate
  }
}

/**
 * Hook for item search with debouncing
 */
export function useItemSearch(query, delay = 300) {
  const { data, error, isValidating } = useSWR(
    query && query.trim() ? `/api/items_search?q=${encodeURIComponent(query)}` : null,
    fetcher,
    {
      dedupingInterval: 1000,
      revalidateOnFocus: false,
    }
  )

  return {
    suggestions: Array.isArray(data) ? data : [],
    isLoading: isValidating,
    error
  }
}

/**
 * Hook for fetching available categories
 */
export function useCategories() {
  const { data, error, isValidating } = useSWR(
    '/api/items/categories',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute - categories don't change often
    }
  )

  return {
    categories: data?.categories || [],
    isLoading: !data && !error,
    error
  }
}
