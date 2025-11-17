import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { query, db } from '../lib/db.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function syncHeroesCSVToDB() {
  console.log('=== Sync Heroes CSV to Database ===\n');

  // Read and parse heroes.csv
  const csvPath = path.join(__dirname, '..', 'public', 'csv', 'heroes.csv');
  console.log(`Reading CSV: ${csvPath}`);
  
  if (!fs.existsSync(csvPath)) {
    console.error('❌ Error: heroes.csv not found at', csvPath);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  const records = parse(fileContent, {
    columns: true,
    trim: true,
    relax_column_count: true,
  });

  console.log(`✓ Parsed ${records.length} heroes from CSV\n`);

  // Validate CSV has required columns (per AGENTS.md contract)
  const requiredColumns = ['Hero Name', 'Role', 'Damage Type', 'Attack Reliance', 'Note'];
  const firstRecord = records[0];
  const missingColumns = requiredColumns.filter(col => !(col in firstRecord));
  
  if (missingColumns.length > 0) {
    console.error('❌ Error: Missing required columns in CSV:', missingColumns.join(', '));
    process.exit(1);
  }

  console.log('✓ CSV columns validated\n');

  // Fetch existing heroes from database
  let existingHeroes = [];
  try {
    existingHeroes = await query('SELECT hero_name FROM heroes');
    console.log(`✓ Found ${existingHeroes.length} existing heroes in database\n`);
  } catch (err) {
    console.error('❌ Error fetching existing heroes:', err.message);
    process.exit(1);
  }

  const existingHeroNames = new Set(existingHeroes.map(h => h.hero_name));

  // Categorize heroes: to insert vs to update
  const toInsert = [];
  const toUpdate = [];
  const skipped = [];

  records.forEach(record => {
    const heroName = record['Hero Name'];
    const role = record['Role'];
    const damageType = record['Damage Type'];
    const attackReliance = record['Attack Reliance'];
    const note = record['Note'] || '';

    // Skip if hero name is empty
    if (!heroName || heroName.trim() === '') {
      skipped.push({ name: 'EMPTY', reason: 'Hero Name is empty' });
      return;
    }

    const heroData = {
      hero_name: heroName,
      role: role || '',
      damage_type: damageType || '',
      attack_reliance: attackReliance || '',
      note: note,
    };

    if (existingHeroNames.has(heroName)) {
      toUpdate.push(heroData);
    } else {
      toInsert.push(heroData);
    }
  });

  console.log(`📊 Sync Plan:`);
  console.log(`   - Insert: ${toInsert.length} new heroes`);
  console.log(`   - Update: ${toUpdate.length} existing heroes`);
  console.log(`   - Skipped: ${skipped.length} invalid rows\n`);

  if (skipped.length > 0) {
    console.log('⚠️  Skipped rows:');
    skipped.forEach(s => console.log(`   - ${s.name}: ${s.reason}`));
    console.log();
  }

  // Perform INSERT
  let insertCount = 0;
  let insertErrors = [];
  for (const hero of toInsert) {
    try {
      await query(
        `INSERT INTO heroes (hero_name, role, damage_type, attack_reliance, note)
         VALUES (?, ?, ?, ?, ?)`,
        [hero.hero_name, hero.role, hero.damage_type, hero.attack_reliance, hero.note]
      );
      insertCount++;
      console.log(`   ✓ Inserted: ${hero.hero_name}`);
    } catch (err) {
      insertErrors.push({ name: hero.hero_name, error: err.message });
      console.error(`   ❌ Failed to insert ${hero.hero_name}: ${err.message}`);
    }
  }

  // Perform UPDATE
  let updateCount = 0;
  let updateErrors = [];
  for (const hero of toUpdate) {
    try {
      await query(
        `UPDATE heroes
         SET role = ?, damage_type = ?, attack_reliance = ?, note = ?
         WHERE hero_name = ?`,
        [hero.role, hero.damage_type, hero.attack_reliance, hero.note, hero.hero_name]
      );
      updateCount++;
      console.log(`   ✓ Updated: ${hero.hero_name}`);
    } catch (err) {
      updateErrors.push({ name: hero.hero_name, error: err.message });
      console.error(`   ❌ Failed to update ${hero.hero_name}: ${err.message}`);
    }
  }

  console.log('\n=== Sync Complete ===');
  console.log(`✓ Inserted: ${insertCount}/${toInsert.length}`);
  console.log(`✓ Updated: ${updateCount}/${toUpdate.length}`);
  
  if (insertErrors.length > 0) {
    console.log(`❌ Insert errors: ${insertErrors.length}`);
  }
  if (updateErrors.length > 0) {
    console.log(`❌ Update errors: ${updateErrors.length}`);
  }

  // Close database connection
  const pool = await db();
  await pool.end();
  
  console.log('\n✓ Database connection closed');
}

syncHeroesCSVToDB().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
