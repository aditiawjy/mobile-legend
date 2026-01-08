import React from 'react'

export default function LatestAdjustments({ adjustments = [], loading = false }) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-12">
        <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 px-6 py-4">
           <div className="h-8 w-48 bg-white/20 rounded animate-pulse"></div>
        </div>
        <div className="p-6 flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange-200 border-t-orange-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-12">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Latest Hero Adjustments</h2>
              <p className="text-orange-100 text-sm">Balance changes & patch notes</p>
            </div>
          </div>
          <a href="/edit-hero-adjustments" className="text-sm px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors backdrop-blur-sm">
            View All
          </a>
        </div>
      </div>

      <div className="p-6">
        {adjustments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {adjustments.slice(0, 6).map((adj, idx) => {
              const desc = (adj.description || '').toLowerCase()
              const buffKeywords = ['buff', 'increased', 'improved', 'enhanced', 'added', 'bonus', 'faster', 'stronger', 'higher', 'more damage', 'reduced cooldown', 'lower mana']
              const nerfKeywords = ['nerf', 'decreased', 'reduced', 'lowered', 'removed', 'slower', 'weaker', 'less damage', 'increased cooldown', 'higher mana cost']
              const isBuff = buffKeywords.some(k => desc.includes(k))
              const isNerf = nerfKeywords.some(k => desc.includes(k))
              const adjustmentType = isBuff && isNerf ? 'mixed' : isBuff ? 'buff' : isNerf ? 'nerf' : 'adjust'
              
              const typeStyles = {
                buff: { 
                  gradient: 'from-green-500 to-emerald-600', 
                  bg: 'bg-green-50', 
                  border: 'border-green-200 hover:border-green-300',
                  text: 'text-green-700',
                  icon: '▲',
                  label: 'BUFF'
                },
                nerf: { 
                  gradient: 'from-red-500 to-rose-600', 
                  bg: 'bg-red-50', 
                  border: 'border-red-200 hover:border-red-300',
                  text: 'text-red-700',
                  icon: '▼',
                  label: 'NERF'
                },
                mixed: { 
                  gradient: 'from-yellow-500 to-amber-600', 
                  bg: 'bg-yellow-50', 
                  border: 'border-yellow-200 hover:border-yellow-300',
                  text: 'text-yellow-700',
                  icon: '◆',
                  label: 'ADJUST'
                },
                adjust: { 
                  gradient: 'from-blue-500 to-indigo-600', 
                  bg: 'bg-blue-50', 
                  border: 'border-blue-200 hover:border-blue-300',
                  text: 'text-blue-700',
                  icon: '●',
                  label: 'UPDATE'
                },
              }
              const style = typeStyles[adjustmentType]
              
              return (
                <a 
                  key={idx} 
                  href={`/hero/${encodeURIComponent(adj.hero_name)}`}
                  className={`group relative ${style.bg} rounded-xl border-2 ${style.border} p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}
                >
                  {/* Adjustment Type Indicator */}
                  <div className={`absolute -top-2 -right-2 w-16 h-16 bg-gradient-to-br ${style.gradient} rounded-full opacity-10 group-hover:opacity-20 transition-opacity`}></div>
                  
                  <div className="relative flex gap-4">
                    {/* Hero Avatar */}
                    <div className={`flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br ${style.gradient} flex items-center justify-center shadow-lg`}>
                      <span className="text-white font-bold text-xl">
                        {adj.hero_name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900 group-hover:text-gray-700 transition-colors truncate">
                          {adj.hero_name}
                        </h3>
                        <span className={`flex-shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${style.gradient} text-white shadow-sm`}>
                          <span>{style.icon}</span>
                          {style.label}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                        {adj.description}
                      </p>
                      
                      <div className="flex items-center gap-3 text-xs">
                        <span className={`${style.text} font-medium`}>
                          {adj.season || 'Latest Patch'}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-500">
                          {adj.adjustment_date ? (() => {
                            try {
                              const date = new Date(adj.adjustment_date)
                              return !isNaN(date) ? date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }) : adj.adjustment_date
                            } catch (e) {
                              return adj.adjustment_date
                            }
                          })() : 'Recent'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Arrow indicator */}
                    <div className="flex-shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className={`w-5 h-5 ${style.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </a>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">Tidak ada adjustments terbaru</p>
            <p className="text-gray-400 text-sm mt-1">Check back later for balance updates</p>
          </div>
        )}
      </div>
    </div>
  )
}
