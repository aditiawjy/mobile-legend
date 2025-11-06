import { query } from '../../../lib/db'

export default async function handler(req, res) {
  // Allow both GET and POST for easy browser access
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Check if column already exists
    const columns = await query('SHOW COLUMNS FROM items LIKE "image_url"')
    
    if (columns.length > 0) {
      return res.status(200).json({ 
        message: 'Column image_url already exists',
        alreadyExists: true 
      })
    }

    // Add image_url column
    await query('ALTER TABLE items ADD COLUMN image_url VARCHAR(500) DEFAULT NULL')
    
    return res.status(200).json({ 
      message: 'Column image_url added successfully',
      success: true 
    })
  } catch (error) {
    console.error('Migration error:', error)
    return res.status(500).json({ 
      error: 'Failed to add image_url column', 
      details: error.message 
    })
  }
}
