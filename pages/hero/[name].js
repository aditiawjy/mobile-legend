import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AppLayout from '../../components/common/AppLayout';

const ROLE_COLORS = {
  Tank: {
    bg: 'bg-blue-500',
    text: 'text-blue-600',
    light: 'bg-blue-50',
    border: 'border-blue-200',
  },
  Fighter: {
    bg: 'bg-orange-500',
    text: 'text-orange-600',
    light: 'bg-orange-50',
    border: 'border-orange-200',
  },
  Assassin: {
    bg: 'bg-red-500',
    text: 'text-red-600',
    light: 'bg-red-50',
    border: 'border-red-200',
  },
  Mage: {
    bg: 'bg-purple-500',
    text: 'text-purple-600',
    light: 'bg-purple-50',
    border: 'border-purple-200',
  },
  Marksman: {
    bg: 'bg-yellow-500',
    text: 'text-yellow-600',
    light: 'bg-yellow-50',
    border: 'border-yellow-200',
  },
  Support: {
    bg: 'bg-green-500',
    text: 'text-green-600',
    light: 'bg-green-50',
    border: 'border-green-200',
  },
};

export default function HeroDetailPage() {
  const router = useRouter();
  const name = typeof router.query.name === 'string' ? router.query.name : '';
  const [hero, setHero] = useState(null);
  const [heroAdjs, setHeroAdjs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSkillTab, setActiveSkillTab] = useState(0);

  useEffect(() => {
    const load = async () => {
      if (!name) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/get_hero_detail?name=${encodeURIComponent(name)}`);
        const data = res.ok ? await res.json() : null;
        setHero(data && data.hero_name ? data : null);

        // Load adjustments in parallel
        fetch(`/api/heroes/${encodeURIComponent(name)}/adjustments`)
          .then((r) => (r.ok ? r.json() : null))
          .then((a) => setHeroAdjs(Array.isArray(a) ? a : null))
          .catch(() => setHeroAdjs(null));
      } catch {
        setHero(null);
        setHeroAdjs(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [name]);

  const getRoleStyle = (role) => {
    const primaryRole = role?.split('/')[0]?.trim() || 'Tank';
    return ROLE_COLORS[primaryRole] || ROLE_COLORS.Tank;
  };

  const getDamageTypeStyle = (type) => {
    if (!type) return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
    if (type.toLowerCase().includes('magic')) {
      return { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' };
    }
    return { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' };
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-slate-600">Loading hero details...</span>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!hero) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-slate-600 text-lg">Hero not found.</p>
            <button
              onClick={() => router.push('/heroes')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Heroes
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const roleStyle = getRoleStyle(hero.role);
  const damageStyle = getDamageTypeStyle(hero.damage_type);
  const primaryRole = hero.role?.split('/')[0]?.trim() || 'Unknown';
  const secondaryRole = hero.role?.includes('/') ? hero.role.split('/')[1]?.trim() : null;

  // Prepare skills data
  const skills = [
    { name: hero.passive_name, desc: hero.passive_description, type: 'Passive', icon: 'P' },
    {
      name: hero.basic_attack_name,
      desc: hero.basic_attack_description,
      type: 'Basic Attack',
      icon: 'B',
    },
    { name: hero.skill_1_name, desc: hero.skill_1_description, type: 'Skill 1', icon: '1' },
    { name: hero.skill_2_name, desc: hero.skill_2_description, type: 'Skill 2', icon: '2' },
    { name: hero.skill_3_name, desc: hero.skill_3_description, type: 'Skill 3', icon: '3' },
    { name: hero.skill_4_name, desc: hero.skill_4_description, type: 'Skill 4', icon: '4' },
    { name: hero.ultimate_name, desc: hero.ultimate_description, type: 'Ultimate', icon: 'U' },
  ].filter((skill) => skill.name || skill.desc);

  return (
    <AppLayout>
      <div className="min-h-screen bg-slate-50">
        {/* Hero Header */}
        <div className={`${roleStyle.bg} text-white`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              {/* Avatar */}
              <div className="w-24 h-24 bg-white/20 rounded-2xl flex items-center justify-center text-5xl font-black backdrop-blur-sm border border-white/30">
                {hero.hero_name?.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1">
                <h1 className="text-4xl md:text-5xl font-black mb-3">{hero.hero_name}</h1>
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`px-4 py-1.5 rounded-full text-sm font-bold ${roleStyle.light} ${roleStyle.text}`}
                  >
                    {primaryRole}
                  </span>
                  {secondaryRole && (
                    <span className="px-4 py-1.5 rounded-full text-sm font-bold bg-white/20 text-white border border-white/30">
                      {secondaryRole}
                    </span>
                  )}
                  <span
                    className={`px-4 py-1.5 rounded-full text-sm font-bold ${damageStyle.bg} ${damageStyle.text} border ${damageStyle.border}`}
                  >
                    {hero.damage_type || 'Physical'}
                  </span>
                </div>
                {hero.attack_reliance && (
                  <p className="mt-3 text-white/80 text-sm">{hero.attack_reliance}</p>
                )}
              </div>

              {/* Back Button */}
              <button
                onClick={() => router.push('/heroes')}
                className="px-6 py-3 bg-white/10 backdrop-blur-sm rounded-xl text-white font-semibold hover:bg-white/20 transition-all border border-white/20 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Skills */}
            <div className="lg:col-span-2 space-y-6">
              {/* Skills Section */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <h2 className="text-xl font-bold text-slate-900">Skills</h2>
                </div>

                {/* Skill Tabs */}
                <div className="border-b border-slate-100 overflow-x-auto">
                  <div className="flex gap-1 p-2">
                    {skills.map((skill, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveSkillTab(idx)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                          activeSkillTab === idx
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {skill.type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active Skill Content */}
                <div className="p-6">
                  {skills[activeSkillTab] && (
                    <div>
                      <div className="flex items-center gap-4 mb-4">
                        <div
                          className={`w-16 h-16 ${roleStyle.bg} rounded-xl flex items-center justify-center text-white text-2xl font-bold`}
                        >
                          {skills[activeSkillTab].icon}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">
                            {skills[activeSkillTab].name}
                          </h3>
                          <span className="text-sm text-slate-500">
                            {skills[activeSkillTab].type}
                          </span>
                        </div>
                      </div>
                      <div className="prose prose-slate max-w-none">
                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {skills[activeSkillTab].desc}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Note Section */}
              {hero.note && (
                <div className="bg-blue-50 rounded-2xl border border-blue-200 p-6">
                  <h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Hero Note
                  </h3>
                  <p className="text-blue-800 leading-relaxed whitespace-pre-wrap">{hero.note}</p>
                </div>
              )}

              {/* Additional Note */}
              {hero.additional_note && (
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-3">Additional Information</h3>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {hero.additional_note}
                  </p>
                </div>
              )}
            </div>

            {/* Right Column - Adjustments */}
            <div className="space-y-6">
              {/* Adjustments Section */}
              {heroAdjs && heroAdjs.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="p-6 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-900">Recent Adjustments</h2>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {heroAdjs.slice(0, 5).map((adj, idx) => (
                      <div key={idx} className="p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-semibold text-slate-500">
                            {adj.adjustment_date || adj.date}
                          </span>
                          {adj.season && (
                            <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-medium text-slate-600">
                              Season {adj.season}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">
                          {adj.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Stats */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Info</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-500">Role</span>
                    <span className="font-semibold text-slate-900">{hero.role}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-500">Damage Type</span>
                    <span className="font-semibold text-slate-900">
                      {hero.damage_type || 'Physical'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-500">Attack Reliance</span>
                    <span className="font-semibold text-slate-900">
                      {hero.attack_reliance || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
