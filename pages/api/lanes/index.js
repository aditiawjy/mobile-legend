import { query } from '../../../lib/db'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const lanes = await query('SELECT * FROM lanes ORDER BY id')
      return res.status(200).json(lanes)
    } catch (e) {
      console.error('[lanes GET] error:', e)
      return res.status(200).json([])
    }
  }

  res.setHeader('Allow', 'GET')
  return res.status(405).json({ error: 'Method not allowed' })
}
