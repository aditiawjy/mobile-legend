import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const filePath = path.join(process.cwd(), 'public/csv/battle-spells.csv');
    if (!fs.existsSync(filePath)) {
      return res.status(200).json([]);
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const records = parse(fileContent, { columns: true, trim: true, skip_empty_lines: true });

    const spells = records.map(record => ({
      name: record.spell_name || record.name,
      description: record.description || ''
    }));

    // Sort alphabetically
    spells.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    res.status(200).json(spells);
  } catch (error) {
    console.error('Error fetching spells from CSV:', error);
    res.status(200).json([]);
  }
}
