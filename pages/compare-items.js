import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/router'
import AppLayout from '../components/AppLayout'
import { useToast, toastError, toastWarning, toastSuccess } from '../components/Toast'
import LazyImage from '../components/LazyImage'
import { useItemSearch } from '../lib/hooks/useItems'

export default function CompareItemsPage() {
  const router = useRouter()
  const { addToast } = useToast()
  const [selectedItems, setSelectedItems] = useState([null, null, null])
  const [itemsData, setItemsData] = useState([null, null, null])
  const [loading, setLoading] = useState([false, false, false])
  
  // Search states for each slot
  const [searchQueries, setSearchQueries] = useState(['', '', ''])
  const [activeSearchIndex, setActiveSearchIndex] = useState(-1)
  const [activeDropdownIndex, setActiveDropdownIndex] = useState(-1)
  
  const inputRefs = [useRef(null), useRef(null), useRef(null)]
  const dropdownRefs = [useRef(null), useRef(null), useRef(null)]

  // Debounced search for active slot
  const debouncedQuery = useDebounce(
    activeSearchIndex >= 0 ? searchQueries[activeSearchIndex] : '',
    300
  )

  const { suggestions, isLoading: suggestionsLoading } = useItemSearch(debouncedQuery)

  // Load items from URL query params on mount (only once)
  useEffect(() => {
    const { item1, item2, item3 } = router.query
    const items = [item1, item2, item3]
    
    // Only load if we have query params and haven't loaded yet
    const hasQueryParams = items.some(Boolean)
    const hasLoadedItems = selectedItems.some(Boolean)
    
    if (hasQueryParams && !hasLoadedItems && router.isReady) {
      items.forEach((itemName, idx) => {
        if (itemName && idx < 3 && !selectedItems[idx]) {
          loadItemData(idx, itemName)
        }
      })
    }
  }, [router.isReady])

  // Separate function to load item data without triggering URL update
  const loadItemData = async (slotIndex, itemName) => {
    if (!itemName) return

    setSelectedItems(prev => {
      const updated = [...prev]
      updated[slotIndex] = itemName
      return updated
    })

    setSearchQueries(prev => {
      const updated = [...prev]
      updated[slotIndex] = itemName
      return updated
    })

    setLoading(prev => {
      const updated = [...prev]
      updated[slotIndex] = true
      return updated
    })

    try {
      const res = await fetch(`/api/items/${encodeURIComponent(itemName)}`)
      if (!res.ok) throw new Error('Item not found')
      const data = await res.json()
      
      setItemsData(prev => {
        const updated = [...prev]
        updated[slotIndex] = data
        return updated
      })
    } catch (error) {
      addToast(toastError(`Gagal memuat item: ${itemName}`, 'Error'))
      setItemsData(prev => {
        const updated = [...prev]
        updated[slotIndex] = null
        return updated
      })
    } finally {
      setLoading(prev => {
        const updated = [...prev]
        updated[slotIndex] = false
        return updated
      })
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (activeDropdownIndex >= 0) {
        const dropdown = dropdownRefs[activeDropdownIndex].current
        const input = inputRefs[activeDropdownIndex].current
        if (dropdown && !dropdown.contains(e.target) && e.target !== input) {
          setActiveDropdownIndex(-1)
        }
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [activeDropdownIndex])

  const selectItem = async (slotIndex, itemName) => {
    if (!itemName) return

    const newSelectedItems = [...selectedItems]
    newSelectedItems[slotIndex] = itemName
    setSelectedItems(newSelectedItems)

    const newSearchQueries = [...searchQueries]
    newSearchQueries[slotIndex] = itemName
    setSearchQueries(newSearchQueries)

    setActiveDropdownIndex(-1)
    setActiveSearchIndex(-1)

    // Fetch item data - use functional update to avoid race condition
    setLoading(prev => {
      const updated = [...prev]
      updated[slotIndex] = true
      return updated
    })

    try {
      const res = await fetch(`/api/items/${encodeURIComponent(itemName)}`)
      if (!res.ok) throw new Error('Item not found')
      const data = await res.json()
      
      setItemsData(prev => {
        const updated = [...prev]
        updated[slotIndex] = data
        return updated
      })
    } catch (error) {
      addToast(toastError(`Gagal memuat item: ${itemName}`, 'Error'))
      setItemsData(prev => {
        const updated = [...prev]
        updated[slotIndex] = null
        return updated
      })
    } finally {
      setLoading(prev => {
        const updated = [...prev]
        updated[slotIndex] = false
        return updated
      })
    }

    // Update URL
    updateURL(newSelectedItems)
  }

  const removeItem = (slotIndex) => {
    setSelectedItems(prev => {
      const updated = [...prev]
      updated[slotIndex] = null
      updateURL(updated)
      return updated
    })

    setItemsData(prev => {
      const updated = [...prev]
      updated[slotIndex] = null
      return updated
    })

    setSearchQueries(prev => {
      const updated = [...prev]
      updated[slotIndex] = ''
      return updated
    })

    setLoading(prev => {
      const updated = [...prev]
      updated[slotIndex] = false
      return updated
    })
  }

  const updateURL = (items) => {
    const params = new URLSearchParams()
    items.forEach((item, idx) => {
      if (item) params.append(`item${idx + 1}`, item)
    })
    router.replace(`/compare-items?${params.toString()}`, undefined, { shallow: true })
  }

  const handleSearchChange = (slotIndex, value) => {
    const newSearchQueries = [...searchQueries]
    newSearchQueries[slotIndex] = value
    setSearchQueries(newSearchQueries)
    setActiveSearchIndex(slotIndex)
    setActiveDropdownIndex(slotIndex)
  }

  const handleKeyDown = (slotIndex, e) => {
    if (e.key === 'Escape') {
      setActiveDropdownIndex(-1)
      setActiveSearchIndex(-1)
    }
  }

  const clearAll = () => {
    setSelectedItems([null, null, null])
    setItemsData([null, null, null])
    setSearchQueries(['', '', ''])
    router.replace('/compare-items', undefined, { shallow: true })
  }

  const validItems = itemsData.filter(Boolean)
  const canCompare = validItems.length >= 2

  return (
    <AppLayout>
      <div className="bg-gradient-to-br from-purple-50 via-white to-blue-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <header className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800 flex items-center gap-3">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Compare Items
                </h1>
                <p className="text-gray-600 mt-2">
                  Bandingkan 2-3 items untuk melihat perbedaan stats dan harga
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push('/items?showAll=true')}
                  className="text-sm px-3 py-1.5 rounded-md border border-gray-200 text-gray-700 bg-white hover:bg-gray-100"
                >
                  Browse Items
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="text-sm px-3 py-1.5 rounded-md border border-gray-200 text-gray-700 bg-white hover:bg-gray-100"
                >
                  Home
                </button>
              </div>
            </div>
          </header>

          {/* Item Selection Slots */}
          <section className="bg-white rounded-2xl shadow border border-gray-100 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Pilih Items untuk Dibandingkan</h2>
              {validItems.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[0, 1, 2].map((slotIndex) => (
                <div key={slotIndex} className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Item {slotIndex + 1} {slotIndex === 0 && <span className="text-red-500">*</span>}
                  </label>
                  
                  {selectedItems[slotIndex] ? (
                    // Selected item preview
                    <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <LazyImage
                            src={itemsData[slotIndex]?.image_url}
                            alt={selectedItems[slotIndex]}
                            containerClassName="w-10 h-10"
                            className="w-full h-full object-cover rounded-full"
                          />
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">
                              {selectedItems[slotIndex]}
                            </p>
                            <p className="text-xs text-gray-500">
                              {itemsData[slotIndex]?.category || 'Loading...'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeItem(slotIndex)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      {loading[slotIndex] && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-600"></div>
                          Loading details...
                        </div>
                      )}
                    </div>
                  ) : (
                    // Search input
                    <div className="relative">
                      <input
                        ref={inputRefs[slotIndex]}
                        type="text"
                        value={searchQueries[slotIndex]}
                        onChange={(e) => handleSearchChange(slotIndex, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(slotIndex, e)}
                        onFocus={() => {
                          setActiveSearchIndex(slotIndex)
                          if (searchQueries[slotIndex]) setActiveDropdownIndex(slotIndex)
                        }}
                        placeholder="Ketik nama item..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      
                      {/* Suggestions dropdown */}
                      {activeDropdownIndex === slotIndex && activeSearchIndex === slotIndex && (suggestions.length > 0 || suggestionsLoading) && (
                        <div
                          ref={dropdownRefs[slotIndex]}
                          className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto"
                        >
                          {suggestionsLoading ? (
                            <div className="flex items-center justify-center py-4 px-4">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                              <span className="ml-2 text-sm text-gray-600">Mencari...</span>
                            </div>
                          ) : (
                            suggestions.map((name, i) => (
                              <div
                                key={name + i}
                                className="cursor-pointer px-4 py-2 text-sm text-gray-700 hover:bg-purple-50"
                                onMouseDown={(e) => {
                                  e.preventDefault()
                                  selectItem(slotIndex, name)
                                }}
                              >
                                {name}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {!canCompare && (
              <p className="text-sm text-gray-500 mt-4 text-center">
                Pilih minimal 2 items untuk mulai membandingkan
              </p>
            )}
          </section>

          {/* Comparison Table */}
          {canCompare && (
            <section className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-purple-100 to-blue-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 w-1/4">
                        Attribute
                      </th>
                      {validItems.map((item, idx) => (
                        <th key={idx} className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                          <div className="flex flex-col items-center gap-2">
                            <LazyImage
                              src={item.image_url}
                              alt={item.item_name}
                              containerClassName="w-16 h-16"
                              className="w-full h-full object-cover rounded-full"
                            />
                            <span className="font-bold">{item.item_name}</span>
                            <span className="text-xs text-gray-500 font-normal">{item.category}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {/* Price Row */}
                    <ComparisonRow
                      label="Price"
                      icon="💰"
                      values={validItems.map(item => ({
                        value: item.price,
                        display: item.price !== null && item.price !== undefined 
                          ? `${item.price.toLocaleString()} gold`
                          : 'N/A'
                      }))}
                      highlightLowest={true}
                    />

                    {/* Category Row */}
                    <ComparisonRow
                      label="Category"
                      icon="📦"
                      values={validItems.map(item => ({
                        value: item.category,
                        display: item.category || 'N/A'
                      }))}
                    />

                    {/* Description Row */}
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-700">
                        <div className="flex items-center gap-2">
                          <span>📝</span>
                          <span>Description</span>
                        </div>
                      </td>
                      {validItems.map((item, idx) => (
                        <td key={idx} className="px-6 py-4 text-sm text-gray-600 text-center">
                          <div className="max-w-xs mx-auto text-left">
                            {item.description || 'No description available'}
                          </div>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
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

function ComparisonRow({ label, icon, values, highlightLowest = false }) {
  // Find the best value (lowest for price, etc.)
  let bestIndex = -1
  if (highlightLowest) {
    const numericValues = values.map(v => 
      typeof v.value === 'number' ? v.value : Infinity
    )
    const minValue = Math.min(...numericValues)
    if (minValue !== Infinity) {
      bestIndex = numericValues.indexOf(minValue)
    }
  }

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 text-sm font-medium text-gray-700">
        <div className="flex items-center gap-2">
          <span>{icon}</span>
          <span>{label}</span>
        </div>
      </td>
      {values.map((item, idx) => (
        <td
          key={idx}
          className={`px-6 py-4 text-sm text-center font-medium ${
            idx === bestIndex
              ? 'text-green-700 bg-green-50'
              : 'text-gray-600'
          }`}
        >
          {item.display}
          {idx === bestIndex && highlightLowest && (
            <span className="ml-2 text-xs">✓ Best</span>
          )}
        </td>
      ))}
    </tr>
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
