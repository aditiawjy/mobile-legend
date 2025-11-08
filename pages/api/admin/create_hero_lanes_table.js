import { query } from '../../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    await query(`
      CREATE TABLE IF NOT EXISTS hero_lanes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        hero_name VARCHAR(100) NOT NULL,
        lane_id INT NOT NULL,
        priority TINYINT DEFAULT 1 COMMENT '1=primary, 2=secondary, 3=situational',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_hero_lane (hero_name, lane_id),
        INDEX idx_hero_name (hero_name),
        INDEX idx_lane_id (lane_id),
        CONSTRAINT fk_hero_lanes_hero FOREIGN KEY (hero_name) REFERENCES heroes(hero_name)
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_hero_lanes_lane FOREIGN KEY (lane_id) REFERENCES lanes(id)
          ON DELETE CASCADE ON UPDATE CASCADE
      );
    `)
    return res.status(200).json({ ok: true, message: 'hero_lanes table created successfully' })
  } catch (e) {
    console.error('[create_hero_lanes_table] error:', e)
    return res.status(500).json({ error: 'Server error', details: e.message })
  }
}
