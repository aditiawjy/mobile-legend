import { query } from '../../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    await query(`
      CREATE TABLE IF NOT EXISTS matches (
        id INT AUTO_INCREMENT PRIMARY KEY,
        match_date DATE NULL,
        team_a_hero1 VARCHAR(100) NULL,
        team_a_hero2 VARCHAR(100) NULL,
        team_a_hero3 VARCHAR(100) NULL,
        team_a_hero4 VARCHAR(100) NULL,
        team_a_hero5 VARCHAR(100) NULL,
        team_b_hero1 VARCHAR(100) NULL,
        team_b_hero2 VARCHAR(100) NULL,
        team_b_hero3 VARCHAR(100) NULL,
        team_b_hero4 VARCHAR(100) NULL,
        team_b_hero5 VARCHAR(100) NULL,
        score_a INT DEFAULT 0,
        score_b INT DEFAULT 0,
        result VARCHAR(10) NOT NULL DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_match_date (match_date),
        INDEX idx_result (result),
        INDEX idx_team_a_hero1 (team_a_hero1),
        INDEX idx_team_a_hero2 (team_a_hero2),
        INDEX idx_team_a_hero3 (team_a_hero3),
        INDEX idx_team_a_hero4 (team_a_hero4),
        INDEX idx_team_a_hero5 (team_a_hero5),
        INDEX idx_team_b_hero1 (team_b_hero1),
        INDEX idx_team_b_hero2 (team_b_hero2),
        INDEX idx_team_b_hero3 (team_b_hero3),
        INDEX idx_team_b_hero4 (team_b_hero4),
        INDEX idx_team_b_hero5 (team_b_hero5),
        CONSTRAINT fk_ma_ta_h1 FOREIGN KEY (team_a_hero1) REFERENCES heroes(hero_name) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_ma_ta_h2 FOREIGN KEY (team_a_hero2) REFERENCES heroes(hero_name) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_ma_ta_h3 FOREIGN KEY (team_a_hero3) REFERENCES heroes(hero_name) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_ma_ta_h4 FOREIGN KEY (team_a_hero4) REFERENCES heroes(hero_name) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_ma_ta_h5 FOREIGN KEY (team_a_hero5) REFERENCES heroes(hero_name) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_ma_tb_h1 FOREIGN KEY (team_b_hero1) REFERENCES heroes(hero_name) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_ma_tb_h2 FOREIGN KEY (team_b_hero2) REFERENCES heroes(hero_name) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_ma_tb_h3 FOREIGN KEY (team_b_hero3) REFERENCES heroes(hero_name) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_ma_tb_h4 FOREIGN KEY (team_b_hero4) REFERENCES heroes(hero_name) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_ma_tb_h5 FOREIGN KEY (team_b_hero5) REFERENCES heroes(hero_name) ON DELETE CASCADE ON UPDATE CASCADE
      );
    `)

    return res.status(200).json({ ok: true, message: 'matches table ensured' })
  } catch (e) {
    console.error('[create_matches_table] error:', e)
    return res.status(500).json({ error: 'Server error', details: e.message })
  }
}
