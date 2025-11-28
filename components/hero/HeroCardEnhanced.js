import { useRouter } from 'next/router'

const ROLE_COLORS = {
  Tank: 'bg-blue-500',
  Fighter: 'bg-orange-500',
  Assassin: 'bg-red-500',
  Mage: 'bg-purple-500',
  Marksman: 'bg-yellow-500',
  Support: 'bg-green-500',
}

const ROLE_BG_COLORS = {
  Tank: 'bg-blue-100 text-blue-800',
  Fighter: 'bg-orange-100 text-orange-800',
  Assassin: 'bg-red-100 text-red-800',
  Mage: 'bg-purple-100 text-purple-800',
  Marksman: 'bg-yellow-100 text-yellow-800',
  Support: 'bg-green-100 text-green-800',
}

const DAMAGE_TYPE_COLORS = {
  Physical: 'bg-orange-50 text-orange-700 border-orange-200',
  Magic: 'bg-purple-50 text-purple-700 border-purple-200',
}

export default function HeroCardEnhanced({ hero }) {
  const router = useRouter()
  const heroName = hero.hero_name || hero.name
  const primaryRole = hero.role?.split('/')[0]?.trim() || 'Unknown'
  const secondaryRole = hero.role?.includes('/') ? hero.role.split('/')[1]?.trim() : null
  const damageType = hero.damage_type || ''

  const handleClick = () => {
    router.push(`/hero/${encodeURIComponent(heroName)}`)
  }

  const getRoleColor = (role) => {
    const normalizedRole = Object.keys(ROLE_COLORS).find(
      (r) => r.toLowerCase() === role?.toLowerCase()
    )
    return ROLE_COLORS[normalizedRole] || 'bg-gray-500'
  }

  const getRoleBgColor = (role) => {
    const normalizedRole = Object.keys(ROLE_BG_COLORS).find(
      (r) => r.toLowerCase() === role?.toLowerCase()
    )
    return ROLE_BG_COLORS[normalizedRole] || 'bg-gray-100 text-gray-800'
  }

  const getDamageTypeColor = (type) => {
    if (type?.toLowerCase().includes('physical')) {
      return DAMAGE_TYPE_COLORS.Physical
    }
    if (type?.toLowerCase().includes('magic')) {
      return DAMAGE_TYPE_COLORS.Magic
    }
    return 'bg-gray-50 text-gray-700 border-gray-200'
  }

  return (
    <div
      onClick={handleClick}
      className="group bg-white rounded-xl border border-gray-200 hover:border-sky-300 hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden"
    >
      {/* Hero Avatar Section */}
      <div className={`relative h-24 ${getRoleColor(primaryRole)} flex items-center justify-center`}>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
        <span className="text-white font-bold text-4xl drop-shadow-lg z-10">
          {heroName?.charAt(0).toUpperCase()}
        </span>
        
        {/* Damage Type Badge */}
        {damageType && (
          <span className={`absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getDamageTypeColor(damageType)}`}>
            {damageType.includes('/') ? damageType.split('/')[0].trim() : damageType}
          </span>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4">
        {/* Hero Name */}
        <h3 className="font-semibold text-gray-900 text-sm mb-2 truncate group-hover:text-sky-600 transition-colors">
          {heroName}
        </h3>

        {/* Role Badges */}
        <div className="flex flex-wrap gap-1 mb-3">
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getRoleBgColor(primaryRole)}`}>
            {primaryRole}
          </span>
          {secondaryRole && (
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getRoleBgColor(secondaryRole)}`}>
              {secondaryRole}
            </span>
          )}
        </div>

        {/* Lanes (if available) */}
        {hero.lanes && hero.lanes.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {hero.lanes.slice(0, 2).map((lane, idx) => (
              <span
                key={idx}
                className="text-[10px] text-gray-600 bg-gray-100 px-2 py-0.5 rounded"
              >
                {lane.lane_name || lane}
              </span>
            ))}
            {hero.lanes.length > 2 && (
              <span className="text-[10px] text-gray-400">+{hero.lanes.length - 2}</span>
            )}
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2 border-t border-gray-100">
          <button
            onClick={handleClick}
            className="w-full text-xs px-3 py-1.5 bg-sky-50 text-sky-700 rounded-lg hover:bg-sky-100 transition-colors font-medium"
          >
            Lihat Detail
          </button>
        </div>
      </div>
    </div>
  )
}

export function HeroCardEnhancedSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
      <div className="h-24 bg-gray-200" />
      <div className="p-4">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
        <div className="flex gap-1 mb-3">
          <div className="h-5 bg-gray-200 rounded-full w-14" />
          <div className="h-5 bg-gray-200 rounded-full w-12" />
        </div>
        <div className="pt-2 border-t border-gray-100">
          <div className="h-8 bg-gray-200 rounded-lg w-full" />
        </div>
      </div>
    </div>
  )
}
