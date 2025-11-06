import { query } from '../../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    await query(`
      CREATE TABLE IF NOT EXISTS teams (
        id INT AUTO_INCREMENT PRIMARY KEY,
        team_name VARCHAR(100) NOT NULL UNIQUE,
        tag VARCHAR(50) NULL,
        region VARCHAR(100) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_team_name (team_name),
        INDEX idx_region (region)
      );
    `)
    return res.status(200).json({ ok: true, message: 'teams table ensured' })
  } catch (e) {
    console.error('[create_teams_table] error:', e)
    return res.status(500).json({ error: 'Server error', details: e.message })
  }
}
