import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import AppLayout from '../components/AppLayout'
import { useToast } from '../components/Toast'

export default function AddHeroPage() {
  const router = useRouter()
  const { addToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [formData, setFormData] = useState({
    hero_name: '',
    role: '',
    damage_type: '',
    attack_reliance: '',
    note: '',
  })

  const [roles, setRoles] = useState([])
  const [damageTypes, setDamageTypes] = useState([])
  const [attackReliances, setAttackReliances] = useState([])

  // Fetch dropdown options from database
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoadingOptions(true)
        console.log('Fetching all heroes from database...')
        const res = await fetch('/api/heroes')
        
        if (!res.ok) {
          console.error(`API error: ${res.status} ${res.statusText}`)
          const errorText = await res.text()
          console.error('Error response:', errorText)
          setLoadingOptions(false)
          return
        }
        
        const heroes = await res.json()
        console.log(`Received ${heroes.length} heroes from database`)
        
        if (!Array.isArray(heroes)) {
          console.error('Expected array of heroes, got:', typeof heroes)
          setLoadingOptions(false)
          return
        }
        
        // Extract unique values
        const uniqueRoles = [...new Set(heroes.map(h => h.role).filter(Boolean))].sort()
        const uniqueDamageTypes = [...new Set(heroes.map(h => h.damage_type).filter(Boolean))].sort()
        const uniqueAttackReliances = [...new Set(heroes.map(h => h.attack_reliance).filter(Boolean))].sort()
        
        console.log('Options loaded:', {
          roles: uniqueRoles.length,
          damageTypes: uniqueDamageTypes.length,
          attackReliances: uniqueAttackReliances.length
        })
        
        setRoles(uniqueRoles)
        setDamageTypes(uniqueDamageTypes)
        setAttackReliances(uniqueAttackReliances)
      } catch (error) {
        console.error('Error fetching options:', error.message)
        console.error('Full error:', error)
      } finally {
        setLoadingOptions(false)
      }
    }

    fetchOptions()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.hero_name.trim()) {
      addToast({
        type: 'error',
        title: 'Error!',
        message: 'Nama hero tidak boleh kosong',
        duration: 3000
      })
      return
    }

    setLoading(true)
    try {
      console.log('Submitting form data:', formData)
      
      const res = await fetch('/api/heroes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      console.log('Response status:', res.status)
      const data = await res.json()
      console.log('Response data:', data)

      if (!res.ok) {
        const errorMsg = data.error || `Server error: ${res.status}`
        console.error('API error:', errorMsg)
        throw new Error(errorMsg)
      }

      addToast({
        type: 'success',
        title: 'Success!',
        message: `Hero ${formData.hero_name} berhasil dibuat`,
        duration: 3000
      })

      // Redirect to edit skills for the new hero
      setTimeout(() => {
        router.push(`/edit-skills?name=${encodeURIComponent(formData.hero_name)}`)
      }, 500)
    } catch (error) {
      console.error('Error creating hero:', error)
      addToast({
        type: 'error',
        title: 'Error!',
        message: error.message || 'Gagal membuat hero',
        duration: 5000
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout>
      <div className="bg-gradient-to-br from-sky-50 via-white to-blue-50 min-h-screen">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Tambah Hero Baru</h1>
            <p className="mt-2 text-gray-600">Buat hero baru di database Mobile Legends</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <form onSubmit={handleSubmit} className="">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Hero Name */}
                <div className="space-y-2 md:col-span-2">
                <label htmlFor="hero_name" className="block text-sm font-medium text-gray-700">
                  Nama Hero <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="hero_name"
                  name="hero_name"
                  value={formData.hero_name}
                  onChange={handleChange}
                  placeholder="Contoh: Miya, Gusion, Lancelot"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500">
                  Masukkan nama hero dengan benar (tidak boleh duplikat)
                </p>
              </div>

              {/* Role */}
              <div className="space-y-2">
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  Role (Opsional)
                </label>
                {loadingOptions ? (
                  <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 flex items-center text-sm text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-sky-600 mr-2"></div>
                    Loading...
                  </div>
                ) : roles.length > 0 ? (
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
                    disabled={loading}
                  >
                    <option value="">Pilih role...</option>
                    {roles.map(role => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    placeholder="Masukkan role (e.g., Warrior, Mage)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
                    disabled={loading}
                  />
                )}
                <p className="text-xs text-gray-500">
                  {roles.length > 0 ? 'Pilih dari daftar atau biarkan kosong' : 'Tidak ada data dari database, ketik manual'}
                </p>
              </div>

              {/* Damage Type */}
              <div className="space-y-2">
                <label htmlFor="damage_type" className="block text-sm font-medium text-gray-700">
                  Damage Type (Opsional)
                </label>
                {loadingOptions ? (
                  <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 flex items-center text-sm text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-sky-600 mr-2"></div>
                    Loading...
                  </div>
                ) : damageTypes.length > 0 ? (
                  <select
                    id="damage_type"
                    name="damage_type"
                    value={formData.damage_type}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
                    disabled={loading}
                  >
                    <option value="">Pilih damage type...</option>
                    {damageTypes.map(type => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    name="damage_type"
                    value={formData.damage_type}
                    onChange={handleChange}
                    placeholder="Masukkan damage type (e.g., Physical, Magical)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
                    disabled={loading}
                  />
                )}
                <p className="text-xs text-gray-500">
                  {damageTypes.length > 0 ? 'Jenis damage yang dihasilkan hero' : 'Tidak ada data dari database, ketik manual'}
                </p>
              </div>

              {/* Attack Reliance */}
              <div className="space-y-2">
                <label htmlFor="attack_reliance" className="block text-sm font-medium text-gray-700">
                  Attack Reliance (Opsional)
                </label>
                {loadingOptions ? (
                  <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 flex items-center text-sm text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-sky-600 mr-2"></div>
                    Loading...
                  </div>
                ) : attackReliances.length > 0 ? (
                  <select
                    id="attack_reliance"
                    name="attack_reliance"
                    value={formData.attack_reliance}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
                    disabled={loading}
                  >
                    <option value="">Pilih attack reliance...</option>
                    {attackReliances.map(reliance => (
                      <option key={reliance} value={reliance}>
                        {reliance}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    name="attack_reliance"
                    value={formData.attack_reliance}
                    onChange={handleChange}
                    placeholder="Masukkan attack reliance (e.g., Skill, Basic Attack)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
                    disabled={loading}
                  />
                )}
                <p className="text-xs text-gray-500">
                  {attackReliances.length > 0 ? 'Ketergantungan pada basic attack atau skill' : 'Tidak ada data dari database, ketik manual'}
                </p>
              </div>

              {/* Note */}
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="note" className="block text-sm font-medium text-gray-700">
                  Note (Opsional)
                </label>
                <textarea
                  id="note"
                  name="note"
                  value={formData.note}
                  onChange={handleChange}
                  placeholder="Catatan atau deskripsi tambahan tentang hero ini..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
                  rows={4}
                  disabled={loading}
                />
                <p className="text-xs text-gray-500">
                  Catatan atau deskripsi tambahan tentang hero
                </p>
              </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Informasi</h3>
                    <p className="mt-2 text-sm text-blue-700">
                      Setelah membuat hero, Anda akan diarahkan ke halaman edit skills untuk menambahkan deskripsi skill hero ini.
                    </p>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-between pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => router.back()}
                  disabled={loading}
                  className="inline-flex items-center px-6 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center px-6 py-2 bg-sky-600 text-white font-medium rounded-lg hover:bg-sky-700 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Membuat...
                    </>
                  ) : (
                    'Buat Hero'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
