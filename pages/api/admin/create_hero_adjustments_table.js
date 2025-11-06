import { query } from '../../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Create table if not exists
    await query(`
      CREATE TABLE IF NOT EXISTS hero_adjustments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        hero_name VARCHAR(100) NOT NULL,
        adj_date DATE NULL,
        skill VARCHAR(100) NULL,
        description TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_adj_hero_name (hero_name),
        INDEX idx_adj_date (adj_date),
        CONSTRAINT fk_adj_hero_name FOREIGN KEY (hero_name) REFERENCES heroes(hero_name)
          ON DELETE CASCADE ON UPDATE CASCADE
      );
    `)

    return res.status(200).json({ ok: true, message: 'hero_adjustments table ensured' })
  } catch (e) {
    console.error('[create_hero_adjustments_table] error:', e)
    return res.status(500).json({ error: 'Server error', details: e.message })
  }
}
