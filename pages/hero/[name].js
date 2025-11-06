import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import AppLayout from '../../components/AppLayout'
import HeroCard from '../../components/HeroCard'

export default function HeroDetailPage() {
  const router = useRouter()
  const name = typeof router.query.name === 'string' ? router.query.name : ''
  const [detail, setDetail] = useState(null)
  const [heroAttrs, setHeroAttrs] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!name) return
      setLoading(true)
      try {
        const res = await fetch(`/api/get_hero_detail?name=${encodeURIComponent(name)}`)
        const data = res.ok ? await res.json() : null
        setDetail(data && data.hero_name ? data : null)
        // Load attributes in parallel (non-blocking)
        fetch(`/api/heroes/${encodeURIComponent(name)}/attributes`)
          .then(r => r.ok ? r.json() : null)
          .then(a => setHeroAttrs(a || null))
          .catch(() => setHeroAttrs(null))
      } catch {
        setDetail(null)
        setHeroAttrs(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [name])

  return (
    <AppLayout>
      <div className="bg-gradient-to-br from-sky-50 via-white to-blue-50 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                {name ? `Hero Detail: ${name}` : 'Hero Detail'}
              </h1>
              <p className="text-gray-600 mt-1">Informasi detail dan atribut hero.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push('/?showAll=true')}
                className="text-sm inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-200 text-gray-700 bg-white hover:bg-gray-100"
              >
                All Heroes
              </button>
              <button
                onClick={() => router.push('/')}
                className="text-sm inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-200 text-gray-700 bg-white hover:bg-gray-100"
              >
                Dashboard
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
                <span className="ml-2 text-gray-600">Memuat detail hero...</span>
              </div>
            ) : detail ? (
              <HeroCard
                hero={detail}
                heroAttrs={heroAttrs}
                onEdit={(type) => {
                  if (type === 'skills' && detail.hero_name) {
                    window.location.href = `/edit-skills?name=${encodeURIComponent(detail.hero_name)}`
                  }
                }}
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600">Hero tidak ditemukan.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
