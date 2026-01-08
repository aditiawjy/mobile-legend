import { useRouter } from 'next/router'

export default function StatsOverview({ stats = {} }) {
  const router = useRouter()
  const defaultStats = {
    totalHeroes: 0,
    totalItems: 0,
    totalMatches: 0,
    totalTeams: 0,
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
      gradient: 'from-blue-500 to-blue-600',
      shadow: 'shadow-blue-100',
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
      gradient: 'from-purple-500 to-purple-600',
      shadow: 'shadow-purple-100',
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
      gradient: 'from-emerald-500 to-emerald-600',
      shadow: 'shadow-emerald-100',
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
      gradient: 'from-orange-500 to-orange-600',
      shadow: 'shadow-orange-100',
      onClick: () => router.push('/edit-teams'),
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-8">
      {statCards.map((stat) => (
        <div
          key={stat.name}
          className={`relative bg-white rounded-xl p-5 cursor-pointer group transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border border-gray-100 ${stat.shadow}`}
          onClick={stat.onClick}
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} text-white shadow-md transform group-hover:scale-110 transition-transform duration-300`}>
              {stat.icon}
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">{stat.name}</p>
            <p className="text-2xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
