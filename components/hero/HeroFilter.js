import { useState, useEffect, useCallback } from 'react';

const ROLES = [
  { name: 'Tank', color: 'blue' },
  { name: 'Fighter', color: 'orange' },
  { name: 'Assassin', color: 'red' },
  { name: 'Mage', color: 'purple' },
  { name: 'Marksman', color: 'yellow' },
  { name: 'Support', color: 'green' },
];

const DAMAGE_TYPES = [
  { name: 'Physical', color: 'orange' },
  { name: 'Magic', color: 'purple' },
];

const SORT_OPTIONS = [
  { value: 'name_asc', label: 'Name A-Z' },
  { value: 'name_desc', label: 'Name Z-A' },
  { value: 'role', label: 'By Role' },
];

export default function HeroFilter({ onFilterChange, initialFilters = {} }) {
  const [search, setSearch] = useState(initialFilters.search || '');
  const [selectedRoles, setSelectedRoles] = useState(initialFilters.roles || []);
  const [selectedDamageTypes, setSelectedDamageTypes] = useState(initialFilters.damageTypes || []);
  const [sortBy, setSortBy] = useState(initialFilters.sortBy || 'name_asc');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = useCallback(() => {
    onFilterChange({
      search,
      roles: selectedRoles,
      damageTypes: selectedDamageTypes,
      sortBy,
    });
  }, [search, selectedRoles, selectedDamageTypes, sortBy, onFilterChange]);

  useEffect(() => {
    handleFilterChange();
  }, [handleFilterChange]);

  const toggleRole = (role) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const toggleDamageType = (type) => {
    setSelectedDamageTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedRoles([]);
    setSelectedDamageTypes([]);
    setSortBy('name_asc');
  };

  const hasActiveFilters = search || selectedRoles.length > 0 || selectedDamageTypes.length > 0;

  const getButtonClasses = (color, isSelected) => {
    const baseClasses = 'px-3 py-1.5 rounded-lg text-xs font-medium transition-all border';

    if (isSelected) {
      const selectedClasses = {
        blue: 'bg-blue-600 text-white border-blue-600 shadow-sm',
        orange: 'bg-orange-500 text-white border-orange-500 shadow-sm',
        red: 'bg-red-600 text-white border-red-600 shadow-sm',
        purple: 'bg-purple-600 text-white border-purple-600 shadow-sm',
        yellow: 'bg-yellow-500 text-white border-yellow-500 shadow-sm',
        green: 'bg-green-600 text-white border-green-600 shadow-sm',
      };
      return `${baseClasses} ${selectedClasses[color] || selectedClasses.blue}`;
    }

    return `${baseClasses} bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50`;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Main Filter Bar */}
      <div className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-4 w-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search heroes..."
              className="block w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="sm:w-40 relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="block w-full pl-3 pr-8 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white appearance-none cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
              <svg
                className="h-4 w-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors min-w-[100px] ${
              hasActiveFilters
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            Filter
            <svg
              className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Expandable Filter Options */}
      <div
        className={`border-t border-gray-100 transition-all duration-200 ${isExpanded ? 'block' : 'hidden'}`}
      >
        <div className="p-4 space-y-4">
          {/* Role Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Role
            </label>
            <div className="flex flex-wrap gap-2">
              {ROLES.map((role) => (
                <button
                  key={role.name}
                  onClick={() => toggleRole(role.name)}
                  className={getButtonClasses(role.color, selectedRoles.includes(role.name))}
                >
                  {role.name}
                </button>
              ))}
            </div>
          </div>

          {/* Damage Type Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Damage Type
            </label>
            <div className="flex flex-wrap gap-2">
              {DAMAGE_TYPES.map((type) => (
                <button
                  key={type.name}
                  onClick={() => toggleDamageType(type.name)}
                  className={getButtonClasses(type.color, selectedDamageTypes.includes(type.name))}
                >
                  {type.name}
                </button>
              ))}
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <div className="pt-2 border-t border-gray-100">
              <button
                onClick={clearFilters}
                className="text-xs text-gray-500 hover:text-red-600 font-medium flex items-center gap-1 transition-colors"
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
