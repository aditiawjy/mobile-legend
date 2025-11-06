import { query } from '../../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Get distinct categories from items table
    const rows = await query(
      'SELECT DISTINCT category FROM items WHERE category IS NOT NULL AND category != "" ORDER BY category ASC'
    )

    const categories = rows.map(row => row.category)

    res.status(200).json({
      categories,
      count: categories.length
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    res.status(200).json({ categories: [], count: 0 })
  }
}
