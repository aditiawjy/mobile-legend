export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      return res.status(200).json([])
    }

    if (req.method === 'POST') {
      return res.status(201).json({ ok: true })
    }

    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    console.error('[matches:index] error:', e)
    return res.status(500).json({ error: 'Server error' })
  }
}
