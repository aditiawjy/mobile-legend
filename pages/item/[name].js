import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import AppLayout from '../../components/AppLayout'
import LazyImage from '../../components/LazyImage'

export default function ItemDetailPage() {
  const router = useRouter()
  const name = typeof router.query.name === 'string' ? router.query.name : ''
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    description: '',
    price: '',
    attack: '',
    attack_speed: '',
    crit_chance: '',
    armor_pen: '',
    spell_vamp: '',
    magic_power: '',
    hp: '',
    armor: '',
    magic_resist: '',
    movement_speed: '',
    cooldown_reduction: '',
    mana_regen: '',
    hp_regen: ''
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    const load = async () => {
      if (!name) return
      setLoading(true)
      try {
        const res = await fetch(`/api/items/${encodeURIComponent(name)}`)
        const data = res.ok ? await res.json() : null
        setDetail(data && (data.item_name || data.name) ? data : null)
        if (data) {
          setEditData({
            description: data.description || '',
            price: data.price != null ? data.price : '',
            attack: data.attack != null ? data.attack : '',
            attack_speed: data.attack_speed != null ? data.attack_speed : '',
            crit_chance: data.crit_chance != null ? data.crit_chance : '',
            armor_pen: data.armor_pen != null ? data.armor_pen : '',
            spell_vamp: data.spell_vamp != null ? data.spell_vamp : '',
            magic_power: data.magic_power != null ? data.magic_power : '',
            hp: data.hp != null ? data.hp : '',
            armor: data.armor != null ? data.armor : '',
            magic_resist: data.magic_resist != null ? data.magic_resist : '',
            movement_speed: data.movement_speed != null ? data.movement_speed : '',
            cooldown_reduction: data.cooldown_reduction != null ? data.cooldown_reduction : '',
            mana_regen: data.mana_regen != null ? data.mana_regen : '',
            hp_regen: data.hp_regen != null ? data.hp_regen : ''
          })
        }
      } catch {
        setDetail(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [name])

  const handleSave = async () => {
    if (!detail) return
    setIsSaving(true)
    setSaveMessage('')
    try {
      const payload = {
        description: editData.description,
        price: editData.price ? parseInt(editData.price) : null,
        attack: editData.attack ? parseInt(editData.attack) : null,
        attack_speed: editData.attack_speed ? parseFloat(editData.attack_speed) : null,
        crit_chance: editData.crit_chance ? parseFloat(editData.crit_chance) : null,
        armor_pen: editData.armor_pen ? parseFloat(editData.armor_pen) : null,
        spell_vamp: editData.spell_vamp ? parseFloat(editData.spell_vamp) : null,
        magic_power: editData.magic_power ? parseInt(editData.magic_power) : null,
        hp: editData.hp ? parseInt(editData.hp) : null,
        armor: editData.armor ? parseInt(editData.armor) : null,
        magic_resist: editData.magic_resist ? parseInt(editData.magic_resist) : null,
        movement_speed: editData.movement_speed ? parseInt(editData.movement_speed) : null,
        cooldown_reduction: editData.cooldown_reduction ? parseFloat(editData.cooldown_reduction) : null,
        mana_regen: editData.mana_regen ? parseInt(editData.mana_regen) : null,
        hp_regen: editData.hp_regen ? parseInt(editData.hp_regen) : null
      }
      
      const res = await fetch(`/api/items/${encodeURIComponent(name)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        const updated = await res.json()
        setDetail(updated)
        setIsEditing(false)
        setSaveMessage('✓ Item berhasil diperbarui')
        setTimeout(() => setSaveMessage(''), 3000)
      } else {
        setSaveMessage('✗ Gagal menyimpan perubahan')
      }
    } catch (err) {
      setSaveMessage('✗ Error: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AppLayout>
      <div className="bg-gradient-to-br from-blue-50 via-white to-green-50 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                {name ? `Item Detail: ${name}` : 'Item Detail'}
              </h1>
              <p className="text-gray-600 mt-1">Informasi detail item.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push(`/compare-items?item1=${encodeURIComponent(name)}`)}
                className="text-sm inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100"
              >
                ⚖️ Compare
              </button>
              <button
                onClick={() => router.push('/items?showAll=true')}
                className="text-sm inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-200 text-gray-700 bg-white hover:bg-gray-100"
              >
                All Items
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
                <span className="ml-2 text-gray-600">Memuat detail item...</span>
              </div>
            ) : detail ? (
              <div>
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    <LazyImage
                      src={detail.image_url}
                      alt={detail.item_name || name}
                      containerClassName="w-20 h-20"
                      className="w-full h-full object-cover rounded-full"
                    />
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">{detail.item_name || name}</h2>
                      {detail.category && (
                        <p className="text-sm text-gray-600 mt-1">Category: {detail.category}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      isEditing
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isEditing ? 'Batal' : '✏️ Edit'}
                  </button>
                </div>

                {saveMessage && (
                  <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${
                    saveMessage.startsWith('✓') 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {saveMessage}
                  </div>
                )}

                {isEditing ? (
                  <div className="space-y-4">
                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea
                        value={editData.description}
                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows="3"
                        placeholder="Masukkan deskripsi item..."
                      />
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Price (Gold)</label>
                        <input type="number" value={editData.price} onChange={(e) => setEditData({ ...editData, price: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="0" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Attack</label>
                        <input type="number" value={editData.attack} onChange={(e) => setEditData({ ...editData, attack: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="0" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Attack Speed</label>
                        <input type="number" step="0.01" value={editData.attack_speed} onChange={(e) => setEditData({ ...editData, attack_speed: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="0.00" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Crit Chance</label>
                        <input type="number" step="0.01" value={editData.crit_chance} onChange={(e) => setEditData({ ...editData, crit_chance: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="0.00" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Armor Penetration</label>
                        <input type="number" step="0.01" value={editData.armor_pen} onChange={(e) => setEditData({ ...editData, armor_pen: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="0.00" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Spell Vamp</label>
                        <input type="number" step="0.01" value={editData.spell_vamp} onChange={(e) => setEditData({ ...editData, spell_vamp: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="0.00" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Magic Power</label>
                        <input type="number" value={editData.magic_power} onChange={(e) => setEditData({ ...editData, magic_power: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="0" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">HP</label>
                        <input type="number" value={editData.hp} onChange={(e) => setEditData({ ...editData, hp: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="0" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Physical Defense</label>
                        <input type="number" value={editData.armor} onChange={(e) => setEditData({ ...editData, armor: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="0" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Magic Defense</label>
                        <input type="number" value={editData.magic_resist} onChange={(e) => setEditData({ ...editData, magic_resist: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="0" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Movement Speed</label>
                        <input type="number" value={editData.movement_speed} onChange={(e) => setEditData({ ...editData, movement_speed: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="0" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cooldown Reduction</label>
                        <input type="number" step="0.01" value={editData.cooldown_reduction} onChange={(e) => setEditData({ ...editData, cooldown_reduction: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="0.00" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mana Regen</label>
                        <input type="number" value={editData.mana_regen} onChange={(e) => setEditData({ ...editData, mana_regen: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="0" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">HP Regen</label>
                        <input type="number" value={editData.hp_regen} onChange={(e) => setEditData({ ...editData, hp_regen: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="0" />
                      </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-2 justify-end pt-4">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        Batal
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                      >
                        {isSaving ? 'Menyimpan...' : 'Simpan'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                    {/* Description */}
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs font-semibold text-gray-500 uppercase">Description</p>
                      <p className="text-gray-700 mt-1 text-sm">{detail.description || '-'}</p>
                    </div>

                    {/* Price */}
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs font-semibold text-gray-500 uppercase">Price</p>
                      <p className="text-gray-700 mt-1 text-sm">{detail.price != null ? `${detail.price} gold` : '-'}</p>
                    </div>

                    {/* Attack */}
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs font-semibold text-gray-500 uppercase">Attack</p>
                      <p className="text-gray-700 mt-1 text-sm">{detail.attack || '-'}</p>
                    </div>

                    {/* Attack Speed */}
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs font-semibold text-gray-500 uppercase">Attack Speed</p>
                      <p className="text-gray-700 mt-1 text-sm">{detail.attack_speed || '-'}</p>
                    </div>

                    {/* Crit Chance */}
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs font-semibold text-gray-500 uppercase">Crit Chance</p>
                      <p className="text-gray-700 mt-1 text-sm">{detail.crit_chance || '-'}</p>
                    </div>

                    {/* Armor Penetration */}
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs font-semibold text-gray-500 uppercase">Armor Pen</p>
                      <p className="text-gray-700 mt-1 text-sm">{detail.armor_pen || '-'}</p>
                    </div>

                    {/* Spell Vamp */}
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs font-semibold text-gray-500 uppercase">Spell Vamp</p>
                      <p className="text-gray-700 mt-1 text-sm">{detail.spell_vamp || '-'}</p>
                    </div>

                    {/* Magic Power */}
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs font-semibold text-gray-500 uppercase">Magic Power</p>
                      <p className="text-gray-700 mt-1 text-sm">{detail.magic_power || '-'}</p>
                    </div>

                    {/* HP */}
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs font-semibold text-gray-500 uppercase">HP</p>
                      <p className="text-gray-700 mt-1 text-sm">{detail.hp || '-'}</p>
                    </div>

                    {/* Physical Defense */}
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs font-semibold text-gray-500 uppercase">Physical Defense</p>
                      <p className="text-gray-700 mt-1 text-sm">{detail.armor || '-'}</p>
                    </div>

                    {/* Magic Defense */}
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs font-semibold text-gray-500 uppercase">Magic Defense</p>
                      <p className="text-gray-700 mt-1 text-sm">{detail.magic_resist || '-'}</p>
                    </div>

                    {/* Movement Speed */}
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs font-semibold text-gray-500 uppercase">Movement Speed</p>
                      <p className="text-gray-700 mt-1 text-sm">{detail.movement_speed || '-'}</p>
                    </div>

                    {/* Cooldown Reduction */}
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs font-semibold text-gray-500 uppercase">Cooldown Reduction</p>
                      <p className="text-gray-700 mt-1 text-sm">{detail.cooldown_reduction || '-'}</p>
                    </div>

                    {/* Mana Regen */}
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs font-semibold text-gray-500 uppercase">Mana Regen</p>
                      <p className="text-gray-700 mt-1 text-sm">{detail.mana_regen || '-'}</p>
                    </div>

                    {/* HP Regen */}
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs font-semibold text-gray-500 uppercase">HP Regen</p>
                      <p className="text-gray-700 mt-1 text-sm">{detail.hp_regen || '-'}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600">Item tidak ditemukan.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
