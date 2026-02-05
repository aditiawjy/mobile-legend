import { useRouter } from 'next/router';
import { useState } from 'react';

const ROLE_STYLES = {
  Tank: {
    gradient: 'from-blue-600 via-blue-700 to-blue-800',
    bg: 'bg-blue-600',
    light: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    glow: 'shadow-blue-500/25',
  },
  Fighter: {
    gradient: 'from-orange-500 via-orange-600 to-red-600',
    bg: 'bg-orange-500',
    light: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    glow: 'shadow-orange-500/25',
  },
  Assassin: {
    gradient: 'from-red-600 via-red-700 to-pink-700',
    bg: 'bg-red-600',
    light: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    glow: 'shadow-red-500/25',
  },
  Mage: {
    gradient: 'from-purple-600 via-purple-700 to-indigo-700',
    bg: 'bg-purple-600',
    light: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    glow: 'shadow-purple-500/25',
  },
  Marksman: {
    gradient: 'from-yellow-500 via-yellow-600 to-orange-500',
    bg: 'bg-yellow-500',
    light: 'bg-yellow-50',
    text: 'text-yellow-700',
    border: 'border-yellow-200',
    glow: 'shadow-yellow-500/25',
  },
  Support: {
    gradient: 'from-green-500 via-green-600 to-teal-600',
    bg: 'bg-green-500',
    light: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
    glow: 'shadow-green-500/25',
  },
};

const DAMAGE_ICONS = {
  Physical: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 10V3L4 14h7v7l9-11h-7z"
      />
    </svg>
  ),
  Magic: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
      />
    </svg>
  ),
};

export default function HeroCard({ hero }) {
  const router = useRouter();

  const heroName = hero.hero_name || hero.name;
  const primaryRole = hero.role?.split('/')[0]?.trim() || 'Unknown';
  const secondaryRole = hero.role?.includes('/') ? hero.role.split('/')[1]?.trim() : null;
  const damageType = hero.damage_type || '';

  const roleStyle = ROLE_STYLES[primaryRole] || ROLE_STYLES.Tank;

  const getDamageType = (type) => {
    if (!type) return 'Physical';
    const lower = type.toLowerCase();
    if (lower.includes('magic')) return 'Magic';
    return 'Physical';
  };

  const displayDamage = getDamageType(damageType);

  return (
    <div
      onClick={() => router.push(`/hero/${encodeURIComponent(heroName)}`)}
      className="group relative bg-white rounded-xl border border-gray-200 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-0.5 hover:border-gray-300"
    >
      {/* Card Header with Gradient */}
      <div className={`h-20 bg-gradient-to-br ${roleStyle.gradient} relative overflow-hidden`}>
        {/* Subtle Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id={`grid-${heroName}`} width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill={`url(#grid-${heroName})`} />
          </svg>
        </div>

        {/* Hero Initial */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl font-bold text-white/90 drop-shadow-lg">
            {heroName?.charAt(0).toUpperCase()}
          </span>
        </div>

        {/* Damage Type Badge */}
        <div className="absolute top-2 right-2">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${
              displayDamage === 'Magic'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-orange-100 text-orange-700'
            }`}
          >
            {DAMAGE_ICONS[displayDamage]}
            <span className="hidden sm:inline">{displayDamage}</span>
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-3">
        {/* Hero Name */}
        <h3 className="font-semibold text-gray-900 text-sm mb-2 truncate group-hover:text-blue-600 transition-colors">
          {heroName}
        </h3>

        {/* Role Tags */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${roleStyle.light} ${roleStyle.text} border ${roleStyle.border}`}
          >
            {primaryRole}
          </span>
          {secondaryRole && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
              {secondaryRole}
            </span>
          )}
        </div>

        {/* Attack Reliance */}
        {hero.attack_reliance && (
          <p className="text-[10px] text-gray-500 truncate mb-2">{hero.attack_reliance}</p>
        )}

        {/* Action Button */}
        <button className="w-full mt-1 py-1.5 px-3 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-medium rounded-lg border border-gray-200 transition-colors flex items-center justify-center gap-1 group-hover:border-gray-300">
          View Details
          <svg
            className="w-3 h-3 transition-transform group-hover:translate-x-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export function HeroCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="h-20 bg-gray-200 animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
        <div className="flex gap-1.5">
          <div className="h-5 bg-gray-200 rounded animate-pulse w-14" />
          <div className="h-5 bg-gray-200 rounded animate-pulse w-12" />
        </div>
        <div className="h-3 bg-gray-200 rounded animate-pulse w-full" />
        <div className="h-7 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    </div>
  );
}
