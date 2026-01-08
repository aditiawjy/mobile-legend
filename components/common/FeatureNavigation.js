import { useRouter } from 'next/router'

export default function FeatureNavigation() {
  const router = useRouter()

  const features = [
    {
      name: 'Compare Items',
      description: 'Analyze item stats for the best builds',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      borderColor: 'border-purple-100',
      onClick: () => router.push('/compare-items'),
    },
    {
      name: 'Add Hero',
      description: 'Add new hero to database',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      borderColor: 'border-blue-100',
      onClick: () => router.push('/add-hero'),
    },
    {
      name: 'Skills Editor',
      description: 'Manage skill detail & scaling',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      color: 'text-teal-600',
      bg: 'bg-teal-50',
      borderColor: 'border-teal-100',
      onClick: () => router.push('/edit-skills'),
    },
    {
      name: 'Items Manager',
      description: 'Update item attributes & costs',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      color: 'text-green-600',
      bg: 'bg-green-50',
      borderColor: 'border-green-100',
      onClick: () => router.push('/edit-items'),
    },
    {
      name: 'Match Reports',
      description: 'Performance analysis',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      borderColor: 'border-orange-100',
      onClick: () => router.push('/matches'),
    },
  ]

  return (
    <div className="space-y-8 mb-8">
      {/* Draft Pick Promo */}
      <div 
        onClick={() => router.push('/draft-pick')}
        className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl shadow-lg cursor-pointer group transition-all duration-300 hover:shadow-xl hover:scale-[1.01]"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:scale-110 transition-transform duration-500"></div>
        <div className="relative px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6 text-center sm:text-left">
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm border border-white/20 shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">Start Draft Pick</h2>
              <p className="text-blue-100 text-sm font-light">Real-time counter recommendations & analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-6 py-3 bg-white text-blue-700 font-bold rounded-2xl shadow-md group-hover:bg-blue-50 transition-colors">
            Try Now
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </div>
        </div>
      </div>

      {/* Grid Features */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {features.map((f) => (
          <div
            key={f.name}
            onClick={f.onClick}
            className={`group p-6 bg-white border ${f.borderColor} rounded-3xl shadow-sm hover:shadow-md cursor-pointer transition-all hover:-translate-y-1`}
          >
            <div className={`w-12 h-12 rounded-2xl ${f.bg} ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              {f.icon}
            </div>
            <h3 className="font-bold text-gray-900 mb-1">{f.name}</h3>
            <p className="text-xs text-gray-500 leading-tight">{f.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
