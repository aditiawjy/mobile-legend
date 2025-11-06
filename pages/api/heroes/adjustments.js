import { query } from '../../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const limit = parseInt(req.query.limit) || 10
    const sort = req.query.sort || 'date_desc'

    // Build order clause
    let orderClause = 'ORDER BY COALESCE(adj_date, created_at) DESC'
    if (sort === 'date_asc') {
      orderClause = 'ORDER BY COALESCE(adj_date, created_at) ASC'
    } else if (sort === 'hero_name') {
      orderClause = 'ORDER BY hero_name ASC'
    }

    // Fetch latest adjustments with better null handling
    const adjustments = await query(
      `SELECT id, hero_name, description, adj_date as adjustment_date, season, created_at
       FROM hero_adjustments 
       WHERE description IS NOT NULL AND description != ''
       ${orderClause}
       LIMIT ?`,
      [Math.min(limit, 50)] // Max 50 to prevent abuse
    )

    console.log(`[ADJUSTMENTS] Fetched ${adjustments ? adjustments.length : 0} adjustments with sort=${sort}`)
    
    if (!adjustments || adjustments.length === 0) {
      console.log('[ADJUSTMENTS] No adjustments found in database')
      return res.status(200).json([])
    }

    return res.status(200).json(adjustments)
  } catch (e) {
    console.error('[ADJUSTMENTS] error:', e)
    return res.status(500).json({ error: 'Server error', details: e.message })
  }
}
