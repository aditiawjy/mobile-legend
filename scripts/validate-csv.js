// Script untuk validasi CSV sesuai AGENTS.md guidelines
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const CSV_DIR = path.join(__dirname, '../public/csv');

// Validasi items.csv kolom numerik
function validateItemsNumericColumns() {
  console.log('\n=== Validating items.csv Numeric Columns ===');
  
  const filePath = path.join(CSV_DIR, 'items.csv');
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const records = parse(fileContent, { columns: true, trim: true });

  const numericColumns = [
    'Price', 'Attack', 'Attack Speed', 'Crit Chance', 
    'Armor Penetration', 'Spell Vamp', 'Magic Power', 
    'HP', 'Armor', 'Magic Resist', 'Movement Speed', 
    'Cooldown Reduction', 'Mana Regen', 'HP Regen'
  ];

  let totalAnomalies = 0;
  const anomalies = [];

  records.forEach((item, idx) => {
    numericColumns.forEach(col => {
      const value = item[col];
      
      // Check if value exists and is numeric
      if (value === undefined || value === null || value === '') {
        anomalies.push({
          row: idx + 2, // +2 for header and 0-index
          item: item['Item Name'],
          column: col,
          value: value,
          issue: 'Empty or null value'
        });
        totalAnomalies++;
      } else {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
          anomalies.push({
            row: idx + 2,
            item: item['Item Name'],
            column: col,
            value: value,
            issue: 'Not a valid number'
          });
          totalAnomalies++;
        }
      }
    });
  });

  console.log(`Total items: ${records.length}`);
  console.log(`Total anomalies: ${totalAnomalies}`);
  
  if (anomalies.length > 0) {
    console.log('\n⚠️ Anomalies found:');
    anomalies.forEach(a => {
      console.log(`  Row ${a.row} (${a.item}): ${a.column} = "${a.value}" - ${a.issue}`);
    });
  } else {
    console.log('✅ All numeric columns are valid!');
  }

  return totalAnomalies;
}

// Validasi hero-adjustments.csv Date format (dd-MM-yyyy)
function validateHeroAdjustmentsDateFormat() {
  console.log('\n=== Validating hero-adjustments.csv Date Format ===');
  
  const filePath = path.join(CSV_DIR, 'hero-adjustments.csv');
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const records = parse(fileContent, { columns: true, trim: true });

  const dateRegex = /^\d{2}-\d{2}-\d{4}$/; // dd-MM-yyyy
  let totalAnomalies = 0;
  const anomalies = [];

  records.forEach((record, idx) => {
    const dateValue = record['Date'];
    
    if (!dateValue) {
      anomalies.push({
        row: idx + 2,
        hero: record['Hero Name'],
        date: dateValue,
        issue: 'Empty date'
      });
      totalAnomalies++;
    } else if (!dateRegex.test(dateValue)) {
      anomalies.push({
        row: idx + 2,
        hero: record['Hero Name'],
        date: dateValue,
        issue: 'Date format tidak sesuai dd-MM-yyyy'
      });
      totalAnomalies++;
    } else {
      // Check if date is valid
      const [day, month, year] = dateValue.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      
      if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
        anomalies.push({
          row: idx + 2,
          hero: record['Hero Name'],
          date: dateValue,
          issue: 'Invalid date (e.g., 32-01-2025)'
        });
        totalAnomalies++;
      }
    }
  });

  console.log(`Total adjustments: ${records.length}`);
  console.log(`Total anomalies: ${totalAnomalies}`);
  
  if (anomalies.length > 0) {
    console.log('\n⚠️ Anomalies found:');
    anomalies.slice(0, 10).forEach(a => {
      console.log(`  Row ${a.row} (${a.hero}): Date = "${a.date}" - ${a.issue}`);
    });
    if (anomalies.length > 10) {
      console.log(`  ... and ${anomalies.length - 10} more`);
    }
  } else {
    console.log('✅ All dates are in dd-MM-yyyy format and valid!');
  }

  return totalAnomalies;
}

// Validasi heroes.csv consistency
function validateHeroesCSV() {
  console.log('\n=== Validating heroes.csv Structure ===');
  
  const filePath = path.join(CSV_DIR, 'heroes.csv');
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const records = parse(fileContent, { columns: true, trim: true });

  const requiredColumns = ['Hero Name', 'Role', 'Damage Type', 'Attack Reliance', 'Note'];
  const headers = Object.keys(records[0]);

  console.log(`Total heroes: ${records.length}`);
  console.log(`Headers: ${headers.join(', ')}`);

  // Check required columns
  const missingColumns = requiredColumns.filter(col => !headers.includes(col));
  if (missingColumns.length > 0) {
    console.log(`⚠️ Missing columns: ${missingColumns.join(', ')}`);
    return 1;
  }

  // Check empty hero names
  const emptyNames = records.filter((r, idx) => !r['Hero Name'] || !r['Hero Name'].trim());
  if (emptyNames.length > 0) {
    console.log(`⚠️ ${emptyNames.length} heroes with empty names`);
    return 1;
  }

  console.log('✅ Heroes CSV structure is valid!');
  return 0;
}

// Main validation
function main() {
  console.log('🔍 CSV Validation (AGENTS.md Compliance)\n');
  console.log('Validating CSV files in:', CSV_DIR);

  let totalErrors = 0;

  try {
    totalErrors += validateItemsNumericColumns();
    totalErrors += validateHeroAdjustmentsDateFormat();
    totalErrors += validateHeroesCSV();

    console.log('\n' + '='.repeat(60));
    if (totalErrors === 0) {
      console.log('✅ All CSV validations passed!');
      console.log('   - items.csv: All numeric columns are valid');
      console.log('   - hero-adjustments.csv: All dates are dd-MM-yyyy');
      console.log('   - heroes.csv: Structure is valid');
    } else {
      console.log(`⚠️ Total anomalies found: ${totalErrors}`);
      console.log('   Please fix the issues above before proceeding.');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Validation error:', error.message);
    process.exit(1);
  }
}

main();
