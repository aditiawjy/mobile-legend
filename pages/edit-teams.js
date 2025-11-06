import { useEffect, useState } from 'react'
import AppLayout from '../components/AppLayout'

const emptyForm = { team_name: '', tag: '', region: '' }

export default function EditTeamsPage() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const [form, setForm] = useState({ ...emptyForm })

  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ ...emptyForm })

  const load = async () => {
    setLoading(true)
    setErr(''); setOk('')
    try {
      const res = await fetch('/api/teams')
      if (!res.ok) throw new Error('Gagal memuat data')
      const rows = await res.json()
      setList(Array.isArray(rows) ? rows : [])
    } catch (e) {
      setErr(e.message || 'Error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const onChange = (key, value) => setForm(prev => ({ ...prev, [key]: value }))
  const onEditChange = (key, value) => setEditForm(prev => ({ ...prev, [key]: value }))

  const submitNew = async (e) => {
    e.preventDefault()
    setSaving(true)
    setErr(''); setOk('')
    try {
      if (!form.team_name.trim()) throw new Error('Team name wajib diisi')
      const res = await fetch('/api/teams', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
      })
      if (!res.ok) throw new Error('Gagal menambah team')
      setOk('Team berhasil ditambahkan')
      setForm({ ...emptyForm })
      await load()
    } catch (e) {
      setErr(e.message || 'Error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppLayout>
      <div className="bg-gradient-to-br from-yellow-50 via-white to-emerald-50 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-8">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Master Teams</h1>
          <div className="flex items-center gap-2">
            <a href="/?showAll=true" className="text-sm inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-200 text-gray-700 bg-white hover:bg-gray-100">Heroes</a>
            <a href="/items" className="text-sm inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-200 text-gray-700 bg-white hover:bg-gray-100">Items</a>
            <a href="/edit-matches" className="text-sm inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-200 text-gray-700 bg-white hover:bg-gray-100">Matches</a>
            <a href="/edit-teams" className="text-sm inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-indigo-200 text-indigo-700 bg-white">Teams</a>
          </div>
        </header>

        <section className="bg-white rounded-2xl shadow border border-gray-100 p-4 md:p-6">
          <h2 className="text-lg font-semibold text-gray-800">Tambah Team</h2>
          {loading && <p className="text-sm text-gray-500 mt-2">Memuat data...</p>}
          {err && <p className="text-sm text-red-600 mt-2">{err}</p>}
          {ok && <p className="text-sm text-green-600 mt-2">{ok}</p>}

          <form onSubmit={submitNew} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Team Name</label>
                <input value={form.team_name} onChange={(e) => onChange('team_name', e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:ring-black" placeholder="Contoh: EVOS" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tag</label>
                <input value={form.tag} onChange={(e) => onChange('tag', e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:ring-black" placeholder="EVOS" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Region</label>
                <input value={form.region} onChange={(e) => onChange('region', e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:ring-black" placeholder="ID" />
              </div>
            </div>
            <div>
              <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50">
                {saving ? 'Menyimpan...' : 'Tambah Team'}
              </button>
            </div>
          </form>
        </section>

        <section className="mt-8 bg-white rounded-2xl shadow border border-gray-100 p-4 md:p-6">
          <h2 className="text-lg font-semibold text-gray-800">Daftar Teams</h2>
          {list.length === 0 ? (
            <p className="text-sm text-gray-500 mt-2">Belum ada data.</p>
          ) : (
            <ul className="mt-3 divide-y divide-gray-100">
              {list.map((row) => {
                const isEditing = editingId === row.id
                return (
                  <li key={row.id} className="py-3">
                    {!isEditing ? (
                      <div>
                        <p className="text-sm font-medium text-gray-800">{row.team_name}</p>
                        <p className="text-xs text-gray-600">Tag: {row.tag || '-'} | Region: {row.region || '-'}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <button type="button" className="text-xs px-2 py-1 rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-100" onClick={() => { setEditingId(row.id); setEditForm({ team_name: row.team_name || '', tag: row.tag || '', region: row.region || '' }) }}>Edit</button>
                          <button type="button" className="text-xs px-2 py-1 rounded-md border border-red-200 bg-white text-red-600 hover:bg-red-50" onClick={async () => {
                            if (!confirm('Hapus team ini?')) return
                            try {
                              const resp = await fetch(`/api/teams/${row.id}`, { method: 'DELETE' })
                              if (!resp.ok) throw new Error('Gagal menghapus')
                              setList(prev => prev.filter(x => x.id !== row.id))
                            } catch (e) { alert(e.message || 'Error') }
                          }}>Hapus</button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-600">Team Name</label>
                            <input value={editForm.team_name} onChange={(e) => onEditChange('team_name', e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:ring-black" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600">Tag</label>
                            <input value={editForm.tag} onChange={(e) => onEditChange('tag', e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:ring-black" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600">Region</label>
                            <input value={editForm.region} onChange={(e) => onEditChange('region', e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:ring-black" />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button type="button" className="text-xs px-2 py-1 rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-100" onClick={() => { setEditingId(null); setEditForm({ ...emptyForm }) }}>Batal</button>
                          <button type="button" className="text-xs px-2 py-1 rounded-md bg-purple-600 text-white hover:bg-purple-700" onClick={async () => {
                            try {
                              if (!editForm.team_name.trim()) throw new Error('Team name wajib diisi')
                              const resp = await fetch(`/api/teams/${row.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm) })
                              if (!resp.ok) throw new Error('Gagal menyimpan')
                              setList(prev => prev.map(x => x.id === row.id ? { ...x, ...editForm } : x))
                              setEditingId(null)
                              setEditForm({ ...emptyForm })
                            } catch (e) { alert(e.message || 'Error') }
                          }}>Simpan</button>
                        </div>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>
        </div>
      </div>
    </AppLayout>
  )
}
