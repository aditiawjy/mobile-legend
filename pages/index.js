import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AppLayout from '../components/common/AppLayout';

const ROLE_COLORS = {
  Tank: 'from-blue-500 to-blue-600',
  Fighter: 'from-orange-500 to-red-500',
  Assassin: 'from-red-500 to-pink-600',
  Mage: 'from-purple-500 to-indigo-600',
  Marksman: 'from-yellow-400 to-orange-500',
  Support: 'from-green-500 to-teal-600',
};

const FEATURED_HEROES = ['Lancelot', 'Gusion', 'Lunox', 'Granger', 'Esmeralda', 'Fanny'];

export default function LandingPage() {
  const router = useRouter();
  const [stats, setStats] = useState({ totalHeroes: 0, totalItems: 0 });
  const [featuredHeroesData, setFeaturedHeroesData] = useState([]);
  const [popularItems, setPopularItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('heroes');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch stats
        const statsRes = await fetch('/api/stats');
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        // Fetch heroes
        const heroesRes = await fetch('/api/heroes');
        if (heroesRes.ok) {
          const heroes = await heroesRes.json();
          const featured = heroes
            .filter((h) => FEATURED_HEROES.includes(h.hero_name || h.name))
            .slice(0, 6);
          setFeaturedHeroesData(featured);
        }

        // Fetch items
        const itemsRes = await fetch('/api/items');
        if (itemsRes.ok) {
          const itemsData = await itemsRes.json();
          setPopularItems(itemsData.items?.slice(0, 6) || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getRoleGradient = (role) => {
    const primaryRole = role?.split('/')[0]?.trim() || 'Tank';
    return ROLE_COLORS[primaryRole] || ROLE_COLORS.Tank;
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-slate-950">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20" />
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
            <div className="text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm text-blue-200 mb-8 border border-white/20">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Database Updated • {stats.totalHeroes} Heroes Available
              </div>

              {/* Main Title */}
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-white mb-6 tracking-tight">
                Mobile Legends
                <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                  Database
                </span>
              </h1>

              <p className="text-xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed">
                Explore heroes, analyze strategies, and dominate the battlefield with comprehensive
                Mobile Legends data and tools.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => router.push('/heroes')}
                  className="group px-8 py-4 bg-white text-slate-900 font-bold rounded-2xl hover:bg-slate-100 transition-all shadow-2xl shadow-white/20 flex items-center gap-3"
                >
                  <span>Explore Heroes</span>
                  <svg
                    className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => router.push('/draft-pick')}
                  className="px-8 py-4 bg-slate-800/50 text-white font-bold rounded-2xl border border-slate-700 hover:bg-slate-800 transition-all backdrop-blur-sm"
                >
                  Try Draft Pick
                </button>
              </div>
            </div>
          </div>

          {/* Wave Divider */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
                fill="#020617"
              />
            </svg>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-slate-950 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                {
                  label: 'Heroes',
                  value: stats.totalHeroes,
                  icon: '⚔️',
                  gradient: 'from-blue-500 to-blue-600',
                },
                {
                  label: 'Items',
                  value: stats.totalItems,
                  icon: '🛡️',
                  gradient: 'from-orange-500 to-red-500',
                },
                {
                  label: 'Categories',
                  value: '6',
                  icon: '📊',
                  gradient: 'from-purple-500 to-indigo-600',
                },
                {
                  label: 'Updates',
                  value: 'Weekly',
                  icon: '🔄',
                  gradient: 'from-green-500 to-teal-600',
                },
              ].map((stat, idx) => (
                <div key={idx} className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
                  <div className="relative bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-800 hover:border-slate-700 transition-all">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-2xl mb-4`}
                    >
                      {stat.icon}
                    </div>
                    <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
                    <div className="text-slate-400 text-sm font-medium">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Featured Content Section */}
        <div className="bg-slate-950 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-12">
              <div>
                <h2 className="text-4xl font-black text-white mb-2">Featured Content</h2>
                <p className="text-slate-400">Discover popular heroes and essential items</p>
              </div>

              {/* Tab Switcher */}
              <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-800">
                <button
                  onClick={() => setActiveTab('heroes')}
                  className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                    activeTab === 'heroes'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Heroes
                </button>
                <button
                  onClick={() => setActiveTab('items')}
                  className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                    activeTab === 'items'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Items
                </button>
              </div>
            </div>

            {/* Content Grid */}
            {activeTab === 'heroes' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {loading
                  ? [...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        className="bg-slate-900 rounded-2xl p-4 border border-slate-800 animate-pulse"
                      >
                        <div className="h-32 bg-slate-800 rounded-xl mb-4" />
                        <div className="h-4 bg-slate-800 rounded w-3/4" />
                      </div>
                    ))
                  : featuredHeroesData.map((hero, idx) => (
                      <div
                        key={idx}
                        onClick={() =>
                          router.push(`/hero/${encodeURIComponent(hero.hero_name || hero.name)}`)
                        }
                        className="group relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 hover:border-slate-600 cursor-pointer transition-all hover:-translate-y-1"
                      >
                        <div
                          className={`h-32 bg-gradient-to-br ${getRoleGradient(hero.role)} relative overflow-hidden`}
                        >
                          <div className="absolute inset-0 bg-black/20" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-4xl font-black text-white/90 drop-shadow-lg">
                              {(hero.hero_name || hero.name)?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="absolute top-2 right-2">
                            <span className="px-2 py-1 bg-black/30 backdrop-blur-sm rounded text-[10px] font-bold text-white">
                              {hero.role?.split('/')[0]}
                            </span>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                            {hero.hero_name || hero.name}
                          </h3>
                          <p className="text-xs text-slate-400 mt-1">{hero.damage_type}</p>
                        </div>
                      </div>
                    ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {loading
                  ? [...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        className="bg-slate-900 rounded-2xl p-4 border border-slate-800 animate-pulse"
                      >
                        <div className="h-32 bg-slate-800 rounded-xl mb-4" />
                        <div className="h-4 bg-slate-800 rounded w-3/4" />
                      </div>
                    ))
                  : popularItems.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => router.push(`/item/${encodeURIComponent(item.item_name)}`)}
                        className="group relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 hover:border-slate-600 cursor-pointer transition-all hover:-translate-y-1"
                      >
                        <div className="h-32 bg-gradient-to-br from-slate-700 to-slate-800 relative overflow-hidden flex items-center justify-center">
                          <span className="text-4xl font-black text-white/50">
                            {item.item_name?.charAt(0).toUpperCase()}
                          </span>
                          <div className="absolute top-2 right-2">
                            <span className="px-2 py-1 bg-yellow-500/20 backdrop-blur-sm rounded text-[10px] font-bold text-yellow-400">
                              {item.price}g
                            </span>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors truncate text-sm">
                            {item.item_name}
                          </h3>
                          <p className="text-xs text-slate-400 mt-1 capitalize">{item.category}</p>
                        </div>
                      </div>
                    ))}
              </div>
            )}

            {/* View All Button */}
            <div className="text-center mt-8">
              <button
                onClick={() => router.push(activeTab === 'heroes' ? '/heroes' : '/items')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 text-white font-semibold rounded-xl hover:bg-slate-700 transition-all border border-slate-700"
              >
                View All {activeTab === 'heroes' ? 'Heroes' : 'Items'}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-slate-950 py-20 border-t border-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-black text-white mb-4">Powerful Tools</h2>
              <p className="text-slate-400 max-w-2xl mx-auto">
                Everything you need to improve your Mobile Legends gameplay
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: 'Hero Database',
                  description:
                    'Browse all heroes with detailed stats, abilities, and role information.',
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  ),
                  gradient: 'from-blue-500 to-blue-600',
                  link: '/heroes',
                },
                {
                  title: 'Item Builder',
                  description: 'Explore items, builds, and get recommendations for your heroes.',
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  ),
                  gradient: 'from-orange-500 to-red-500',
                  link: '/items',
                },
                {
                  title: 'Draft Pick',
                  description: 'Simulate draft picks and get strategic hero recommendations.',
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  ),
                  gradient: 'from-purple-500 to-indigo-600',
                  link: '/draft-pick',
                },
              ].map((feature, idx) => (
                <div
                  key={idx}
                  onClick={() => router.push(feature.link)}
                  className="group relative bg-slate-900 rounded-2xl p-8 border border-slate-800 hover:border-slate-600 cursor-pointer transition-all hover:-translate-y-1"
                >
                  <div
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform`}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{feature.description}</p>
                  <div className="mt-6 flex items-center text-blue-400 font-semibold group-hover:text-blue-300 transition-colors">
                    <span>Try it now</span>
                    <svg
                      className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-slate-950 py-20 border-t border-slate-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">Ready to Dominate?</h2>
            <p className="text-xl text-slate-400 mb-10">
              Start exploring our comprehensive database and take your gameplay to the next level.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => router.push('/heroes')}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-2xl shadow-blue-500/25"
              >
                Get Started Now
              </button>
              <button
                onClick={() => router.push('/draft-pick')}
                className="w-full sm:w-auto px-8 py-4 bg-slate-800 text-white font-bold rounded-2xl border border-slate-700 hover:bg-slate-700 transition-all"
              >
                Try Draft Simulator
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-slate-950 border-t border-slate-900 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-black text-lg">ML</span>
                </div>
                <span className="text-white font-bold text-xl">ML Database</span>
              </div>
              <p className="text-slate-500 text-sm">
                © {new Date().getFullYear()} Mobile Legends Database. Built for players.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </AppLayout>
  );
}
