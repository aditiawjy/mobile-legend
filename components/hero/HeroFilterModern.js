import { useState, useEffect, useCallback } from 'react';

const ROLES = [
  { name: 'Tank', icon: '🛡️', color: 'blue' },
  { name: 'Fighter', icon: '⚔️', color: 'orange' },
  { name: 'Assassin', icon: '🗡️', color: 'red' },
  { name: 'Mage', icon: '🔮', color: 'purple' },
  { name: 'Marksman', icon: '🏹', color: 'yellow' },
  { name: 'Support', icon: '💚', color: 'green' },
];

const DAMAGE_TYPES = [
  { name: 'Physical', icon: '⚔️', color: 'orange' },
  { name: 'Magic', icon: '🔮', color: 'purple' },
];

const SORT_OPTIONS = [
  { value: 'name_asc', label: 'Name A-Z', icon: '↓' },
  { value: 'name_desc', label: 'Name Z-A', icon: '↑' },
  { value: 'role', label: 'By Role', icon: '⚔️' },
];

export default function HeroFilterModern({
  onFilterChange,
  initialFilters = {},
  totalHeroes = 0,
  filteredCount = 0,
}) {
  const [search, setSearch] = useState(initialFilters.search || '');
  const [selectedRoles, setSelectedRoles] = useState(initialFilters.roles || []);
  const [selectedDamageTypes, setSelectedDamageTypes] = useState(initialFilters.damageTypes || []);
  const [sortBy, setSortBy] = useState(initialFilters.sortBy || 'name_asc');
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  const handleFilterChange = useCallback(() => {
    onFilterChange({
      search,
      roles: selectedRoles,
      damageTypes: selectedDamageTypes,
      sortBy,
      viewMode,
    });
  }, [search, selectedRoles, selectedDamageTypes, sortBy, viewMode, onFilterChange]);

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
  const activeFiltersCount = selectedRoles.length + selectedDamageTypes.length + (search ? 1 : 0);

  const getRoleColorClasses = (color, isSelected) => {
    const colors = {
      blue: isSelected
        ? 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/30'
        : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
      orange: isSelected
        ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/30'
        : 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
      red: isSelected
        ? 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/30'
        : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
      purple: isSelected
        ? 'bg-purple-500 text-white border-purple-500 shadow-lg shadow-purple-500/30'
        : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
      yellow: isSelected
        ? 'bg-yellow-500 text-white border-yellow-500 shadow-lg shadow-yellow-500/30'
        : 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100',
      green: isSelected
        ? 'bg-green-500 text-white border-green-500 shadow-lg shadow-green-500/30'
        : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden">
      {/* Header Section */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Search Input */}
          <div className="flex-1 w-full lg:w-auto relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400 group-focus-within:text-sky-500 transition-colors"
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
              placeholder="Search heroes by name..."
              className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm bg-gray-50 focus:bg-white transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

          {/* Right Side Controls */}
          <div className="flex items-center gap-3 w-full lg:w-auto">
            {/* Sort Dropdown */}
            <div className="relative flex-1 lg:flex-none">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full lg:w-44 appearance-none px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm bg-gray-50 focus:bg-white cursor-pointer pr-10"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.icon} {opt.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
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

            {/* Filter Toggle Button */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                hasActiveFilters
                  ? 'bg-sky-50 border-sky-200 text-sky-700 shadow-md shadow-sky-500/20'
                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              <span className="hidden sm:inline">Filters</span>
              {activeFiltersCount > 0 && (
                <span className="bg-sky-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                  {activeFiltersCount}
                </span>
              )}
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
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

        {/* Results Count */}
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing <span className="font-bold text-gray-900">{filteredCount}</span> of{' '}
            <span className="font-bold text-gray-900">{totalHeroes}</span> heroes
          </p>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* Expandable Filter Options */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="p-5 border-t border-gray-100 space-y-5">
          {/* Role Filter */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <svg
                className="w-4 h-4 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              Filter by Role
            </label>
            <div className="flex flex-wrap gap-2">
              {ROLES.map((role) => {
                const isSelected = selectedRoles.includes(role.name);
                return (
                  <button
                    key={role.name}
                    onClick={() => toggleRole(role.name)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all duration-200 flex items-center gap-2 ${getRoleColorClasses(role.color, isSelected)}`}
                  >
                    <span>{role.icon}</span>
                    <span>{role.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Damage Type Filter */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <svg
                className="w-4 h-4 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              Filter by Damage Type
            </label>
            <div className="flex flex-wrap gap-2">
              {DAMAGE_TYPES.map((type) => {
                const isSelected = selectedDamageTypes.includes(type.name);
                return (
                  <button
                    key={type.name}
                    onClick={() => toggleDamageType(type.name)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all duration-200 flex items-center gap-2 ${getRoleColorClasses(type.color, isSelected)}`}
                  >
                    <span>{type.icon}</span>
                    <span>{type.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
