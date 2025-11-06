import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import AppLayout from '../components/AppLayout'

export default function EmblemsPage() {
  const [emblems, setEmblems] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/emblems')
        const data = res.ok ? await res.json() : []
        setEmblems(Array.isArray(data) ? data : [])
      } catch {
        setEmblems([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleEdit = (id) => {
    router.push(`/edit-emblem?id=${id}`)
  }

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this emblem?')) {
      try {
        const res = await fetch(`/api/emblems/${id}`, {
          method: 'DELETE'
        })
        
        if (res.ok) {
          setEmblems(emblems.filter(emp => emp.id !== id))
        } else {
          alert('Failed to delete emblem')
        }
      } catch (error) {
        console.error('Error deleting emblem:', error)
        alert('Failed to delete emblem')
      }
    }
  }

  return (
    <AppLayout>
      <div className="bg-gradient-to-br from-amber-50 via-white to-rose-50 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <header className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 flex items-center gap-3">
                <span className="text-amber-600">ML</span> Emblems
                <span className="text-lg font-normal text-gray-500">- All Emblems</span>
              </h1>
              <p className="text-gray-600 mt-2">Menampilkan semua emblems dari database.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push('/edit-emblem?id=new')}
                className="text-sm inline-flex items-center gap-1 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
              >
                + Add New Emblem
              </button>
              <a href="/" className="text-sm inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-200 text-gray-700 bg-white hover:bg-gray-100">Dashboard</a>
            </div>
          </header>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                <span className="ml-2 text-gray-600">Memuat emblems...</span>
              </div>
            ) : emblems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {emblems.map((e, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900 text-sm">{e.name}</h3>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(e.id)}
                          className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(e.id)}
                          className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    {e.attributes && <p className="text-xs text-gray-600 mb-2">{e.attributes}</p>}
                    {e.talent1 && (
                      <div className="text-xs text-gray-500 mb-1">
                        <strong>Slot 1:</strong> {e.talent1.substring(0, 50)}...
                      </div>
                    )}
                    {e.talent2 && (
                      <div className="text-xs text-gray-500 mb-1">
                        <strong>Slot 2:</strong> {e.talent2.substring(0, 50)}...
                      </div>
                    )}
                    {e.talent3 && (
                      <div className="text-xs text-gray-500">
                        <strong>Slot 3:</strong> {e.talent3.substring(0, 50)}...
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600">Tidak ada data emblems.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
