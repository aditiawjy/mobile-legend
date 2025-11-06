import { query } from '../../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Support pagination
    const fetchAll = req.query.fetchAll === 'true' // New parameter to fetch all items
    const limit = fetchAll ? 10000 : (parseInt(req.query.limit) || 20)
    const offset = parseInt(req.query.offset) || 0

    // Filter & Sort parameters
    const category = typeof req.query.category === 'string' ? req.query.category.trim() : ''
    const sortBy = req.query.sortBy || 'name' // name, price
    const sortOrder = req.query.sortOrder === 'desc' ? 'DESC' : 'ASC'
    const minPrice = req.query.minPrice ? parseInt(req.query.minPrice) : null
    const maxPrice = req.query.maxPrice ? parseInt(req.query.maxPrice) : null

    // Build WHERE clause
    const whereConditions = []
    const params = []

    if (category) {
      whereConditions.push('category = ?')
      params.push(category)
    }

    if (minPrice !== null) {
      whereConditions.push('price >= ?')
      params.push(minPrice)
    }

    if (maxPrice !== null) {
      whereConditions.push('price <= ?')
      params.push(maxPrice)
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : ''

    // Build ORDER BY clause
    let orderByClause = 'ORDER BY '
    if (sortBy === 'price') {
      orderByClause += `price ${sortOrder}, item_name ASC`
    } else {
      orderByClause += `item_name ${sortOrder}`
    }

    // Get total count with filters
    const countQuery = `SELECT COUNT(*) as total FROM items ${whereClause}`
    const countResult = await query(countQuery, params)
    const total = countResult[0]?.total || 0

    // Get paginated items with filters and sorting
    const selectQuery = `
      SELECT * 
      FROM items 
      ${whereClause}
      ${orderByClause}
      LIMIT ? OFFSET ?
    `
    const rows = await query(selectQuery, [...params, limit, offset])

    res.status(200).json({
      items: rows,
      total,
      limit,
      offset,
      hasMore: offset + rows.length < total,
      filters: {
        category,
        sortBy,
        sortOrder,
        minPrice,
        maxPrice
      }
    })
  } catch (error) {
    console.error('Error fetching all items:', error)
    res.status(200).json({ items: [], total: 0, limit: 20, offset: 0, hasMore: false })
  }
}
