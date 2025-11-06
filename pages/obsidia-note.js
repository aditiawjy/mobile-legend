import { useState, useEffect } from 'react'
import AppLayout from '../components/AppLayout'
import { useRouter } from 'next/router'

export default function ObsidiaNotePage() {
  const router = useRouter()
  const [additionalNote, setAdditionalNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [existingNote, setExistingNote] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchObsidiaData()
  }, [])

  const fetchObsidiaData = async () => {
    try {
      const response = await fetch('/api/get_hero_detail?name=Obsidia')
      const data = await response.json()
      
      if (data && data.hero_name) {
        setExistingNote(data.additional_note || '')
        setAdditionalNote(data.additional_note || '')
      } else {
        setMessage('Hero Obsidia tidak ditemukan di database')
      }
    } catch (error) {
      console.error('Error fetching Obsidia data:', error)
      setMessage('Gagal memuat data Obsidia')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/admin/add_additional_note', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hero_name: 'Obsidia',
          additional_note: additionalNote
        })
      })

      const result = await response.json()

      if (response.ok) {
        setMessage('Additional note berhasil disimpan!')
        setExistingNote(additionalNote)
        // Redirect ke halaman hero detail setelah 2 detik
        setTimeout(() => {
          router.push('/hero/Obsidia')
        }, 2000)
      } else {
        setMessage(`Error: ${result.error || 'Gagal menyimpan additional note'}`)
      }
    } catch (error) {
      console.error('Error saving additional note:', error)
      setMessage('Terjadi kesalahan saat menyimpan data')
    } finally {
      setLoading(false)
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Additional Note untuk Obsidia
            </h1>
            <p className="text-gray-600">
              Tambahkan catatan tambahan untuk hero Obsidia
            </p>
          </div>

          {message && (
            <div className={`mb-4 p-4 rounded-md ${
              message.includes('Error') || message.includes('Gagal') || message.includes('tidak ditemukan')
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="additionalNote" className="block text-sm font-medium text-gray-700 mb-2">
                Additional Note
              </label>
              <textarea
                id="additionalNote"
                rows={6}
                value={additionalNote}
                onChange={(e) => setAdditionalNote(e.target.value)}
                placeholder="Masukkan catatan tambahan untuk Obsidia..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
              />
              <p className="mt-1 text-sm text-gray-500">
                Catatan ini akan ditampilkan di halaman detail Obsidia
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Menyimpan...
                  </div>
                ) : (
                  'Simpan Additional Note'
                )}
              </button>
              
              <button
                type="button"
                onClick={() => router.push('/hero/Obsidia')}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Batal
              </button>
            </div>
          </form>

          {existingNote && (
            <div className="mt-6 p-4 bg-gray-50 rounded-md">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Note Saat Ini:</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{existingNote}</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}