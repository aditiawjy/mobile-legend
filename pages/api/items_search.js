import { query } from '../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const q = typeof req.query.q === 'string' ? req.query.q.trim() : ''
  const category = typeof req.query.category === 'string' ? req.query.category.trim() : ''
  if (!q && !category) return res.status(200).json([])

  try {
    console.log('[items_search] Query:', { q, category })
    
    const like = `%${q}%`
    const params = []
    let sql = 'SELECT item_name, category, price, description FROM items WHERE 1=1'

    if (q) { sql += ' AND item_name LIKE ?'; params.push(like) }
    if (category) { sql += ' AND category = ?'; params.push(category) }

    sql += ' ORDER BY item_name ASC LIMIT 15'

    console.log('[items_search] SQL:', sql, 'Params:', params)
    
    const rows = await query(sql, params)
    
    console.log('[items_search] Found', rows.length, 'items')
    
    // Return array of item names by default for simple autocomplete, but include rich data if requested
    if (req.query.rich === '1') {
      return res.status(200).json(rows)
    }
    const names = rows.map(r => r.item_name)
    return res.status(200).json(names)
  } catch (e) {
    console.error('[items_search] ERROR:', {
      message: e.message,
      code: e.code,
      errno: e.errno,
      sqlState: e.sqlState,
      stack: e.stack
    })
    // Return empty array instead of 500 to prevent infinite error loops
    return res.status(200).json([])
  }
}
