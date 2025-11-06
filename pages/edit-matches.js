import { useEffect, useRef, useState } from 'react'
import HeroAutocomplete from '../components/HeroAutocomplete'

const emptyForm = {
  match_date: '',
  team_a_hero1: '', team_a_hero2: '', team_a_hero3: '', team_a_hero4: '', team_a_hero5: '',
  team_b_hero1: '', team_b_hero2: '', team_b_hero3: '', team_b_hero4: '', team_b_hero5: '',
  score_a: 0, score_b: 0,
  result: 'team_a',
}

export default function EditMatchesPage() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const [form, setForm] = useState({ ...emptyForm })

  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ ...emptyForm })

  useEffect(() => {
    let ignore = false
    const run = async () => {
      setLoading(true)
      setErr(''); setOk('')
      try {
        const res = await fetch('/api/matches')
        if (!res.ok) throw new Error('Gagal memuat data')
        const rows = await res.json()
        if (!ignore) setList(Array.isArray(rows) ? rows : [])
      } catch (e) {
        setErr(e.message || 'Error')
      } finally {
        setLoading(false)
      }
    }
    run()
    return () => { ignore = true }
  }, [])

  const onChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }
  const onEditChange = (key, value) => {
    setEditForm(prev => ({ ...prev, [key]: value }))
  }

  const submitNew = async (e) => {
    e.preventDefault()
    setSaving(true)
    setErr(''); setOk('')
    try {
      const payload = { ...form }
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Gagal menambah match')
      setOk('Match berhasil ditambahkan')
      setForm({ ...emptyForm })
      // refresh list
      const r = await fetch('/api/matches')
      if (r.ok) {
        const rows = await r.json()
        setList(Array.isArray(rows) ? rows : [])
      }
    } catch (e) {
      setErr(e.message || 'Error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Edit Matches</h1>
          <div className="flex items-center gap-2">
            <a href="/" className="text-sm inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-200 text-gray-700 bg-white hover:bg-gray-100">Home</a>
            <a href="/items" className="text-sm inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-200 text-gray-700 bg-white hover:bg-gray-100">Items</a>
          </div>
        </header>

        <section className="bg-white rounded-2xl shadow border border-gray-100 p-4 md:p-6">
          <h2 className="text-lg font-semibold text-gray-800">Tambah Match</h2>

          {loading && <p className="text-sm text-gray-500 mt-2">Memuat data...</p>}
          {err && <p className="text-sm text-red-600 mt-2">{err}</p>}
          {ok && <p className="text-sm text-green-600 mt-2">{ok}</p>}

          <form onSubmit={submitNew} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tanggal</label>
                <input type="date" value={form.match_date} onChange={(e) => onChange('match_date', e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:ring-black" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Score A</label>
                <input type="number" value={form.score_a} onChange={(e) => onChange('score_a', e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:ring-black" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Score B</label>
                <input type="number" value={form.score_b} onChange={(e) => onChange('score_b', e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:ring-black" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Result</label>
                <select value={form.result} onChange={(e) => onChange('result', e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:ring-black">
                  <option value="team_a">Team A</option>
                  <option value="team_b">Team B</option>
                  <option value="draw">Draw</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-800">Team A Picks</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  {[1,2,3,4,5].map(i => (
                    <HeroAutocomplete
                      key={i}
                      value={form[`team_a_hero${i}`]}
                      onChange={(value) => onChange(`team_a_hero${i}`, value)}
                      placeholder={`Hero ${i}`}
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Team B Picks</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  {[1,2,3,4,5].map(i => (
                    <HeroAutocomplete
                      key={i}
                      value={form[`team_b_hero${i}`]}
                      onChange={(value) => onChange(`team_b_hero${i}`, value)}
                      placeholder={`Hero ${i}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50">
                {saving ? 'Menyimpan...' : 'Tambah Match'}
              </button>
            </div>
          </form>
        </section>

        <section className="mt-8 bg-white rounded-2xl shadow border border-gray-100 p-4 md:p-6">
          <h2 className="text-lg font-semibold text-gray-800">Daftar Matches</h2>
          {list.length === 0 ? (
            <p className="text-sm text-gray-500 mt-2">Belum ada data.</p>
          ) : (
            <ul className="mt-3 divide-y divide-gray-100">
              {list.map((row) => {
                const isEditing = editingId === row.id
                return (
                  <li key={row.id} className="py-4">
                    {!isEditing ? (
                      <div>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                          <span className="font-medium text-gray-800">{row.match_date || '-'}</span>
                          <span>Result: <span className="font-medium">{row.result || '-'}</span></span>
                          <span>Score: <span className="font-medium">{row.score_a} - {row.score_b}</span></span>
                        </div>
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-gray-500">Team A</p>
                            <p className="text-gray-800">{[row.team_a_hero1,row.team_a_hero2,row.team_a_hero3,row.team_a_hero4,row.team_a_hero5].filter(Boolean).join(', ') || '-'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Team B</p>
                            <p className="text-gray-800">{[row.team_b_hero1,row.team_b_hero2,row.team_b_hero3,row.team_b_hero4,row.team_b_hero5].filter(Boolean).join(', ') || '-'}</p>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <button type="button" className="text-xs px-2 py-1 rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-100" onClick={() => { setEditingId(row.id); setEditForm({
                            match_date: row.match_date || '',
                            team_a_hero1: row.team_a_hero1 || '', team_a_hero2: row.team_a_hero2 || '', team_a_hero3: row.team_a_hero3 || '', team_a_hero4: row.team_a_hero4 || '', team_a_hero5: row.team_a_hero5 || '',
                            team_b_hero1: row.team_b_hero1 || '', team_b_hero2: row.team_b_hero2 || '', team_b_hero3: row.team_b_hero3 || '', team_b_hero4: row.team_b_hero4 || '', team_b_hero5: row.team_b_hero5 || '',
                            score_a: row.score_a ?? 0, score_b: row.score_b ?? 0,
                            result: row.result || 'team_a',
                          }) }}>Edit</button>
                          <button type="button" className="text-xs px-2 py-1 rounded-md border border-red-200 bg-white text-red-600 hover:bg-red-50" onClick={async () => {
                            if (!confirm('Hapus match ini?')) return
                            try {
                              const resp = await fetch(`/api/matches/${row.id}`, { method: 'DELETE' })
                              if (!resp.ok) throw new Error('Gagal menghapus')
                              setList(prev => prev.filter(x => x.id !== row.id))
                            } catch (e) { alert(e.message || 'Error') }
                          }}>Hapus</button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-600">Tanggal</label>
                            <input type="date" value={editForm.match_date} onChange={(e) => onEditChange('match_date', e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:ring-black" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600">Score A</label>
                            <input type="number" value={editForm.score_a} onChange={(e) => onEditChange('score_a', e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:ring-black" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600">Score B</label>
                            <input type="number" value={editForm.score_b} onChange={(e) => onEditChange('score_b', e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:ring-black" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600">Result</label>
                            <select value={editForm.result} onChange={(e) => onEditChange('result', e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:ring-black">
                              <option value="team_a">Team A</option>
                              <option value="team_b">Team B</option>
                              <option value="draw">Draw</option>
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <p className="text-xs font-medium text-gray-600">Team A Picks</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                              {[1,2,3,4,5].map(i => (
                                <HeroAutocomplete
                                  key={i}
                                  value={editForm[`team_a_hero${i}`]}
                                  onChange={(value) => onEditChange(`team_a_hero${i}`, value)}
                                  placeholder={`Hero ${i}`}
                                />
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-600">Team B Picks</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                              {[1,2,3,4,5].map(i => (
                                <HeroAutocomplete
                                  key={i}
                                  value={editForm[`team_b_hero${i}`]}
                                  onChange={(value) => onEditChange(`team_b_hero${i}`, value)}
                                  placeholder={`Hero ${i}`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button type="button" className="text-xs px-2 py-1 rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-100" onClick={() => { setEditingId(null); setEditForm({ ...emptyForm }) }}>Batal</button>
                          <button type="button" className="text-xs px-2 py-1 rounded-md bg-purple-600 text-white hover:bg-purple-700" onClick={async () => {
                            try {
                              const payload = { ...editForm }
                              const resp = await fetch(`/api/matches/${row.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
                              if (!resp.ok) throw new Error('Gagal menyimpan')
                              setList(prev => prev.map(x => x.id === row.id ? { ...x, ...payload } : x))
                              setEditingId(null)
                              setEditForm({ ...emptyForm })
                            } catch (e) {
                              alert(e.message || 'Error')
                            }
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
    </main>
  )
}
