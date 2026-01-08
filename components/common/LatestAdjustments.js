import React from 'react'
import { useRouter } from 'next/router'

export default function LatestAdjustments({ adjustments = [], loading = false, compact = false }) {
  const router = useRouter()

  if (loading) {
    return (
      <div className={`bg-white ${compact ? '' : 'rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-12'}`}>
        {!compact && (
          <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 px-6 py-4">
             <div className="h-8 w-48 bg-white/20 rounded animate-pulse"></div>
          </div>
        )}
        <div className="p-6 flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange-200 border-t-orange-500"></div>
        </div>
      </div>
    )
  }

  const items = compact ? adjustments.slice(0, 5) : adjustments.slice(0, 10)

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 font-medium">No recent adjustments found</p>
      </div>
    )
  }

  return (
    <div className={`${compact ? '' : 'bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-12'}`}>
      {!compact && (
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
          </div>
        </div>
      )}

      <div className={compact ? "divide-y divide-gray-50" : "p-6 grid grid-cols-1 md:grid-cols-2 gap-4"}>
        {items.map((adj, idx) => {
          const desc = (adj.description || '').toLowerCase()
          const isBuff = ['buff', 'increased', 'improved', 'enhanced', 'added', 'bonus', 'faster', 'stronger', 'higher', 'more damage', 'reduced cooldown'].some(k => desc.includes(k))
          const isNerf = ['nerf', 'decreased', 'reduced', 'lowered', 'removed', 'slower', 'weaker', 'less damage', 'increased cooldown'].some(k => desc.includes(k))
          const type = isBuff && isNerf ? 'mixed' : isBuff ? 'buff' : isNerf ? 'nerf' : 'adjust'
          
          const colors = {
            buff: 'text-green-600 bg-green-50 border-green-100',
            nerf: 'text-red-600 bg-red-50 border-red-100',
            mixed: 'text-amber-600 bg-amber-50 border-amber-100',
            adjust: 'text-blue-600 bg-blue-50 border-blue-100'
          }

          if (compact) {
            return (
              <div 
                key={idx} 
                onClick={() => router.push(`/hero/${encodeURIComponent(adj.hero_name)}`)}
                className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer transition-colors group"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm bg-gradient-to-br ${isBuff ? 'from-green-500 to-emerald-600' : isNerf ? 'from-red-500 to-rose-600' : 'from-blue-500 to-indigo-600'}`}>
                  {adj.hero_name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-gray-900 truncate">{adj.hero_name}</h4>
                    <span className="text-[10px] text-gray-400 font-medium">{adj.season || 'S30'}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{adj.description}</p>
                </div>
                <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${colors[type]}`}>
                  {type.toUpperCase()}
                </div>
              </div>
            )
          }

          return (
            <a 
              key={idx} 
              href={`/hero/${encodeURIComponent(adj.hero_name)}`}
              className={`group flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all bg-white`}
            >
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex-shrink-0 flex items-center justify-center font-bold text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                {adj.hero_name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-gray-900 truncate">{adj.hero_name}</h4>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${colors[type]}`}>{type.toUpperCase()}</span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{adj.description}</p>
              </div>
            </a>
          )
        })}
      </div>
    </div>
  )
}
