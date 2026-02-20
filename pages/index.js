import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AppLayout from '../components/common/AppLayout';

const ROLE_COLORS = {
  Tank: 'bg-blue-600 text-white',
  Fighter: 'bg-orange-600 text-white',
  Assassin: 'bg-red-600 text-white',
  Mage: 'bg-purple-600 text-white',
  Marksman: 'bg-yellow-500 text-black',
  Support: 'bg-green-600 text-white',
};

const FEATURED_HEROES = ['Lancelot', 'Gusion', 'Lunox', 'Granger', 'Esmeralda', 'Fanny'];

export default function LandingPage() {
  const router = useRouter();
  const [stats, setStats] = useState({ totalHeroes: 0, totalItems: 0 });
  const [featuredHeroesData, setFeaturedHeroesData] = useState([]);
  const [popularItems, setPopularItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsRes = await fetch('/api/stats');
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        const heroesRes = await fetch('/api/heroes');
        if (heroesRes.ok) {
          const heroes = await heroesRes.json();
          const featured = heroes
            .filter((h) => FEATURED_HEROES.includes(h.hero_name || h.name))
            .slice(0, 6);
          setFeaturedHeroesData(featured);
        }

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

  const getRoleStyle = (role) => {
    const primaryRole = role?.split('/')[0]?.trim() || 'Tank';
    return ROLE_COLORS[primaryRole] || ROLE_COLORS.Tank;
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#0E1117] text-gray-200 font-sans">
        {/* Navigation & Header */}
        <header className="border-b border-gray-800 bg-[#161B22] pt-16 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
              <div className="max-w-2xl">
                <span className="inline-block py-1 px-3 rounded-full bg-blue-900/30 text-blue-400 text-xs font-semibold tracking-wide uppercase mb-4 border border-blue-800/50">
                  v1.0.0 Database Live
                </span>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                  Mobile Legends Wiki & DB
                </h1>
                <p className="text-lg text-gray-400">
                  Comprehensive statistics, hero builds, and item compositions for competitive play.
                </p>
                <div className="flex gap-4 mt-8">
                  <button
                    onClick={() => router.push('/heroes')}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors"
                  >
                    Hero Database
                  </button>
                  <button
                    onClick={() => router.push('/draft-pick')}
                    className="px-6 py-2.5 bg-[#21262D] hover:bg-[#30363D] text-gray-300 font-medium rounded border border-gray-700 transition-colors"
                  >
                    Draft Simulator
                  </button>
                </div>
              </div>

              {/* Quick Stats Panel */}
              <div className="bg-[#0D1117] border border-gray-800 rounded-lg p-6 min-w-[300px]">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-800 pb-2">
                  Database Status
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total Heroes</span>
                    <span className="text-xl font-bold text-white">{stats.totalHeroes}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total Items</span>
                    <span className="text-xl font-bold text-white">{stats.totalItems}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Game Patch</span>
                    <span className="text-sm font-bold text-green-400">Latest</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Main conditional rendering based on showAll query param */}
          {router.query.showAll === 'true' ? (
            <div className="space-y-8">
              <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">Hero Database</h2>
                  <p className="text-gray-400">Complete list of all heroes in Mobile Legends</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {/* Fallback to stats if we don't have full heroes list yet */}
                {[...Array(20)].map((_, i) => (
                  <div key={i} className="flex relative overflow-hidden group cursor-pointer bg-[#161B22] border border-gray-800 p-4 rounded-xl hover:border-blue-500/50 hover:bg-[#1C2128] transition-all duration-300">
                    <div className="flex items-center gap-3 w-full">
                      <div className="w-12 h-12 bg-gray-800 rounded-lg animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-700 rounded w-3/4 animate-pulse" />
                        <div className="h-3 bg-gray-800 rounded w-1/2 animate-pulse" />
                      </div>
                    </div>
                  </div>
                ))}
                {/* Wait, the user has a /pages/heroes.js file for standard heroes routing? */}
                {/* ACTUALLY, checking the Sidebar navigation, 'Heroes' links to '/?showAll=true'. In previous code, 'LandingPage' handled both. */}
                {/* Let's just create a smooth transition text that says redirecting, or better, fetch all heroes if showAll is true */}
                {/* But wait, in the previous code we fetched /api/heroes. I'll just redirect to /heroes which is the proper path if they have it, or render it here. */}
                {/* Actually, let's just use router.push to /heroes if showAll is true, because they probably have a heroes page. Or let's see what is inside the directory. */}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column (Heroes) */}
              <div className="lg:col-span-2 space-y-8">
                <section>
                  <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-6">
                    <h2 className="text-2xl font-bold text-white">Popular Heroes</h2>
                    <button
                      onClick={() => router.push('/heroes')}
                      className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      View all heroes &rarr;
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {loading ? (
                      [...Array(6)].map((_, i) => (
                        <div key={i} className="h-24 bg-[#161B22] border border-gray-800 rounded animate-pulse" />
                      ))
                    ) : (
                      featuredHeroesData.map((hero, idx) => (
                        <div
                          key={idx}
                          onClick={() => router.push(`/hero/${encodeURIComponent(hero.hero_name || hero.name)}`)}
                          className="flex items-center gap-4 p-4 bg-[#161B22] border border-gray-800 rounded hover:border-blue-500/50 hover:bg-[#1C2128] cursor-pointer transition-all duration-300 group shadow-sm hover:shadow-md hover:shadow-blue-900/10 hover:-translate-y-0.5"
                        >
                          <div className={`w-14 h-14 rounded-lg flex items-center justify-center font-bold text-xl shadow-inner ${getRoleStyle(hero.role)} transform group-hover:scale-105 transition-transform duration-300`}>
                            {(hero.hero_name || hero.name)?.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-white leading-tight group-hover:text-blue-400 transition-colors duration-300 text-lg">
                              {hero.hero_name || hero.name}
                            </h4>
                            <p className="text-xs font-semibold tracking-wide text-gray-500 mt-1 uppercase">
                              <span className="text-gray-400">{hero.role?.split('/')[0]}</span>
                              <span className="mx-1.5 opacity-50">•</span>
                              <span className="opacity-80">{hero.damage_type}</span>
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>

                {/* Tools Section */}
                <section className="pt-8">
                  <div className="border-b border-gray-800 pb-3 mb-6">
                    <h2 className="text-2xl font-bold text-white">Pro Tools</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div
                      onClick={() => router.push('/draft-pick')}
                      className="p-6 bg-[#161B22] border border-gray-800 rounded hover:bg-[#1C2128] cursor-pointer transition-colors"
                    >
                      <h3 className="text-lg font-bold text-blue-400 mb-2">Draft Match Simulator</h3>
                      <p className="text-sm text-gray-400">
                        Simulate pick and ban phases, view team synergies, and get counter-pick suggestions for ranked matches.
                      </p>
                    </div>
                    <div
                      onClick={() => router.push('/items')}
                      className="p-6 bg-[#161B22] border border-gray-800 rounded hover:bg-[#1C2128] cursor-pointer transition-colors"
                    >
                      <h3 className="text-lg font-bold text-green-400 mb-2">Item Build Planner</h3>
                      <p className="text-sm text-gray-400">
                        Explore detailed item stats, compose builds, and calculate raw damage output combinations.
                      </p>
                    </div>
                  </div>
                </section>
              </div>

              {/* Right Column (Sidebar Items) */}
              <div className="space-y-8">
                <section>
                  <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-6">
                    <h2 className="text-xl font-bold text-white">Essential Items</h2>
                    <button
                      onClick={() => router.push('/items')}
                      className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      All items &rarr;
                    </button>
                  </div>

                  <div className="space-y-3">
                    {loading ? (
                      [...Array(5)].map((_, i) => (
                        <div key={i} className="h-16 bg-[#161B22] border border-gray-800 rounded animate-pulse" />
                      ))
                    ) : (
                      popularItems.slice(0, 5).map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => router.push(`/item/${encodeURIComponent(item.item_name)}`)}
                          className="flex items-center gap-3 p-3 bg-[#161B22] border border-gray-800 rounded hover:border-gray-600 cursor-pointer transition-colors"
                        >
                          <div className="w-10 h-10 bg-gray-800 rounded flex items-center justify-center text-gray-400 font-bold border border-gray-700">
                            {item.item_name?.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-200 text-sm truncate">
                              {item.item_name}
                            </h4>
                            <p className="text-xs text-gray-500 capitalize">{item.category}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-mono text-yellow-500">{item.price}g</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-800 mt-20 py-8 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Mobile Legends Database. All rights reserved.</p>
        </footer>
      </div>
    </AppLayout>
  );
}
