import React from 'react'
import { useRouter } from 'next/router'

export default function RoleDistribution({ roleDistribution = [], totalHeroes = 0, layout = 'grid' }) {
  const router = useRouter()
  
  const getRoleIcon = (role) => {
    switch(role) {
      case 'Tank': return "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z";
      case 'Fighter': return "M13 10V3L4 14h7v7l9-11h-7z";
      case 'Assassin': return "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z";
      case 'Mage': return "M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z";
      case 'Marksman': return "M3 21v-8a2 2 0 012-2h14a2 2 0 012 2v8M12 3v10m0 0l-3-3m3 3l3-3";
      case 'Support': return "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z";
      default: return "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z";
    }
  }

  const roleColors = {
    Tank: { text: 'text-blue-600', light: 'bg-blue-50', border: 'border-blue-100', bar: 'bg-blue-500' },
    Fighter: { text: 'text-red-600', light: 'bg-red-50', border: 'border-red-100', bar: 'bg-red-500' },
    Assassin: { text: 'text-purple-600', light: 'bg-purple-50', border: 'border-purple-100', bar: 'bg-purple-500' },
    Mage: { text: 'text-indigo-600', light: 'bg-indigo-50', border: 'border-indigo-100', bar: 'bg-indigo-500' },
    Marksman: { text: 'text-amber-600', light: 'bg-amber-50', border: 'border-amber-100', bar: 'bg-amber-500' },
    Support: { text: 'text-green-600', light: 'bg-green-50', border: 'border-green-100', bar: 'bg-green-500' },
  }

  if (!roleDistribution || roleDistribution.length === 0) return null

  if (layout === 'vertical') {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Role Distribution</h3>
        <div className="space-y-3">
          {roleDistribution.map((role) => {
            const colors = roleColors[role.role] || { text: 'text-gray-600', light: 'bg-gray-50', border: 'border-gray-100', bar: 'bg-gray-400' }
            const percentage = totalHeroes > 0 ? Math.round((role.count / totalHeroes) * 100) : 0
            
            return (
              <div 
                key={role.role}
                onClick={() => router.push(`/?showAll=true&role=${role.role}`)}
                className="group cursor-pointer"
              >
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`p-1 rounded ${colors.light} ${colors.text}`}>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getRoleIcon(role.role)} />
                      </svg>
                    </div>
                    <span className="font-semibold text-gray-700 group-hover:text-gray-900">{role.role}</span>
                  </div>
                  <span className="text-gray-500 font-medium">{role.count} <span className="text-[10px] text-gray-400">({percentage}%)</span></span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`${colors.bar} h-full rounded-full transition-all duration-1000 ease-out`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6 px-1">
        <div>
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            Hero Distribution
            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-medium">{totalHeroes} Heroes</span>
          </h3>
          <p className="text-sm text-gray-500 mt-1">Komposisi hero berdasarkan role</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {roleDistribution.map((role) => {
          const colors = roleColors[role.role] || { text: 'text-gray-700', light: 'bg-gray-50', border: 'border-gray-200', bar: 'bg-gray-500' }
          const percentage = totalHeroes > 0 ? Math.round((role.count / totalHeroes) * 100) : 0
            
          return (
            <div 
              key={role.role} 
              className={`relative bg-white rounded-2xl p-4 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border ${colors.border} group overflow-hidden`}
              onClick={() => router.push(`/?showAll=true&role=${role.role}`)}
            >
              <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${colors.light} opacity-50 group-hover:scale-125 transition-transform duration-500`}></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${colors.light} ${colors.text}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getRoleIcon(role.role)} />
                    </svg>
                  </div>
                  <span className="font-bold text-gray-700 group-hover:text-gray-900 transition-colors">{role.role}</span>
                </div>
                <div className="flex items-end justify-between mb-2">
                  <span className="text-3xl font-black text-gray-900">{role.count}</span>
                  <span className="text-xs font-medium text-gray-400 mb-1">{percentage}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`${colors.bar} h-full rounded-full transition-all duration-1000 ease-out`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
