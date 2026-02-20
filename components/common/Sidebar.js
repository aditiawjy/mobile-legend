import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
      </svg>
    ),
  },
  {
    name: 'Heroes',
    href: '/heroes',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    name: 'Draft Pick',
    href: '/draft-pick',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    name: 'Items',
    href: '/items',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    name: 'Battle Spells',
    href: '/spells',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    name: 'Emblems',
    href: '/emblems',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3 0 1.656 1.343 3 3 3s3-1.344 3-3c0-1.657-1.343-3-3-3zm0-6l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
      </svg>
    ),
  },
  {
    name: 'Matches',
    href: '/matches',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    name: 'Teams',
    href: '/edit-teams',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
]

const editNavigation = []

export default function Sidebar({ children }) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isActive = (href) => {
    if (href === '/') {
      return router.pathname === '/'
    }
    return router.pathname.startsWith(href.split('?')[0]) && router.pathname !== '/'
  }

  const NavItem = ({ item }) => (
    <Link
      href={item.href}
      className={`relative group flex items-center px-4 py-3 my-1 text-sm font-medium rounded-xl transition-all duration-300 ease-out overflow-hidden ${isActive(item.href)
        ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-[0_0_20px_rgba(37,99,235,0.05)]'
        : 'text-gray-400 border border-transparent hover:bg-[#21262D] hover:text-gray-100'
        }`}
    >
      {/* Animated Left Indicator Line */}
      <span
        className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 bg-blue-500 rounded-r-md transition-all duration-300 ease-out origin-left ${isActive(item.href) ? 'h-3/4 opacity-100 scale-x-100' : 'h-1/2 opacity-0 scale-x-0 group-hover:scale-x-50 group-hover:opacity-40'
          }`}
      />

      {/* Icon Styling with Scale and Translation */}
      <span className={`mr-4 relative z-10 transition-all duration-300 ease-out ${isActive(item.href)
        ? 'text-blue-500 scale-110 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]'
        : 'text-gray-500 group-hover:text-blue-400 group-hover:scale-110 group-hover:translate-x-1'
        }`}>
        {item.icon}
      </span>

      {/* Text Styling with Slide Effect on Hover */}
      <span className={`relative z-10 tracking-wide transition-all duration-300 ease-out ${isActive(item.href)
        ? 'font-bold'
        : 'group-hover:translate-x-1 group-hover:font-medium'
        }`}>
        {item.name}
      </span>

      {/* Subtle Hover Background Shine */}
      <span className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </Link>
  )

  return (
    <div className="flex h-screen bg-[#0E1117] selection:bg-blue-500/30">
      {/* --- Desktop Sidebar --- */}
      <div className="hidden lg:flex lg:w-[280px] lg:flex-col relative z-20 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.8)] border-r border-gray-800/60 bg-[#161B22]">
        <div className="flex flex-col flex-grow pt-6 pb-4 overflow-y-auto">

          {/* Brand Header with Hover Effects */}
          <div className="flex items-center flex-shrink-0 px-8 mb-6 mt-2 group cursor-pointer transition-transform duration-500 hover:scale-[1.02]">
            <div className="relative">
              {/* Glow effect behind the logo */}
              <div className="absolute inset-0 bg-blue-500 rounded-xl blur-md opacity-20 group-hover:opacity-60 transition-all duration-500"></div>
              <div className="relative w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center border border-white/10 shadow-lg">
                <span className="text-white font-black text-xl tracking-tighter">ML</span>
              </div>
            </div>
            <div className="ml-4 flex flex-col justify-center">
              <span className="text-xl font-extrabold text-white tracking-tight group-hover:text-blue-400 transition-colors duration-300">Helper.Gg</span>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">Database</span>
            </div>
          </div>

          <nav className="flex-1 px-4 space-y-1">
            <div className="space-y-1">
              <h3 className="px-4 text-[11px] font-black text-gray-600 uppercase tracking-[0.2em] mb-4 mt-4">
                Main Menu
              </h3>
              {navigation.map((item) => (
                <NavItem key={item.name} item={item} />
              ))}
            </div>

            {editNavigation.length > 0 && (
              <div className="mt-8 space-y-1">
                <h3 className="px-4 text-[11px] font-black text-gray-600 uppercase tracking-[0.2em] mb-4 mt-8">
                  Management
                </h3>
                {editNavigation.map((item) => (
                  <NavItem key={item.name} item={item} />
                ))}
              </div>
            )}
          </nav>
        </div>
      </div>

      {/* --- Mobile Sidebar Overlay --- */}
      {sidebarOpen && (
        <div className="lg:hidden">
          <div className="fixed inset-0 flex z-50">
            {/* Backdrop Blur Overlay */}
            <div
              className="fixed inset-0 bg-[#0E1117]/80 backdrop-blur-md transition-opacity duration-300"
              onClick={() => setSidebarOpen(false)}
            />
            {/* Mobile Sidebar Panel */}
            <div className="relative flex-1 flex flex-col max-w-[280px] w-full bg-[#161B22] border-r border-gray-800 shadow-2xl transform transition-transform duration-300 ease-out">
              <div className="absolute top-0 right-0 -mr-14 pt-3">
                <button
                  type="button"
                  className="ml-1 flex items-center justify-center p-2 rounded-xl focus:outline-none bg-gray-900/50 hover:bg-gray-800 backdrop-blur border border-white/5 transition-all text-gray-400 hover:text-white group"
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="sr-only">Close sidebar</span>
                  <svg className="h-6 w-6 transform group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 h-0 pt-6 pb-4 overflow-y-auto">
                <div className="flex-shrink-0 flex items-center px-6 mb-8">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                    <span className="text-white font-black text-xl">ML</span>
                  </div>
                  <span className="ml-4 text-xl font-bold text-white tracking-tight">Helper.Gg</span>
                </div>
                <nav className="flex-1 px-4 space-y-1">
                  <h3 className="px-4 text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">
                    Menu
                  </h3>
                  {[...navigation, ...editNavigation].map((item) => (
                    <NavItem key={item.name} item={item} />
                  ))}
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Main Content Area --- */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Mobile Header (Hidden on Desktop) */}
        <div className="relative z-30 flex-shrink-0 flex items-center justify-between h-16 bg-[#161B22]/95 backdrop-blur-xl border-b border-gray-800 lg:hidden px-4 shadow-sm">
          <div className="flex items-center">
            <button
              type="button"
              className="p-2 border border-transparent bg-gray-900/50 rounded-lg text-gray-400 hover:text-white hover:border-gray-700 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all mr-3 active:scale-95"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                <span className="text-white font-black text-sm">ML</span>
              </div>
              <span className="text-lg font-bold text-white tracking-tight leading-none pt-0.5">Helper</span>
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto focus:outline-none bg-[#0E1117] scroll-smooth">
          {children}
        </main>
      </div>
    </div>
  )
}
