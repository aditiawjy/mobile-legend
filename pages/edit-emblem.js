import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import AppLayout from '../components/AppLayout'

export default function EditEmblemPage() {
  const router = useRouter()
  const { id } = router.query
  
  const [formData, setFormData] = useState({
    name: '',
    attributes: '',
    talent1: '',
    talent2: '',
    talent3: ''
  })
  const [loading, setLoading] = useState(false)
  const [isEdit, setIsEdit] = useState(false)

  useEffect(() => {
    if (id && id !== 'new') {
      setIsEdit(true)
      fetchEmblem()
    }
  }, [id])

  const fetchEmblem = async () => {
    try {
      const res = await fetch(`/api/emblems/${id}`)
      if (res.ok) {
        const data = await res.json()
        setFormData({
          name: data.name || '',
          attributes: data.attributes || '',
          talent1: data.talent1 || '',
          talent2: data.talent2 || '',
          talent3: data.talent3 || ''
        })
      }
    } catch (error) {
      console.error('Error fetching emblem:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = isEdit ? `/api/emblems/${id}` : '/api/emblems'
      const method = isEdit ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        router.push('/emblems')
      } else {
        const error = await res.json()
        alert(error.message || 'Failed to save emblem')
      }
    } catch (error) {
      console.error('Error saving emblem:', error)
      alert('Failed to save emblem')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            {isEdit ? 'Edit Emblem' : 'Add New Emblem'}
          </h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Emblem Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter emblem name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attributes
              </label>
              <textarea
                name="attributes"
                value={formData.attributes}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter attributes (e.g., hp +240, attack +18.40)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Talent Slot 1 Options
              </label>
              <textarea
                name="talent1"
                value={formData.talent1}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter talent slot 1 options"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Talent Slot 2 Options
              </label>
              <textarea
                name="talent2"
                value={formData.talent2}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter talent slot 2 options"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Talent Slot 3 Options
              </label>
              <textarea
                name="talent3"
                value={formData.talent3}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter talent slot 3 options"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : (isEdit ? 'Update Emblem' : 'Create Emblem')}
              </button>
              
              <button
                type="button"
                onClick={() => router.push('/emblems')}
                className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  )
}