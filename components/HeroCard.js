import { useState } from 'react'
import { colors, shadows, borderRadius, spacing, typography } from '../lib/design-system'

export default function HeroCard({ hero, heroAttrs, heroAdjs, onEdit }) {
  const [activeSkillTab, setActiveSkillTab] = useState(0)
  
  const formatDate = (dateString) => {
    if (!dateString) return '-'
    // If it's already in YYYY-MM-DD format, parse it carefully
    if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
      const parts = dateString.slice(0, 10).split('-')
      const year = parseInt(parts[0], 10)
      const month = parseInt(parts[1], 10)
      const day = parseInt(parts[2], 10)
      return `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`
    }
    // Otherwise parse as ISO/other format using local timezone
    const date = new Date(dateString)
    if (isNaN(date)) return '-'
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}-${month}-${year}`
  }
  
  if (!hero) return null

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-100 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{hero.hero_name}</h3>
            <div className="flex items-center gap-2 mb-3">
              {hero.role && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {hero.role}
                </span>
              )}
              {hero.damage_type && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {hero.damage_type}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onEdit && onEdit('skills')}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors duration-150"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
            <button
              onClick={() => window.location.href = `/edit-hero-adjustments?name=${encodeURIComponent(hero.hero_name)}`}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors duration-150"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Adjustments
            </button>
          </div>
        </div>

        {/* Attributes Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">HP</p>
            <p className="text-lg font-semibold text-gray-900">{heroAttrs?.hp || '-'}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Attack</p>
            <p className="text-lg font-semibold text-gray-900">{heroAttrs?.physical_attack || '-'}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Defense</p>
            <p className="text-lg font-semibold text-gray-900">{heroAttrs?.physical_defense || '-'}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Speed</p>
            <p className="text-lg font-semibold text-gray-900">{heroAttrs?.movement_speed || '-'}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Range</p>
            <p className="text-lg font-semibold text-gray-900">{heroAttrs?.basic_attack_range || '-'}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Mana</p>
            <p className="text-lg font-semibold text-gray-900">{heroAttrs?.mana || '-'}</p>
          </div>
        </div>

        {/* Skills with Tabs */}
        <div className="border-t border-gray-100 pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Skills</h4>
          
          {/* Tab Navigation */}
          <div className="flex gap-1 mb-4 border-b border-gray-200">
            {[
              { name: hero.skill1_name, desc: hero.skill1_desc, title: 'Basic Attack', id: 0 },
              { name: hero.skill2_name, desc: hero.skill2_desc, title: 'Skill 1', id: 1 },
              { name: hero.skill3_name, desc: hero.skill3_desc, title: 'Skill 2', id: 2 },
              { name: hero.ultimate_name, desc: hero.ultimate_desc, title: 'Ultimate', id: 3 },
            ].filter(skill => skill.name || skill.desc).map((skill) => (
              <button
                key={skill.id}
                onClick={() => setActiveSkillTab(skill.id)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeSkillTab === skill.id
                    ? 'border-sky-600 text-sky-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {skill.name || skill.title}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-gray-50 rounded-lg p-4">
            {[
              { name: hero.skill1_name, desc: hero.skill1_desc, title: 'Basic Attack', id: 0 },
              { name: hero.skill2_name, desc: hero.skill2_desc, title: 'Skill 1', id: 1 },
              { name: hero.skill3_name, desc: hero.skill3_desc, title: 'Skill 2', id: 2 },
              { name: hero.ultimate_name, desc: hero.ultimate_desc, title: 'Ultimate', id: 3 },
            ].filter(skill => skill.name || skill.desc).find(skill => skill.id === activeSkillTab) && (
              (() => {
                const skill = [
                  { name: hero.skill1_name, desc: hero.skill1_desc, title: 'Basic Attack', id: 0 },
                  { name: hero.skill2_name, desc: hero.skill2_desc, title: 'Skill 1', id: 1 },
                  { name: hero.skill3_name, desc: hero.skill3_desc, title: 'Skill 2', id: 2 },
                  { name: hero.ultimate_name, desc: hero.ultimate_desc, title: 'Ultimate', id: 3 },
                ].filter(s => s.name || s.desc).find(s => s.id === activeSkillTab)
                
                return (
                  <div>
                    <h5 className="text-base font-semibold text-gray-900 mb-2">{skill.name || skill.title}</h5>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {skill.desc || 'No description available'}
                    </p>
                  </div>
                )
              })()
            )}
          </div>
        </div>

        {/* Adjustments History */}
        {heroAdjs && heroAdjs.length > 0 && (
          <div className="border-t border-gray-100 pt-4 mt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-900">Hero Adjustments</h4>
              <button
                onClick={() => window.location.href = `/edit-hero-adjustments?name=${encodeURIComponent(hero.hero_name)}`}
                className="text-xs text-purple-600 hover:text-purple-800 underline"
              >
                Manage
              </button>
            </div>
            <div className="space-y-2">
              {heroAdjs.map((adj) => (
                <div key={adj.id} className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-purple-700">
                        {formatDate(adj.adj_date)} • {adj.season || 'N/A'}
                      </p>
                      <p className="text-sm text-purple-900 mt-1 whitespace-pre-wrap">{adj.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Note */}
        {hero.additional_note && (
          <div className="border-t border-gray-100 pt-4 mt-4">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h5 className="text-sm font-medium text-blue-900 mb-1">Additional Note</h5>
                  <p className="text-sm text-blue-800 whitespace-pre-wrap">{hero.additional_note}</p>
                </div>
                <button
                  onClick={() => window.location.href = `/obsidia-note`}
                  className="ml-2 text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-100 pt-4 mt-4">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{hero.note || 'No additional notes'}</span>
            <span>{hero.attack_reliance || 'Standard reliance'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Loading skeleton component
export function HeroCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden animate-pulse">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="flex gap-2 mb-3">
              <div className="h-5 bg-gray-200 rounded-full w-16"></div>
              <div className="h-5 bg-gray-200 rounded-full w-20"></div>
            </div>
          </div>
          <div className="h-8 bg-gray-200 rounded-lg w-16"></div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-3">
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-5 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-100 pt-4">
          <div className="h-4 bg-gray-200 rounded w-16 mb-3"></div>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-3">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
