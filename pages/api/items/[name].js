import { query } from '../../../lib/db'

export default async function handler(req, res) {
  const raw = Array.isArray(req.query.name) ? req.query.name[0] : req.query.name
  const name = (raw || '').trim()
  if (!name) return res.status(400).json({ error: 'name is required' })

  try {
    if (req.method === 'GET') {
      const rows = await query(
        'SELECT * FROM items WHERE LOWER(item_name) = LOWER(?) LIMIT 1',
        [name]
      )
      if (!rows || rows.length === 0) {
        return res.status(404).json({ error: 'item not found' })
      }
      return res.status(200).json(rows[0])
    }

    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const fields = ['category', 'price', 'description', 'image_url']
      const updates = []
      const params = []
      for (const f of fields) {
        if (Object.prototype.hasOwnProperty.call(body, f)) {
          updates.push(`${f} = ?`)
          params.push(body[f])
        }
      }
      if (updates.length === 0) return res.status(400).json({ error: 'no fields to update' })
      params.push(name)
      await query(`UPDATE items SET ${updates.join(', ')} WHERE LOWER(item_name) = LOWER(?)`, params)
      
      // Return updated item data
      const updatedRows = await query(
        'SELECT * FROM items WHERE LOWER(item_name) = LOWER(?) LIMIT 1',
        [name]
      )
      if (updatedRows && updatedRows.length > 0) {
        return res.status(200).json(updatedRows[0])
      }
      return res.status(200).json({ ok: true })
    }

    res.setHeader('Allow', 'GET, PUT')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    console.error('[DEBUG] Database error:', e)
    return res.status(500).json({ error: 'Server error', details: e.message })
  }
}
