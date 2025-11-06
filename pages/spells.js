import { useEffect, useState } from 'react'
import AppLayout from '../components/AppLayout'

export default function SpellsPage() {
  const [spells, setSpells] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/battle-spells')
        const data = res.ok ? await res.json() : []
        setSpells(Array.isArray(data) ? data : [])
      } catch {
        setSpells([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <AppLayout>
      <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <header className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 flex items-center gap-3">
                <span className="text-indigo-600">ML</span> Battle Spells
                <span className="text-lg font-normal text-gray-500">- All Spells</span>
              </h1>
              <p className="text-gray-600 mt-2">Menampilkan semua battle spells dari database.</p>
            </div>
            <div className="flex items-center gap-2">
              <a href="/" className="text-sm inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-200 text-gray-700 bg-white hover:bg-gray-100">Dashboard</a>
            </div>
          </header>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <span className="ml-2 text-gray-600">Memuat spells...</span>
              </div>
            ) : spells.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {spells.map((s, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h3 className="font-semibold text-gray-900 text-sm mb-1">{s.name}</h3>
                    <p className="text-xs text-gray-600 whitespace-pre-line">{s.description || '-'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600">Tidak ada data spells.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
