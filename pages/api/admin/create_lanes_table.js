import { query } from '../../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    await query(`
      CREATE TABLE IF NOT EXISTS lanes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lane_name VARCHAR(50) NOT NULL UNIQUE,
        description TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_lane_name (lane_name)
      );
    `)
    return res.status(200).json({ ok: true, message: 'lanes table created successfully' })
  } catch (e) {
    console.error('[create_lanes_table] error:', e)
    return res.status(500).json({ error: 'Server error', details: e.message })
  }
}
