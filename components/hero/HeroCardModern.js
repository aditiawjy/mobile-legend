import { useRouter } from 'next/router';
import { useState } from 'react';

const ROLE_COLORS = {
  Tank: {
    bg: 'bg-gradient-to-br from-blue-500 to-blue-700',
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    accent: 'text-blue-600',
    glow: 'group-hover:shadow-blue-500/30',
  },
  Fighter: {
    bg: 'bg-gradient-to-br from-orange-500 to-red-600',
    badge: 'bg-orange-100 text-orange-800 border-orange-200',
    accent: 'text-orange-600',
    glow: 'group-hover:shadow-orange-500/30',
  },
  Assassin: {
    bg: 'bg-gradient-to-br from-red-500 to-pink-600',
    badge: 'bg-red-100 text-red-800 border-red-200',
    accent: 'text-red-600',
    glow: 'group-hover:shadow-red-500/30',
  },
  Mage: {
    bg: 'bg-gradient-to-br from-purple-500 to-indigo-600',
    badge: 'bg-purple-100 text-purple-800 border-purple-200',
    accent: 'text-purple-600',
    glow: 'group-hover:shadow-purple-500/30',
  },
  Marksman: {
    bg: 'bg-gradient-to-br from-yellow-400 to-orange-500',
    badge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    accent: 'text-yellow-600',
    glow: 'group-hover:shadow-yellow-500/30',
  },
  Support: {
    bg: 'bg-gradient-to-br from-green-500 to-teal-600',
    badge: 'bg-green-100 text-green-800 border-green-200',
    accent: 'text-green-600',
    glow: 'group-hover:shadow-green-500/30',
  },
};

const DAMAGE_TYPE_STYLES = {
  Physical: {
    bg: 'bg-orange-500/20 text-orange-700 border-orange-300/50',
    icon: '⚔️',
    label: 'Physical',
  },
  Magic: {
    bg: 'bg-purple-500/20 text-purple-700 border-purple-300/50',
    icon: '🔮',
    label: 'Magic',
  },
  Mixed: {
    bg: 'bg-gradient-to-r from-orange-500/20 to-purple-500/20 text-gray-700 border-gray-300/50',
    icon: '⚡',
    label: 'Mixed',
  },
};

export default function HeroCardModern({ hero }) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  const heroName = hero.hero_name || hero.name;
  const primaryRole = hero.role?.split('/')[0]?.trim() || 'Unknown';
  const secondaryRole = hero.role?.includes('/') ? hero.role.split('/')[1]?.trim() : null;
  const damageType = hero.damage_type || '';

  const handleClick = () => {
    router.push(`/hero/${encodeURIComponent(heroName)}`);
  };

  const getRoleStyle = (role) => {
    const normalizedRole = Object.keys(ROLE_COLORS).find(
      (r) => r.toLowerCase() === role?.toLowerCase()
    );
    return (
      ROLE_COLORS[normalizedRole] || {
        bg: 'bg-gradient-to-br from-gray-500 to-gray-700',
        badge: 'bg-gray-100 text-gray-800 border-gray-200',
        accent: 'text-gray-600',
        glow: 'group-hover:shadow-gray-500/30',
      }
    );
  };

  const getDamageTypeStyle = (type) => {
    if (!type) return DAMAGE_TYPE_STYLES.Physical;
    const lowerType = type.toLowerCase();
    if (lowerType.includes('physical') && lowerType.includes('magic')) {
      return DAMAGE_TYPE_STYLES.Mixed;
    }
    if (lowerType.includes('magic')) {
      return DAMAGE_TYPE_STYLES.Magic;
    }
    return DAMAGE_TYPE_STYLES.Physical;
  };

  const roleStyle = getRoleStyle(primaryRole);
  const damageStyle = getDamageTypeStyle(damageType);
  const displayDamageType = damageType.includes('/') ? damageType.split('/')[0].trim() : damageType;

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative bg-white rounded-2xl border border-gray-200/80 hover:border-transparent transition-all duration-300 cursor-pointer overflow-hidden hover:shadow-2xl hover:-translate-y-1 ${roleStyle.glow}`}
    >
      {/* Glow Effect Background */}
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${roleStyle.bg} blur-xl`}
      />

      {/* Card Content */}
      <div className="relative">
        {/* Hero Avatar Section */}
        <div className={`relative h-28 ${roleStyle.bg} overflow-hidden`}>
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.3),transparent_70%)]" />
            <div
              className={`absolute -inset-4 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-y-12 transform transition-transform duration-1000 ${isHovered ? 'translate-x-full' : '-translate-x-full'}`}
            />
          </div>

          {/* Hero Initial */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white font-black text-5xl drop-shadow-2xl tracking-tighter">
              {heroName?.charAt(0).toUpperCase()}
            </span>
          </div>

          {/* Damage Type Badge */}
          <div className="absolute top-3 right-3">
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border backdrop-blur-sm ${damageStyle.bg}`}
            >
              <span>{damageStyle.icon}</span>
              <span className="hidden sm:inline">{displayDamageType || damageStyle.label}</span>
            </span>
          </div>

          {/* Role Badge Top Left */}
          <div className="absolute top-3 left-3">
            <span
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full border backdrop-blur-sm bg-white/90 ${roleStyle.badge}`}
            >
              {primaryRole}
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4">
          {/* Hero Name */}
          <h3
            className={`font-bold text-gray-900 text-base mb-2 truncate group-hover:${roleStyle.accent} transition-colors`}
          >
            {heroName}
          </h3>

          {/* Secondary Role & Attack Reliance */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {secondaryRole && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                {secondaryRole}
              </span>
            )}
            {hero.attack_reliance && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-sky-50 text-sky-600 border border-sky-200">
                {hero.attack_reliance}
              </span>
            )}
          </div>

          {/* Lanes (if available) */}
          {hero.lanes && hero.lanes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {hero.lanes.slice(0, 2).map((lane, idx) => (
                <span
                  key={idx}
                  className="text-[10px] text-gray-600 bg-gradient-to-r from-gray-50 to-gray-100 px-2 py-1 rounded-md border border-gray-200 font-medium"
                >
                  {lane.lane_name || lane}
                </span>
              ))}
              {hero.lanes.length > 2 && (
                <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
                  +{hero.lanes.length - 2}
                </span>
              )}
            </div>
          )}

          {/* Action Button */}
          <div className="pt-3 border-t border-gray-100">
            <button
              onClick={handleClick}
              className={`w-full text-xs font-bold px-4 py-2 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 bg-gray-50 text-gray-700 group-hover:${roleStyle.bg} group-hover:text-white border border-gray-200 group-hover:border-transparent`}
            >
              <span>View Details</span>
              <svg
                className="w-4 h-4 transform group-hover:translate-x-1 transition-transform"
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
          </div>
        </div>
      </div>
    </div>
  );
}

export function HeroCardModernSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden animate-pulse">
      <div className="h-28 bg-gradient-to-br from-gray-200 to-gray-300" />
      <div className="p-4">
        <div className="h-5 bg-gray-200 rounded-lg w-3/4 mb-3" />
        <div className="flex gap-2 mb-3">
          <div className="h-5 bg-gray-200 rounded-full w-16" />
          <div className="h-5 bg-gray-200 rounded-full w-14" />
        </div>
        <div className="pt-3 border-t border-gray-100">
          <div className="h-9 bg-gray-200 rounded-xl w-full" />
        </div>
      </div>
    </div>
  );
}
