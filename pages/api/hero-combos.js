import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const filePath = path.join(process.cwd(), 'public/csv/hero-combos.csv');
    if (!fs.existsSync(filePath)) {
      return res.status(200).json({ success: true, totalCombos: 0, combos: [] });
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const records = parse(fileContent, { columns: true, trim: true, skip_empty_lines: true });

    const combos = records.map((r, i) => ({
      ...r,
      id: i + 1,
      hero1: r['Hero1'] || r['hero1'],
      hero2: r['Hero2'] || r['hero2'],
      combo_type: r['Combo Type'] || r['combo_type'],
      synergy_score: parseInt(r['Synergy Score'] || r['synergy_score'] || '0', 10),
      description: r['Description'] || r['description']
    }));

    combos.sort((a, b) => b.synergy_score - a.synergy_score);

    res.status(200).json({
      success: true,
      totalCombos: combos.length,
      combos: combos
    });
  } catch (error) {
    console.error('Error fetching hero combos:', error);
    res.status(200).json({ success: false, totalCombos: 0, combos: [], error: error.message });
  }
}
