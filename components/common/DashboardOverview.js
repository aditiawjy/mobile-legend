import { useRouter } from 'next/router'

export default function DashboardOverview({ stats = {}, roleDistribution = [] }) {
  const router = useRouter()
  const defaultStats = {
    totalHeroes: 0,
    totalItems: 0,
    totalMatches: 0,
    totalTeams: 0,
    recentHeroes: 0,
    ...stats
  }

  const statCards = [
    {
      name: 'Total Heroes',
      value: defaultStats.totalHeroes,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: 'bg-blue-500',
      href: '/?showAll=true',
      onClick: () => router.push('/?showAll=true'),
    },
    {
      name: 'Total Items',
      value: defaultStats.totalItems,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      color: 'bg-purple-500',
      href: '/items?showAll=true',
      onClick: () => router.push('/items?showAll=true'),
    },
    {
      name: 'Matches',
      value: defaultStats.totalMatches,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: 'bg-green-500',
      href: '/matches',
      onClick: () => router.push('/matches'),
    },
    {
      name: 'Teams',
      value: defaultStats.totalTeams,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: 'bg-orange-500',
      href: '/edit-teams',
      onClick: () => router.push('/edit-teams'),
    },
  ]

  const quickActions = [
    {
      name: 'Compare Items',
      description: 'Bandingkan 2-3 items sekaligus',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
      onClick: () => router.push('/compare-items'),
    },
    {
      name: 'Add New Hero',
      description: 'Tambah hero baru ke database',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
      onClick: () => router.push('/add-hero'),
    },
    {
      name: 'Edit Skills',
      description: 'Update skill descriptions',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      color: 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100',
      onClick: () => router.push('/edit-skills'),
    },
    {
      name: 'Manage Items',
      description: 'Update item database',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      color: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
      onClick: () => router.push('/edit-items'),
    },
    {
      name: 'View Reports',
      description: 'Lihat laporan dan analitik',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
      onClick: () => router.push('/matches'),
    },
  ]

  // Role colors for distribution chart
  const roleColors = {
    Tank: { bg: 'bg-blue-500', text: 'text-blue-700', light: 'bg-blue-100' },
    Fighter: { bg: 'bg-red-500', text: 'text-red-700', light: 'bg-red-100' },
    Assassin: { bg: 'bg-purple-500', text: 'text-purple-700', light: 'bg-purple-100' },
    Mage: { bg: 'bg-indigo-500', text: 'text-indigo-700', light: 'bg-indigo-100' },
    Marksman: { bg: 'bg-yellow-500', text: 'text-yellow-700', light: 'bg-yellow-100' },
    Support: { bg: 'bg-green-500', text: 'text-green-700', light: 'bg-green-100' },
  }

  return (
    <div className="space-y-6">
      {/* Draft Pick Quick Start - Prominent CTA */}
      <div 
        onClick={() => router.push('/draft-pick')}
        className="relative overflow-hidden bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 rounded-2xl shadow-lg cursor-pointer group hover:shadow-xl transition-all duration-300"
      >
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMiIvPjwvZz48L3N2Zz4=')] opacity-30"></div>
        <div className="relative px-6 py-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Start Draft Pick</h2>
              <p className="text-blue-100 mt-1">Simulasi draft pick dengan rekomendasi hero & counter</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full bg-white/20 text-white text-sm font-medium backdrop-blur-sm">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
              Ready
            </span>
            <div className="p-2 bg-white/20 rounded-full group-hover:bg-white/30 transition-colors">
              <svg className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards - 4 columns */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div
            key={stat.name}
            className="relative bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow duration-200 cursor-pointer group"
            onClick={stat.onClick}
          >
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <div className="text-white">
                  {stat.icon}
                </div>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-500 truncate">{stat.name}</p>
                <p className="text-xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Role Distribution Widget */}
      {roleDistribution && roleDistribution.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
            Hero Role Distribution
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {roleDistribution.map((role) => {
              const colors = roleColors[role.role] || { bg: 'bg-gray-500', text: 'text-gray-700', light: 'bg-gray-100' }
              const percentage = defaultStats.totalHeroes > 0 
                ? Math.round((role.count / defaultStats.totalHeroes) * 100) 
                : 0
              return (
                <div 
                  key={role.role} 
                  className={`${colors.light} rounded-lg p-3 cursor-pointer hover:shadow-md transition-all`}
                  onClick={() => router.push(`/?showAll=true&role=${role.role}`)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-semibold ${colors.text}`}>{role.role}</span>
                    <span className={`text-lg font-bold ${colors.text}`}>{role.count}</span>
                  </div>
                  <div className="w-full bg-white/50 rounded-full h-1.5">
                    <div 
                      className={`${colors.bg} h-1.5 rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">{percentage}% of total</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
          <p className="mt-1 text-sm text-gray-600">
            Akses cepat ke fitur-fitur utama
          </p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {quickActions.map((action) => (
              <button
                key={action.name}
                onClick={action.onClick}
                className={`relative block w-full p-4 text-left border rounded-lg transition-all duration-200 ${action.color} hover:shadow-md`}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    {action.icon}
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium">
                      {action.name}
                    </p>
                    <p className="mt-1 text-xs opacity-75">
                      {action.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
