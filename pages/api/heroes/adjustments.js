import { query } from '../../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const limit = parseInt(req.query.limit) || 10
    const sort = req.query.sort || 'date_desc'

    // Build order clause
    let orderClause = 'ORDER BY adjustment_date DESC'
    if (sort === 'date_asc') {
      orderClause = 'ORDER BY adjustment_date ASC'
    } else if (sort === 'hero_name') {
      orderClause = 'ORDER BY hero_name ASC'
    }

    // Fetch latest adjustments
    const adjustments = await query(
      `SELECT hero_name, description, adjustment_date, season 
       FROM hero_adjustments 
       ${orderClause}
       LIMIT ?`,
      [Math.min(limit, 50)] // Max 50 to prevent abuse
    )

    if (!adjustments) {
      return res.status(200).json([])
    }

    return res.status(200).json(adjustments)
  } catch (e) {
    console.error('[ADJUSTMENTS] error:', e)
    return res.status(500).json({ error: 'Server error' })
  }
}
