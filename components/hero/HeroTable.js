import { useRouter } from 'next/router';
import { useState } from 'react';

const ROLE_COLORS = {
  Tank: 'bg-blue-100 text-blue-700 border-blue-200',
  Fighter: 'bg-orange-100 text-orange-700 border-orange-200',
  Assassin: 'bg-red-100 text-red-700 border-red-200',
  Mage: 'bg-purple-100 text-purple-700 border-purple-200',
  Marksman: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Support: 'bg-green-100 text-green-700 border-green-200',
};

const DAMAGE_COLORS = {
  Physical: 'text-orange-600',
  Magic: 'text-purple-600',
  Mixed: 'text-gray-600',
};

export default function HeroTable({ heroes, loading }) {
  const router = useRouter();
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedHeroes = [...heroes].sort((a, b) => {
    let aVal, bVal;

    switch (sortField) {
      case 'name':
        aVal = (a.hero_name || a.name || '').toLowerCase();
        bVal = (b.hero_name || b.name || '').toLowerCase();
        break;
      case 'role':
        aVal = (a.role || '').toLowerCase();
        bVal = (b.role || '').toLowerCase();
        break;
      case 'damage':
        aVal = (a.damage_type || '').toLowerCase();
        bVal = (b.damage_type || '').toLowerCase();
        break;
      default:
        return 0;
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const getRoleBadgeClass = (role) => {
    const primaryRole = role?.split('/')[0]?.trim() || 'Tank';
    return ROLE_COLORS[primaryRole] || ROLE_COLORS.Tank;
  };

  const getDamageType = (type) => {
    if (!type) return 'Physical';
    const lower = type.toLowerCase();
    if (lower.includes('physical') && lower.includes('magic')) return 'Mixed';
    if (lower.includes('magic')) return 'Magic';
    return 'Physical';
  };

  const getDamageColor = (type) => {
    const damageType = getDamageType(type);
    return DAMAGE_COLORS[damageType] || DAMAGE_COLORS.Physical;
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) {
      return (
        <svg
          className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-50"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
      );
    }
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="animate-pulse">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border-b border-gray-100">
              <div className="w-10 h-10 bg-gray-200 rounded-lg" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (heroes.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-gray-400"
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
        <p className="text-gray-600 font-medium">No heroes found</p>
        <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th
                className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-2">
                  Hero
                  <SortIcon field="name" />
                </div>
              </th>
              <th
                className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('role')}
              >
                <div className="flex items-center gap-2">
                  Role
                  <SortIcon field="role" />
                </div>
              </th>
              <th
                className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('damage')}
              >
                <div className="flex items-center gap-2">
                  Damage Type
                  <SortIcon field="damage" />
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Attack Reliance
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedHeroes.map((hero, index) => {
              const heroName = hero.hero_name || hero.name;
              const primaryRole = hero.role?.split('/')[0]?.trim() || 'Unknown';
              const secondaryRole = hero.role?.includes('/')
                ? hero.role.split('/')[1]?.trim()
                : null;
              const damageType = getDamageType(hero.damage_type);

              return (
                <tr
                  key={index}
                  onClick={() => router.push(`/hero/${encodeURIComponent(heroName)}`)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getRoleBadgeClass(hero.role).replace('bg-', 'from-').replace('100', '500').replace('text-', 'to-').replace('700', '600')} flex items-center justify-center text-white font-bold`}
                      >
                        {heroName?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {heroName}
                        </div>
                        {secondaryRole && (
                          <div className="text-xs text-gray-500">{secondaryRole}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeClass(hero.role)}`}
                    >
                      {primaryRole}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-medium ${getDamageColor(hero.damage_type)}`}>
                      {damageType}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{hero.attack_reliance || '-'}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors">
                      View
                      <svg
                        className="w-3 h-3"
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
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
