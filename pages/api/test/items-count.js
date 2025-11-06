import { query } from '../../../lib/db'

export default async function handler(req, res) {
  try {
    console.log('[TEST] Checking items in database...')
    
    // Test query to count items
    const countResult = await query('SELECT COUNT(*) as total FROM items')
    const totalItems = countResult[0]?.total || 0
    
    console.log(`[TEST] Total items in database: ${totalItems}`)
    
    // Get sample items
    const sampleItems = await query('SELECT item_name, category, price FROM items LIMIT 5')
    
    console.log('[TEST] Sample items:', sampleItems)
    
    return res.status(200).json({
      success: true,
      totalItems: totalItems,
      sampleItems: sampleItems,
      message: totalItems > 0 ? 'Items found in database' : 'No items in database'
    })
  } catch (e) {
    console.error('[TEST] Error:', e.message)
    return res.status(500).json({
      error: e.message,
      code: e.code,
      sqlMessage: e.sqlMessage
    })
  }
}
