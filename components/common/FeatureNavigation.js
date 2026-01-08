import { useRouter } from 'next/router'

export default function FeatureNavigation() {
  const router = useRouter()

  const features = [
    {
      name: 'Compare Items',
      description: 'Bandingkan stat items untuk build terbaik',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      hoverBg: 'group-hover:bg-purple-100',
      borderColor: 'border-purple-100',
      onClick: () => router.push('/compare-items'),
    },
    {
      name: 'Add New Hero',
      description: 'Input data hero baru ke database',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      hoverBg: 'group-hover:bg-blue-100',
      borderColor: 'border-blue-100',
      onClick: () => router.push('/add-hero'),
    },
    {
      name: 'Edit Skills',
      description: 'Update detail skill & scaling hero',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      color: 'text-teal-600',
      bg: 'bg-teal-50',
      hoverBg: 'group-hover:bg-teal-100',
      borderColor: 'border-teal-100',
      onClick: () => router.push('/edit-skills'),
    },
    {
      name: 'Manage Items',
      description: 'Update harga & atribut items',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      color: 'text-green-600',
      bg: 'bg-green-50',
      hoverBg: 'group-hover:bg-green-100',
      borderColor: 'border-green-100',
      onClick: () => router.push('/edit-items'),
    },
    {
      name: 'View Reports',
      description: 'Analisis match & performa tim',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      hoverBg: 'group-hover:bg-orange-100',
      borderColor: 'border-orange-100',
      onClick: () => router.push('/matches'),
    },
  ]

  return (
    <div className="space-y-8 mb-12">
      {/* Draft Pick Quick Start - Prominent CTA */}
      <div 
        onClick={() => router.push('/draft-pick')}
        className="relative overflow-hidden bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 rounded-3xl shadow-xl shadow-blue-200/50 cursor-pointer group transition-all duration-300 hover:shadow-2xl hover:shadow-blue-300/50 hover:scale-[1.01]"
      >
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute -right-10 -top-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -left-10 -bottom-10 w-64 h-64 bg-indigo-500/30 rounded-full blur-3xl"></div>
        
        <div className="relative px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md shadow-inner border border-white/10">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white tracking-tight">Start Draft Pick</h2>
              <p className="text-blue-100 mt-2 text-lg font-light">Simulasi draft pick dengan rekomendasi hero & counter real-time</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex flex-col items-end text-right mr-2">
              <span className="text-white/80 text-xs font-medium uppercase tracking-wider">Status</span>
              <span className="text-white font-semibold flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                System Ready
              </span>
            </div>
            <div className="p-3 bg-white rounded-full shadow-lg group-hover:bg-blue-50 transition-colors">
              <svg className="w-6 h-6 text-blue-600 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Main Features Grid */}
      <div>
        <div className="flex items-center justify-between mb-6 px-1">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Main Features</h2>
            <p className="text-sm text-gray-500 mt-1">Tools manajemen data Mobile Legends</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {features.map((feature) => (
            <button
              key={feature.name}
              onClick={feature.onClick}
              className={`group relative flex flex-col items-start p-6 bg-white border ${feature.borderColor} rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 overflow-hidden text-left`}
            >
              {/* Background decoration */}
              <div className={`absolute top-0 right-0 w-24 h-24 ${feature.bg} rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:scale-110 transition-transform duration-500`}></div>
              
              <div className={`relative p-3 rounded-xl ${feature.bg} ${feature.color} mb-4 ${feature.hoverBg} transition-colors duration-300`}>
                {feature.icon}
              </div>
              
              <h3 className="text-base font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                {feature.name}
              </h3>
              
              <p className="text-sm text-gray-500 leading-relaxed">
                {feature.description}
              </p>
              
              <div className="mt-auto pt-4 w-full flex justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <svg className={`w-5 h-5 ${feature.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
