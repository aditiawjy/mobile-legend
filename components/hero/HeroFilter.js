import { useState, useEffect, useCallback } from 'react'

const ROLES = ['Tank', 'Fighter', 'Assassin', 'Mage', 'Marksman', 'Support']
const DAMAGE_TYPES = ['Physical', 'Magic']
const SORT_OPTIONS = [
  { value: 'name_asc', label: 'Nama A-Z' },
  { value: 'name_desc', label: 'Nama Z-A' },
  { value: 'role', label: 'Role' },
]

export default function HeroFilter({ onFilterChange, initialFilters = {} }) {
  const [search, setSearch] = useState(initialFilters.search || '')
  const [selectedRoles, setSelectedRoles] = useState(initialFilters.roles || [])
  const [selectedDamageTypes, setSelectedDamageTypes] = useState(initialFilters.damageTypes || [])
  const [sortBy, setSortBy] = useState(initialFilters.sortBy || 'name_asc')
  const [isExpanded, setIsExpanded] = useState(false)

  const handleFilterChange = useCallback(() => {
    onFilterChange({
      search,
      roles: selectedRoles,
      damageTypes: selectedDamageTypes,
      sortBy,
    })
  }, [search, selectedRoles, selectedDamageTypes, sortBy, onFilterChange])

  useEffect(() => {
    handleFilterChange()
  }, [handleFilterChange])

  const toggleRole = (role) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    )
  }

  const toggleDamageType = (type) => {
    setSelectedDamageTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  const clearFilters = () => {
    setSearch('')
    setSelectedRoles([])
    setSelectedDamageTypes([])
    setSortBy('name_asc')
  }

  const hasActiveFilters = search || selectedRoles.length > 0 || selectedDamageTypes.length > 0

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
      {/* Search and Sort Row */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        {/* Search Input */}
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari hero..."
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm bg-white"
          />
        </div>

        {/* Sort Dropdown */}
        <div className="sm:w-48">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm bg-white"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Toggle Filter Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
            hasActiveFilters
              ? 'bg-sky-50 border-sky-200 text-sky-700'
              : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filter
          {hasActiveFilters && (
            <span className="bg-sky-600 text-white text-xs px-1.5 py-0.5 rounded-full">
              {selectedRoles.length + selectedDamageTypes.length + (search ? 1 : 0)}
            </span>
          )}
          <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Expandable Filter Options */}
      {isExpanded && (
        <div className="pt-4 border-t border-gray-200 space-y-4">
          {/* Role Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <div className="flex flex-wrap gap-2">
              {ROLES.map((role) => (
                <button
                  key={role}
                  onClick={() => toggleRole(role)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedRoles.includes(role)
                      ? 'bg-sky-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* Damage Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Damage Type</label>
            <div className="flex flex-wrap gap-2">
              {DAMAGE_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => toggleDamageType(type)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedDamageTypes.includes(type)
                      ? type === 'Physical' ? 'bg-orange-500 text-white' : 'bg-purple-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <div className="pt-2">
              <button
                onClick={clearFilters}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Reset Filter
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
