import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import AppLayout from '../components/common/AppLayout';
import HeroTable from '../components/hero/HeroTable';

const ROLES = ['Tank', 'Fighter', 'Assassin', 'Mage', 'Marksman', 'Support'];
const DAMAGE_TYPES = ['Physical', 'Magic'];

export default function HeroesPage() {
  const router = useRouter();
  const [allHeroes, setAllHeroes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedDamageTypes, setSelectedDamageTypes] = useState([]);

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

  return (
    <AppLayout>
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Heroes Database</h1>
                <p className="text-sm text-slate-500 mt-1">
                  {filteredHeroes.length} of {allHeroes.length} heroes
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push('/draft-pick')}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Draft Pick
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="px-4 py-2 bg-white text-slate-700 text-sm font-medium rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors"
                >
                  Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Filters */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-slate-400"
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
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
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

              {/* Role Filters */}
              <div className="flex flex-wrap gap-2">
                {ROLES.map((role) => (
                  <button
                    key={role}
                    onClick={() => toggleRole(role)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                      selectedRoles.includes(role)
                        ? 'bg-slate-800 text-white border-slate-800'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>

              {/* Damage Type Filters */}
              <div className="flex gap-2">
                {DAMAGE_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => toggleDamageType(type)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                      selectedDamageTypes.includes(type)
                        ? type === 'Physical'
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'bg-purple-500 text-white border-purple-500'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-2 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <HeroTable heroes={filteredHeroes} loading={loading} />
        </div>
      </div>
    </AppLayout>
  );
}
