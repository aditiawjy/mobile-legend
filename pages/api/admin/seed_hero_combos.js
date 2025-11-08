import { query } from '../../../lib/db';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Seeding hero_combos from CSV...');

    // Read CSV file
    const csvPath = path.join(process.cwd(), 'public/csv/hero-combos.csv');
    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    const records = parse(fileContent, { columns: true, trim: true });

    console.log(`Found ${records.length} combos in CSV`);

    // Clear existing data
    await query('DELETE FROM hero_combos');
    console.log('✓ Cleared existing combos');

    // Insert combos
    let inserted = 0;
    for (const record of records) {
      try {
        await query(`
          INSERT INTO hero_combos (hero1, hero2, combo_type, synergy_score, description)
          VALUES (?, ?, ?, ?, ?)
        `, [
          record.Hero1.trim(),
          record.Hero2.trim(),
          record['Combo Type'].trim(),
          parseInt(record['Synergy Score']) || 80,
          record.Description.trim()
        ]);
        inserted++;
      } catch (err) {
        console.error(`Error inserting combo ${record.Hero1} + ${record.Hero2}:`, err.message);
      }
    }

    console.log(`✓ Inserted ${inserted} combos successfully`);

    // Fetch and return all combos
    const allCombos = await query('SELECT * FROM hero_combos ORDER BY synergy_score DESC');

    res.status(200).json({
      success: true,
      message: `Successfully seeded ${inserted} hero combos`,
      totalCombos: allCombos.length,
      combos: allCombos
    });

  } catch (error) {
    console.error('Error seeding hero_combos:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
