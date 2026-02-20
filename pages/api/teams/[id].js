export default async function handler(req, res) {
  const raw = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id
  const id = Number(raw)
  if (!id || Number.isNaN(id)) return res.status(400).json({ error: 'valid id required' })

  try {
    if (req.method === 'GET') {
      return res.status(404).json({ error: 'not found' })
    }

    if (req.method === 'PUT') {
      return res.status(200).json({ ok: true })
    }

    if (req.method === 'DELETE') {
      return res.status(200).json({ ok: true })
    }

    res.setHeader('Allow', 'GET, PUT, DELETE')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    console.error('[teams:id] error:', e)
    return res.status(500).json({ error: 'Server error' })
  }
}
