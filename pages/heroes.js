import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import AppLayout from '../components/common/AppLayout';

const ROLES = [
  { name: 'Tank', color: 'blue', icon: '🛡️' },
  { name: 'Fighter', color: 'orange', icon: '⚔️' },
  { name: 'Assassin', color: 'red', icon: '🗡️' },
  { name: 'Mage', color: 'purple', icon: '🔮' },
  { name: 'Marksman', color: 'yellow', icon: '🏹' },
  { name: 'Support', color: 'green', icon: '💚' },
];

const DAMAGE_TYPES = [
  { name: 'Physical', color: 'orange', icon: '⚔️' },
  { name: 'Magic', color: 'purple', icon: '🔮' },
];

const ROLE_COLORS = {
  Tank: 'from-blue-500 to-blue-600',
  Fighter: 'from-orange-500 to-red-500',
  Assassin: 'from-red-500 to-pink-600',
  Mage: 'from-purple-500 to-indigo-600',
  Marksman: 'from-yellow-400 to-orange-500',
  Support: 'from-green-500 to-teal-600',
};

export default function HeroesPage() {
  const router = useRouter();
  const [allHeroes, setAllHeroes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedDamageTypes, setSelectedDamageTypes] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  useEffect(() => {
    const fetchAllHeroes = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/heroes');
        if (response.ok) {
          const data = await response.json();
          setAllHeroes(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Error fetching all heroes:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllHeroes();
  }, []);

  const filteredHeroes = useMemo(() => {
    let result = [...allHeroes];

    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter((hero) => {
        const name = (hero.hero_name || hero.name || '').toLowerCase();
        return name.includes(searchLower);
      });
    }

    if (selectedRoles.length > 0) {
      result = result.filter((hero) => {
        const heroRole = (hero.role || '').toLowerCase();
        return selectedRoles.some((role) => heroRole.includes(role.toLowerCase()));
      });
    }

    if (selectedDamageTypes.length > 0) {
      result = result.filter((hero) => {
        const damageType = (hero.damage_type || '').toLowerCase();
        return selectedDamageTypes.some((type) => damageType.includes(type.toLowerCase()));
      });
    }

    return result;
  }, [allHeroes, search, selectedRoles, selectedDamageTypes]);

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
  };

  const hasActiveFilters = search || selectedRoles.length > 0 || selectedDamageTypes.length > 0;

  const getRoleGradient = (role) => {
    const primaryRole = role?.split('/')[0]?.trim() || 'Tank';
    return ROLE_COLORS[primaryRole] || ROLE_COLORS.Tank;
  };

  const getDamageColor = (type) => {
    if (!type) return 'text-slate-400';
    if (type.toLowerCase().includes('magic')) return 'text-purple-400';
    return 'text-orange-400';
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-slate-950">
        {/* Hero Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-slate-400 text-sm">
                    {allHeroes.length} Heroes Available
                  </span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-white">Heroes Database</h1>
                <p className="text-slate-400 mt-2">Browse and filter all Mobile Legends heroes</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push('/draft-pick')}
                  className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all"
                >
                  Draft Pick
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="px-5 py-2.5 bg-slate-800 text-white font-semibold rounded-xl border border-slate-700 hover:bg-slate-700 transition-all"
                >
                  Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filters Bar */}
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800 p-6 mb-8">
            <div className="flex flex-col xl:flex-row gap-6">
              {/* Search */}
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-slate-500"
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
                  className="block w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-slate-500"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300"
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

              {/* View Mode Toggle */}
              <div className="flex bg-slate-800 rounded-xl p-1 border border-slate-700">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    viewMode === 'grid'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                    />
                  </svg>
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    viewMode === 'list'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                  List
                </button>
              </div>
            </div>

            {/* Filter Tags */}
            <div className="mt-6 pt-6 border-t border-slate-800">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Role Filters */}
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    Filter by Role
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {ROLES.map((role) => (
                      <button
                        key={role.name}
                        onClick={() => toggleRole(role.name)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all flex items-center gap-2 ${
                          selectedRoles.includes(role.name)
                            ? `bg-${role.color}-500/20 border-${role.color}-500 text-${role.color}-400`
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <span>{role.icon}</span>
                        <span>{role.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Damage Type Filters */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    Damage Type
                  </p>
                  <div className="flex gap-2">
                    {DAMAGE_TYPES.map((type) => (
                      <button
                        key={type.name}
                        onClick={() => toggleDamageType(type.name)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all flex items-center gap-2 ${
                          selectedDamageTypes.includes(type.name)
                            ? `bg-${type.color}-500/20 border-${type.color}-500 text-${type.color}-400`
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <span>{type.icon}</span>
                        <span>{type.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <div className="mt-4 pt-4 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="text-sm text-red-400 hover:text-red-300 font-medium flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-red-500/10 transition-all"
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
                </div>
              )}
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-6 flex items-center justify-between">
            <p className="text-slate-400">
              Showing <span className="text-white font-semibold">{filteredHeroes.length}</span> of{' '}
              <span className="text-white font-semibold">{allHeroes.length}</span> heroes
            </p>
          </div>

          {/* Heroes Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="bg-slate-900 rounded-2xl p-4 border border-slate-800 animate-pulse"
                >
                  <div className="h-32 bg-slate-800 rounded-xl mb-4" />
                  <div className="h-4 bg-slate-800 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : filteredHeroes.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-slate-600"
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
              <p className="text-slate-400 text-lg">No heroes found</p>
              <p className="text-slate-500 text-sm mt-2">Try adjusting your filters</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredHeroes.map((hero, idx) => {
                const heroName = hero.hero_name || hero.name;
                const primaryRole = hero.role?.split('/')[0]?.trim() || 'Unknown';

                return (
                  <div
                    key={idx}
                    onClick={() => router.push(`/hero/${encodeURIComponent(heroName)}`)}
                    className="group bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 hover:border-slate-600 cursor-pointer transition-all hover:-translate-y-1"
                  >
                    <div
                      className={`h-28 bg-gradient-to-br ${getRoleGradient(hero.role)} relative overflow-hidden`}
                    >
                      <div className="absolute inset-0 bg-black/20" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-4xl font-black text-white/90 drop-shadow-lg">
                          {heroName?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="absolute top-2 right-2">
                        <span className="px-2 py-1 bg-black/30 backdrop-blur-sm rounded text-[10px] font-bold text-white">
                          {primaryRole}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                        {heroName}
                      </h3>
                      <p className={`text-xs mt-1 ${getDamageColor(hero.damage_type)}`}>
                        {hero.damage_type || 'Physical'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="divide-y divide-slate-800">
                {filteredHeroes.map((hero, idx) => {
                  const heroName = hero.hero_name || hero.name;
                  const primaryRole = hero.role?.split('/')[0]?.trim() || 'Unknown';

                  return (
                    <div
                      key={idx}
                      onClick={() => router.push(`/hero/${encodeURIComponent(heroName)}`)}
                      className="flex items-center gap-4 p-4 hover:bg-slate-800/50 cursor-pointer transition-colors group"
                    >
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getRoleGradient(hero.role)} flex items-center justify-center text-white font-bold`}
                      >
                        {heroName?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                          {heroName}
                        </h3>
                        <p className="text-sm text-slate-400">{hero.role}</p>
                      </div>
                      <span className={`text-sm ${getDamageColor(hero.damage_type)}`}>
                        {hero.damage_type || 'Physical'}
                      </span>
                      <svg
                        className="w-5 h-5 text-slate-600 group-hover:text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
