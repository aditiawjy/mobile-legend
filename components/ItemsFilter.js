export default function ItemsFilter({ 
  filters, 
  onFilterChange, 
  categories = [],
  isLoadingCategories = false 
}) {
  const { category, sortBy, sortOrder, minPrice, maxPrice } = filters

  const handleChange = (field, value) => {
    onFilterChange({ ...filters, [field]: value })
  }

  const handleReset = () => {
    onFilterChange({
      category: '',
      sortBy: 'name',
      sortOrder: 'asc',
      minPrice: null,
      maxPrice: null
    })
  }

  const hasActiveFilters = category || minPrice !== null || maxPrice !== null

  return (
    <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filter & Sort
        </h3>
        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Reset All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Category Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => handleChange('category', e.target.value)}
            className="w-full text-sm rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            disabled={isLoadingCategories}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Sort By
          </label>
          <select
            value={sortBy}
            onChange={(e) => handleChange('sortBy', e.target.value)}
            className="w-full text-sm rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="name">Name</option>
            <option value="price">Price</option>
          </select>
        </div>

        {/* Sort Order */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Order
          </label>
          <select
            value={sortOrder}
            onChange={(e) => handleChange('sortOrder', e.target.value)}
            className="w-full text-sm rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="asc">
              {sortBy === 'price' ? 'Lowest First' : 'A-Z'}
            </option>
            <option value="desc">
              {sortBy === 'price' ? 'Highest First' : 'Z-A'}
            </option>
          </select>
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Price Range
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min"
              value={minPrice || ''}
              onChange={(e) => handleChange('minPrice', e.target.value ? parseInt(e.target.value) : null)}
              className="w-full text-sm rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
            <span className="text-gray-400 self-center">-</span>
            <input
              type="number"
              placeholder="Max"
              value={maxPrice || ''}
              onChange={(e) => handleChange('maxPrice', e.target.value ? parseInt(e.target.value) : null)}
              className="w-full text-sm rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-gray-500">Active filters:</span>
            {category && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-100 text-blue-700 text-xs">
                Category: {category}
                <button
                  onClick={() => handleChange('category', '')}
                  className="hover:text-blue-900"
                >
                  ×
                </button>
              </span>
            )}
            {minPrice !== null && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-100 text-green-700 text-xs">
                Min: {minPrice}
                <button
                  onClick={() => handleChange('minPrice', null)}
                  className="hover:text-green-900"
                >
                  ×
                </button>
              </span>
            )}
            {maxPrice !== null && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-100 text-green-700 text-xs">
                Max: {maxPrice}
                <button
                  onClick={() => handleChange('maxPrice', null)}
                  className="hover:text-green-900"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
