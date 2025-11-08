import { query } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Creating hero_combos table...');

    // Create hero_combos table
    await query(`
      CREATE TABLE IF NOT EXISTS hero_combos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        hero1 VARCHAR(100) NOT NULL,
        hero2 VARCHAR(100) NOT NULL,
        combo_type VARCHAR(100) NOT NULL,
        synergy_score INT NOT NULL DEFAULT 80,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_combo (hero1, hero2),
        INDEX idx_hero1 (hero1),
        INDEX idx_hero2 (hero2)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✓ hero_combos table created successfully');

    res.status(200).json({
      success: true,
      message: 'hero_combos table created successfully'
    });

  } catch (error) {
    console.error('Error creating hero_combos table:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
